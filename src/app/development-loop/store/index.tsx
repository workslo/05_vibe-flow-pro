'use client';

import React, {
  type ReactNode,
  createContext,
  useContext,
  useState,
} from 'react';
import { useStore } from 'zustand';

import {
  type DevelopmentRunState,
  type DevelopmentRunStore,
  createDevelopmentRunStore,
} from './run-store';

export type DevelopmentRunStoreApi = ReturnType<typeof createDevelopmentRunStore>;

const DevelopmentRunStoreContext = createContext<
  DevelopmentRunStoreApi | undefined
>(undefined);

export interface DevelopmentRunProviderProps {
  children: ReactNode;
  initialState?: Partial<DevelopmentRunState>;
}

export const DevelopmentRunProvider = ({
  children,
  initialState,
}: DevelopmentRunProviderProps) => {
  const [store] = useState<DevelopmentRunStoreApi>(() =>
    createDevelopmentRunStore(initialState),
  );

  return (
    <DevelopmentRunStoreContext.Provider value={store}>
      {children}
    </DevelopmentRunStoreContext.Provider>
  );
};

export const useDevelopmentRunStore = <T,>(
  selector: (store: DevelopmentRunStore) => T,
): T => {
  const developmentRunStoreContext = useContext(DevelopmentRunStoreContext);

  if (!developmentRunStoreContext) {
    throw new Error(
      'useDevelopmentRunStore must be used within DevelopmentRunProvider',
    );
  }

  return useStore(developmentRunStoreContext, selector);
};
