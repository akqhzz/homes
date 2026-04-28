'use client';
import { create } from 'zustand';
import type { Coordinates } from '@/lib/types';

interface AreaScopeStore {
  appliedBoundaries: Coordinates[][];
  appliedNeighborhoods: Set<string>;
  setAppliedBoundaries: (boundaries: Coordinates[][]) => void;
  setAppliedNeighborhoods: (neighborhoods: Set<string> | string[]) => void;
  setAppliedArea: (area: {
    boundary?: Coordinates[];
    boundaries?: Coordinates[][];
    neighborhoods?: Set<string> | string[];
  }) => void;
  clearAppliedArea: () => void;
}

function cloneBoundary(boundary: Coordinates[]) {
  return boundary.map((point) => ({ ...point }));
}

function cloneBoundaries(boundaries: Coordinates[][]) {
  return boundaries.filter((boundary) => boundary.length >= 3).map(cloneBoundary);
}

function cloneNeighborhoods(neighborhoods: Set<string> | string[]) {
  return new Set(neighborhoods);
}

export const useAreaScopeStore = create<AreaScopeStore>((set) => ({
  appliedBoundaries: [],
  appliedNeighborhoods: new Set(),
  setAppliedBoundaries: (appliedBoundaries) => set({ appliedBoundaries: cloneBoundaries(appliedBoundaries) }),
  setAppliedNeighborhoods: (appliedNeighborhoods) =>
    set({ appliedNeighborhoods: cloneNeighborhoods(appliedNeighborhoods) }),
  setAppliedArea: ({ boundary, boundaries, neighborhoods = [] }) =>
    set({
      appliedBoundaries: cloneBoundaries(boundaries ?? (boundary ? [boundary] : [])),
      appliedNeighborhoods: cloneNeighborhoods(neighborhoods),
    }),
  clearAppliedArea: () =>
    set({
      appliedBoundaries: [],
      appliedNeighborhoods: new Set(),
    }),
}));
