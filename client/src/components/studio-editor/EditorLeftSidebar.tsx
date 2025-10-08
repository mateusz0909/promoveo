import { useState, useEffect } from 'react';
import {
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  LanguageIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundPanel } from './BackgroundPanel';
import { VisualsPanel } from './VisualsPanel';
import { TextPanel } from '../editor/panels/TextPanel';
import { MockupsPanel } from '../editor/panels/MockupsPanel';

type SidebarPanel = 'mockups' | 'text' | 'visuals' | 'background' | 'translate' | null;

const SIDEBAR_ITEMS = [
  { id: 'background' as const, icon: PaintBrushIcon, label: 'Background' },
  { id: 'mockups' as const, icon: DevicePhoneMobileIcon, label: 'Mockups' },
  { id: 'text' as const, icon: DocumentTextIcon, label: 'Text' },
  { id: 'visuals' as const, icon: ImageIcon, label: 'Visuals' },
  { id: 'translate' as const, icon: LanguageIcon, label: 'Translate' },
];

export function EditorLeftSidebar() {
  const [activePanel, setActivePanel] = useState<SidebarPanel>('background');

  const handlePanelToggle = (panelId: SidebarPanel) => {
    setActivePanel(activePanel === panelId ? null : panelId);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  // Keyboard shortcut: ESC to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePanel) {
        handleClosePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel]);

  return (
    <div 
      data-editor-toolbar="true"
      className="flex border-r border-border bg-card flex-shrink-0"
    >
      {/* Icon-only sidebar */}
      <div className="w-14 border-r border-border flex flex-col items-center py-4 gap-2">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handlePanelToggle(item.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-accent ${
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      {/* Expandable panel with smooth animation */}
      <div 
        className={`border-r border-border bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden ${
          activePanel ? 'w-64 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        {activePanel && (
          <div className="flex flex-col h-full w-64">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
              <h3 className="text-sm font-medium text-foreground">
                {SIDEBAR_ITEMS.find(item => item.id === activePanel)?.label}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePanel}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title="Close panel (ESC)"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="text-sm text-muted-foreground">
                {activePanel === 'background' && <BackgroundPanel />}
                {activePanel === 'mockups' && <MockupsPanel />}
                {activePanel === 'text' && <TextPanel />}
                {activePanel === 'visuals' && <VisualsPanel />}
                {activePanel === 'translate' && (
                  <p className="p-4">Comming soon...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
