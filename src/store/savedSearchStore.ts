'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedSearch } from '@/lib/types';
import {
  createSavedSearch,
  removeSavedSearch,
  renameSavedSearch,
  replaceSavedSearch,
  type SaveSearchInput,
} from '@/features/saved-searches/lib/savedSearchActions';

interface SavedSearchStore {
  searches: SavedSearch[];
  activeSearchId: string | null;
  activeSearchDirty: boolean;
  saveSearch: (input: SaveSearchInput) => string;
  updateSearch: (id: string, input: SaveSearchInput) => void;
  renameSearch: (id: string, name: string) => void;
  deleteSearch: (id: string) => void;
  setActiveSearchId: (id: string | null) => void;
  setActiveSearchDirty: (value: boolean) => void;
}

export const useSavedSearchStore = create<SavedSearchStore>()(
  persist(
    (set) => ({
      searches: [],
      activeSearchId: null,
      activeSearchDirty: false,
      saveSearch: (input) => {
        const id = `ss-${Date.now()}`;
        const search = createSavedSearch(input, id, new Date().toISOString());
        set((state) => ({
          searches: [search, ...state.searches],
          activeSearchId: id,
          activeSearchDirty: false,
        }));
        return id;
      },
      updateSearch: (id, input) =>
        set((state) => ({
          searches: replaceSavedSearch(state.searches, id, input),
          activeSearchDirty: false,
        })),
      renameSearch: (id, name) =>
        set((state) => ({
          searches: renameSavedSearch(state.searches, id, name),
        })),
      deleteSearch: (id) =>
        set((state) => ({
          searches: removeSavedSearch(state.searches, id),
          activeSearchId: state.activeSearchId === id ? null : state.activeSearchId,
          activeSearchDirty: state.activeSearchId === id ? false : state.activeSearchDirty,
        })),
      setActiveSearchId: (activeSearchId) => set({ activeSearchId }),
      setActiveSearchDirty: (activeSearchDirty) => set({ activeSearchDirty }),
    }),
    {
      name: 'homes-saved-searches-v1',
      partialize: (state) => ({
        searches: state.searches,
        activeSearchId: state.activeSearchId,
        activeSearchDirty: state.activeSearchDirty,
      }),
    }
  )
);
