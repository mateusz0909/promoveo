import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface CurrentProject {
  id: string;
  name: string;
  device: string;
}

interface ProjectContextType {
  currentProject: CurrentProject | null;
  setCurrentProject: (project: CurrentProject | null) => void;
  updateCurrentProject: (updates: Partial<CurrentProject>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<CurrentProject | null>(null);

  const updateCurrentProject = (updates: Partial<CurrentProject>) => {
    if (currentProject) {
      setCurrentProject({ ...currentProject, ...updates });
    }
  };

  const value = {
    currentProject,
    setCurrentProject,
    updateCurrentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};