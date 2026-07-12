'use client';

import React, {
  type ReactNode,
  createContext,
  useContext,
  useState,
} from 'react';
import { useStore } from 'zustand';

import {
  type LineageState,
  type LineageStore,
  createLineageStore,
} from './lineage-store';

export type LineageStoreApi = ReturnType<typeof createLineageStore>;

const LineageStoreContext = createContext<LineageStoreApi | undefined>(
  undefined,
);

export interface LineageProviderProps {
  children: ReactNode;
  initialState?: Partial<LineageState>;
}

export const LineageProvider = ({
  children,
  initialState,
}: LineageProviderProps) => {
  const [store] = useState<LineageStoreApi>(() =>
    createLineageStore(initialState),
  );

  return (
    <LineageStoreContext.Provider value={store}>
      {children}
    </LineageStoreContext.Provider>
  );
};

export const useLineageStore = <T,>(
  selector: (store: LineageStore) => T,
): T => {
  const lineageStoreContext = useContext(LineageStoreContext);

  if (!lineageStoreContext) {
    throw new Error('useLineageStore must be used within LineageProvider');
  }

  return useStore(lineageStoreContext, selector);
};
