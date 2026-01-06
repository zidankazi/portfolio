'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { DAFT_PUNK_TRACKS } from '@/data/daftpunk.generated';
import { shuffle } from '@/lib/shuffle';
import { usePlayerStore } from '@/store/player';

export type PlayerControls = {
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
};

type PlayerContextValue = {
  controls: PlayerControls;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayer = () => {
  const value = useContext(PlayerContext);
  if (!value) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return value;
};

const getQueueFromTracks = () => shuffle(DAFT_PUNK_TRACKS.map((track) => track.id));

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasBootedRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const skipLoadRef = useRef<string | null>(null);
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
  }

  const {
    currentTrack,
    isPlaying,
    volume,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setError
  } = usePlayerStore();

  const applyTrack = useCallback((track: typeof currentTrack) => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.src = track.src;
    audio.load();
    if (typeof track.coverSrc === 'string') {
      audio.setAttribute('data-cover', track.coverSrc);
    }
  }, []);

  const attemptPlay = useCallback(async (errorLabel = 'playback blocked') => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      await audio.play();
      setIsPlaying(true);
      setError(undefined);
      return true;
    } catch (error) {
      setIsPlaying(false);
      setError(errorLabel);
      return false;
    }
  }, [setError, setIsPlaying]);

  const loadTrack = useCallback(
    async (shouldAutoplay: boolean) => {
      if (!currentTrack) return;
      if (skipLoadRef.current === currentTrack.id) {
        skipLoadRef.current = null;
        return;
      }
      applyTrack(currentTrack);
      if (shouldAutoplay) {
        await attemptPlay('autoplay blocked');
      }
    },
    [applyTrack, attemptPlay, currentTrack]
  );

  useEffect(() => {
    console.log('[PlayerProvider] Init effect running', {
      hasInitialized: hasInitializedRef.current,
      tracksCount: DAFT_PUNK_TRACKS.length
    });
    if (hasInitializedRef.current) return;
    if (DAFT_PUNK_TRACKS.length > 0) {
      hasInitializedRef.current = true;
      const nextQueue = getQueueFromTracks();
      const randomIndex = Math.floor(Math.random() * nextQueue.length);
      console.log('[PlayerProvider] Calling initialize with', {
        tracksCount: DAFT_PUNK_TRACKS.length,
        queueLength: nextQueue.length,
        randomIndex,
        firstTrackId: nextQueue[randomIndex]
      });
      usePlayerStore.getState().initialize(DAFT_PUNK_TRACKS, nextQueue, randomIndex);
      console.log('[PlayerProvider] After initialize, currentTrack:', usePlayerStore.getState().currentTrack);
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleTime = () => setCurrentTime(audio.currentTime || 0);
    const handleDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      next();
    };
    const handleError = () => setError('audio error');

    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('loadedmetadata', handleDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('loadedmetadata', handleDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [next, setCurrentTime, setDuration, setError]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const currentTrackSrc = currentTrack?.src;
  useEffect(() => {
    if (!audioRef.current || !currentTrackSrc) return;
    const shouldAutoplay = hasBootedRef.current && isPlaying;
    loadTrack(shouldAutoplay);
    hasBootedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackSrc, isPlaying]);

  const controls = useMemo<PlayerControls>(
    () => ({
      play: async () => {
        await attemptPlay();
      },
      pause: () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        setIsPlaying(false);
      },
      toggle: async () => {
        if (usePlayerStore.getState().isPlaying) {
          const audio = audioRef.current;
          if (!audio) return;
          audio.pause();
          setIsPlaying(false);
        } else {
          await attemptPlay();
        }
      },
      next: () => {
        const state = usePlayerStore.getState();
        if (state.queue.length === 0 || state.tracks.length === 0) return;
        const nextIndex = (state.index + 1) % state.queue.length;
        const nextTrack = state.tracks.find((track) => track.id === state.queue[nextIndex]);
        usePlayerStore.getState().setIndex(nextIndex);
        if (nextTrack) {
          skipLoadRef.current = nextTrack.id;
          applyTrack(nextTrack);
          if (state.isPlaying) {
            void attemptPlay();
          }
        }
      },
      previous: () => {
        const state = usePlayerStore.getState();
        if (state.queue.length === 0 || state.tracks.length === 0) return;
        const prevIndex = (state.index - 1 + state.queue.length) % state.queue.length;
        const prevTrack = state.tracks.find((track) => track.id === state.queue[prevIndex]);
        usePlayerStore.getState().setIndex(prevIndex);
        if (prevTrack) {
          skipLoadRef.current = prevTrack.id;
          applyTrack(prevTrack);
          if (state.isPlaying) {
            void attemptPlay();
          }
        }
      },
      seek: (time) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);
      },
      setVolume: (nextVolume) => {
        const clamped = Math.max(0, Math.min(1, nextVolume));
        setVolume(clamped);
        if (audioRef.current) {
          audioRef.current.volume = clamped;
        }
      }
    }),
    [applyTrack, attemptPlay, setCurrentTime, setIsPlaying, setVolume]
  );

  return (
    <PlayerContext.Provider value={{ controls }}>
      {children}
    </PlayerContext.Provider>
  );
};
