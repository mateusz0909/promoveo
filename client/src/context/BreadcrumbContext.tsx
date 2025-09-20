import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface BreadcrumbPart {
  name: string;
  path?: string;
}

interface BreadcrumbContextType {
  parts: BreadcrumbPart[];
  setParts: (parts: BreadcrumbPart[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
  const [parts, setParts] = useState<BreadcrumbPart[]>([]);

  return (
    <BreadcrumbContext.Provider value={{ parts, setParts }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};
