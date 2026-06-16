'use client';
import { createContext, useContext, type ReactNode } from 'react';

/**
 * Describes the view a listing card lives in, so its quick-save confirmation
 * toast can anchor correctly. `list` (default) anchors top center; `map`
 * anchors lower to clear the map's top toolbar on mobile.
 */
export type SavePromptView = 'list' | 'map';

const SavePromptViewContext = createContext<SavePromptView>('list');

export function SavePromptViewProvider({ value, children }: { value: SavePromptView; children: ReactNode }) {
  return <SavePromptViewContext.Provider value={value}>{children}</SavePromptViewContext.Provider>;
}

export function useSavePromptView() {
  return useContext(SavePromptViewContext);
}
