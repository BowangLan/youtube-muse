"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { exchangeCodeForTokens } from "@/lib/spotify/auth";
import { useSpotifyStore } from "@/lib/store/spotify-store";

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const handledRef = React.useRef(false);

  React.useEffect(() => {
    // Guard against double-invocation (React strict mode) — the auth code is single-use
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(
        oauthError === "access_denied"
          ? "Spotify access was denied."
          : `Spotify authorization failed: ${oauthError}`
      );
      return;
    }
    if (!code) {
      setError("Missing authorization code in callback URL.");
      return;
    }

    exchangeCodeForTokens(code, state)
      .then((tokens) => {
        // Kick off profile + favorites loading in the background; go home immediately
        void useSpotifyStore.getState().connect(tokens);
        router.replace("/");
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [router]);

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center gap-4 text-foreground">
      {error ? (
        <>
          <p className="text-sm text-red-400">{error}</p>
          <button
            className="text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground"
            onClick={() => router.replace("/")}
          >
            Back to home
          </button>
        </>
      ) : (
        <p className="animate-pulse text-sm text-foreground/60">
          Connecting to Spotify…
        </p>
      )}
    </main>
  );
}
