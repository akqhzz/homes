'use client';
import { useMemo, useState } from 'react';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import type { Coordinates, Neighborhood, SavedSearch, SearchFilters } from '@/lib/types';
import {
  createSearchSnapshot,
  getCarryoverAreaSelection,
  getNeighborhoodIdForLocation,
  removeLocationsMatchingNeighborhood,
  type SearchSnapshot,
} from '@/lib/search/utils';
import type { AreaChip } from '@/lib/utils/search-display';

function cloneBoundary(boundary: Coordinates[]) {
  return boundary.map((point) => ({ ...point }));
}

function getSearchBoundaries(search: SavedSearch) {
  return search.areaBoundaries?.map(cloneBoundary) ?? (search.areaBoundary ? [cloneBoundary(search.areaBoundary)] : []);
}

interface UseAreaSelectionOptions {
  activePanel: string;
  selectedLocations: SavedSearch['locations'];
  filters: SearchFilters;
  appliedBoundaries: Coordinates[][];
  appliedNeighborhoods: Set<string>;
  setLocations: (locations: SavedSearch['locations']) => void;
  clearLocations: () => void;
  setAppliedBoundaries: (boundaries: Coordinates[][]) => void;
  setAppliedNeighborhoods: (neighborhoods: Set<string>) => void;
  setAppliedArea: (area: { neighborhoods: Set<string> | string[]; boundaries: Coordinates[][] }) => void;
  clearAppliedAreaScope: () => void;
  setActivePanel: (panel: 'none' | 'area-select') => void;
  setAreaSelectMode: (value: boolean) => void;
  onOpenAreaSelection?: () => void;
  onRestoreSearchState?: (snapshot: SearchSnapshot) => void;
  onApplySavedSearch?: (search: SavedSearch, boundaries: Coordinates[][], neighborhoods: Set<string>) => void;
}

export function useAreaSelection({
  activePanel,
  selectedLocations,
  filters,
  appliedBoundaries,
  appliedNeighborhoods,
  setLocations,
  clearLocations,
  setAppliedBoundaries,
  setAppliedNeighborhoods,
  setAppliedArea,
  clearAppliedAreaScope,
  setActivePanel,
  setAreaSelectMode,
  onOpenAreaSelection,
  onRestoreSearchState,
  onApplySavedSearch,
}: UseAreaSelectionOptions) {
  const [focusedNeighborhood, setFocusedNeighborhood] = useState<Neighborhood | null>(null);
  const [areaFocusToken, setAreaFocusToken] = useState(0);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<Neighborhood | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set());
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [drawnBoundaries, setDrawnBoundaries] = useState<Coordinates[][]>([]);
  const [drawnBoundary, setDrawnBoundary] = useState<Coordinates[]>([]);
  const [redoBoundary, setRedoBoundary] = useState<Coordinates[]>([]);
  const [clearedBoundarySnapshot, setClearedBoundarySnapshot] = useState<Coordinates[] | null>(null);
  const [clearedBoundaryRedoSnapshot, setClearedBoundaryRedoSnapshot] = useState<Coordinates[] | null>(null);
  const [areaUndoStack, setAreaUndoStack] = useState<Set<string>[]>([]);
  const [areaRedoStack, setAreaRedoStack] = useState<Set<string>[]>([]);
  const [preSavedSearchState, setPreSavedSearchState] = useState<SearchSnapshot | null>(null);

  const isAreaSelect = activePanel === 'area-select';
  const visibleDraftBoundaries = useMemo(
    () => [...drawnBoundaries, ...(drawnBoundary.length > 0 ? [drawnBoundary] : [])],
    [drawnBoundaries, drawnBoundary]
  );
  const completedDraftBoundaries = useMemo(
    () => [...drawnBoundaries, ...(drawnBoundary.length >= 3 ? [drawnBoundary] : [])],
    [drawnBoundaries, drawnBoundary]
  );

  const resetAreaDraftHistory = () => {
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
  };

  const getSeededAreaDraft = (preserveCurrentDraft: boolean) => {
    if (preserveCurrentDraft) {
      return {
        neighborhoods: new Set(selectedNeighborhoods),
        boundaries: visibleDraftBoundaries.map(cloneBoundary),
      };
    }

    const { matchedNeighborhoodIds, fallbackBoundary } = getCarryoverAreaSelection(selectedLocations);
    const neighborhoods = new Set([...appliedNeighborhoods, ...matchedNeighborhoodIds]);
    const boundaries = appliedBoundaries.length > 0
      ? appliedBoundaries.map(cloneBoundary)
      : fallbackBoundary.length >= 3
        ? [cloneBoundary(fallbackBoundary)]
        : [];

    return { neighborhoods, boundaries };
  };

  const openAreaSelection = (mode: 'select' | 'draw') => {
    const isDrawMode = mode === 'draw';
    const { neighborhoods, boundaries } = getSeededAreaDraft(isAreaSelect);

    onOpenAreaSelection?.();
    setSelectedNeighborhoods(neighborhoods);
    setDrawnBoundaries(boundaries);
    setDrawnBoundary([]);
    resetAreaDraftHistory();
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    if (!isDrawMode) {
      const [firstNeighborhoodId] = neighborhoods;
      setFocusedNeighborhood(
        firstNeighborhoodId
          ? MOCK_NEIGHBORHOODS.find((neighborhood) => neighborhood.id === firstNeighborhoodId) ?? null
          : null
      );
    }
    setIsDrawingArea(isDrawMode);
    setAreaSelectMode(true);
    setActivePanel('area-select');
  };

  const clearAppliedArea = () => {
    clearAppliedAreaScope();
    setSelectedNeighborhoods(new Set());
    setDrawnBoundaries([]);
    setDrawnBoundary([]);
    resetAreaDraftHistory();
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
  };

  const resetAreaSelectDraft = () => {
    setActivePanel('none');
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setIsDrawingArea(false);
    setSelectedNeighborhoods(new Set());
    setDrawnBoundaries([]);
    setDrawnBoundary([]);
    resetAreaDraftHistory();
  };

  const toggleNeighborhood = (id: string) => {
    setAreaUndoStack((stack) => [...stack, new Set(selectedNeighborhoods)]);
    setAreaRedoStack([]);
    const next = new Set(selectedNeighborhoods);
    if (next.has(id)) {
      next.delete(id);
      const remainingLocations = removeLocationsMatchingNeighborhood(selectedLocations, id);
      if (remainingLocations.length === 0) clearLocations();
      else if (remainingLocations.length !== selectedLocations.length) setLocations(remainingLocations);
    } else {
      next.add(id);
    }
    setSelectedNeighborhoods(next);
  };

  const clearVisibleBoundaries = () => {
    clearAppliedArea();
    const remainingLocations = selectedLocations.filter((location) => (location.boundary?.length ?? 0) < 3);
    if (remainingLocations.length !== selectedLocations.length) {
      if (remainingLocations.length === 0) clearLocations();
      else setLocations(remainingLocations);
    }
  };

  const removeAppliedAreaChip = (chip: AreaChip) => {
    if (chip.kind === 'custom-boundary') {
      setAppliedBoundaries([]);
      setDrawnBoundaries([]);
      setDrawnBoundary([]);
      resetAreaDraftHistory();
      return;
    }

    if (chip.kind === 'neighborhood' && appliedNeighborhoods.has(chip.id)) {
      const nextNeighborhoods = new Set(appliedNeighborhoods);
      nextNeighborhoods.delete(chip.id);
      setAppliedNeighborhoods(nextNeighborhoods);
      setSelectedNeighborhoods(new Set(nextNeighborhoods));
      return;
    }

    if (chip.kind === 'search-area') {
      const remainingLocations = selectedLocations.filter((location) => location.id !== chip.id);
      if (remainingLocations.length === 0) clearLocations();
      else setLocations(remainingLocations);
    }
  };

  const removeSearchLocationChip = (location: SavedSearch['locations'][number]) => {
    const matchingNeighborhoodId = getNeighborhoodIdForLocation(location);

    if (matchingNeighborhoodId && appliedNeighborhoods.has(matchingNeighborhoodId)) {
      const nextNeighborhoods = new Set(appliedNeighborhoods);
      nextNeighborhoods.delete(matchingNeighborhoodId);
      setAppliedNeighborhoods(nextNeighborhoods);
      setSelectedNeighborhoods(new Set(nextNeighborhoods));
    }

    const remainingLocations = selectedLocations.filter((item) => item.id !== location.id);
    if (remainingLocations.length === 0) clearLocations();
    else setLocations(remainingLocations);
  };

  const undoBoundary = () => {
    if (drawnBoundary.length === 0 && clearedBoundarySnapshot && redoBoundary.length === 0) {
      setDrawnBoundary(clearedBoundarySnapshot);
      setClearedBoundaryRedoSnapshot(clearedBoundarySnapshot);
      setClearedBoundarySnapshot(null);
      return;
    }
    if (drawnBoundary.length === 0) {
      setAreaUndoStack((stack) => {
        if (stack.length === 0) return stack;
        const previous = stack[stack.length - 1];
        setAreaRedoStack((redo) => [new Set(selectedNeighborhoods), ...redo]);
        setSelectedNeighborhoods(new Set(previous));
        return stack.slice(0, -1);
      });
      return;
    }
    setDrawnBoundary((points) => {
      if (points.length === 0) return points;
      const next = points.slice(0, -1);
      setRedoBoundary((redo) => [points[points.length - 1], ...redo]);
      setClearedBoundarySnapshot(null);
      setClearedBoundaryRedoSnapshot(null);
      return next;
    });
  };

  const redoBoundaryPoint = () => {
    if (drawnBoundary.length > 0 && clearedBoundaryRedoSnapshot && redoBoundary.length === 0) {
      setDrawnBoundary([]);
      setClearedBoundarySnapshot(clearedBoundaryRedoSnapshot);
      setClearedBoundaryRedoSnapshot(null);
      return;
    }
    if (drawnBoundary.length === 0 && clearedBoundarySnapshot === null && redoBoundary.length > 0) {
      setRedoBoundary((redo) => {
        if (redo.length === 0) return redo;
        const [point, ...rest] = redo;
        setDrawnBoundary([point]);
        return rest;
      });
      return;
    }
    if (redoBoundary.length === 0) {
      setAreaRedoStack((redo) => {
        if (redo.length === 0) return redo;
        const [next, ...rest] = redo;
        setAreaUndoStack((stack) => [...stack, new Set(selectedNeighborhoods)]);
        setSelectedNeighborhoods(new Set(next));
        return rest;
      });
      return;
    }
    setRedoBoundary((redo) => {
      if (redo.length === 0) return redo;
      const [point, ...rest] = redo;
      setDrawnBoundary((points) => [...points, point]);
      return rest;
    });
  };

  const addDrawnBoundaryPoint = (coordinates: Coordinates) => {
    setDrawnBoundary((points) => [...points, coordinates]);
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
  };

  const addDrawnBoundaryShape = () => {
    if (drawnBoundary.length < 3) return;
    setDrawnBoundaries((boundaries) => [...boundaries, cloneBoundary(drawnBoundary)]);
    setDrawnBoundary([]);
    resetAreaDraftHistory();
  };

  const clearDrawnBoundaryShapes = () => {
    setDrawnBoundaries([]);
    setDrawnBoundary([]);
    resetAreaDraftHistory();
  };

  const applyAreaSelect = () => {
    setAppliedArea({ neighborhoods: selectedNeighborhoods, boundaries: completedDraftBoundaries });
    resetAreaSelectDraft();
  };

  const applySavedSearch = (search: SavedSearch) => {
    const nextNeighborhoods = new Set(search.neighborhoodIds ?? []);
    const nextBoundaries = getSearchBoundaries(search);
    setAppliedArea({ neighborhoods: nextNeighborhoods, boundaries: nextBoundaries });
    setSelectedNeighborhoods(new Set(nextNeighborhoods));
    setDrawnBoundaries(nextBoundaries);
    setDrawnBoundary([]);
    resetAreaDraftHistory();
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setIsDrawingArea(false);
    onApplySavedSearch?.(search, nextBoundaries, nextNeighborhoods);
  };

  const handleSelectSavedSearch = (search: SavedSearch) => {
    setPreSavedSearchState((current) =>
      current ?? createSearchSnapshot(selectedLocations, filters, appliedBoundaries, appliedNeighborhoods)
    );
    applySavedSearch(search);
  };

  const restoreSearchSnapshot = (fallback: SearchSnapshot) => {
    setLocations(fallback.locations);
    setAppliedArea({ boundaries: fallback.areaBoundaries, neighborhoods: fallback.neighborhoodIds });
    setSelectedNeighborhoods(new Set(fallback.neighborhoodIds));
    setDrawnBoundaries(fallback.areaBoundaries);
    setDrawnBoundary([]);
    resetAreaDraftHistory();
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setPreSavedSearchState(null);
    onRestoreSearchState?.(fallback);
  };

  const handleDeselectSavedSearch = (onDeselect: () => void) => {
    const fallback = preSavedSearchState;
    onDeselect();
    if (!fallback) return;
    restoreSearchSnapshot(fallback);
  };

  const handleNeighborhoodClick = (neighborhood: Neighborhood) => {
    setAreaFocusToken((token) => token + 1);
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const isIncluded = selectedNeighborhoods.has(neighborhood.id);
    toggleNeighborhood(neighborhood.id);

    if (isIncluded) {
      setFocusedNeighborhood(null);
      setHoveredNeighborhood(null);
      return;
    }

    if (!isDesktop) {
      setFocusedNeighborhood(neighborhood);
      return;
    }

    setFocusedNeighborhood(neighborhood);
  };

  return {
    addDrawnBoundaryPoint,
    addDrawnBoundaryShape,
    applyAreaSelect,
    areaFocusToken,
    canAddShape: drawnBoundary.length >= 3,
    canClearShapes: visibleDraftBoundaries.length > 0,
    canRedoBoundary: redoBoundary.length > 0 || areaRedoStack.length > 0 || clearedBoundaryRedoSnapshot !== null,
    canUndoBoundary: drawnBoundary.length > 0 || areaUndoStack.length > 0 || clearedBoundarySnapshot !== null,
    cancelAreaSelect: resetAreaSelectDraft,
    clearDrawnBoundaryShapes,
    clearVisibleBoundaries,
    completedDraftBoundaries,
    draftBoundaryCount: completedDraftBoundaries.length,
    drawnBoundary,
    editAppliedArea: () => openAreaSelection('select'),
    focusedNeighborhood,
    handleDeselectSavedSearch,
    handleNeighborhoodClick,
    handleSelectSavedSearch,
    isAreaSelect,
    isDrawingArea,
    openAreaSelect: () => openAreaSelection('select'),
    openAreaSelection,
    redoBoundaryPoint,
    removeAppliedAreaChip,
    removeSearchLocationChip,
    selectedNeighborhoods,
    setFocusedNeighborhood,
    setHoveredNeighborhood,
    toggleNeighborhood,
    undoBoundary,
    visibleDraftBoundaries,
    areaPreviewNeighborhoodId:
      hoveredNeighborhood?.id ??
      (focusedNeighborhood && !selectedNeighborhoods.has(focusedNeighborhood.id) ? focusedNeighborhood.id : null),
  };
}
