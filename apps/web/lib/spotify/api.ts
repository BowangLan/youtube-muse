// Thin client for the Spotify Web API endpoints this app uses.

const API_BASE = "https://api.spotify.com/v1";
const SAVED_TRACKS_PAGE_SIZE = 50;
const PLAYLISTS_PAGE_SIZE = 50;
const PLAYLIST_ITEMS_PAGE_SIZE = 50;

export interface SpotifyFavoriteTrack {
  id: string;
  title: string;
  artists: string[];
  album: string;
  albumArtUrl: string | null;
  /** Duration in seconds */
  duration: number;
  /** ISO 8601 date the track was added to the collection */
  addedAt: string;
  spotifyUrl: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  spotifyUrl: string;
  ownerName: string;
  totalTracks: number;
  tracks: SpotifyFavoriteTrack[];
  tracksLoaded: boolean;
}

export interface SpotifyProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  /** "premium" | "free" | ... — Web Playback SDK requires "premium". */
  product: string | null;
}

interface SpotifyPage<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  next: string | null;
}

export interface SpotifyFetchResult<T> {
  data: T;
  error: SpotifyApiError | null;
}

export function getErrorLogDetails(error: unknown) {
  if (error instanceof SpotifyApiError) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: error.status,
      path: error.path,
      retryAfter: error.retryAfter,
      responseBody: error.responseBody,
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? error.cause.message : error.cause,
    };
  }
  return { value: String(error) };
}

export class SpotifyApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly responseBody: string;
  readonly retryAfter: string | null;

  constructor({
    status,
    path,
    responseBody,
    retryAfter,
  }: {
    status: number;
    path: string;
    responseBody: string;
    retryAfter: string | null;
  }) {
    const bodyMessage = responseBody ? `: ${responseBody}` : "";
    super(`Spotify API error (${status}) on ${path}${bodyMessage}`);
    this.name = "SpotifyApiError";
    this.status = status;
    this.path = path;
    this.responseBody = responseBody;
    this.retryAfter = retryAfter;
  }
}

async function spotifyFetch<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    console.error(
      `[spotify-api] Network request failed\n${JSON.stringify(
        { method, path, error: getErrorLogDetails(error) },
        null,
        2,
      )}`,
    );
    throw error;
  }

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "<failed to read response body>");
    const error = new SpotifyApiError({
      status: response.status,
      path,
      responseBody,
      retryAfter: response.headers.get("retry-after"),
    });
    console.error(
      `[spotify-api] Request failed\n${JSON.stringify(
        {
          method,
          path,
          status: response.status,
          statusText: response.statusText,
          retryAfter: error.retryAfter,
          responseBody,
          error: getErrorLogDetails(error),
        },
        null,
        2,
      )}`,
    );
    throw error;
  }

  if (response.status === 204) return undefined as T;

  const responseBody = await response.text();
  try {
    return JSON.parse(responseBody) as T;
  } catch (error) {
    console.error(
      `[spotify-api] Failed to parse response\n${JSON.stringify(
        {
          method,
          path,
          status: response.status,
          contentType: response.headers.get("content-type"),
          responseBody: responseBody.slice(0, 1_000),
          error: getErrorLogDetails(error),
        },
        null,
        2,
      )}`,
    );
    throw error;
  }
}

interface RawTrack {
  id: string | null;
  name: string;
  type?: string;
  duration_ms: number;
  external_urls: { spotify: string };
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number | null }>;
  };
}

interface RawTrackItem {
  added_at: string | null;
  /** Legacy playlist/saved-track response field. */
  track?: RawTrack | null;
  /** Current playlist-items response field. */
  item?: RawTrack | null;
}

function toSpotifyTrack(item: RawTrackItem): SpotifyFavoriteTrack | null {
  const track = item.item ?? item.track;
  if (!track?.id || (track.type && track.type !== "track")) return null;
  const art = track.album.images[1] ?? track.album.images[0] ?? null;
  return {
    id: track.id,
    title: track.name,
    artists: track.artists.map((artist) => artist.name),
    album: track.album.name,
    albumArtUrl: art?.url ?? null,
    duration: Math.round(track.duration_ms / 1000),
    addedAt: item.added_at ?? "",
    spotifyUrl: track.external_urls.spotify,
  };
}

function pathFromSpotifyPageUrl(pageUrl: string) {
  const url = new URL(pageUrl);
  if (url.origin !== "https://api.spotify.com" || !url.pathname.startsWith("/v1/")) {
    throw new Error(`Spotify returned an invalid pagination URL: ${pageUrl}`);
  }
  return `${url.pathname.slice("/v1".length)}${url.search}`;
}

async function fetchAllPages<T>(accessToken: string, initialPath: string) {
  const items: T[] = [];
  let path: string | null = initialPath;

  while (path) {
    try {
      const page: SpotifyPage<T> = await spotifyFetch<SpotifyPage<T>>(accessToken, path);
      items.push(...page.items);
      path = page.next ? pathFromSpotifyPageUrl(page.next) : null;
    } catch (error) {
      if (error instanceof SpotifyApiError && error.status >= 400 && error.status < 500) {
        return { data: items, error } satisfies SpotifyFetchResult<T[]>;
      }
      throw error;
    }
  }

  return { data: items, error: null } satisfies SpotifyFetchResult<T[]>;
}

/** Fetches the entire liked-songs library by following Spotify's pagination links. */
export async function fetchAllSavedTracks(accessToken: string) {
  const result = await fetchAllPages<RawTrackItem>(
    accessToken,
    `/me/tracks?limit=${SAVED_TRACKS_PAGE_SIZE}`,
  );
  return {
    data: result.data.flatMap((item) => {
      const track = toSpotifyTrack(item);
      return track ? [track] : [];
    }),
    error: result.error,
  } satisfies SpotifyFetchResult<SpotifyFavoriteTrack[]>;
}

interface RawPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: Array<{ url: string }> | null;
  external_urls: { spotify: string };
  owner: { display_name: string | null; id: string };
  collaborative: boolean;
  /** Legacy Spotify playlist summary field. */
  tracks?: { total: number };
  /** Current Spotify playlist summary field. */
  items?: { total: number };
}

function getPlaylistTrackTotal(playlist: RawPlaylist) {
  const total = playlist.items?.total ?? playlist.tracks?.total;
  if (typeof total === "number") return total;

  console.warn(
    `[spotify-api] Playlist summary has no track total\n${JSON.stringify(
      { playlistId: playlist.id, playlistName: playlist.name, fields: Object.keys(playlist) },
      null,
      2,
    )}`,
  );
  return 0;
}

async function fetchAllPlaylistSummaries(accessToken: string) {
  return fetchAllPages<RawPlaylist>(accessToken, `/me/playlists?limit=${PLAYLISTS_PAGE_SIZE}`);
}

export async function fetchSpotifyPlaylistTracks(accessToken: string, playlistId: string) {
  const encodedId = encodeURIComponent(playlistId);
  try {
    const result = await fetchAllPages<RawTrackItem>(
      accessToken,
      `/playlists/${encodedId}/items?limit=${PLAYLIST_ITEMS_PAGE_SIZE}`,
    );
    return {
      data: result.data.flatMap((item) => {
        const track = toSpotifyTrack(item);
        return track ? [track] : [];
      }),
      error: result.error,
    } satisfies SpotifyFetchResult<SpotifyFavoriteTrack[]>;
  } catch (error) {
    console.error(
      `[spotify-api] Failed to fetch or normalize playlist tracks\n${JSON.stringify(
        {
          playlistId,
          error: getErrorLogDetails(error),
        },
        null,
        2,
      )}`,
    );
    throw error;
  }
}

/**
 * Fetches playlist metadata only. Playlist contents and liked songs are loaded
 * separately after the user selects them.
 */
export async function fetchSpotifyLibrary(accessToken: string) {
  const result = await fetchAllPlaylistSummaries(accessToken);
  const summaries = result.data.filter(
    (playlist) => playlist.items !== undefined || playlist.tracks !== undefined,
  );
  const playlistTrackTotals = summaries.map(getPlaylistTrackTotal);

  const playlists = summaries.map<SpotifyPlaylist>((playlist, index) => ({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description ?? "",
    imageUrl: playlist.images?.[0]?.url ?? null,
    spotifyUrl: playlist.external_urls.spotify,
    ownerName: playlist.owner.display_name ?? playlist.owner.id,
    totalTracks: playlistTrackTotals[index],
    tracks: [],
    tracksLoaded: false,
  }));

  return { data: playlists, error: result.error } satisfies SpotifyFetchResult<SpotifyPlaylist[]>;
}

interface RawProfileResponse {
  id: string;
  display_name: string | null;
  images: Array<{ url: string }>;
  product?: string;
}

export async function fetchSpotifyProfile(accessToken: string) {
  const data = await spotifyFetch<RawProfileResponse>(accessToken, "/me");
  return {
    id: data.id,
    displayName: data.display_name ?? data.id,
    avatarUrl: data.images[0]?.url ?? null,
    product: data.product ?? null,
  };
}

export async function startPlayback(
  accessToken: string,
  deviceId: string,
  trackId: string,
  positionMs = 0,
) {
  await spotifyFetch<void>(
    accessToken,
    `/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        uris: [`spotify:track:${trackId}`],
        position_ms: positionMs,
      }),
    },
  );
}
