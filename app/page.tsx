"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { Music } from "lucide-react";
import { PlayerControls } from "@/components/player/player-controls";
import { NowPlaying } from "@/components/player/now-playing";
import { PlaylistSidebar } from "@/components/playlist/playlist-sidebar";

// YouTube Player types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YT {
  Player: new (elementId: string, options: any) => YTPlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  loadVideoById: (videoId: string) => void;
}

export default function Home() {
  const {
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    setCurrentPlaylist,
    setCurrentTrackIndex,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    playNext,
    playPrevious,
    getCurrentTrack,
  } = usePlaylistStore();

  const playerRef = React.useRef<YTPlayer | null>(null);
  const pendingPlayStateRef = React.useRef<boolean | null>(null);
  const isLoadingNewVideoRef = React.useRef(false);
  const wasPlayingBeforeLoadRef = React.useRef(false);
  const [apiReady, setApiReady] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(100);

  const currentTrack = getCurrentTrack();
  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);

  // Initialize default playlist
  React.useEffect(() => {
    if (playlists.length === 0) {
      createPlaylist("My Playlist", "Your music collection");
      setTimeout(() => {
        const newPlaylists = usePlaylistStore.getState().playlists;
        if (newPlaylists.length > 0) {
          setCurrentPlaylist(newPlaylists[0].id);
        }
      }, 100);
    } else if (!currentPlaylistId && playlists.length > 0) {
      setCurrentPlaylist(playlists[0].id);
    }
  }, []);

  // Load YouTube API
  React.useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Initialize player
  React.useEffect(() => {
    if (!apiReady || playerRef.current) {
      return;
    }

    playerRef.current = new window.YT.Player("youtube-player", {
      height: "1",
      width: "1",
      videoId: currentTrack?.id || "dQw4w9WgXcQ",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
      },
      events: {
        onReady: (event: any) => {
          const dur = event.target.getDuration();
          setDuration(dur);
        },
        onStateChange: (event: any) => {
          const newIsPlaying = event.data === window.YT.PlayerState.PLAYING;

          // Update duration when video is cued or playing (new video loaded)
          if (event.data === window.YT.PlayerState.CUED || event.data === window.YT.PlayerState.PLAYING) {
            const dur = event.target.getDuration();
            if (dur > 0) {
              setDuration(dur);
              setCurrentTime(0); // Reset current time when loading new video
            }
            // When video is cued, clear loading flag and possibly auto-play
            if (event.data === window.YT.PlayerState.CUED && isLoadingNewVideoRef.current) {
              isLoadingNewVideoRef.current = false;
              // If we were playing before, resume playback
              if (wasPlayingBeforeLoadRef.current) {
                wasPlayingBeforeLoadRef.current = false;
                event.target.playVideo();
              }
            }
          }

          // If we're loading a new video, don't update playing state to prevent flash
          if (isLoadingNewVideoRef.current) {
            // Ignore state changes during initial video loading
            return;
          }

          // If we have a pending state change, only update when we reach the target state
          if (pendingPlayStateRef.current !== null) {
            if (newIsPlaying === pendingPlayStateRef.current) {
              // We've reached the desired state, clear the pending flag
              pendingPlayStateRef.current = null;
              setIsPlaying(newIsPlaying);
            }
            // Otherwise, ignore intermediate states like BUFFERING
          } else {
            // No pending state, update normally
            setIsPlaying(newIsPlaying);
          }

          if (event.data === window.YT.PlayerState.ENDED) {
            handlePlayNext();
          }
        },
      },
    });
  }, [apiReady]);

  // Update current time
  React.useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Load new track
  React.useEffect(() => {
    if (currentTrack && playerRef.current) {
      playerRef.current.loadVideoById(currentTrack.id);
      // Duration will be updated in onStateChange event handler
    }
  }, [currentTrack?.id]);

  const togglePlay = () => {
    if (playerRef.current) {
      // Clear loading flag to allow state updates from user interaction
      isLoadingNewVideoRef.current = false;

      if (isPlaying) {
        pendingPlayStateRef.current = false;
        setIsPlaying(false); // Optimistic update
        playerRef.current.pauseVideo();
      } else {
        pendingPlayStateRef.current = true;
        setIsPlaying(true); // Optimistic update
        playerRef.current.playVideo();
      }
    }
  };

  const seek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(value);
      setVolume(value);
    }
  };

  const handlePlayNext = () => {
    const nextTrack = playNext();
    if (nextTrack && playerRef.current) {
      wasPlayingBeforeLoadRef.current = isPlaying;
      isLoadingNewVideoRef.current = true;
      playerRef.current.loadVideoById(nextTrack.id);
    }
  };

  const handlePlayPrevious = () => {
    const prevTrack = playPrevious();
    if (prevTrack && playerRef.current) {
      wasPlayingBeforeLoadRef.current = isPlaying;
      isLoadingNewVideoRef.current = true;
      playerRef.current.loadVideoById(prevTrack.id);
    }
  };

  const handleTrackClick = (index: number) => {
    setCurrentTrackIndex(index);
    const track = currentPlaylist?.tracks[index];
    if (track && playerRef.current) {
      wasPlayingBeforeLoadRef.current = isPlaying;
      isLoadingNewVideoRef.current = true;
      playerRef.current.loadVideoById(track.id);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (currentPlaylistId) {
      removeTrackFromPlaylist(currentPlaylistId, trackId);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0a0c10] via-[#090a0f] to-[#050507] text-white overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.06),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_35%),linear-gradient(300deg,rgba(255,255,255,0.02)_10%,rgba(255,255,255,0)_40%)]" />
      </div>

      {/* Hidden YouTube player */}
      <div className="absolute left-[-9999px] h-px w-px">
        <div id="youtube-player" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 border-b border-white/5 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white to-zinc-200 text-black shadow-lg shadow-white/10">
                <Music className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  YouTube Music Player
                </h1>
                <p className="text-xs text-white/50">
                  Minimal YouTube-powered playlists
                </p>
              </div>
            </div>

          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Playlist Sidebar */}
          <PlaylistSidebar
            playlist={currentPlaylist || null}
            currentPlaylistId={currentPlaylistId}
            currentTrackIndex={currentTrackIndex}
            isPlaying={isPlaying}
            onTrackClick={handleTrackClick}
            onRemoveTrack={handleRemoveTrack}
            onAddTrack={addTrackToPlaylist}
          />

          {/* Player Area */}
          <div className="flex flex-1 items-center justify-center px-6 py-10">
            <div className="w-full max-w-5xl space-y-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
                <span>Now Playing</span>
                <span>{currentPlaylist?.tracks.length || 0} tracks</span>
              </div>

              <NowPlaying track={currentTrack} />

              {currentTrack && (
                <div className="glass-panel rounded-2xl border border-white/5 px-6 py-5 shadow-lg shadow-black/30">
                  <PlayerControls
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    volume={volume}
                    canPlayPrevious={currentTrackIndex > 0}
                    canPlayNext={
                      !!currentPlaylist &&
                      currentTrackIndex < currentPlaylist.tracks.length - 1
                    }
                    onTogglePlay={togglePlay}
                    onPlayPrevious={handlePlayPrevious}
                    onPlayNext={handlePlayNext}
                    onSeek={seek}
                    onVolumeChange={handleVolumeChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
