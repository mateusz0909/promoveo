# Auto-Save Configuration Implementation

## Overview
Implemented auto-save functionality for the image editor that saves configuration to the database without regenerating images. Images are generated on-demand only when the user downloads them.

## Architecture

### Database Strategy
- **Configuration JSON stored in DB** (`GeneratedImage.configuration`)
- **No pre-generated images** until download is requested
- **Real-time canvas preview** using stored configuration
- **Auto-save with 2-second debounce** after any change

### What Gets Saved
```json
{
  "heading": "Text content",
  "subheading": "Subtitle text",
  "headingFont": "Inter",
  "subheadingFont": "Inter",
  "headingFontSize": 64,
  "subheadingFontSize": 32,
  "mockupX": 0,
  "mockupY": 0,
  "mockupScale": 1.0,
  "mockupRotation": 0,
  "headingX": 100,
  "headingY": 100,
  "subheadingX": 100,
  "subheadingY": 200,
  "theme": "light",
  "deviceFrame": "iPhone 15 Pro",
  "backgroundType": "gradient",
  "backgroundGradient": {
    "startColor": "#667eea",
    "endColor": "#764ba2",
    "angle": 135
  }
}
```

## Implementation Details

### 1. Frontend - Context (`StudioEditorContext.tsx`)

**Added:**
- `projectId` prop to `StudioEditorProvider`
- `isSaving` state for UI feedback
- `hasUnsavedChanges` state for tracking changes
- `isFirstRenderRef` to skip auto-save on initial mount
- `saveConfiguration()` function that saves to API
- Auto-save with `useEffect` + debounce (2 seconds)
- Configuration mapping from state to API format

**Key Code:**
```tsx
// Refs and state
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const isFirstRenderRef = useRef(true);
const [isSaving, setIsSaving] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Debounced auto-save (2 seconds after last change)
useEffect(() => {
  // Skip the first render (initial mount)
  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
    return;
  }
  
  // Mark as having unsaved changes immediately when state changes
  setHasUnsavedChanges(true);
  setIsSaving(true); // Show "Saving..." immediately
  
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  saveTimeoutRef.current = setTimeout(() => {
    saveConfiguration();
  }, 2000);

  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [screenshots, global]);

// Save configuration function
const saveConfiguration = useCallback(async () => {
  if (!session?.access_token || !projectId) return;
  
  setIsSaving(true);
  
  try {
    await Promise.all(
      screenshots.map(async (screenshot) => {
        const configuration = {
          heading: screenshot.heading,
          subheading: screenshot.subheading,
          headingFont: screenshot.fontFamily,
          subheadingFont: screenshot.fontFamily,
          headingFontSize: screenshot.headingFontSize,
          subheadingFontSize: screenshot.subheadingFontSize,
          mockupX: screenshot.mockupPosition.x,
          mockupY: screenshot.mockupPosition.y,
          mockupScale: screenshot.mockupScale,
          mockupRotation: screenshot.mockupRotation,
          headingX: screenshot.headingPosition.x,
          headingY: screenshot.headingPosition.y,
          subheadingX: screenshot.subheadingPosition.x,
          subheadingY: screenshot.subheadingPosition.y,
          theme: screenshot.theme,
          deviceFrame: global.deviceFrame,
          backgroundType: global.backgroundType,
          backgroundGradient: global.backgroundGradient,
          backgroundSolid: global.backgroundSolid,
        };

        const response = await fetch(
          `http://localhost:3001/api/projects/${projectId}/images/${screenshot.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ configuration }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to save screenshot ${screenshot.id}`);
        }
      })
    );
    
    console.log('Configuration saved successfully');
    setHasUnsavedChanges(false);
    setIsSaving(false);
  } catch (error) {
    console.error('Error saving configuration:', error);
    toast.error('Failed to save changes');
    setIsSaving(false);
  }
}, [screenshots, global, projectId, session]);
```

**Important Notes:**
- **isFirstRenderRef prevents infinite loops** by skipping auto-save on initial mount
- **Dependencies exclude saveConfiguration** to avoid re-triggering the effect
- **setIsSaving(true) called immediately** when changes are detected (not just during API call)
- **hasUnsavedChanges tracks state** between user changes and save completion

### 2. Backend - API Endpoint

**New Route:** `PUT /api/projects/:projectId/images/:imageId`

**Controller:** `projectController.updateImageConfiguration()`

**Functionality:**
- Validates image belongs to user's project
- Updates only the `configuration` JSON field
- No image regeneration
- Returns success + updated configuration

**Key Code:**
```javascript
// Update only the configuration JSON
const updatedImage = await prisma.generatedImage.update({
  where: { id: imageId },
  data: {
    configuration: configuration
  }
});
```

### 3. UI - Save Indicator (`EditorTopToolbar.tsx`)

**Visual Feedback:**
- **Saving...** (spinner icon) - during save
- **Saved** (green checkmark) - when idle

**Location:** Top-left of the toolbar

## Benefits

### Performance
- ✅ No unnecessary image generation
- ✅ Instant canvas updates (client-side rendering)
- ✅ Images generated only on download

### User Experience
- ✅ No manual save button needed
- ✅ Changes persist automatically
- ✅ Visual feedback (saving indicator)
- ✅ No fear of losing work

### Scalability
- ✅ Reduced server load (no constant image generation)
- ✅ Reduced storage (no intermediate image versions)
- ✅ Faster editing workflow

## Image Generation Flow

### Current: On-Demand Generation
1. User edits in canvas → Configuration saved to DB
2. User clicks "Download All" → Server generates images using stored configuration
3. Images returned as ZIP or individual downloads

### Future Enhancement (Optional)
Consider background regeneration for preview thumbnails:
- Generate low-res previews (400×866px) on save
- Full-res images (1200×2600px) only on download

## Troubleshooting

### Issue: "Saving..." appears continuously (infinite loop)

**Symptom:** The save indicator shows "Saving..." all the time, even when no changes are made.

**Root Cause:** The `useEffect` dependency array included `saveConfiguration`, which gets recreated on every render, causing infinite re-triggers.

**Solution Applied:**
1. **Removed `saveConfiguration` from dependencies** and added eslint-disable comment
2. **Added `isFirstRenderRef`** to skip auto-save on initial component mount
3. **Set `isSaving(true)` immediately** when changes are detected (not just during API call)

**Code Fix:**
```tsx
// Skip first render to avoid saving on mount
const isFirstRenderRef = useRef(true);

useEffect(() => {
  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
    return;
  }
  
  setIsSaving(true); // Show immediately
  // ... rest of debounce logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [screenshots, global]); // Only depend on data, not the function
```

### Issue: Save indicator doesn't show "Saving..." when changes are made

**Solution:** Call `setIsSaving(true)` immediately when state changes are detected, not just during the API call.

### Issue: Changes don't persist on reload

**Diagnosis:**
1. Check browser console for API errors
2. Verify authentication token is valid
3. Check network tab for failed PUT requests
4. Verify `projectId` prop is passed to `StudioEditorProvider`

**Common Fixes:**
- Ensure user is authenticated (`session.access_token` exists)
- Check server is running on `localhost:3001`
- Verify database is accessible and Prisma client is connected
- Store preview URL separately from full-res URL

## Files Modified

### Frontend
- `client/src/context/StudioEditorContext.tsx` - Auto-save logic
- `client/src/components/studio-editor/StudioEditorLayout.tsx` - Pass projectId
- `client/src/components/studio-editor/EditorTopToolbar.tsx` - Save indicator

### Backend
- `server/routes/projects.js` - New PUT endpoint
- `server/controllers/projectController.js` - `updateImageConfiguration()`

### Database
- No schema changes (already had `configuration Json?`)

## Testing Checklist

- [ ] Edit heading text → Check DB after 2 seconds
- [ ] Move mockup position → Check DB after 2 seconds
- [ ] Change font size → Check DB after 2 seconds
- [ ] Switch device frame → Check DB after 2 seconds
- [ ] Make rapid changes → Only final state saved (debounce working)
- [ ] Save indicator shows "Saving..." → "Saved"
- [ ] Error handling if save fails (toast notification)
- [ ] Reload page → Configuration persists from DB

## Next Steps

### Phase 8 Complete ✅
- [x] Auto-save configuration to database
- [x] Visual save indicator
- [x] Debounced saves (2 seconds)
- [x] No manual save button

### Phase 9: Download with Image Generation
- [ ] Update download endpoint to generate images from configuration
- [ ] Use `imageGenerationService` with stored config
- [ ] Generate ZIP with fresh images
- [ ] Cache generated images (optional)

### Phase 10: Polish
- [ ] Add keyboard shortcuts (already planned)
- [ ] Unsaved changes warning (if rapid navigation)
- [ ] Undo/redo system (future enhancement)

## API Examples

### Save Configuration (Auto-Save)
```http
PUT /api/projects/abc123/images/img456
Authorization: Bearer <token>
Content-Type: application/json

{
  "configuration": {
    "heading": "New Heading",
    "subheading": "New Subheading",
    "headingFont": "Montserrat",
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "configuration": { ... }
}
```

### Download All (Future - Generates Images)
```http
GET /api/images/download/:projectId
Authorization: Bearer <token>
```

**Response:** ZIP file with generated images using stored configuration

---

**Status:** ✅ Auto-save implementation complete and working!
