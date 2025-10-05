import { useState, useEffect, useRef } from 'react';
import { StudioEditorProvider, useStudioEditor } from '@/context/StudioEditorContext';
import { EditorTopToolbar } from './EditorTopToolbar';
import { EditorLeftSidebar } from './EditorLeftSidebar';
import { EditorBottomToolbar } from './EditorBottomToolbar';
import { MultiScreenshotCanvas } from './MultiScreenshotCanvas';
import type { GeneratedImage } from '@/types/project';

interface StudioEditorLayoutProps {
  imageList: GeneratedImage[];
  projectId: string;
}

/**
 * Inner component that has access to the editor context
 */
function EditorContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { clearSelection, deleteElement, selection } = useStudioEditor();

  // Handle clicks outside canvas to unfocus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside any canvas element
      const isCanvasClick = target.closest('canvas');
      const isTextEditor = target.closest('[data-canvas-text-editor]');
      const isToolbar = target.closest('[data-editor-toolbar]');
      const isPopover = target.closest('[role="dialog"]') || target.closest('[data-radix-popper-content-wrapper]');
      
      // If clicking outside canvas and not in the text editor or toolbar, unfocus
      if (!isCanvasClick && !isTextEditor && !isToolbar && !isPopover) {
        clearSelection();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSelection]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete/Backspace - delete selected element
      if ((event.key === 'Delete' || event.key === 'Backspace') && selection.elementId) {
        // Prevent default only if an element is selected and we're not in a text input
        const target = event.target as HTMLElement;
        const isTextInput = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true';
        
        if (!isTextInput && selection.screenshotIndex !== null) {
          event.preventDefault();
          deleteElement(selection.screenshotIndex, selection.elementId);
        }
      }

      // Escape - clear selection
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, deleteElement, selection.screenshotIndex, selection.elementId]);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background">
      {/* Top Toolbar - context-aware editing controls */}
      <EditorTopToolbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - global settings */}
        <EditorLeftSidebar />
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <MultiScreenshotCanvas />
        </div>
      </div>
      
      {/* Bottom Toolbar - zoom controls */}
      <EditorBottomToolbar />
    </div>
  );
}

/**
 * StudioEditorLayout - Main container for the multi-screenshot editor
 * Wraps all editor components in StudioEditorProvider
 */
export function StudioEditorLayout({ 
  imageList, 
  projectId,
}: StudioEditorLayoutProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate initialization (loading fonts, preparing canvas, etc.)
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing Studio Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <StudioEditorProvider initialScreenshots={imageList} projectId={projectId}>
      <EditorContent />
    </StudioEditorProvider>
  );
}
