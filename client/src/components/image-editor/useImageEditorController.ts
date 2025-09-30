import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { toast } from "sonner";

import { imageThemes } from "@/constants/imageThemes";
import { useImageEditor } from "@/hooks/useImageEditor";
import type { GeneratedImage, GeneratedImageConfiguration, ImageEditorTheme } from "@/types/project";
import { preloadFonts } from "@/utils/fontLoader";
import { lightenColor } from "@/utils/color";

interface UseImageEditorControllerParams {
  isOpen: boolean;
  imageData: GeneratedImage | null;
  imageIndex: number | null;
  fonts: string[];
  projectId?: string;
  device?: string;
  sessionToken?: string;
  onSave: (newImageUrl: string, imageIndex: number, configuration: GeneratedImageConfiguration) => Promise<void>;
  onClose: () => void;
  appName?: string;
  appDescription?: string;
}

type DraggableElement = "mockup" | "heading" | "subheading" | null;
type HandleType = "rotate" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se" | null;
type InteractionMode = "move" | "resize" | "rotate" | null;

export const useImageEditorController = ({
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
}: UseImageEditorControllerParams) => {
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
  const [mockupScale, setMockupScale] = useState(1);
  const [mockupRotation, setMockupRotation] = useState(0);
  const [headingX, setHeadingX] = useState(0);
  const [headingY, setHeadingY] = useState(0);
  const [subheadingX, setSubheadingX] = useState(0);
  const [subheadingY, setSubheadingY] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<ImageEditorTheme>("accent");
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<DraggableElement>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const dragStartCoords = useRef({ x: 0, y: 0 });
  const initialElementPosition = useRef({ x: 0, y: 0 });
  const initialScale = useRef(1);
  const initialRotation = useRef(0);
  const elementBounds = useRef<{ mockup: DOMRect | null; heading: DOMRect | null; subheading: DOMRect | null }>({
    mockup: null,
    heading: null,
    subheading: null,
  });

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
      setMockupScale(config.mockupScale || 1);
      setMockupRotation(config.mockupRotation || 0);
      setHeadingX(config.headingX || 0);
      setHeadingY(config.headingY || 0);
      setSubheadingX(config.subheadingX || 0);
      setSubheadingY(config.subheadingY || 0);

      const configTheme = typeof config.theme === "string" ? config.theme : null;
      const normalizedTheme =
        configTheme && Object.prototype.hasOwnProperty.call(imageThemes, configTheme)
          ? (configTheme as ImageEditorTheme)
          : "accent";
      setSelectedTheme(normalizedTheme);
    }
  }, [isOpen, imageData]);

  useEffect(() => {
    if (isOpen) return;

    setHeading("");
    setSubheading("");
    setHeadingFont("Farro");
    setSubheadingFont("Headland One");
    setHeadingFontSize(120);
    setSubheadingFontSize(69);
    setMockupX(0);
    setMockupY(0);
    setMockupScale(1);
    setMockupRotation(0);
    setHeadingX(0);
    setHeadingY(0);
    setSubheadingX(0);
    setSubheadingY(0);
    setDragTarget(null);
    setIsDragging(false);
    setSelectedTheme("accent");
  }, [isOpen]);

  const themeContext = useMemo(() => {
    const themeDefinition = imageThemes[selectedTheme] ?? imageThemes.accent;
    const storedTheme = imageData?.configuration?.theme;
    const storedThemeMatches = storedTheme === selectedTheme;
    const headingColor =
      storedThemeMatches && imageData?.configuration?.headingColor
        ? imageData.configuration.headingColor
        : themeDefinition.headingColor;
    const subheadingColor =
      storedThemeMatches && imageData?.configuration?.subheadingColor
        ? imageData.configuration.subheadingColor
        : themeDefinition.subheadingColor;
    const accentFallback = themeDefinition.background.type === "accent" ? themeDefinition.background.fallback : undefined;
    const accentSource = imageData?.accentColor || accentFallback || "#4F46E5";
    const accentLighten = themeDefinition.background.type === "accent" ? themeDefinition.background.lightenBasePercent ?? 55 : 0;
    const accentColor = themeDefinition.background.type === "accent"
      ? lightenColor(accentSource, accentLighten)
      : accentSource;

    return { themeDefinition, headingColor, subheadingColor, accentColor };
  }, [imageData, selectedTheme]);

  const { themeDefinition, headingColor, subheadingColor, accentColor } = themeContext;

  useEffect(() => {
    if (!isOpen || !imageData?.sourceScreenshotUrl) return;

    const screenshotUrl = imageData.sourceScreenshotUrl;

    const redraw = async () => {
      // Wait for next frame to ensure canvas is mounted and ready
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const bounds = await drawImage({
        heading,
        subheading,
        screenshotUrl,
        headingFontFamily: headingFont,
        subheadingFontFamily: subheadingFont,
        headingFontSize,
        subheadingFontSize,
        headingColor,
        subheadingColor,
        mockupX,
        mockupY,
        mockupScale,
        mockupRotation,
        headingX,
        headingY,
        subheadingX,
        subheadingY,
        isHovering: !!dragTarget,
        isDragging,
        dragTarget,
        activeHandle,
        theme: themeDefinition,
        accentColor,
        device,
      });

      if (bounds) {
        elementBounds.current = bounds;
      }
    };

    redraw();
  }, [
    isOpen,
    imageData,
    drawImage,
    heading,
    subheading,
    headingFont,
    subheadingFont,
    headingFontSize,
    subheadingFontSize,
    mockupX,
    mockupY,
    mockupScale,
    mockupRotation,
    headingX,
    headingY,
    subheadingX,
    subheadingY,
    isDragging,
    dragTarget,
    activeHandle,
    themeDefinition,
    headingColor,
    subheadingColor,
    accentColor,
    device,
  ]);

  const getElementAtPos = useCallback(
    (x: number, y: number): DraggableElement => {
      const { mockup, heading: headingBounds, subheading: subheadingBounds } = elementBounds.current;
      
      // Add margin around mockup to include handle areas (especially rotation handle above)
      const handleMargin = 60; // Enough to cover rotation handle offset (40px) + handle size (24px) + buffer
      
      if (mockup) {
        const expandedBounds = {
          x: mockup.x - handleMargin,
          y: mockup.y - handleMargin,
          width: mockup.width + handleMargin * 2,
          height: mockup.height + handleMargin * 2,
        };
        
        if (
          x >= expandedBounds.x &&
          x <= expandedBounds.x + expandedBounds.width &&
          y >= expandedBounds.y &&
          y <= expandedBounds.y + expandedBounds.height
        ) {
          return "mockup";
        }
      }
      
      if (
        headingBounds &&
        x >= headingBounds.x &&
        x <= headingBounds.x + headingBounds.width &&
        y >= headingBounds.y &&
        y <= headingBounds.y + headingBounds.height
      ) {
        return "heading";
      }
      if (
        subheadingBounds &&
        x >= subheadingBounds.x &&
        x <= subheadingBounds.x + subheadingBounds.width &&
        y >= subheadingBounds.y &&
        y <= subheadingBounds.y + subheadingBounds.height
      ) {
        return "subheading";
      }
      return null;
    },
    [],
  );

  const getHandleAtPos = useCallback(
    (x: number, y: number): HandleType => {
      const mockup = elementBounds.current.mockup;
      if (!mockup || dragTarget !== 'mockup') return null;

      const handleSize = 24;
      const rotateHandleOffset = 40;
      
      // Calculate mockup center and dimensions
      const mockupCenterX = mockup.x + mockup.width / 2;
      const mockupCenterY = mockup.y + mockup.height / 2;
      
      // Convert mouse position to rotated coordinate system
      const dx = x - mockupCenterX;
      const dy = y - mockupCenterY;
      const angleRad = (-mockupRotation * Math.PI) / 180;
      const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
      
      const halfWidth = mockup.width / 2;
      const halfHeight = mockup.height / 2;
      
      // Check rotation handle
      const rotateY = -halfHeight - rotateHandleOffset;
      if (Math.hypot(rotatedX, rotatedY - rotateY) <= handleSize / 2) {
        return 'rotate';
      }
      
      // Check corner resize handles
      const corners: Array<{ x: number; y: number; handle: HandleType }> = [
        { x: -halfWidth, y: -halfHeight, handle: 'resize-nw' },
        { x: halfWidth, y: -halfHeight, handle: 'resize-ne' },
        { x: -halfWidth, y: halfHeight, handle: 'resize-sw' },
        { x: halfWidth, y: halfHeight, handle: 'resize-se' },
      ];
      
      for (const corner of corners) {
        if (Math.hypot(rotatedX - corner.x, rotatedY - corner.y) <= handleSize / 2) {
          return corner.handle;
        }
      }
      
      return null;
    },
    [dragTarget, mockupRotation],
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (event.button !== 0 || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (canvas.height / rect.height);

      // Check for handle interaction first
      const handle = getHandleAtPos(x, y);
      if (handle) {
        setActiveHandle(handle);
        setIsDragging(true);
        dragStartCoords.current = { x: event.clientX, y: event.clientY };
        initialScale.current = mockupScale;
        initialRotation.current = mockupRotation;
        
        const mockup = elementBounds.current.mockup;
        if (mockup) {
          initialElementPosition.current = {
            x: mockup.x + mockup.width / 2,
            y: mockup.y + mockup.height / 2,
          };
        }
        
        if (handle === 'rotate') {
          setInteractionMode('rotate');
        } else {
          setInteractionMode('resize');
        }
        return;
      }

      // Regular drag interaction
      if (!dragTarget) return;
      
      setIsDragging(true);
      setInteractionMode('move');
      dragStartCoords.current = { x: event.clientX, y: event.clientY };

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
    },
    [dragTarget, getHandleAtPos, mockupScale, mockupRotation, headingX, headingY, mockupX, mockupY, subheadingX, subheadingY],
  );

  const handleDrag = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const deltaX = (event.clientX - dragStartCoords.current.x) * scaleX;
      const deltaY = (event.clientY - dragStartCoords.current.y) * scaleY;

      // Handle rotation
      if (interactionMode === 'rotate' && activeHandle === 'rotate') {
        const centerX = initialElementPosition.current.x;
        const centerY = initialElementPosition.current.y;
        
        // Calculate angle from center to start point
        const startAngle = Math.atan2(
          dragStartCoords.current.y * scaleY - centerY,
          dragStartCoords.current.x * scaleX - centerX
        );
        
        // Calculate angle from center to current point
        const currentX = dragStartCoords.current.x * scaleX + deltaX;
        const currentY = dragStartCoords.current.y * scaleY + deltaY;
        const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
        
        // Calculate angle difference and convert to degrees
        const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;
        const newRotation = initialRotation.current + angleDelta;
        
        setMockupRotation(newRotation);
        return;
      }

      // Handle resize
      if (interactionMode === 'resize' && activeHandle && activeHandle.startsWith('resize-')) {
        const mockup = elementBounds.current.mockup;
        if (!mockup) return;
        
        const centerX = mockup.x + mockup.width / 2;
        const centerY = mockup.y + mockup.height / 2;
        
        // Calculate distance from center to mouse at start
        const startDist = Math.hypot(
          dragStartCoords.current.x * scaleX - centerX,
          dragStartCoords.current.y * scaleY - centerY
        );
        
        // Calculate distance from center to current mouse position
        const currentDist = Math.hypot(
          (dragStartCoords.current.x * scaleX + deltaX) - centerX,
          (dragStartCoords.current.y * scaleY + deltaY) - centerY
        );
        
        // Calculate scale change
        const scaleChange = currentDist / startDist;
        const newScale = Math.max(0.2, Math.min(2, initialScale.current * scaleChange));
        
        setMockupScale(newScale);
        return;
      }

      // Handle move
      if (interactionMode === 'move') {
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
      }
    },
    [dragTarget, isDragging, interactionMode, activeHandle],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        handleDrag(event);
        return;
      }

      if (!canvasRef.current) {
        setDragTarget(null);
        setActiveHandle(null);
        return;
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (canvas.height / rect.height);

      const target = getElementAtPos(x, y);
      setDragTarget(target);

      // Check for handle hover
      if (target === 'mockup') {
        const handle = getHandleAtPos(x, y);
        setActiveHandle(handle);
        
        // Update cursor based on handle
        if (handle === 'rotate') {
          canvas.style.cursor = 'grab';
        } else if (handle && handle.startsWith('resize-')) {
          // Set appropriate resize cursor based on corner
          const cursorMap: Record<string, string> = {
            'resize-nw': 'nwse-resize',
            'resize-ne': 'nesw-resize',
            'resize-sw': 'nesw-resize',
            'resize-se': 'nwse-resize',
          };
          canvas.style.cursor = cursorMap[handle] || 'default';
        } else {
          canvas.style.cursor = 'move';
        }
      } else {
        setActiveHandle(null);
        canvas.style.cursor = target ? 'move' : 'default';
      }
    },
    [getElementAtPos, getHandleAtPos, handleDrag, isDragging],
  );

  const handleMouseUp = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDragging) return;
    setIsDragging(false);
    setActiveHandle(null);
    setInteractionMode(null);
  }, [isDragging]);

  const handleMouseLeave = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setDragTarget(null);
    setActiveHandle(null);
    if (isDragging) {
      setIsDragging(false);
      setInteractionMode(null);
    }
  }, [isDragging]);

  const handleRegenerateContent = useCallback(async (style: 'concise' | 'detailed') => {
    if (!imageData?.sourceScreenshotUrl) {
      toast.error("Missing screenshot to regenerate content");
      return;
    }

    if (!appName || !appDescription) {
      const missingFields = [];
      if (!appName) missingFields.push('App Name');
      if (!appDescription) missingFields.push('App Description');
      toast.error(`Missing: ${missingFields.join(', ')}. Please ensure these are available.`);
      return;
    }

    setIsRegenerating(true);
    try {
      const styleLabel = style === 'concise' ? 'Concise' : 'Detailed';
      toast.info(`Regenerating content with AI (${styleLabel} style)...`);

      // Download the screenshot image
      const screenshotResponse = await fetch(imageData.sourceScreenshotUrl);
      const screenshotBlob = await screenshotResponse.blob();

      // Prepare form data
      const formData = new FormData();
      formData.append("image", screenshotBlob, "screenshot.png");
      formData.append("appName", appName);
      formData.append("appDescription", appDescription);
      formData.append("currentHeading", heading);
      formData.append("currentSubheading", subheading);
      formData.append("style", style);

      // Call the API
      const response = await fetch("/api/images/generate-heading-subheading", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Failed to generate content");
      }

      const result = await response.json();
      
      // Update the state with new heading and subheading
      setHeading(result.heading);
      setSubheading(result.subheading);

      toast.success("Content regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating content:", error);
      toast.error(`Failed to regenerate content: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsRegenerating(false);
    }
  }, [imageData, appName, appDescription, heading, subheading]);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current || imageIndex === null || !projectId || !imageData?.id) return;

    const screenshotUrl = imageData.sourceScreenshotUrl;
    if (!screenshotUrl) {
      return;
    }

    toast.info("Saving image...");

    await drawImage({
      heading,
      subheading,
      screenshotUrl,
      headingFontFamily: headingFont,
      subheadingFontFamily: subheadingFont,
      headingFontSize,
      subheadingFontSize,
      headingColor,
      subheadingColor,
      mockupX,
      mockupY,
      mockupScale,
      mockupRotation,
      headingX,
      headingY,
      subheadingX,
      subheadingY,
      isHovering: false,
      isDragging: false,
      dragTarget: null,
      activeHandle: null,
      theme: themeDefinition,
      accentColor,
      device,
    });

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        toast.error("Failed to get image data.");
        return;
      }

      const configuration: GeneratedImageConfiguration = {
        heading,
        subheading,
        headingFont,
        subheadingFont,
        headingFontSize,
        subheadingFontSize,
        mockupX,
        mockupY,
        mockupScale,
        mockupRotation,
        headingX,
        headingY,
        subheadingX,
        subheadingY,
        theme: selectedTheme,
        headingColor,
        subheadingColor,
        backgroundColor:
          themeDefinition.background.type === "solid"
            ? themeDefinition.background.color
            : themeDefinition.background.type === "accent"
            ? accentColor
            : null,
      };

      const formData = new FormData();
      formData.append("image", blob, "edited-image.jpg");
      formData.append("configuration", JSON.stringify(configuration));

      try {
        const headers: Record<string, string> = {};
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`;
        }

        const response = await fetch(`/api/projects/${projectId}/images/${imageData.id}`, {
          method: "POST",
          headers,
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
    }, "image/jpeg", 0.5);
  }, [
    accentColor,
    device,
    drawImage,
    heading,
    headingColor,
    headingFont,
    headingFontSize,
    headingX,
    headingY,
    imageData,
    imageIndex,
    mockupX,
    mockupY,
    onClose,
    onSave,
    projectId,
    selectedTheme,
    sessionToken,
    subheading,
    subheadingColor,
    subheadingFont,
    subheadingFontSize,
    subheadingX,
    subheadingY,
    themeDefinition,
  ]);

  return {
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
    mockupScale,
    setMockupScale,
    mockupRotation,
    setMockupRotation,
    selectedTheme,
    setSelectedTheme,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleSave,
    handleRegenerateContent,
    isRegenerating,
  };
};
