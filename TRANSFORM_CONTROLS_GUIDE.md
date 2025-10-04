# Transform Controls Implementation Guide

## Overview
Professional on-canvas transform controls for mockup manipulation, inspired by Canva, Figma, and Adobe tools.

## Features Implemented

### ✅ Visual Transform Controls
- **8 Resize Handles**: Corner and side handles for intuitive scaling
- **Rotation Handle**: Top-centered handle with visual connector line
- **Bounding Box**: Dashed blue border showing selection
- **Real-time Feedback**: Immediate visual updates during transformation

### ✅ Interaction Features
- **Drag to Move**: Click and drag mockup to reposition
- **Corner Resize**: Uniform scaling (maintains aspect ratio)
- **Side Resize**: Directional scaling (width or height only)
- **Rotation**: Drag top handle to rotate freely

### ✅ Keyboard Modifiers
- **Shift Key**: Snap rotation to 15° increments (e.g., 0°, 15°, 30°, 45°)
- **Alt/Option Key**: Scale from center point (maintains center position)
- **Shift + Corner Handle**: Enforce uniform scaling

### ✅ Toolbar Display
Mockup toolbar now shows **read-only** transform values:
- Scale percentage (e.g., "100%")
- Rotation degrees (e.g., "45°")
- Device selector
- Replace screenshot button
- Reset transform button (resets position, scale, and rotation)

## Component Architecture

### TransformControls.tsx
```tsx
<TransformControls
  x={number}              // Canvas X position
  y={number}              // Canvas Y position
  width={number}          // Current width
  height={number}         // Current height
  rotation={number}       // Rotation in degrees (-180 to 180)
  displayScale={number}   // Canvas size / display size ratio
  onTransform={(transform) => {
    // Receives: { x, y, width, height, rotation, scale }
  }}
  showRotationHandle={boolean}  // Default: true
  showScaleHandles={boolean}    // Default: true
  minScale={number}             // Default: 0.1
  maxScale={number}             // Default: 5.0
/>
```

### Integration in MultiScreenshotCanvas.tsx
```tsx
{isSelectedMockup && !selection.isEditing && (
  <TransformControls
    x={mockupX}
    y={mockupY}
    width={mockupWidth}
    height={mockupHeight}
    rotation={screenshot.mockupRotation || 0}
    displayScale={displayScale}
    onTransform={(transform) => {
      updateScreenshotPosition(index, 'mockup', { x: newX, y: newY });
      updateScreenshotScale(index, transform.scale);
      updateScreenshotRotation(index, transform.rotation);
    }}
  />
)}
```

## Canvas Rendering with Rotation

### canvasRenderer.ts
Applies rotation using canvas transformation matrix:
```typescript
const centerX = finalMockupX + mockupWidth / 2;
const centerY = finalMockupY + mockupHeight / 2;

ctx.save();
if (mockupRotation !== 0) {
  ctx.translate(centerX, centerY);
  ctx.rotate((mockupRotation * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);
}
// Draw screenshot and frame
ctx.restore();
```

### MultiScreenshotCanvas.tsx
Same rotation logic applied to both:
- Screenshot image (inside device frame)
- Device frame overlay

## Auto-Save Configuration

### Persisted Fields (GeneratedImage.configuration)
```json
{
  "mockupX": 0,
  "mockupY": 0,
  "mockupScale": 1.0,
  "mockupRotation": 0,
  "heading": "Text",
  "subheading": "Subtitle",
  "headingFontSize": 64,
  "subheadingFontSize": 32,
  "deviceFrame": "iPhone 15 Pro",
  "backgroundType": "gradient",
  "backgroundGradient": {
    "startColor": "#667eea",
    "endColor": "#764ba2",
    "angle": 135
  }
}
```

Auto-saves **2 seconds** after last change when element is deselected.

## User Experience Flow

### Selecting Mockup
1. Click on device mockup → Blue dashed border + transform handles appear
2. Toolbar updates with current scale/rotation values

### Transforming Mockup
1. **Move**: Drag mockup body to reposition
2. **Scale**: Drag corner handles (uniform) or side handles (directional)
3. **Rotate**: Drag top circular handle
4. **Modifier Keys**:
   - Hold Shift while rotating → Snap to 15° increments
   - Hold Alt while scaling → Scale from center

### Resetting Transform
Click "Reset Transform" button to restore:
- Position: `x: 0, y: 0` (centered)
- Scale: `1.0` (100%)
- Rotation: `0°`

## Visual Design

### Handle Styling
- **Size**: 12×12px squares (corners/sides), 16×16px circle (rotation)
- **Color**: White fill, 2px blue border (#3b82f6)
- **Hover**: Scale up 1.25x
- **Cursor**: Contextual (nwse-resize, ew-resize, grab, etc.)

### Bounding Box
- **Style**: 2px dashed blue border (#3b82f6)
- **Position**: Exactly wraps mockup bounds
- **Rotation**: Follows mockup rotation

### Rotation Handle
- **Position**: 40px above top edge, centered
- **Connector**: 2px solid blue line from handle to box
- **Cursor**: `grab` (or `grabbing` when active)

## Performance Considerations

### Real-time Updates
- Transform calculations happen in JavaScript (instant)
- Canvas re-renders on every frame during drag
- No server calls during interaction (configuration-only saves)

### Display Scale Calculation
```typescript
const CANVAS_WIDTH = 1200;
const DISPLAY_WIDTH = 350; // Approximate displayed canvas width
const displayScale = DISPLAY_WIDTH / CANVAS_WIDTH; // ~0.29
```

Handles positioned in **display coordinates** (px on screen).
Transform values calculated in **canvas coordinates** (1200×2600px logical size).

## Browser Compatibility

### Supported
✅ Chrome 90+
✅ Safari 14+
✅ Firefox 88+
✅ Edge 90+

### CSS Features Used
- `transform: rotate()` with `transform-origin`
- `cursor` variants (nwse-resize, ew-resize, grab, grabbing)
- `pointer-events: auto/none`
- Absolute positioning with calculated coordinates

### Canvas API Features
- `ctx.translate()` / `ctx.rotate()` transformation matrix
- `ctx.save()` / `ctx.restore()` state stack
- `ctx.roundRect()` for device frame masking

## Future Enhancements

### Planned
- [ ] Snap to grid (10px increments with Shift modifier)
- [ ] Snap to canvas edges (align helpers)
- [ ] Multi-select (transform multiple screenshots simultaneously)
- [ ] Aspect ratio lock toggle (UI button)
- [ ] Keyboard shortcuts (Arrow keys to nudge position)
- [ ] Touch support for mobile/tablet devices
- [ ] Visual rotation degree indicator (floating tooltip)

### Potential
- [ ] Undo/redo history for transforms
- [ ] Transform presets (save/load common configurations)
- [ ] Animation timeline (rotate/scale animations)
- [ ] Smart guides (align with other screenshots)

## Troubleshooting

### Handles not appearing
**Check**: `isSelectedMockup && !selection.isEditing` conditions
**Fix**: Ensure mockup element type is selected and not in text editing mode

### Rotation not applied to canvas
**Check**: Canvas rotation transformation in `MultiScreenshotCanvas.tsx` and `canvasRenderer.ts`
**Fix**: Both screenshot and frame must have identical rotation transformations

### Transform values not saving
**Check**: Auto-save triggers in `StudioEditorContext.tsx` (line 295-315)
**Fix**: Ensure `mockupRotation` is included in configuration object (line 304)

### Display scale incorrect
**Check**: Canvas `width` attribute vs CSS `width` style
**Fix**: Calculate `displayScale = canvas.getBoundingClientRect().width / canvas.width`

## Code References

### Key Files
- `/client/src/components/studio-editor/TransformControls.tsx` - Transform handle component
- `/client/src/components/studio-editor/MultiScreenshotCanvas.tsx` - Canvas with controls
- `/client/src/components/studio-editor/MockupToolbar.tsx` - Simplified toolbar
- `/client/src/components/studio-editor/canvasRenderer.ts` - Standalone renderer
- `/client/src/context/StudioEditorContext.tsx` - State management + auto-save

### API Endpoint
`PUT /api/projects/:projectId/images/:imageId`
- Saves configuration JSON (no image regeneration)
- Returns updated GeneratedImage record

### Database Schema
```prisma
model GeneratedImage {
  id                  String   @id @default(cuid())
  configuration       Json?    // Stores mockupRotation + all transform values
  sourceScreenshotUrl String
  generatedImageUrl   String
  // ... other fields
}
```

## Best Practices

### 1. Separation of Concerns
- **TransformControls**: Pure UI component (handles, visual feedback)
- **MultiScreenshotCanvas**: Integration layer (state updates, coordinate conversion)
- **StudioEditorContext**: Business logic (auto-save, state management)

### 2. Coordinate Systems
- Always distinguish **canvas coordinates** (1200×2600) from **display coordinates** (~350×758)
- Convert once at component boundary, not in loops

### 3. Performance
- Debounce rapid updates (auto-save has 2-second delay)
- Use CSS transforms for handles (GPU-accelerated)
- Minimize canvas redraws (only on actual changes)

### 4. Accessibility
- Provide keyboard alternatives for all mouse interactions
- Visual focus indicators on handles
- Screen reader announcements for transform values

### 5. User Feedback
- Show transform values in toolbar (read-only display)
- Visual handles confirm selection state
- Cursor changes indicate interaction affordances

---

**Last Updated**: October 4, 2025
**Version**: 1.0
**Status**: ✅ Production Ready
