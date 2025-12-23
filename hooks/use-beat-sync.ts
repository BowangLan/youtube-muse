"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePlayerStore } from "@/lib/store/player-store";

interface BeatSyncState {
  /** Animation duration in seconds, synced to the beat */
  pulseInterval: number;
  /** Current intensity based on detected beat (0-1) */
  intensity: number;
  /** Detected or estimated BPM */
  bpm: number;
  /** Whether audio is being analyzed */
  isListening: boolean;
  /** Start listening to audio */
  startListening: () => Promise<void>;
  /** Stop listening to audio */
  stopListening: () => void;
  /** Error message if audio capture failed */
  error: string | null;
}

const DEFAULT_BPM = 120;
const MIN_BPM = 60;
const MAX_BPM = 180;

// Beat detection parameters
const ENERGY_THRESHOLD = 1.3; // Energy spike must be 1.3x above average
const BEAT_COOLDOWN_MS = 200; // Minimum time between beats (300 BPM max)
const BPM_HISTORY_SIZE = 8; // Number of beat intervals to average
const SMOOTHING_FACTOR = 0.8; // Intensity decay factor

/**
 * Hook that provides beat-synced animation timing using real audio analysis.
 * 
 * Uses the Web Audio API to capture and analyze audio:
 * - System audio via screen/tab share (getDisplayMedia)
 * - Or microphone input as fallback (getUserMedia)
 * 
 * Beat detection uses energy-based analysis of low frequencies (bass/kick).
 */
export function useBeatSync(): BeatSyncState {
  const { isPlaying } = usePlayerStore();

  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [intensity, setIntensity] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Beat detection state
  const energyHistoryRef = useRef<number[]>([]);
  const beatTimesRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);
  const currentIntensityRef = useRef<number>(0);
  const stopListeningRef = useRef<() => void>(() => { });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Calculate average energy from frequency data (focusing on low frequencies for bass/kick)
  const calculateEnergy = useCallback((dataArray: Uint8Array): number => {
    // Focus on low frequencies (first ~20% of spectrum) for bass/kick detection
    const lowFreqEnd = Math.floor(dataArray.length * 0.2);
    let sum = 0;
    for (let i = 0; i < lowFreqEnd; i++) {
      sum += dataArray[i] * dataArray[i]; // Square for energy
    }
    return Math.sqrt(sum / lowFreqEnd);
  }, []);

  // Detect beat based on energy spike
  const detectBeat = useCallback((energy: number, now: number): boolean => {
    const history = energyHistoryRef.current;

    // Add current energy to history
    history.push(energy);
    if (history.length > 43) { // ~1 second of history at 60fps
      history.shift();
    }

    // Calculate average energy
    const avgEnergy = history.reduce((a, b) => a + b, 0) / history.length;

    // Check for energy spike above threshold
    const isBeat = energy > avgEnergy * ENERGY_THRESHOLD &&
      energy > 20 && // Minimum absolute energy
      (now - lastBeatTimeRef.current) > BEAT_COOLDOWN_MS;

    if (isBeat) {
      // Record beat time for BPM calculation
      const beatTimes = beatTimesRef.current;
      beatTimes.push(now);

      // Keep only recent beats
      if (beatTimes.length > BPM_HISTORY_SIZE + 1) {
        beatTimes.shift();
      }

      // Calculate BPM from beat intervals
      if (beatTimes.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < beatTimes.length; i++) {
          intervals.push(beatTimes[i] - beatTimes[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);

        // Clamp BPM to reasonable range
        if (calculatedBpm >= MIN_BPM && calculatedBpm <= MAX_BPM) {
          setBpm(calculatedBpm);
        }
      }

      lastBeatTimeRef.current = now;
    }

    return isBeat;
  }, []);

  // Animation loop for beat detection
  const analyze = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const loop = () => {
      if (!analyserRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      const energy = calculateEnergy(dataArray);
      const now = performance.now();

      const isBeat = detectBeat(energy, now);

      // Update intensity with beat spike and smooth decay
      if (isBeat) {
        currentIntensityRef.current = 1;
      } else {
        currentIntensityRef.current *= SMOOTHING_FACTOR;
      }

      setIntensity(currentIntensityRef.current);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, [calculateEnergy, detectBeat]);

  // Start listening to audio
  const startListening = useCallback(async () => {
    setError(null);
    cleanup();

    try {
      let stream: MediaStream;

      // Try to get system audio via screen/tab share first
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // Required, but we'll ignore it
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          } as MediaTrackConstraints,
        });

        // Stop video track immediately - we only need audio
        stream.getVideoTracks().forEach(track => track.stop());

        // Check if we got audio
        if (stream.getAudioTracks().length === 0) {
          throw new Error("No audio track available from screen share");
        }
      } catch {
        // Fallback to microphone
        console.log("Screen share audio not available, falling back to microphone");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      }

      streamRef.current = stream;

      // Create audio context and analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Reset beat detection state
      energyHistoryRef.current = [];
      beatTimesRef.current = [];
      lastBeatTimeRef.current = 0;

      setIsListening(true);
      analyze();

      // Handle stream ending (user stops sharing)
      stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        stopListeningRef.current();
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to capture audio";
      setError(message);
      console.error("Audio capture error:", err);
      cleanup();
    }
  }, [cleanup, analyze]);

  // Stop listening to audio
  const stopListening = useCallback(() => {
    cleanup();
    setIsListening(false);
    setIntensity(0);
    setBpm(DEFAULT_BPM);
    energyHistoryRef.current = [];
    beatTimesRef.current = [];
  }, [cleanup]);

  // Keep ref updated for use in event handlers
  stopListeningRef.current = stopListening;

  // Auto-stop when not playing
  useEffect(() => {
    if (!isPlaying && isListening) {
      // Keep listening but reduce intensity when paused
      setIntensity(0);
    }
  }, [isPlaying, isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Calculate pulse interval from BPM
  const beatDuration = 60 / bpm;
  const pulseInterval = beatDuration * 2; // Pulse every 2 beats

  return {
    pulseInterval,
    intensity: isPlaying ? intensity : 0,
    bpm,
    isListening,
    startListening,
    stopListening,
    error,
  };
}

/**
 * Returns CSS custom properties for beat-synced animations
 */
export function useBeatSyncStyles() {
  const { pulseInterval, intensity, bpm, isListening, startListening, stopListening, error } = useBeatSync();
  const { isPlaying } = usePlayerStore();

  return {
    style: {
      "--beat-pulse-duration": `${pulseInterval}s`,
      "--beat-intensity": intensity,
      "--beat-bpm": bpm,
    } as React.CSSProperties,
    pulseInterval,
    intensity,
    bpm,
    isPlaying,
    isListening,
    startListening,
    stopListening,
    error,
  };
}
