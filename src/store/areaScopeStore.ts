'use client';
import { create } from 'zustand';
import type { Coordinates } from '@/lib/types';

interface AreaScopeStore {
  appliedBoundary: Coordinates[];
  appliedNeighborhoods: Set<string>;
  setAppliedBoundary: (boundary: Coordinates[]) => void;
  setAppliedNeighborhoods: (neighborhoods: Set<string> | string[]) => void;
  setAppliedArea: (area: { boundary?: Coordinates[]; neighborhoods?: Set<string> | string[] }) => void;
  clearAppliedArea: () => void;
}

function cloneBoundary(boundary: Coordinates[]) {
  return boundary.map((point) => ({ ...point }));
}

function cloneNeighborhoods(neighborhoods: Set<string> | string[]) {
  return new Set(neighborhoods);
}

export const useAreaScopeStore = create<AreaScopeStore>((set) => ({
  appliedBoundary: [],
  appliedNeighborhoods: new Set(),
  setAppliedBoundary: (appliedBoundary) => set({ appliedBoundary: cloneBoundary(appliedBoundary) }),
  setAppliedNeighborhoods: (appliedNeighborhoods) =>
    set({ appliedNeighborhoods: cloneNeighborhoods(appliedNeighborhoods) }),
  setAppliedArea: ({ boundary = [], neighborhoods = [] }) =>
    set({
      appliedBoundary: cloneBoundary(boundary),
      appliedNeighborhoods: cloneNeighborhoods(neighborhoods),
    }),
  clearAppliedArea: () =>
    set({
      appliedBoundary: [],
      appliedNeighborhoods: new Set(),
    }),
}));
