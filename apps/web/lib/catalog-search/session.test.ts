import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCatalogSearchSession } from "./session";
import type { SearchQueue } from "./types";
import type { Track } from "@/lib/types/playlist";
import type { SearchVideoResult } from "@/app/actions/youtube-search-unofficial";
import {
  SpotifyApiError,
  type SpotifyCatalogSearchPage,
  type SpotifyTrackSearchResult,
  type SpotifyArtistSearchResult,
} from "@/lib/spotify/api";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function video(id = "abcdefghijk", title = id): SearchVideoResult {
  return {
    videoId: id,
    title,
    channelId: "channel",
    channelTitle: "Author",
    publishedTime: "Yesterday",
    viewCount: "10 views",
    lengthText: "3:25",
    thumbnail: "https://image.test/video",
    url: `https://www.youtube.com/watch?v=${id}`,
    raw: {
      videoId: id,
      title: { runs: [{ text: title }] },
      ownerText: { runs: [{ text: "Author" }] },
      publishedTimeText: { simpleText: "Yesterday" },
      viewCountText: { simpleText: "10 views" },
      lengthText: { simpleText: "3:25" },
      thumbnail: { thumbnails: [{ url: "//image.test/video", width: 300, height: 200 }] },
    },
  };
}

function song(id: string): SpotifyTrackSearchResult {
  return {
    source: "spotify",
    resultType: "track",
    id,
    title: id,
    url: `https://open.spotify.com/track/${id}`,
    authors: [{ id: "author", name: "Author", url: null, images: [], raw: null }],
    images: [],
    duration: 100,
    album: {
      id: "album",
      name: "Album",
      url: null,
      images: [],
      albumType: null,
      releaseDate: null,
      totalTracks: null,
    },
    discNumber: null,
    trackNumber: null,
    explicit: null,
    popularity: null,
    previewUrl: null,
    raw: {
      id,
      name: id,
      duration_ms: 100000,
      external_urls: { spotify: "" },
      artists: [],
      album: { name: "Album", images: [] },
    },
  };
}

function artist(id: string): SpotifyArtistSearchResult {
  return {
    source: "spotify",
    resultType: "artist",
    id,
    title: id,
    url: "https://open.spotify.com/artist/test",
    authors: [],
    images: [],
    genres: [],
    followersTotal: null,
    popularity: null,
    raw: { id, name: id, external_urls: { spotify: "" }, images: [] },
  };
}

const page = (ids: string[], nextOffset = 0, hasMore = false): SpotifyCatalogSearchPage => ({
  results: ids.map(song),
  nextOffset,
  hasMore,
});

function harness(overrides: Partial<Parameters<typeof createCatalogSearchSession>[0]> = {}) {
  let tracks: Track[] = [];
  let current: { track: Track; index: number } | null = null;
  const played: Track[] = [];
  const queue: SearchQueue = {
    current: () => current,
    replace: (next) => {
      tracks = next;
      if (current) {
        const index = tracks.findIndex(
          (track) => track.id === current?.track.id && track.source === current?.track.source,
        );
        if (index >= 0) current = { track: tracks[index], index };
      }
    },
    play: (track) => {
      const index = tracks.findIndex(
        (item) => item.id === track.id && item.source === track.source,
      );
      assert.ok(index >= 0, "clicked result must already be projected to the queue");
      current = { track: tracks[index], index };
      played.push(track);
    },
  };
  const session = createCatalogSearchSession({
    youtube: async () => ({ results: [] }),
    spotify: async () => page([]),
    getSpotifyToken: async () => "token",
    queue,
    ...overrides,
  });
  return { session, state: session.getState, tracks: () => tracks, current: () => current, played };
}

describe("Catalog Search Session", () => {
  it("normalizes YouTube videos, rejects invalid ids, deduplicates, and projects playable metadata", async () => {
    const latest = video("abcdefghijk", "Latest title");
    const h = harness({
      youtube: async (query, type, duration) => {
        assert.deepEqual([query, type, duration], ["music", "video", "long"]);
        return {
          results: [
            video(),
            video("invalid"),
            latest,
            {
              playlistId: "list",
              title: "List",
              channelTitle: "",
              channelId: "",
              videoCount: "1",
              thumbnail: "",
              url: "",
            },
          ],
        };
      },
    });
    h.state().setQuery("  music  ");
    h.state().setYouTubeDuration("long");
    assert.equal(await h.state().search(), true);
    assert.equal(h.state().query, "music");
    assert.equal(h.state().results.length, 1);
    assert.equal(h.state().results[0].raw, latest.raw);
    assert.deepEqual(
      h.tracks().map(({ title, duration, thumbnailUrl, publishedTimeText }) => ({
        title,
        duration,
        thumbnailUrl,
        publishedTimeText,
      })),
      [
        {
          title: "Latest title",
          duration: 205,
          thumbnailUrl: "https://image.test/video",
          publishedTimeText: "Yesterday",
        },
      ],
    );
  });

  it("keeps YouTube filter/source changes idle and reruns Spotify filters with a query", async () => {
    const calls: string[] = [];
    const h = harness({
      youtube: async () => {
        calls.push("youtube");
        return { results: [] };
      },
      spotify: async (_token, query, filter) => {
        calls.push(`${query}:${filter}`);
        return page([]);
      },
    });
    h.state().setQuery("music");
    h.state().setYouTubeDuration("short");
    h.state().setSource("spotify");
    assert.deepEqual(calls, []);
    await h.state().setSpotifyType("artist");
    assert.deepEqual(calls, ["music:artist"]);
    h.state().setSource("youtube");
    h.state().setSource("spotify");
    assert.equal(h.state().spotifyType, "all");
    h.state().setQuery("");
    await h.state().setSpotifyType("track");
    assert.deepEqual(calls, ["music:artist"]);
  });

  it("ignores an older submission even when the newer submission has identical criteria", async () => {
    const old = deferred<{ results: SearchVideoResult[] }>();
    let calls = 0;
    const h = harness({
      youtube: async () => (++calls === 1 ? old.promise : { results: [video("newnewnew11")] }),
    });
    h.state().setQuery("music");
    const pending = h.state().search();
    await h.state().search();
    old.resolve({ results: [video()] });
    assert.equal(await pending, false);
    assert.equal(h.state().results[0].id, "newnewnew11");
    assert.equal(h.tracks()[0].id, "newnewnew11");
  });

  it("ignores a rejected request after clear and resets filters and loading state", async () => {
    const old = deferred<{ results: SearchVideoResult[] }>();
    const h = harness({ youtube: () => old.promise });
    h.state().setQuery("music");
    h.state().setYouTubeDuration("long");
    const pending = h.state().search();
    h.state().clearSearch();
    old.reject(new Error("late failure"));
    assert.equal(await pending, false);
    assert.equal(h.state().isSearching, false);
    assert.equal(h.state().error, null);
    assert.equal(h.state().query, "");
    assert.equal(h.state().youtubeDuration, "any");
  });

  it("cancels before remote Spotify search when source changes during token lookup", async () => {
    const token = deferred<string | null>();
    let calls = 0;
    const h = harness({
      getSpotifyToken: () => token.promise,
      spotify: async () => {
        calls++;
        return page([]);
      },
    });
    h.state().setSource("spotify");
    h.state().setQuery("music");
    const pending = h.state().search();
    h.state().setSource("youtube");
    token.resolve("token");
    assert.equal(await pending, false);
    assert.equal(calls, 0);
    assert.equal(h.state().source, "youtube");
    assert.equal(h.state().isActive, false);
  });

  it("aborts superseded remote requests and ignores filter-switch errors", async () => {
    const old = deferred<SpotifyCatalogSearchPage>();
    let oldSignal: AbortSignal | undefined;
    const h = harness({
      spotify: async (_token, _query, filter, _offset, signal) => {
        if (filter === "track") {
          oldSignal = signal;
          return old.promise;
        }
        return { results: [artist("author")], hasMore: false, nextOffset: 1 };
      },
    });
    h.state().setSource("spotify");
    h.state().setQuery("music");
    const pending = h.state().setSpotifyType("track");
    await flush();
    await h.state().setSpotifyType("artist");
    assert.equal(oldSignal?.aborted, true);
    old.reject(new Error("late error"));
    assert.equal(await pending, false);
    assert.equal(h.state().error, null);
    assert.equal(h.state().results[0].resultType, "artist");
  });

  it("appends one page for duplicate load-more calls and deduplicates within and across pages", async () => {
    const more = deferred<SpotifyCatalogSearchPage>();
    const offsets: number[] = [];
    const h = harness({
      spotify: async (_token, _query, _filter, offset = 0) => {
        offsets.push(offset);
        return offset === 0 ? page(["a"], 10, true) : more.promise;
      },
    });
    h.state().setSource("spotify");
    h.state().setQuery("music");
    await h.state().setSpotifyType("track");
    const pending = h.state().loadMore();
    await h.state().loadMore();
    more.resolve(page(["a", "b", "b"], 20, true));
    await pending;
    assert.deepEqual(offsets, [0, 10]);
    assert.deepEqual(
      h.state().results.map((result) => result.id),
      ["a", "b"],
    );
    assert.equal(h.state().nextOffset, 20);
    assert.equal(h.state().isLoadingMore, false);
  });

  for (const outcome of ["success", "failure"] as const) {
    it(`ignores late pagination ${outcome} after a new query completes with the same filter`, async () => {
      const old = deferred<SpotifyCatalogSearchPage>();
      const h = harness({
        spotify: async (_token, query, _filter, offset) => {
          if (offset) return old.promise;
          return page([query], 10, true);
        },
      });
      h.state().setSource("spotify");
      h.state().setQuery("old");
      await h.state().setSpotifyType("track");
      const pending = h.state().loadMore();
      await flush();
      h.state().setQuery("new");
      await h.state().search();
      if (outcome === "success") old.resolve(page(["obsolete"], 20));
      else old.reject(new Error("obsolete failure"));
      await pending;
      assert.deepEqual(
        h.state().results.map((result) => result.id),
        ["new"],
      );
      assert.equal(h.state().loadMoreError, null);
      assert.equal(h.state().isLoadingMore, false);
      assert.equal(h.state().nextOffset, 10);
    });
  }

  it("keeps loaded results on page failure and retries the same offset", async () => {
    let fail = true;
    const offsets: number[] = [];
    const h = harness({
      spotify: async (_token, _query, _filter, offset = 0) => {
        offsets.push(offset);
        if (offset && fail)
          throw new SpotifyApiError({
            status: 429,
            path: "/search",
            responseBody: "",
            retryAfter: null,
          });
        return offset ? page(["b"], 20) : page(["a"], 10, true);
      },
    });
    h.state().setSource("spotify");
    h.state().setQuery("music");
    await h.state().setSpotifyType("track");
    await h.state().loadMore();
    assert.equal(h.state().loadMoreError, "Spotify's search limit was reached. Try again shortly.");
    assert.deepEqual(
      h.tracks().map((track) => track.id),
      ["a"],
    );
    assert.equal(h.state().error, null);
    fail = false;
    await h.state().loadMore();
    assert.deepEqual(offsets, [0, 10, 10]);
    assert.deepEqual(
      h.state().results.map((result) => result.id),
      ["a", "b"],
    );
    assert.equal(h.state().loadMoreError, null);
  });

  it("retains connect/expired error messages at the appropriate search stage", async () => {
    let token: string | null = null;
    const h = harness({
      getSpotifyToken: async () => token,
      spotify: async () => page(["a"], 10, true),
    });
    h.state().setSource("spotify");
    h.state().setQuery("music");
    await h.state().setSpotifyType("track");
    assert.equal(h.state().error, "Connect Spotify to search its catalog.");
    token = "token";
    await h.state().search();
    token = null;
    await h.state().loadMore();
    assert.equal(
      h.state().loadMoreError,
      "Spotify session expired. Reconnect to continue loading results.",
    );
    assert.equal(h.state().results.length, 1);
  });

  it("does not paginate overview searches or provider pages that cannot advance", async () => {
    let calls = 0;
    const h = harness({
      spotify: async () => {
        calls++;
        return page(["a"], 0, true);
      },
    });
    h.state().setSource("spotify");
    h.state().setQuery("music");
    await h.state().search();
    await h.state().loadMore();
    assert.equal(calls, 1);
    await h.state().setSpotifyType("track");
    await h.state().loadMore();
    assert.equal(calls, 2);
    assert.equal(h.state().hasMore, false);
  });

  it("keeps the playing track but resolves clicks by result identity rather than queue position", async () => {
    const h = harness({
      spotify: async (_token, query) => ({
        results: query === "old" ? [song("old")] : [artist("author"), song("new"), song("other")],
        hasMore: false,
        nextOffset: 0,
      }),
    });
    h.state().setSource("spotify");
    h.state().setQuery("old");
    await h.state().search();
    h.state().playResult(0);
    h.state().setQuery("new");
    await h.state().search();
    assert.equal(h.current()?.track.id, "old");
    assert.deepEqual(
      h.tracks().map((track) => track.id),
      ["old", "new", "other"],
    );
    h.state().playResult(0); // An artist is not playable.
    h.state().playResult(2); // Result index differs from playable-only position.
    assert.equal(h.current()?.track.id, "other");
    assert.deepEqual(
      h.played.map((track) => track.id),
      ["old", "other"],
    );
    h.state().clearSearch();
    assert.deepEqual(
      h.tracks().map((track) => track.id),
      ["other"],
    );
  });

  it("retains the active track when a new search fails and reports YouTube provider errors", async () => {
    let error: string | undefined = undefined;
    const h = harness({ youtube: async () => ({ results: error ? [] : [video()], error }) });
    h.state().setQuery("music");
    await h.state().search();
    h.state().playResult(0);
    error = "Provider unavailable";
    await h.state().search();
    assert.equal(h.state().error, error);
    assert.deepEqual(h.state().results, []);
    assert.equal(h.current()?.track.id, "abcdefghijk");
    assert.equal(h.tracks().length, 1);
  });
});
