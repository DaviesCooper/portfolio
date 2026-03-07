import { createContext, useContext, type ReactNode } from 'react';
import type { LaserTool } from '../types';

export interface LaserToolContextValue {
  readonly tool: LaserTool;
  readonly setTool: (tool: LaserTool) => void;
}

const LaserToolContext = createContext<LaserToolContextValue | null>(null);

export function LaserToolProvider(props: {
  readonly value: LaserToolContextValue;
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <LaserToolContext.Provider value={props.value}>
      {props.children}
    </LaserToolContext.Provider>
  );
}

export function useLaserTool(): LaserToolContextValue {
  const ctx = useContext(LaserToolContext);
  if (ctx == null) {
    throw new Error('useLaserTool must be used within LaserToolProvider');
  }
  return ctx;
}
