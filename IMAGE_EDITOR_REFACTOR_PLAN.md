# Image Editor Refactoring Plan
## Transform Dialog-Based Single Image Editor → Full-Page Multi-Screenshot Canvas Editor

---

## 🎯 **Executive Summary**

Transform the current dialog-based image editor (editing one screenshot at a time) into a full-page, multi-screenshot canvas editor similar to screenshots.pro, where:
- **Images Tab IS the editor** - always active, no mode switching needed
- All screenshots displayed side-by-side on a unified canvas
- **Click any element** (text/mockup) → Contextual toolbar appears at top automatically
- Backgrounds/gradients span across all images
- Left sidebar for global controls (background, devices, etc.) - always visible or collapsible
- Bottom zoom controls for canvas navigation
- No "Edit" or "Edit All" button needed - direct manipulation interface

---

## 📊 **Current State Analysis**

### Current Architecture
```
ProjectContent (Tab Container)
  └─ ImagesTab (Gallery View ONLY - static grid)
       └─ Opens → ImageEditor (Dialog)
            ├─ ImageEditorCanvas (Single canvas with one screenshot)
            ├─ ImageEditorControls (Right sidebar controls)
            └─ useImageEditorController (State management for one image)
```

### Current Flow
1. User navigates to Images Tab → Sees gallery grid
2. User clicks "Edit" on a single image in `ImagesTab`
3. Dialog opens with `ImageEditor` component
4. Canvas renders ONE screenshot with heading/subheading
5. Right sidebar shows all controls (fonts, theme, layout, etc.)
6. User saves → Dialog closes → Returns to gallery

### Current Pain Points
- ❌ Can only edit one screenshot at a time
- ❌ Dialog modal interrupts workflow
- ❌ No way to see/edit all screenshots together
- ❌ Can't apply unified background across all images
- ❌ Multiple clicks needed to edit multiple images

### Current Features
- ✅ Canvas-based rendering with device frames
- ✅ Draggable text elements (heading, subheading)
- ✅ Mockup positioning, rotation, scaling
- ✅ Theme system with gradients/backgrounds
- ✅ Font selection and sizing
- ✅ AI-powered content regeneration
- ✅ Layout toggle (text-top/text-bottom)

---

## 🎨 **Target State (screenshots.pro-like)**

### New Architecture
```
ProjectContent (Tab Container)
  └─ ImagesTab (ALWAYS in editor mode - no mode toggle)
       └─ StudioEditorLayout (Full-page editor interface)
            ├─ TopToolbar (Context-aware: empty → text tools → mockup tools)
            ├─ LeftSidebar (Global controls: background, devices - collapsible)
            ├─ CenterCanvas (Multi-screenshot unified canvas)
            │    └─ CanvasViewport (Zoomable/Pannable)
            │         ├─ Screenshot 1 + Text + Frame
            │         ├─ Screenshot 2 + Text + Frame
            │         ├─ Screenshot 3 + Text + Frame
            │         └─ ... (all screenshots in one canvas)
            ├─ BottomToolbar (Zoom slider, canvas controls)
            └─ useStudioEditorController (Global state for all images)
```

### New User Flow (Direct Manipulation)
1. User navigates to Images Tab → **Immediately sees canvas editor** with all screenshots
2. Canvas shows all screenshots side-by-side with unified background
3. **User clicks heading text** → Top toolbar instantly shows: font selector, size, color, alignment
4. **User clicks mockup** → Top toolbar instantly shows: upload new screenshot, device frame selector
5. **User clicks background area** → Left sidebar background panel highlights
6. User drags text → Text repositions in real-time
7. User opens left sidebar → Changes gradient → **All screenshots update** (gradient spans)
8. User adjusts zoom slider → Canvas zooms to focus on details
9. **Changes auto-save continuously** - no explicit save needed (or optional save button)
10. Click elsewhere to deselect → Toolbar returns to default state

### Key UX Principles
- ✅ **No mode switching** - editor is always active
- ✅ **Direct manipulation** - click element = edit element
- ✅ **Contextual UI** - toolbar adapts to selection automatically
- ✅ **Live preview** - see changes immediately
- ✅ **Auto-save** - no fear of losing work
- ✅ **Unified canvas** - all screenshots together, not isolated

---

## 🏗️ **Phase-by-Phase Refactoring Plan**

---

### **PHASE 1: Replace ImagesTab with Editor Layout** 
**Goal:** Transform ImagesTab into always-on canvas editor (no mode toggle)

#### 1.1 Refactor ImagesTab Component
**File:** `client/src/components/tabs/ImagesTab.tsx`
```tsx
/**
 * ImagesTab is now the full editor - no preview/edit mode toggle
 * Always shows canvas with all screenshots
 */
export const ImagesTab = ({ 
  imageList, 
  projectId,
  onDownloadAll, 
  onDownloadSingle 
}: ImagesTabProps) => {
  // NO mode toggle state - always in editor mode
  
  return (
    <StudioEditorLayout 
      imageList={imageList}
      projectId={projectId}
      onDownloadAll={onDownloadAll}
    />
  );
};
```

#### 1.2 Create Main Editor Layout
**New File:** `client/src/components/studio-editor/StudioEditorLayout.tsx`
```tsx
/**
 * Main layout for multi-screenshot editor
 * Replaces gallery grid entirely
 */
interface StudioEditorLayoutProps {
  imageList: GeneratedImage[];
  projectId: string;
  onDownloadAll: () => Promise<void>;
}

export const StudioEditorLayout = ({ 
  imageList, 
  projectId, 
  onDownloadAll 
}: StudioEditorLayoutProps) => {
  return (
    <div className="h-[calc(100vh-200px)] flex flex-col border rounded-lg overflow-hidden bg-neutral-50">
      {/* Top Toolbar - Context-aware, starts empty */}
      <EditorTopToolbar onDownloadAll={onDownloadAll} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Global controls (collapsible) */}
        <EditorLeftSidebar />
        
        {/* Center Canvas - All screenshots */}
        <div className="flex-1 flex flex-col relative">
          <MultiScreenshotCanvas 
            imageList={imageList}
            projectId={projectId}
          />
          
          {/* Bottom Toolbar - Zoom controls */}
          <EditorBottomToolbar />
        </div>
      </div>
    </div>
  );
};
```

#### 1.3 Create Placeholder Components
**New Files:**
- `client/src/components/studio-editor/EditorTopToolbar.tsx`
  ```tsx
  export const EditorTopToolbar = ({ onDownloadAll }: { onDownloadAll: () => void }) => {
    return (
      <div className="h-14 border-b bg-white flex items-center px-4 gap-4">
        {/* Left: Project info / breadcrumb */}
        <div className="text-sm text-muted-foreground">
          Marketing Images Editor
        </div>
        
        {/* Center: Will show context-aware controls when element selected */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Click on text or screenshot to edit
          </p>
        </div>
        
        {/* Right: Actions */}
        <Button onClick={onDownloadAll} variant="outline" size="sm">
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Download All
        </Button>
      </div>
    );
  };
  ```

- `client/src/components/studio-editor/EditorLeftSidebar.tsx` (collapsible placeholder)
- `client/src/components/studio-editor/EditorBottomToolbar.tsx` (zoom placeholder)
- `client/src/components/studio-editor/MultiScreenshotCanvas.tsx` (empty canvas placeholder)

**Deliverables:**
- ✅ ImagesTab now renders editor layout by default (no gallery grid)
- ✅ `StudioEditorLayout` component structure
- ✅ Empty placeholder toolbar/sidebar components
- ✅ No mode toggle needed - always shows canvas
- ✅ User sees canvas immediately when navigating to Images Tab

---

### **PHASE 2: State Management & Data Layer**
**Goal:** Establish global state for multi-image editing

#### 2.1 Create Global Editor Context
**New File:** `client/src/context/StudioEditorContext.tsx`
```tsx
interface StudioEditorState {
  // Global settings (applied to ALL screenshots)
  globalTheme: ImageEditorTheme;
  globalBackground: BackgroundConfig; // Spans all images
  
  // Per-screenshot settings
  screenshots: Array<{
    id: string;
    sourceUrl: string;
    heading: string;
    subheading: string;
    headingFont: string;
    subheadingFont: string;
    headingFontSize: number;
    subheadingFontSize: number;
    mockupPosition: { x: number; y: number };
    mockupScale: number;
    mockupRotation: number;
    // ... other per-image config
  }>;
  
  // UI State
  selectedElementType: 'text' | 'mockup' | 'background' | null;
  selectedScreenshotIndex: number | null;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  
  // Actions
  updateGlobalTheme: (theme: ImageEditorTheme) => void;
  updateGlobalBackground: (bg: BackgroundConfig) => void;
  updateScreenshot: (index: number, updates: Partial<Screenshot>) => void;
  selectElement: (type: string, screenshotIndex: number) => void;
  // ... other actions
}
```

#### 2.2 Create Unified Canvas Controller Hook
**New File:** `client/src/hooks/useMultiScreenshotEditor.ts`
```tsx
/**
 * Manages rendering and interaction for multiple screenshots
 * Replaces useImageEditorController (which was single-image)
 */
export const useMultiScreenshotEditor = (canvasRef, screenshots) => {
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Rendering
  const drawAllScreenshots = useCallback(() => {
    // 1. Calculate layout (side-by-side positioning)
    // 2. Draw unified background (gradient spans all)
    // 3. Loop through screenshots and draw each
    // 4. Draw selection indicators
    // 5. Draw resize/rotate handles
  }, [screenshots, zoom, pan]);
  
  // Interaction handlers
  const handleCanvasClick = (e) => {
    // Detect which element was clicked (text, mockup, background)
    // Update selectedElement in context
  };
  
  const handleDrag = (e) => {
    // Handle dragging text/mockup
    // Update position in context
  };
  
  return {
    drawAllScreenshots,
    handleCanvasClick,
    handleDrag,
    zoom,
    setZoom,
    pan,
    setPan,
  };
};
```

#### 2.3 Adapt Canvas Rendering Logic
**Modify:** `client/src/hooks/useImageEditor.ts`
```tsx
// Extract reusable functions:
// - generateMockupImage (keep as-is)
// - wrapText (keep as-is)
// - applyBackground → NEW: applyUnifiedBackground(context, width, height, screenshots.length)

// Create new function:
export const drawUnifiedCanvas = (
  context: CanvasRenderingContext2D,
  screenshots: Screenshot[],
  globalBackground: BackgroundConfig,
  zoom: number,
  pan: { x: number; y: number }
) => {
  // 1. Calculate total canvas width (sum of all screenshot widths + gaps)
  const gap = 40; // pixels between screenshots
  const screenshotWidth = 1200; // standard width per screenshot
  const totalWidth = screenshots.length * screenshotWidth + (screenshots.length - 1) * gap;
  const canvasHeight = 2600;
  
  // 2. Draw unified background (gradient from left to right across ALL)
  applyUnifiedBackground(context, totalWidth, canvasHeight, globalBackground);
  
  // 3. Loop through each screenshot and render
  let xOffset = 0;
  screenshots.forEach((screenshot, index) => {
    // Draw background section for this screenshot
    // Draw mockup
    // Draw heading/subheading
    // Draw selection indicators if selected
    
    xOffset += screenshotWidth + gap;
  });
};
```

**Deliverables:**
- ✅ `StudioEditorContext` with global + per-screenshot state
- ✅ `useMultiScreenshotEditor` hook for canvas management
- ✅ Refactored rendering logic to support multi-screenshot canvas
- ✅ Data fetching in `StudioEditorPage` to load all project images

---

### **PHASE 3: Multi-Screenshot Canvas Implementation**
**Goal:** Render all screenshots side-by-side on one unified canvas

#### 3.1 Create Canvas Component
**New File:** `client/src/components/studio-editor/MultiScreenshotCanvas.tsx`
```tsx
export const MultiScreenshotCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { screenshots, globalBackground, zoom, pan } = useStudioEditorContext();
  const { drawAllScreenshots, handleCanvasClick, handleDrag } = useMultiScreenshotEditor(
    canvasRef,
    screenshots
  );
  
  // Effect: Redraw when state changes
  useEffect(() => {
    drawAllScreenshots();
  }, [screenshots, globalBackground, zoom, pan, drawAllScreenshots]);
  
  return (
    <div className="flex-1 overflow-auto bg-neutral-100">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleDrag}
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
};
```

#### 3.2 Implement Layout Algorithm
**In:** `useMultiScreenshotEditor.ts`
```tsx
const calculateLayout = (screenshots: Screenshot[], canvasWidth: number) => {
  const gap = 40;
  const screenshotWidth = 1200;
  const screenshotHeight = 2600;
  
  // Side-by-side layout
  return screenshots.map((_, index) => ({
    x: index * (screenshotWidth + gap),
    y: 0,
    width: screenshotWidth,
    height: screenshotHeight,
  }));
};
```

#### 3.3 Implement Unified Background Rendering
**In:** `useImageEditor.ts` or new helper
```tsx
const applyUnifiedBackground = (
  context: CanvasRenderingContext2D,
  totalWidth: number,
  height: number,
  background: BackgroundConfig
) => {
  switch (background.type) {
    case 'linear-gradient': {
      // Create gradient from 0 to totalWidth (spans ALL screenshots)
      const gradient = context.createLinearGradient(0, 0, totalWidth, 0);
      background.colors.forEach((color, index) => {
        gradient.addColorStop(index / (background.colors.length - 1), color);
      });
      context.fillStyle = gradient;
      context.fillRect(0, 0, totalWidth, height);
      break;
    }
    // ... other background types
  }
};
```

**Deliverables:**
- ✅ `MultiScreenshotCanvas` component rendering all screenshots
- ✅ Side-by-side layout algorithm
- ✅ Unified background spanning entire canvas
- ✅ Basic click detection for element selection

---

### **PHASE 4: Context-Aware Top Toolbar**
**Goal:** Dynamic toolbar that shows relevant controls based on selected element

#### 4.1 Create Toolbar Component
**New File:** `client/src/components/studio-editor/EditorTopToolbar.tsx`
```tsx
export const EditorTopToolbar = ({ onDownloadAll }: { onDownloadAll: () => void }) => {
  const { selectedElementType, selectedScreenshotIndex } = useStudioEditorContext();
  
  return (
    <div className="h-14 border-b bg-white flex items-center px-4 gap-4">
      {/* Left: Project info */}
      <div className="text-sm text-muted-foreground">
        Marketing Images Editor
      </div>
      
      {/* Center: Context-aware controls - DYNAMICALLY CHANGES */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {selectedElementType === 'heading' && <TextToolbar elementType="heading" />}
        {selectedElementType === 'subheading' && <TextToolbar elementType="subheading" />}
        {selectedElementType === 'mockup' && <MockupToolbar />}
        {!selectedElementType && (
          <p className="text-sm text-muted-foreground">
            Click on text or screenshot to edit
          </p>
        )}
      </div>
      
      {/* Right: Actions */}
      <Button onClick={onDownloadAll} variant="outline" size="sm">
        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
        Download All
      </Button>
    </div>
  );
};
```

#### 4.2 Create Text Toolbar
**New File:** `client/src/components/studio-editor/toolbars/TextToolbar.tsx`
```tsx
interface TextToolbarProps {
  elementType: 'heading' | 'subheading';
}

export const TextToolbar = ({ elementType }: TextToolbarProps) => {
  const { selectedScreenshotIndex, updateScreenshot } = useStudioEditorContext();
  const screenshot = screenshots[selectedScreenshotIndex];
  
  const fontKey = elementType === 'heading' ? 'headingFont' : 'subheadingFont';
  const sizeKey = elementType === 'heading' ? 'headingFontSize' : 'subheadingFontSize';
  const colorKey = elementType === 'heading' ? 'headingColor' : 'subheadingColor';
  
  return (
    <div className="flex items-center gap-2">
      {/* Element Label */}
      <span className="text-xs font-medium text-muted-foreground uppercase">
        {elementType}
      </span>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Font Family Selector */}
      <Select value={screenshot[fontKey]} onChange={(font) => updateScreenshot(selectedScreenshotIndex, { [fontKey]: font })}>
        <SelectTrigger className="w-40 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fonts.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
        </SelectContent>
      </Select>
      
      {/* Font Size Slider with Input */}
      <div className="flex items-center gap-2">
        <Slider
          value={[screenshot[sizeKey]]}
          onValueChange={(val) => updateScreenshot(selectedScreenshotIndex, { [sizeKey]: val[0] })}
          min={40}
          max={200}
          step={1}
          className="w-32"
        />
        <Input
          type="number"
          value={screenshot[sizeKey]}
          onChange={(e) => updateScreenshot(selectedScreenshotIndex, { [sizeKey]: parseInt(e.target.value) })}
          className="w-16 h-8 text-sm"
        />
      </div>
      
      {/* Color Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: screenshot[colorKey] }} />
            Color
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <ColorPicker value={screenshot[colorKey]} onChange={(color) => updateScreenshot(selectedScreenshotIndex, { [colorKey]: color })} />
        </PopoverContent>
      </Popover>
      
      {/* Text Alignment */}
      <ToggleGroup type="single" value={screenshot.textAlign || 'center'} size="sm">
        <ToggleGroupItem value="left" className="h-8 px-2">
          <AlignLeftIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" className="h-8 px-2">
          <AlignCenterIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" className="h-8 px-2">
          <AlignRightIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      
      {/* Font Style (Bold, Italic) */}
      <ToggleGroup type="multiple" value={screenshot.fontStyle || []} size="sm">
        <ToggleGroupItem value="bold" className="h-8 px-2 font-bold">
          B
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" className="h-8 px-2 italic">
          I
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
```

#### 4.3 Create Mockup Toolbar
**New File:** `client/src/components/studio-editor/toolbars/MockupToolbar.tsx`
```tsx
export const MockupToolbar = () => {
  const { selectedScreenshotIndex, updateScreenshot } = useStudioEditorContext();
  
  return (
    <>
      {/* Upload New Screenshot */}
      <Button variant="outline" onClick={handleUploadScreenshot}>
        <PhotoIcon className="h-4 w-4 mr-2" />
        Upload Screenshot
      </Button>
      
      {/* Device Frame Selector */}
      <Select value={screenshot.device} onChange={(device) => updateScreenshot(...)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="iPhone">iPhone</SelectItem>
          <SelectItem value="iPad">iPad</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};
```

**Deliverables:**
- ✅ `EditorTopToolbar` with dynamic content switching based on selection
- ✅ `TextToolbar` for heading/subheading with separate controls
- ✅ `MockupToolbar` for screenshot upload and device selection
- ✅ Toolbar **automatically updates** when user clicks different elements
- ✅ No "Save" or "Done" button needed (auto-save)

---

### **PHASE 5: Left Sidebar for Global Controls**
**Goal:** Collapsible sidebar with panels for global settings (background, etc.)

#### 5.1 Create Sidebar Component
**New File:** `client/src/components/studio-editor/EditorLeftSidebar.tsx`
```tsx
export const EditorLeftSidebar = () => {
  const [activePanel, setActivePanel] = useState<'background' | 'devices' | null>('background');
  
  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Icon Navigation */}
      <div className="flex flex-col gap-1 p-2 border-b">
        <Button
          variant={activePanel === 'background' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActivePanel('background')}
        >
          <PaintBrushIcon className="h-4 w-4 mr-2" />
          Background
        </Button>
        
        <Button
          variant={activePanel === 'devices' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActivePanel('devices')}
        >
          <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
          Devices
        </Button>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-auto p-4">
        {activePanel === 'background' && <BackgroundPanel />}
        {activePanel === 'devices' && <DevicesPanel />}
      </div>
    </div>
  );
};
```

#### 5.2 Create Background Panel
**New File:** `client/src/components/studio-editor/panels/BackgroundPanel.tsx`
```tsx
export const BackgroundPanel = () => {
  const { globalBackground, updateGlobalBackground } = useStudioEditorContext();
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Background</h3>
      <p className="text-xs text-muted-foreground">
        Changes apply to all screenshots
      </p>
      
      {/* Background Type Selector */}
      <Select value={globalBackground.type} onChange={(type) => updateGlobalBackground({ type })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="solid">Solid Color</SelectItem>
          <SelectItem value="linear-gradient">Linear Gradient</SelectItem>
          <SelectItem value="radial-gradient">Radial Gradient</SelectItem>
          <SelectItem value="accent">Accent Color</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Gradient Controls */}
      {globalBackground.type === 'linear-gradient' && (
        <>
          <Label>Angle</Label>
          <Slider
            value={[globalBackground.angle || 0]}
            onValueChange={(val) => updateGlobalBackground({ angle: val[0] })}
            min={0}
            max={360}
          />
          
          <Label>Colors</Label>
          {globalBackground.colors.map((color, index) => (
            <ColorPicker
              key={index}
              value={color}
              onChange={(newColor) => {
                const newColors = [...globalBackground.colors];
                newColors[index] = newColor;
                updateGlobalBackground({ colors: newColors });
              }}
            />
          ))}
          
          <Button variant="outline" size="sm" onClick={addColorStop}>
            Add Color Stop
          </Button>
        </>
      )}
    </div>
  );
};
```

**Deliverables:**
- ✅ `EditorLeftSidebar` with icon navigation
- ✅ `BackgroundPanel` with gradient controls
- ✅ Real-time preview of background changes on canvas
- ✅ "Changes apply to all screenshots" messaging

---

### **PHASE 6: Bottom Toolbar (Zoom Controls)**
**Goal:** Zoom slider and canvas navigation controls

#### 6.1 Create Bottom Toolbar
**New File:** `client/src/components/studio-editor/EditorBottomToolbar.tsx`
```tsx
export const EditorBottomToolbar = () => {
  const { canvasZoom, setCanvasZoom, resetCanvasView } = useStudioEditorContext();
  
  return (
    <div className="h-12 border-t bg-background flex items-center justify-center gap-4 px-4">
      {/* Zoom Out Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCanvasZoom(Math.max(0.25, canvasZoom - 0.25))}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      
      {/* Zoom Slider */}
      <Slider
        value={[canvasZoom * 100]}
        onValueChange={(val) => setCanvasZoom(val[0] / 100)}
        min={25}
        max={200}
        step={5}
        className="w-48"
      />
      
      {/* Zoom Percentage */}
      <span className="text-sm text-muted-foreground w-12">
        {Math.round(canvasZoom * 100)}%
      </span>
      
      {/* Zoom In Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCanvasZoom(Math.min(2, canvasZoom + 0.25))}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      
      {/* Reset View */}
      <Button variant="ghost" size="sm" onClick={resetCanvasView}>
        Reset View
      </Button>
    </div>
  );
};
```

#### 6.2 Implement Zoom/Pan Logic
**In:** `useMultiScreenshotEditor.ts`
```tsx
// Add zoom/pan transforms to canvas rendering
const applyCanvasTransform = (context, zoom, pan) => {
  context.save();
  context.scale(zoom, zoom);
  context.translate(pan.x, pan.y);
  // ... draw content
  context.restore();
};

// Add mouse wheel zoom
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  setCanvasZoom(Math.min(2, Math.max(0.25, canvasZoom + delta)));
};

// Add pan on middle mouse drag
const handlePan = (e: MouseEvent) => {
  if (e.buttons === 4) { // Middle mouse button
    setPan({
      x: pan.x + e.movementX,
      y: pan.y + e.movementY,
    });
  }
};
```

**Deliverables:**
- ✅ `EditorBottomToolbar` with zoom slider
- ✅ Zoom in/out buttons
- ✅ Mouse wheel zoom support
- ✅ Pan with middle mouse or spacebar+drag
- ✅ Reset view button

---

### **PHASE 7: Element Selection & Interaction**
**Goal:** Click detection, selection indicators, and drag interactions

#### 7.1 Implement Click Detection
**In:** `useMultiScreenshotEditor.ts`
```tsx
const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
  const rect = canvasRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom - pan.x;
  const y = (e.clientY - rect.top) / zoom - pan.y;
  
  // Check each screenshot
  screenshots.forEach((screenshot, index) => {
    const layout = layoutPositions[index]; // From calculateLayout
    
    // Check if clicked on heading
    if (isPointInBounds(x, y, screenshot.headingBounds)) {
      selectElement('heading', index); // Toolbar shows heading controls
      return;
    }
    
    // Check if clicked on subheading
    if (isPointInBounds(x, y, screenshot.subheadingBounds)) {
      selectElement('subheading', index); // Toolbar shows subheading controls
      return;
    }
    
    // Check if clicked on mockup
    if (isPointInBounds(x, y, screenshot.mockupBounds)) {
      selectElement('mockup', index); // Toolbar shows mockup controls
      return;
    }
  });
  
  // Clicked on background (deselect)
  selectElement(null, null); // Toolbar returns to default state
};
```

#### 7.2 Draw Selection Indicators
**In:** `useMultiScreenshotEditor.ts` → `drawAllScreenshots`
```tsx
// After drawing each screenshot element, draw selection if active
if (selectedScreenshotIndex === index) {
  if (selectedElementType === 'heading') {
    drawSelectionBox(context, screenshot.headingBounds, '#3B82F6');
  }
  if (selectedElementType === 'mockup') {
    drawSelectionBox(context, screenshot.mockupBounds, '#3B82F6');
    drawResizeHandles(context, screenshot.mockupBounds);
  }
}

const drawSelectionBox = (ctx, bounds, color) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);
};

const drawResizeHandles = (ctx, bounds) => {
  const handleSize = 8;
  const positions = [
    { x: bounds.x, y: bounds.y }, // Top-left
    { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
    { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Bottom-right
  ];
  
  positions.forEach(pos => {
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
  });
};
```

#### 7.3 Implement Drag Interactions
**In:** `useMultiScreenshotEditor.ts`
```tsx
const handleMouseDown = (e: MouseEvent) => {
  // Detect if clicking on a handle (for resize/rotate)
  // Or on an element itself (for move)
  
  setIsDragging(true);
  setDragStartCoords({ x: e.clientX, y: e.clientY });
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging) return;
  
  const dx = e.clientX - dragStartCoords.x;
  const dy = e.clientY - dragStartCoords.y;
  
  if (selectedElementType === 'heading' || selectedElementType === 'subheading') {
    // Move text element
    updateScreenshot(selectedScreenshotIndex, {
      [`${selectedElementType}X`]: screenshot[`${selectedElementType}X`] + dx / zoom,
      [`${selectedElementType}Y`]: screenshot[`${selectedElementType}Y`] + dy / zoom,
    });
  }
  
  if (selectedElementType === 'mockup') {
    // Move/resize/rotate mockup
    // ... similar logic to current useImageEditorController
  }
  
  setDragStartCoords({ x: e.clientX, y: e.clientY });
};

const handleMouseUp = () => {
  setIsDragging(false);
};
```

**Deliverables:**
- ✅ Click detection for heading/subheading/mockup elements
- ✅ Visual selection indicators (blue outline) when element clicked
- ✅ Resize handles for mockups
- ✅ Drag-to-move text elements
- ✅ Drag handles to resize/rotate mockups
- ✅ **Clicking element automatically shows toolbar** (no separate edit button)

---

### **PHASE 8: Auto-Save & Persistence**
**Goal:** Continuously persist changes without explicit save button

#### 8.1 Implement Debounced Auto-Save
**In:** `StudioEditorContext.tsx`
```tsx
const StudioEditorProvider = ({ children, projectId }: { children: React.ReactNode; projectId: string }) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { session } = useAuth();
  
  // Debounced auto-save
  const saveChanges = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    
    toast.info("Saving changes...", { duration: 1000 });
    
    try {
      // Save all screenshots in parallel
      await Promise.all(
        screenshots.map(async (screenshot, index) => {
          const configuration: GeneratedImageConfiguration = {
            heading: screenshot.heading,
            subheading: screenshot.subheading,
            headingFont: screenshot.headingFont,
            subheadingFont: screenshot.subheadingFont,
            headingFontSize: screenshot.headingFontSize,
            subheadingFontSize: screenshot.subheadingFontSize,
            mockupX: screenshot.mockupPosition.x,
            mockupY: screenshot.mockupPosition.y,
            mockupScale: screenshot.mockupScale,
            mockupRotation: screenshot.mockupRotation,
            theme: globalTheme,
            // ... other fields
          };
          
          // Call backend to update configuration
          const response = await fetch(
            `http://localhost:3001/api/projects/${projectId}/images/${screenshot.id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ configuration }),
            }
          );
          
          if (!response.ok) throw new Error('Failed to save');
        })
      );
      
      setHasUnsavedChanges(false);
      toast.success("Changes saved!", { duration: 1000 });
    } catch (error) {
      console.error("Auto-save error:", error);
      toast.error("Failed to save changes");
    }
  }, [screenshots, globalTheme, projectId, session, hasUnsavedChanges]);
  
  // Debounce auto-save (2 seconds after last change)
  const debouncedSave = useMemo(
    () => debounce(saveChanges, 2000),
    [saveChanges]
  );
  
  // Auto-save when state changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedSave();
    }
    
    return () => debouncedSave.cancel();
  }, [screenshots, globalBackground, globalTheme, debouncedSave, hasUnsavedChanges]);
  
  // ... rest of context
};
```

#### 8.2 Visual Save Indicator
**In:** `EditorTopToolbar.tsx`
```tsx
export const EditorTopToolbar = ({ onDownloadAll }: { onDownloadAll: () => void }) => {
  const { hasUnsavedChanges, isSaving } = useStudioEditorContext();
  
  return (
    <div className="h-14 border-b bg-white flex items-center px-4 gap-4">
      {/* Left: Save status indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isSaving && (
          <>
            <Loader2Icon className="h-3 w-3 animate-spin" />
            Saving...
          </>
        )}
        {!isSaving && !hasUnsavedChanges && (
          <>
            <CheckCircleIcon className="h-3 w-3 text-green-600" />
            All changes saved
          </>
        )}
        {!isSaving && hasUnsavedChanges && (
          <>
            <ClockIcon className="h-3 w-3 text-amber-600" />
            Unsaved changes
          </>
        )}
      </div>
      
      {/* ... rest of toolbar ... */}
    </div>
  );
};
```

**Deliverables:**
- ✅ Auto-save with 2-second debounce
- ✅ Visual save status indicator in toolbar
- ✅ No explicit "Save" button needed
- ✅ Changes persist automatically as user edits
- ✅ Toast notifications for save success/failure

---

### **PHASE 9: Migration & Cleanup**
**Goal:** Remove old dialog editor and finalize ImagesTab transformation

#### 9.1 Complete ImagesTab Transformation
**File:** `client/src/components/tabs/ImagesTab.tsx`
```tsx
/**
 * ImagesTab is now a full canvas editor - no gallery grid
 */
export const ImagesTab = ({ 
  imageList, 
  projectId,
  onDownloadAll 
}: ImagesTabProps) => {
  // Directly render editor layout (no mode toggle, no gallery grid)
  return (
    <StudioEditorLayout 
      imageList={imageList}
      projectId={projectId}
      onDownloadAll={onDownloadAll}
    />
  );
};
```

#### 9.2 Remove Old Components
**Files to remove:**
- ~~`client/src/components/image-editor/ImageEditor.tsx`~~ (old dialog)
- ~~`client/src/components/image-editor/ImageEditorCanvas.tsx`~~ (old single canvas)
- ~~`client/src/components/image-editor/ImageEditorControls.tsx`~~ (old sidebar)
- ~~`client/src/components/image-editor/useImageEditorController.ts`~~ (old controller)

**Keep for reuse:**
- ✅ `client/src/hooks/useImageEditor.ts` (rendering utilities - refactor for multi-screenshot)

#### 9.3 Update ProjectContent
**File:** `client/src/components/ProjectContent.tsx`
```tsx
// Remove all old dialog-related code

// OLD (DELETE):
// import { ImageEditor } from './ImageEditor';
// const [isEditorOpen, setIsEditorOpen] = useState(false);
// const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
// const handleEdit = (image, index) => { ... };
// <ImageEditor isOpen={...} onClose={...} ... />

// NEW (simplified):
<ImagesTab
  imageList={imageList}
  projectId={projectId}
  onDownloadAll={handleDownloadAll}
  // NO onEdit prop - editing is built-in
/>
```

**Deliverables:**
- ✅ ImagesTab only renders editor layout (no gallery fallback)
- ✅ Old dialog components removed/archived
- ✅ ProjectContent simplified (no dialog state management)
- ✅ Clean separation: ImagesTab = editor, no dual modes

---

### **PHASE 10: Polish & UX Enhancements**
**Goal:** Add finishing touches for professional feel

#### 10.1 Keyboard Shortcuts
**In:** `StudioEditorLayout.tsx` or context
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape: Deselect current element
    if (e.key === 'Escape') {
      selectElement(null, null); // Toolbar returns to default state
    }
    
    // Delete: Remove selected element (clear text)
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElementType === 'heading' || selectedElementType === 'subheading') {
        updateScreenshot(selectedScreenshotIndex, {
          [selectedElementType]: ''
        });
      }
    }
    
    // Cmd/Ctrl + Z: Undo (if undo system implemented)
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
    
    // Cmd/Ctrl + D: Duplicate selected screenshot
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      duplicateScreenshot(selectedScreenshotIndex);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectElement, selectedElementType, selectedScreenshotIndex, updateScreenshot, undo]);
```

#### 10.2 Loading States
**In:** `StudioEditorLayout.tsx`
```tsx
export const StudioEditorLayout = ({ imageList, projectId, onDownloadAll }: StudioEditorLayoutProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    // Simulate editor initialization (preload fonts, setup canvas, etc.)
    const initialize = async () => {
      // Preload fonts, load project config, etc.
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsInitializing(false);
    };
    
    initialize();
  }, []);
  
  if (isInitializing) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center border rounded-lg bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-200px)] flex flex-col border rounded-lg overflow-hidden bg-neutral-50">
      {/* ... editor layout ... */}
    </div>
  );
};
```

#### 10.3 Tooltips & Help
**In:** Various components
```tsx
// Add tooltips to toolbar buttons
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <BoldIcon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Bold (Cmd+B)</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

#### 10.4 Unsaved Changes Warning
**In:** `StudioEditorContext.tsx` or layout
```tsx
// Warn user before leaving tab with unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);

// Optionally: Warn when switching tabs within ProjectContent
// (This requires integration with React Router or tab navigation logic)
```

**Deliverables:**
- ✅ Keyboard shortcuts (Escape to deselect, Delete to clear, Cmd+Z undo, Cmd+D duplicate)
- ✅ Loading state while initializing editor
- ✅ Tooltips on all toolbar buttons
- ✅ Unsaved changes warning on browser close
- ✅ **No "Save" or "Done" button** - auto-save handles persistence

---

## 📋 **File Structure Summary**

### New Files to Create
```
client/src/
  components/
    studio-editor/
      StudioEditorLayout.tsx                     # Main editor layout (replaces ImagesTab content)
      EditorTopToolbar.tsx                       # Context-aware top toolbar
      EditorLeftSidebar.tsx                      # Global controls sidebar
      EditorBottomToolbar.tsx                    # Zoom controls
      MultiScreenshotCanvas.tsx                  # Unified canvas component
      
      toolbars/
        TextToolbar.tsx                          # Text editing controls (heading/subheading)
        MockupToolbar.tsx                        # Mockup controls
      
      panels/
        BackgroundPanel.tsx                      # Background gradient controls
        DevicesPanel.tsx                         # Device frame selector
  
  context/
    StudioEditorContext.tsx                      # Global state management
  
  hooks/
    useMultiScreenshotEditor.ts                  # Canvas controller
  
  types/
    studio-editor.ts                             # Type definitions
```

### Files to Modify
```
client/src/
  components/tabs/ImagesTab.tsx                  # Replace gallery grid with StudioEditorLayout
  components/ProjectContent.tsx                  # Remove old ImageEditor dialog
  hooks/useImageEditor.ts                        # Extract/refactor for multi-screenshot rendering
```

### Files to Remove (Archive/Delete)
```
client/src/
  components/image-editor/ImageEditor.tsx        # Old dialog (no longer needed)
  components/image-editor/ImageEditorCanvas.tsx  # Old single canvas
  components/image-editor/ImageEditorControls.tsx # Old sidebar controls
  components/image-editor/useImageEditorController.ts # Old controller
```

### Files to Keep (No Changes)
```
server/
  controllers/imageController.js                 # Already has regenerate endpoint
  services/imageGenerationService.js             # Canvas rendering logic
  constants/themes.js                            # Theme definitions
```

---

## 🎯 **Success Metrics**

After completing this refactor, you should be able to:

1. ✅ Navigate to Images Tab → **Immediately see canvas editor** (no gallery grid)
2. ✅ See all screenshots rendered side-by-side on unified canvas
3. ✅ **Click heading text** → Top toolbar instantly shows font/size/color/alignment controls
4. ✅ **Click subheading text** → Toolbar switches to subheading controls
5. ✅ **Click mockup** → Toolbar shows screenshot upload + device selector
6. ✅ **Click background** → Deselects element, toolbar returns to default
7. ✅ Open left sidebar → Change background gradient (applies to ALL screenshots)
8. ✅ Use bottom zoom slider to zoom in/out of canvas
9. ✅ Drag text elements to reposition them
10. ✅ Resize/rotate mockups using corner handles
11. ✅ **Changes auto-save** - no manual save needed
12. ✅ See save status indicator (Saving... / All changes saved)
13. ✅ Keyboard shortcuts work (Escape to deselect, Delete to clear)
14. ✅ **No "Edit" or "Edit All" button** - editor is always active

---

## 🚀 **Recommended Implementation Order**

**Week 1: Foundation & Canvas**
- Phase 1: Replace ImagesTab with Editor Layout (always-on editor)
- Phase 2: State Management & Data Layer
- Phase 3: Multi-Screenshot Canvas Implementation

**Week 2: Interactions**
- Phase 7: Element Selection & Interaction (click detection + toolbar switching)

**Week 3: UI Controls**
- Phase 4: Context-Aware Top Toolbar (text/mockup toolbars)
- Phase 5: Left Sidebar for Global Controls
- Phase 6: Bottom Toolbar (Zoom Controls)

**Week 4: Advanced Interactions**
- Phase 7: Complete drag/resize/rotate interactions
- Phase 8: Auto-Save & Persistence

**Week 5: Migration & Polish**
- Phase 9: Migration & Cleanup (remove old dialog)
- Phase 10: Polish & UX Enhancements

---

**Priority order:** Canvas rendering (Phase 3) and click detection (Phase 7) are the most critical to validate the approach early.

---

## ⚠️ **Risk Mitigation**

### Potential Challenges
1. **Canvas Performance**: Rendering 5-10 screenshots at once may be slow
   - **Solution**: Use offscreen canvases for mockups, debounce redraws, virtualize if needed

2. **State Complexity**: Managing global + per-screenshot state
   - **Solution**: Use `useReducer` or Zustand for cleaner state management

3. **Gradient Spanning**: Ensuring gradient flows across all screenshots
   - **Solution**: Calculate total width, use single gradient from 0 → totalWidth

4. **Backwards Compatibility**: Users with saved projects using old config format
   - **Solution**: Add migration logic in `StudioEditorPage` to convert old configs

### Rollback Plan
- Keep old `ImageEditor` dialog component for 1-2 releases
- Add feature flag to toggle between old/new editor
- Monitor error rates and user feedback

---

## 📚 **Additional Resources**

### Similar Tools for Reference
- **screenshots.pro**: Multi-screenshot editor with unified background
- **Figma**: Canvas-based editing with context-aware toolbars
- **Canva**: Drag-and-drop interface with global styles

### Technologies to Leverage
- **Existing**: React 19, Canvas API, Tailwind CSS, shadcn/ui
- **Consider Adding**: 
  - `react-zoom-pan-pinch` for advanced canvas navigation
  - `use-debounce` for auto-save
  - `zustand` for state management (alternative to Context)

---

## ✅ **Next Steps**

1. **Review this plan** with your team
2. **Prototype Phase 1-2** to validate architecture
3. **Build Phase 3** to prove canvas rendering works with multiple screenshots
4. **Iterate** based on user feedback
5. **Gradually migrate** users from old dialog to new full-page editor

---

**Questions or concerns?** Let me know which phase you'd like to start with, and I can provide detailed implementation code for that section! 🚀
