import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useImageEditor } from "../hooks/useImageEditor";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Textarea } from "./ui/textarea";
import { ThemeSelector } from "./ThemeSelector";
import { preloadFonts } from "../utils/fontLoader";
import type { GeneratedImage, GeneratedImageConfiguration, ImageEditorTheme, TemplateSummary } from '@/types/project';

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: GeneratedImage | null;
  imageIndex: number | null;
  fonts: string[];
  onSave: (newImageUrl: string, imageIndex: number, configuration: GeneratedImageConfiguration) => Promise<void>;
  projectId?: string;
  device?: string;
  templates?: TemplateSummary[];
  selectedTemplateId?: string | null;
}

type DraggableElement = "mockup" | "heading" | "subheading" | null;

const themes: Record<ImageEditorTheme, {
  backgroundColor: string | null;
  headingColor: string;
  subheadingColor: string;
}> = {
  accent: {
    backgroundColor: null, // Use accent color from data
    headingColor: "#000000ff",
    subheadingColor: "#333333",
  },
  light: {
    backgroundColor: "#FFFFFF",
    headingColor: "#000000",
    subheadingColor: "#333333",
  },
  dark: {
    backgroundColor: "#000000",
    headingColor: "#FFFFFF",
    subheadingColor: "#CCCCCC",
  },
};

export const ImageEditor = ({
  isOpen,
  onClose,
  imageData,
  imageIndex,
  fonts,
  onSave,
  projectId,
  device,
  templates = [],
  selectedTemplateId = null,
}: ImageEditorProps) => {
  const auth = useAuth();
  const session = auth?.session;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { drawImage } = useImageEditor(canvasRef);

  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [headingFont, setHeadingFont] = useState("Farro");
  const [subheadingFont, setSubheadingFont] = useState("Headland One");
  const [headingFontSize, setHeadingFontSize] = useState(120);
  const [subheadingFontSize, setSubheadingFontSize] = useState(69);
  const [mockupX, setMockupX] = useState(0);
  const [mockupY, setMockupY] = useState(0);
  const [headingX, setHeadingX] = useState(0);
  const [headingY, setHeadingY] = useState(0);
  const [subheadingX, setSubheadingX] = useState(0);
  const [subheadingY, setSubheadingY] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<ImageEditorTheme>("accent");

  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<DraggableElement>(null);

  const activeTemplate = useMemo(() => {
    if (!templates.length) {
      return null;
    }

    const imageTemplateId = imageData?.configuration?.templateId ?? null;
    if (imageTemplateId) {
      const found = templates.find((template) => template.id === imageTemplateId);
      if (found) {
        return found;
      }
    }

    if (selectedTemplateId) {
      const fallback = templates.find((template) => template.id === selectedTemplateId);
      if (fallback) {
        return fallback;
      }
    }

    return templates[0] ?? null;
  }, [templates, imageData?.configuration?.templateId, selectedTemplateId]);
  
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const initialElementPosition = useRef({ x: 0, y: 0 });
  
  const elementBounds = useRef<{
    mockup: DOMRect | null;
    heading: DOMRect | null;
    subheading: DOMRect | null;
  }>({ mockup: null, heading: null, subheading: null });

  // Preload fonts when component mounts or fonts change
  useEffect(() => {
    if (fonts.length > 0) {
      preloadFonts(fonts);
    }
  }, [fonts]);

  useEffect(() => {
    if (isOpen && imageData) {
  const config = imageData.configuration || {};
      setHeading(config.heading || "");
      setSubheading(config.subheading || "");
      setHeadingFont(config.headingFont || "Farro");
      setSubheadingFont(config.subheadingFont || "Headland One");
      setHeadingFontSize(config.headingFontSize || 120);
      setSubheadingFontSize(config.subheadingFontSize || 69);
      setMockupX(config.mockupX || 0);
      setMockupY(config.mockupY || 0);
      setHeadingX(config.headingX || 0);
      setHeadingY(config.headingY || 0);
      setSubheadingX(config.subheadingX || 0);
      setSubheadingY(config.subheadingY || 0);
      setSelectedTheme(config.theme || "accent");
    }
  }, [isOpen, imageData]);

  useEffect(() => {
    if (isOpen && imageData?.sourceScreenshotUrl) {
      const screenshotUrl = imageData.sourceScreenshotUrl;
      const redraw = async () => {
        const theme = themes[selectedTheme];
        const bounds = await drawImage({
          heading,
          subheading,
          screenshotUrl,
          headingFontFamily: headingFont,
          subheadingFontFamily: subheadingFont,
          headingFontSize,
          subheadingFontSize,
          accentColor: theme.backgroundColor || imageData.accentColor || '#4F46E5', // Add fallback
          headingColor: theme.headingColor,
          subheadingColor: theme.subheadingColor,
          mockupX,
          mockupY,
          headingX,
          headingY,
          subheadingX,
          subheadingY,
          isHovering: !!dragTarget,
          isDragging,
          dragTarget,
          device,
        });
        if (bounds) {
          elementBounds.current = bounds;
        }
      };
      
      redraw();
    }
  }, [
    isOpen, imageData, drawImage, heading, subheading, headingFont, 
    subheadingFont, headingFontSize, subheadingFontSize, mockupX, mockupY,
    headingX, headingY, subheadingX, subheadingY, isDragging, 
    dragTarget, selectedTheme, device
  ]);

  useEffect(() => {
    return () => {
      if (!isOpen) {
        setHeading("");
        setSubheading("");
        setHeadingFont("Farro");
        setSubheadingFont("Headland One");
        setHeadingFontSize(120);
        setSubheadingFontSize(69);
        setMockupX(0);
        setMockupY(0);
        setHeadingX(0);
        setHeadingY(0);
        setSubheadingX(0);
        setSubheadingY(0);
        setDragTarget(null);
        setIsDragging(false);
        setSelectedTheme("accent");
      }
    };
  }, [isOpen]);

  const getElementAtPos = (x: number, y: number): DraggableElement => {
    const { mockup, heading, subheading } = elementBounds.current;
    if (mockup && x >= mockup.x && x <= mockup.x + mockup.width && y >= mockup.y && y <= mockup.y + mockup.height) {
      return "mockup";
    }
    if (heading && x >= heading.x && x <= heading.x + heading.width && y >= heading.y && y <= heading.y + heading.height) {
      return "heading";
    }
    if (subheading && x >= subheading.x && x <= subheading.x + subheading.width && y >= subheading.y && y <= subheading.y + subheading.height) {
      return "subheading";
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !dragTarget) return;
    
    setIsDragging(true);
    dragStartCoords.current = { x: e.clientX, y: e.clientY };

    switch (dragTarget) {
      case "mockup":
        initialElementPosition.current = { x: mockupX, y: mockupY };
        break;
      case "heading":
        initialElementPosition.current = { x: headingX, y: headingY };
        break;
      case "subheading":
        initialElementPosition.current = { x: subheadingX, y: subheadingY };
        break;
    }
  };

  const handleDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragTarget || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const deltaX = (e.clientX - dragStartCoords.current.x) * scaleX;
    const deltaY = (e.clientY - dragStartCoords.current.y) * scaleY;

    const newX = initialElementPosition.current.x + deltaX;
    const newY = initialElementPosition.current.y + deltaY;

    switch (dragTarget) {
      case "mockup":
        setMockupX(newX);
        setMockupY(newY);
        break;
      case "heading":
        setHeadingX(newX);
        setHeadingY(newY);
        break;
      case "subheading":
        setSubheadingX(newX);
        setSubheadingY(newY);
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleDrag(e);
      return;
    }

    if (!canvasRef.current) {
      setDragTarget(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const target = getElementAtPos(x, y);
    setDragTarget(target);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setDragTarget(null);
    if (isDragging) {
      handleMouseUp();
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current || imageIndex === null || !projectId || !imageData?.id) return;

    const screenshotUrl = imageData.sourceScreenshotUrl;
    if (!screenshotUrl) {
      return;
    }

    toast.info("Saving image...");

    const theme = themes[selectedTheme];

    await drawImage({
      heading,
      subheading,
  screenshotUrl,
      headingFontFamily: headingFont,
      subheadingFontFamily: subheadingFont,
      headingFontSize,
      subheadingFontSize,
      accentColor: theme.backgroundColor || imageData.accentColor || '#4F46E5', // Add fallback
      headingColor: theme.headingColor,
      subheadingColor: theme.subheadingColor,
      mockupX,
      mockupY,
      headingX,
      headingY,
      subheadingX,
      subheadingY,
      isHovering: false,
      isDragging: false,
      dragTarget: null,
      device,
    });

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        toast.error("Failed to get image data.");
        return;
      }

      const configuration: GeneratedImageConfiguration = {
        ...(imageData.configuration ?? {}),
        heading,
        subheading,
        headingFont,
        subheadingFont,
        headingFontSize,
        subheadingFontSize,
        mockupX,
        mockupY,
        headingX,
        headingY,
        subheadingX,
        subheadingY,
        theme: selectedTheme,
      };

      const formData = new FormData();
      formData.append("image", blob, "edited-image.jpg");
      formData.append("configuration", JSON.stringify(configuration));

      try {
        const response = await fetch(`/api/projects/${projectId}/images/${imageData.id}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to save image.");
        }

        const { imageUrl } = await response.json();

        toast.success("Image saved successfully!");
        onSave(imageUrl, imageIndex, configuration);
        onClose();
      } catch (error) {
        console.error("Error saving image:", error);
        toast.error("Failed to save image. Please try again.");
      }
    }, "image/jpeg", 0.50);
  };

  if (!imageData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Editor</DialogTitle>
          <DialogDescription>
            Edit the text, fonts, and layout of your generated image.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
          <div className="col-span-8 h-full  rounded-md overflow-hidden flex items-center justify-center  bg-muted">
            <canvas 
              ref={canvasRef} 
              className="h-full object-contain" 
              width={device === 'iPad' ? 2048 : 1284} 
              height={device === 'iPad' ? 2732 : 2778}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            ></canvas>
          </div>
          <div className="col-span-4 h-full w-full flex flex-col overflow-y-auto space-y-2 p-4 rounded-md border ">
            <h3 className="text-lg font-semibold">Controls</h3>
            {activeTemplate ? (
              <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="font-semibold uppercase tracking-wide">Template</p>
                <p className="mt-1 text-sm font-medium text-foreground">{activeTemplate.name}</p>
                {activeTemplate.description ? (
                  <p className="mt-1 line-clamp-3">{activeTemplate.description}</p>
                ) : null}
              </div>
            ) : null}
            <div>
              <Label>Theme</Label>
              <ThemeSelector selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} />
            </div>
            <hr />
            <div>
              <Label htmlFor="heading-text">Heading Text</Label>
              <Textarea id="heading-text" value={heading} onChange={(e) => setHeading(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="heading-font">Heading Font</Label>
              <Select value={headingFont} onValueChange={setHeadingFont}>
                <SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger>
                <SelectContent>
                  {fonts.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="heading-font-size">Heading Font Size</Label>
              <Input id="heading-font-size" type="number" value={headingFontSize} onChange={(e) => setHeadingFontSize(parseInt(e.target.value, 10))} />
            </div>
            <hr />
            <div>
              <Label htmlFor="subheading-text">Subheading Text</Label>
              <Textarea id="subheading-text" value={subheading} onChange={(e) => setSubheading(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="subheading-font">Subheading Font</Label>
              <Select value={subheadingFont} onValueChange={setSubheadingFont}>
                <SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger>
                <SelectContent>
                  {fonts.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subheading-font-size">Subheading Font Size</Label>
              <Input id="subheading-font-size" type="number" value={subheadingFontSize} onChange={(e) => setSubheadingFontSize(parseInt(e.target.value, 10))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
       
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
