import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPlaybackSession } from "./session";
import type { PlaybackAdapter, PlaybackObservation, SessionTrack } from "./types";

function adapter(overrides: Partial<PlaybackAdapter> = {}) {
  const calls: string[] = [];
  const signals: AbortSignal[] = [];
  const implementation: PlaybackAdapter = {
    play: () => {
      calls.push("play");
    },
    pause: () => {
      calls.push("pause");
    },
    seek: (time) => {
      calls.push(`seek:${time}`);
    },
    setVolume: (volume) => {
      calls.push(`volume:${volume}`);
    },
    load: (track, autoplay, signal) => {
      calls.push(`load:${track}:${autoplay}`);
      signals.push(signal);
    },
    read: () => null,
    ...overrides,
  };
  return { implementation, calls, signals };
}

function harness(tracks: SessionTrack[] = []) {
  let index = 0;
  let repeat: "off" | "playlist" | "one" = "off";
  let advances = 0;
  const ticks = new Set<() => void>();
  const session = createPlaybackSession({
    queue: {
      next: () => {
        advances++;
        if (index + 1 < tracks.length) index++;
        else if (repeat === "playlist" && tracks.length) index = 0;
        else return null;
        // Match the real synchronous playlist subscription.
        session.selectTrack(tracks[index]);
        return tracks[index];
      },
      previous: () => (index > 0 ? tracks[--index] : null),
      repeatMode: () => repeat,
    },
    schedule: (tick) => {
      ticks.add(tick);
      return () => {
        ticks.delete(tick);
      };
    },
  });
  return {
    session,
    ticks,
    advances: () => advances,
    repeat: (value: typeof repeat) => {
      repeat = value;
    },
  };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const playing = (trackId: string, currentTime = 1, duration = 100): PlaybackObservation => ({
  trackId,
  state: "playing",
  currentTime,
  duration,
});
const spotifyEnd = (trackId: string): PlaybackObservation => ({
  trackId,
  state: "paused",
  currentTime: 0,
  duration: 100,
});

describe("Playback Session", () => {
  it("cues the initial selection only when its source is ready", () => {
    const { session } = harness();
    const youtube = adapter();
    const connection = session.connect("youtube", youtube.implementation);
    session.selectTrack({ id: "a" });
    assert.equal(session.getState().playerReady, false);
    assert.deepEqual(youtube.calls, []);
    connection.ready();
    connection.ready();
    assert.deepEqual(youtube.calls, ["volume:100", "load:a:false"]);
    session.allowAutoplay();
    session.selectTrack({ id: "b" });
    assert.equal(youtube.calls.at(-1), "load:b:true");
  });

  it("loads Spotify without YouTube readiness and ignores unrelated readiness", () => {
    const { session } = harness();
    const spotify = adapter();
    const youtube = adapter();
    const s = session.connect("spotify", spotify.implementation);
    const y = session.connect("youtube", youtube.implementation);
    session.allowAutoplay();
    session.selectTrack({ id: "a", source: "spotify" });
    s.ready();
    s.observe(playing("a", 25));
    const calls = [...spotify.calls];
    y.ready();
    assert.deepEqual(spotify.calls, calls);
    assert.equal(session.getState().currentTime, 25);
    assert.equal(session.getState().playerReady, true);
  });

  it("honors a pause issued while the selected source is unavailable", () => {
    const { session } = harness();
    const source = adapter();
    const c = session.connect("spotify", source.implementation);
    session.allowAutoplay();
    session.selectTrack({ id: "a", source: "spotify" });
    session.dispatch({ type: "UserPause" });
    c.ready();
    assert.equal(source.calls.at(-1), "load:a:false");
    assert.equal(session.getState().desiredPlayback, "paused");
  });

  it("routes controls and clamps seek and volume through the session", () => {
    const { session } = harness();
    const source = adapter();
    const c = session.connect("youtube", source.implementation);
    c.ready();
    session.allowAutoplay();
    session.selectTrack({ id: "a" });
    c.observe(playing("a"));
    session.dispatch({ type: "UserPause" });
    session.dispatch({ type: "UserPlay" });
    session.dispatch({ type: "UserSeek", seconds: 150 });
    session.dispatch({ type: "UserSetVolume", volume: 150 });
    assert.deepEqual(source.calls.slice(-4), ["pause", "play", "seek:100", "volume:100"]);
  });

  it("treats equal track ids on different sources as different selections", () => {
    const { session } = harness();
    const youtube = adapter();
    const spotify = adapter();
    const y = session.connect("youtube", youtube.implementation);
    const s = session.connect("spotify", spotify.implementation);
    y.ready();
    s.ready();
    session.allowAutoplay();
    session.selectTrack({ id: "same" });
    y.observe(playing("same"));
    session.selectTrack({ id: "same", source: "spotify" });
    assert.equal(youtube.signals[0].aborted, true);
    assert.equal(youtube.calls.at(-1), "pause");
    assert.ok(spotify.calls.includes("load:same:true"));
    assert.equal(y.observe(playing("same", 90)), false);
    assert.equal(session.getState().currentTime, 0);
  });

  it("advances once for repeated Spotify terminal snapshots, without replaying the outgoing track", () => {
    const h = harness([
      { id: "a", source: "spotify" },
      { id: "b", source: "spotify" },
    ]);
    const source = adapter({ endsByRewinding: true });
    const c = h.session.connect("spotify", source.implementation);
    c.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    c.observe(playing("a", 98));
    c.observe(spotifyEnd("a"));
    c.observe(spotifyEnd("a"));
    c.observe(playing("a", 1));
    assert.equal(h.advances(), 1);
    assert.deepEqual(
      source.calls.filter((call) => call.startsWith("load:")),
      ["load:a:true", "load:b:true"],
    );
    assert.equal(source.calls.includes("play"), false);
    c.observe(playing("b", 2));
    assert.equal(h.session.getState().currentTime, 2);
  });

  it("deduplicates an ended track even when the queue has no next track", () => {
    const h = harness([{ id: "a" }]);
    const source = adapter();
    const c = h.session.connect("youtube", source.implementation);
    c.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a" });
    c.observe(playing("a", 99));
    c.observe({ trackId: "a", state: "ended" });
    c.observe({ trackId: "a", state: "ended" });
    c.observe({ trackId: "a", state: "paused" });
    assert.equal(h.advances(), 1);
    assert.equal(source.calls.includes("play"), false);
    assert.equal(h.session.getState().observedPlayback, "ended");
  });

  it("repeats one without queue advancement and re-arms only after restart", () => {
    const h = harness();
    h.repeat("one");
    const source = adapter({ endsByRewinding: true });
    const c = h.session.connect("spotify", source.implementation);
    c.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    c.observe(playing("a", 98));
    c.observe(spotifyEnd("a"));
    c.observe(spotifyEnd("a"));
    assert.deepEqual(source.calls.slice(-2), ["seek:0", "play"]);
    assert.equal(source.calls.filter((call) => call === "play").length, 1);
    c.observe(playing("a", 1));
    c.observe(playing("a", 98));
    c.observe(spotifyEnd("a"));
    assert.equal(source.calls.filter((call) => call === "play").length, 2);
    assert.equal(h.advances(), 0);
  });

  it("restarts a one-track repeating playlist", () => {
    const h = harness([{ id: "a" }]);
    h.repeat("playlist");
    const source = adapter();
    const c = h.session.connect("youtube", source.implementation);
    c.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a" });
    c.observe(playing("a", 99));
    c.observe({ trackId: "a", state: "ended" });
    assert.deepEqual(source.calls.slice(-2), ["seek:0", "play"]);
    assert.equal(h.advances(), 1);
  });

  it("does not mistake an explicit seek to zero for a Spotify natural end", () => {
    const h = harness();
    const source = adapter({ endsByRewinding: true });
    const c = h.session.connect("spotify", source.implementation);
    c.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    c.observe(playing("a", 99));
    h.session.dispatch({ type: "UserPause" });
    h.session.dispatch({ type: "UserSeek", seconds: 0 });
    c.observe(spotifyEnd("a"));
    assert.equal(h.advances(), 0);
  });

  it("ignores stale load failures after a same-source selection change", async () => {
    const { session } = harness();
    let reject!: (error: Error) => void;
    const source = adapter({
      load: (id) =>
        id === "a"
          ? new Promise<void>((_, fail) => {
              reject = fail;
            })
          : undefined,
    });
    const c = session.connect("spotify", source.implementation);
    c.ready();
    session.allowAutoplay();
    session.selectTrack({ id: "a", source: "spotify" });
    session.selectTrack({ id: "b", source: "spotify" });
    reject(new Error("stale failure"));
    await flush();
    assert.notEqual(session.getState().mode.tag, "error");
    c.fail("old track failed", "a");
    assert.notEqual(session.getState().mode.tag, "error");
    c.fail("current track failed", "b");
    assert.equal(session.getState().mode.tag, "error");
    assert.equal(session.getState().desiredPlayback, "paused");
  });

  it("scopes reconnect callbacks to the new SDK lifetime", () => {
    const { session } = harness();
    const old = adapter();
    const first = session.connect("youtube", old.implementation);
    first.ready();
    session.allowAutoplay();
    session.selectTrack({ id: "a" });
    first.observe(playing("a"));
    const replacement = adapter();
    const second = session.connect("youtube", replacement.implementation);
    first.disconnect();
    first.ready();
    first.fail("old SDK");
    assert.equal(first.observe(playing("a", 90)), false);
    second.ready();
    second.ready();
    assert.deepEqual(replacement.calls, ["volume:100", "load:a:true"]);
    assert.equal(old.signals[0].aborted, true);
  });

  it("defers commands while unavailable and reloads on reconnect", () => {
    const { session } = harness();
    const source = adapter();
    const c = session.connect("spotify", source.implementation);
    c.ready();
    session.allowAutoplay();
    session.selectTrack({ id: "a", source: "spotify" });
    c.observe(playing("a"));
    c.unavailable();
    assert.equal(session.getState().playerReady, false);
    const count = source.calls.length;
    session.dispatch({ type: "UserPause" });
    assert.equal(source.calls.length, count);
    c.ready();
    assert.equal(source.calls.at(-1), "load:a:false");
  });

  it("polls only while playing and rejects an old selection's late sample", async () => {
    const h = harness();
    let resolve!: (sample: PlaybackObservation) => void;
    const source = adapter({
      read: () =>
        new Promise((done) => {
          resolve = done;
        }),
    });
    const c = h.session.connect("youtube", source.implementation);
    c.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a" });
    assert.equal(h.ticks.size, 0);
    c.observe(playing("a"));
    assert.equal(h.ticks.size, 1);
    for (const tick of h.ticks) tick();
    await flush();
    h.session.selectTrack({ id: "b" });
    resolve(playing("a", 90));
    await flush();
    assert.equal(h.session.getState().currentTime, 0);
    assert.equal(h.ticks.size, 0);
    c.observe(playing("b"));
    c.disconnect();
    assert.equal(h.ticks.size, 0);
  });

  for (const sourceName of ["youtube", "spotify"] as const) {
    it(`preserves slice looping and pause-at-end for ${sourceName}`, () => {
      const { session } = harness();
      const source = adapter();
      const c = session.connect(sourceName, source.implementation);
      c.ready();
      session.allowAutoplay();
      session.selectTrack({ id: "a", source: sourceName });
      c.observe(playing("a"));
      session.dispatch({ type: "UserSetSliceStart", seconds: 10 });
      session.dispatch({ type: "UserSetSliceEnd", seconds: 20 });
      session.dispatch({ type: "UserSetSliceRepeatEnabled", enabled: true });
      c.observe(playing("a", 19.95));
      assert.equal(source.calls.at(-1), "seek:10");
      session.dispatch({ type: "UserSetSliceAutoRepeat", autoRepeat: false });
      c.observe(playing("a", 20));
      assert.equal(source.calls.at(-1), "pause");
      assert.equal(session.getState().desiredPlayback, "paused");
    });
  }

  it("pauses and clears a removed selection, rejecting its later events", () => {
    const { session } = harness();
    const source = adapter();
    const c = session.connect("youtube", source.implementation);
    c.ready();
    session.allowAutoplay();
    session.selectTrack({ id: "a" });
    c.observe(playing("a"));
    session.selectTrack(null);
    assert.equal(source.calls.at(-1), "pause");
    assert.equal(source.signals[0].aborted, true);
    assert.equal(session.getState().mode.tag, "uninitialized");
    assert.equal(c.observe(playing("a", 90)), false);
  });

  it("keeps the new source polling when the outgoing source's read never resolves", async () => {
    const h = harness();
    const youtube = adapter({ read: () => new Promise(() => {}) });
    const spotify = adapter({ read: () => playing("b", 12) });
    const y = h.session.connect("youtube", youtube.implementation);
    const s = h.session.connect("spotify", spotify.implementation);
    y.ready();
    s.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a" });
    y.observe(playing("a"));
    for (const tick of h.ticks) tick();
    await flush();
    h.session.selectTrack({ id: "b", source: "spotify" });
    s.observe(playing("b"));
    for (const tick of h.ticks) tick();
    await flush();
    assert.equal(h.session.getState().currentTime, 12);
  });

  it("does not report a manual pause near the end as a natural end", () => {
    const h = harness();
    const source = adapter({ endsByRewinding: true });
    const c = h.session.connect("spotify", source.implementation);
    c.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    c.observe(playing("a", 99));
    h.session.dispatch({ type: "UserPause" });
    c.observe(spotifyEnd("a"));
    assert.equal(h.advances(), 0);
    assert.equal(h.session.getState().desiredPlayback, "paused");
  });

  it("serializes synchronous source observations during command execution", () => {
    const h = harness([{ id: "a" }, { id: "b" }]);
    const source = adapter({
      load: (id) => {
        connection.observe(playing(id));
      },
    });
    const connection = h.session.connect("youtube", source.implementation);
    connection.ready();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a" });
    connection.observe({ trackId: "a", state: "ended" });
    assert.equal(h.session.getState().mode.tag, "ready");
    assert.equal(h.session.getState().isPlaying, true);
    assert.equal(h.advances(), 1);
    assert.equal(connection.observe(playing("a", 99)), false);
  });
});
