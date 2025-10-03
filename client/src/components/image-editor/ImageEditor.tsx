import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

import { useAuth } from "@/context/AuthContext";
import type { GeneratedImage, GeneratedImageConfiguration, ImageEditorTheme } from "@/types/project";

import { ImageEditorCanvas } from "./ImageEditorCanvas";
import { ImageEditorControls } from "./ImageEditorControls";
import { useImageEditorController } from "./useImageEditorController";

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: GeneratedImage | null;
  imageIndex: number | null;
  fonts: string[];
  onSave: (newImageUrl: string, imageIndex: number, configuration: GeneratedImageConfiguration) => Promise<void>;
  projectId?: string;
  device?: string;
  appName?: string;
  appDescription?: string;
}

export const ImageEditor = ({
  isOpen,
  onClose,
  imageData,
  imageIndex,
  fonts,
  onSave,
  projectId,
  device,
  appName,
  appDescription,
}: ImageEditorProps) => {
  const auth = useAuth();
  const sessionToken = auth?.session?.access_token;

  const {
    canvasRef,
    heading,
    setHeading,
    subheading,
    setSubheading,
    headingFont,
    setHeadingFont,
    subheadingFont,
    setSubheadingFont,
    headingFontSize,
    setHeadingFontSize,
    subheadingFontSize,
    setSubheadingFontSize,
    selectedTheme,
    setSelectedTheme,
    layout,
    setLayout,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleSave,
    handleRegenerateContent,
    isRegenerating,
  } = useImageEditorController({
    isOpen,
    imageData,
    imageIndex,
    fonts,
    projectId,
    device,
    sessionToken,
    onSave,
    onClose,
    appName,
    appDescription,
  });

  if (!imageData) return null;

  const handleThemeChange = (theme: ImageEditorTheme) => {
    setSelectedTheme(theme);
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Editor</DialogTitle>
          <DialogDescription>
            Edit text, fonts, and layout. Hover over the mockup to see resize and rotation handles.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
          <ImageEditorCanvas
            canvasRef={canvasRef}
            device={device}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
          <ImageEditorControls
            fonts={fonts}
            heading={heading}
            onHeadingChange={setHeading}
            headingFont={headingFont}
            onHeadingFontChange={setHeadingFont}
            headingFontSize={headingFontSize}
            onHeadingFontSizeChange={setHeadingFontSize}
            subheading={subheading}
            onSubheadingChange={setSubheading}
            subheadingFont={subheadingFont}
            onSubheadingFontChange={setSubheadingFont}
            subheadingFontSize={subheadingFontSize}
            onSubheadingFontSizeChange={setSubheadingFontSize}
            selectedTheme={selectedTheme}
            onThemeChange={handleThemeChange}
            layout={layout}
            onLayoutChange={setLayout}
            onRegenerateContent={handleRegenerateContent}
            isRegenerating={isRegenerating}
          />
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
