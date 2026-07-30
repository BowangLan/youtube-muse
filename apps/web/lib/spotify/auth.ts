// Spotify OAuth 2.0 Authorization Code flow with PKCE.
// Runs fully client-side — only requires a public Client ID (no secret).

export const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

const AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const SCOPES = [
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  // Web Playback SDK (in-browser player; requires Spotify Premium)
  "streaming",
  "user-read-email",
  "user-read-private",
  // Transfer/start playback on our SDK device via the Web API
  "user-read-playback-state",
  "user-modify-playback-state",
];

/** Scopes that must be granted for in-browser playback to work. */
export const PLAYBACK_SCOPES = ["streaming", "user-modify-playback-state"];
export const LIBRARY_SCOPES = ["user-library-read", "playlist-read-private"];

function tokensHaveScopes(scope: string | undefined, requiredScopes: string[]) {
  if (!scope) return false;
  const granted = new Set(scope.split(" "));
  return requiredScopes.every((required) => granted.has(required));
}

export function tokensHavePlaybackScopes(scope: string | undefined): boolean {
  return tokensHaveScopes(scope, PLAYBACK_SCOPES);
}

export function tokensHaveLibraryScopes(scope: string | undefined): boolean {
  return tokensHaveScopes(scope, LIBRARY_SCOPES);
}

const VERIFIER_STORAGE_KEY = "spotify-pkce-verifier";
const STATE_STORAGE_KEY = "spotify-pkce-state";

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the access token expires */
  expiresAt: number;
  /** Space-separated scopes actually granted (older stored tokens may lack this) */
  scope?: string;
}

// Spotify requires a loopback IP (127.0.0.1) instead of localhost in redirect URIs.
function normalizeOrigin(origin: string): string {
  return origin.replace("//localhost", "//127.0.0.1");
}

export function getSpotifyRedirectUri(): string {
  return `${normalizeOrigin(window.location.origin)}/spotify/callback`;
}

/**
 * PKCE state and tokens live in per-origin storage, so the auth flow must run
 * on the same origin as the redirect URI. If the app is being browsed via
 * localhost, hop to 127.0.0.1 with a flag that auto-resumes the connect flow.
 * Returns true if a hop was initiated (caller should stop).
 */
export function hopToLoopbackOriginIfNeeded(): boolean {
  if (window.location.hostname !== "localhost") return false;
  const url = new URL(window.location.href);
  url.hostname = "127.0.0.1";
  url.searchParams.set(SPOTIFY_CONNECT_PARAM, "1");
  window.location.href = url.toString();
  return true;
}

export const SPOTIFY_CONNECT_PARAM = "spotify-connect";

export function isSpotifyConfigured(): boolean {
  return SPOTIFY_CLIENT_ID.length > 0;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateRandomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return base64UrlEncode(bytes).slice(0, length);
}

async function computeCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

/** Kicks off the OAuth flow by redirecting the browser to Spotify. */
export async function redirectToSpotifyAuthorize(): Promise<void> {
  if (hopToLoopbackOriginIfNeeded()) return;
  const verifier = generateRandomString(64);
  const state = generateRandomString(16);
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  sessionStorage.setItem(STATE_STORAGE_KEY, state);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: getSpotifyRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: await computeCodeChallenge(verifier),
    scope: SCOPES.join(" "),
    state,
  });

  window.location.href = `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

async function requestTokens(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Spotify token request failed (${response.status}): ${text}`);
  }
  return response.json();
}

/** Exchanges the authorization code from the callback URL for tokens. */
export async function exchangeCodeForTokens(
  code: string,
  returnedState: string | null,
): Promise<SpotifyTokens> {
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
  const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  sessionStorage.removeItem(STATE_STORAGE_KEY);

  if (!verifier) throw new Error("Missing PKCE verifier — restart the connection flow.");
  if (!expectedState || returnedState !== expectedState)
    throw new Error("OAuth state mismatch — restart the connection flow.");

  const data = await requestTokens(
    new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: getSpotifyRedirectUri(),
      code_verifier: verifier,
    }),
  );

  if (!data.refresh_token) throw new Error("Spotify did not return a refresh token.");

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  };
}

export async function refreshSpotifyTokens(refreshToken: string): Promise<SpotifyTokens> {
  const data = await requestTokens(
    new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );

  return {
    accessToken: data.access_token,
    // Spotify may rotate the refresh token; fall back to the old one otherwise
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  };
}
