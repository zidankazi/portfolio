import { create } from 'zustand';
import type { Track } from '@/data/daftpunk.generated';

const findTrackById = (tracks: Track[], id?: string) => {
  if (!id) return undefined;
  return tracks.find((track) => track.id === id);
};

export type PlayerState = {
  tracks: Track[];
  queue: string[];
  index: number;
  currentTrack?: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error?: string;
  initialize: (tracks: Track[], queue: string[], index: number) => void;
  setTracks: (tracks: Track[]) => void;
  setQueue: (queue: string[]) => void;
  setIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setError: (error?: string) => void;
  reset: () => void;
};

const getWrappedIndex = (value: number, length: number) => {
  if (length === 0) return 0;
  return (value + length) % length;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  queue: [],
  index: 0,
  currentTrack: undefined,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.6,
  error: undefined,
  initialize: (tracks, queue, index) =>
    set({
      tracks,
      queue,
      index,
      currentTrack: findTrackById(tracks, queue[index])
    }),
  setTracks: (tracks) =>
    set((state) => {
      const currentId = state.queue[state.index];
      return {
        tracks,
        currentTrack: findTrackById(tracks, currentId)
      };
    }),
  setQueue: (queue) =>
    set((state) => {
      const index = getWrappedIndex(state.index, queue.length);
      const tracksToSearch = state.tracks.length > 0 ? state.tracks : [];
      return {
        queue,
        index,
        currentTrack: findTrackById(tracksToSearch, queue[index])
      };
    }),
  setIndex: (index) =>
    set((state) => {
      const nextIndex = getWrappedIndex(index, state.queue.length);
      return {
        index: nextIndex,
        currentTrack: findTrackById(state.tracks, state.queue[nextIndex])
      };
    }),
  next: () =>
    set((state) => {
      const nextIndex = getWrappedIndex(state.index + 1, state.queue.length);
      return {
        index: nextIndex,
        currentTrack: findTrackById(state.tracks, state.queue[nextIndex])
      };
    }),
  previous: () =>
    set((state) => {
      const nextIndex = getWrappedIndex(state.index - 1, state.queue.length);
      return {
        index: nextIndex,
        currentTrack: findTrackById(state.tracks, state.queue[nextIndex])
      };
    }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      tracks: [],
      queue: [],
      index: 0,
      currentTrack: undefined,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.6,
      error: undefined
    })
}));
