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
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
  }

  const {
    tracks,
    queue,
    index,
    currentTrack,
    isPlaying,
    volume,
    initialize,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setError,
    next,
    previous
  } = usePlayerStore();

  const loadTrack = useCallback(
    async (shouldAutoplay: boolean) => {
      const audio = audioRef.current;
      if (!audio || !currentTrack) return;
      audio.src = currentTrack.src;
      audio.load();
      if (typeof currentTrack.coverSrc === 'string') {
        audio.setAttribute('data-cover', currentTrack.coverSrc);
      }
      if (shouldAutoplay) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          setIsPlaying(false);
          setError('autoplay blocked');
        }
      }
    },
    [currentTrack, setError, setIsPlaying]
  );

  useEffect(() => {
    if (!audioRef.current) return;

    if (tracks.length === 0 && DAFT_PUNK_TRACKS.length > 0) {
      const nextQueue = getQueueFromTracks();
      const randomIndex = Math.floor(Math.random() * nextQueue.length);
      initialize(DAFT_PUNK_TRACKS, nextQueue, randomIndex);
    }
  }, [initialize, tracks.length]);

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
    const shouldAutoplay = hasBootedRef.current;
    loadTrack(shouldAutoplay);
    hasBootedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackSrc]);

  const controls = useMemo<PlayerControls>(
    () => ({
      play: async () => {
        const audio = audioRef.current;
        if (!audio) return;
        try {
          await audio.play();
          setIsPlaying(true);
          setError(undefined);
        } catch (error) {
          setIsPlaying(false);
          setError('playback blocked');
        }
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
          const audio = audioRef.current;
          if (!audio) return;
          try {
            await audio.play();
            setIsPlaying(true);
            setError(undefined);
          } catch (error) {
            setIsPlaying(false);
            setError('playback blocked');
          }
        }
      },
      next: () => {
        next();
      },
      previous: () => {
        previous();
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
    [next, previous, setCurrentTime, setError, setIsPlaying, setVolume]
  );

  return (
    <PlayerContext.Provider value={{ controls }}>
      {children}
    </PlayerContext.Provider>
  );
};
