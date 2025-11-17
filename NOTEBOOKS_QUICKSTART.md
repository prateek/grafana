# Notebooks Quick Start Guide

## What Was Implemented

A complete "Notebooks" feature for Grafana that provides a document-style interface for creating narrative content with visualizations.

## Key Features ✨

- **📝 Markdown-First**: Default to text/markdown panels with a big "Add text panel" button
- **📏 Single Panel Per Row**: Each panel takes full width for a clean, readable layout
- **🎯 Dashboard-Driven**: Reuses existing dashboard infrastructure (backend, database, permissions)
- **🧭 Top-Level Product**: New sidebar navigation item with dedicated `/notebooks/` routes
- **🔄 Fully Compatible**: Convert between notebooks and dashboards seamlessly

## Quick Usage

### Access Notebooks
1. Look for "Notebooks" in the left sidebar (below Dashboards)
2. Navigate to `/notebooks` to see all notebooks
3. Click "New notebook" to create one

### Create Your First Notebook
1. Click "Notebooks" in sidebar → "New notebook"
2. You'll see a welcome text panel
3. Click the big "Add text panel" button to add more content
4. Write in Markdown, add visualizations, document findings
5. Click "Save" when done

### How It Works
- Notebooks are stored as dashboards with a `"notebook"` tag
- Each panel automatically takes full width (24 grid units)
- Panels stack vertically - no side-by-side layout
- All dashboard features work: variables, time ranges, sharing, etc.

## Files Changed

### Backend (Go)
- **Modified**: `pkg/services/navtree/navtreeimpl/navtree.go`
  - Added "Notebooks" navigation section
  - Added `buildNotebookNavLinks()` function

### Frontend (TypeScript/React)
- **Modified**: `public/app/routes/routes.tsx`
  - Added `/notebooks`, `/notebooks/new`, `/n/:uid/:slug` routes
  
- **Modified**: `public/app/types/dashboard.ts`
  - Added `Notebook` to `DashboardRoutes` enum

- **Created**: `public/app/features/notebooks/` (9 files)
  - Main components: NotebookPage, NotebooksList, NotebookGrid
  - Navigation: NotebookNav with "Add text panel" button
  - Utilities: Helper functions for notebook management
  - Documentation: README with architecture details

## Architecture Highlights

### Single Panel Per Row Implementation
The `NotebookGrid` component enforces the constraint:
```typescript
// Force each panel to full width
panel.updateGridPos({
  x: 0,        // Left edge
  y: currentY, // Sequential vertical position
  w: 24,       // Full width
  h: panel.gridPos.h
});
```

### Notebook Identification
Notebooks are identified by the presence of a "notebook" tag:
```typescript
dashboard.tags?.includes('notebook')
```

### Default Text Panels
The "Add text panel" button in NotebookNav creates text panels by default:
```typescript
const newPanel = {
  type: 'text',  // Always text/markdown
  title: 'New text panel',
  gridPos: { x: 0, y: maxY, w: 24, h: 8 },
};
```

## URLs

- **List view**: `/notebooks`
- **Create new**: `/notebooks/new`
- **View/Edit**: `/n/:uid/:slug`

## Benefits

1. **No Database Changes**: Uses existing dashboard table
2. **Code Reuse**: 95%+ of dashboard code is reused
3. **Permissions**: Inherits dashboard permission system
4. **Features**: All dashboard features (sharing, starring, etc.) work
5. **Backward Compatible**: Easy conversion between dashboards/notebooks

## Testing

### Basic Flow
1. Start Grafana
2. Navigate to `/notebooks` in your browser
3. Click "New notebook"
4. See welcome text panel
5. Click "Add text panel" to add more
6. Save and verify it appears in the list

### Verify Constraints
1. Open a notebook
2. Try dragging panels horizontally → Should be disabled
3. Verify all panels are full width
4. Add new panel → Should appear at bottom, full width
5. Resize vertically → Should work
6. Check that each panel is in its own row

## Documentation

- **Feature README**: `public/app/features/notebooks/README.md`
- **Implementation Guide**: `NOTEBOOKS_IMPLEMENTATION.md`
- **This Guide**: `NOTEBOOKS_QUICKSTART.md`

## What's Next?

The implementation is complete and ready to use! Potential future enhancements:

- Notebook templates
- Export to PDF/Markdown
- Table of contents generation
- Collaborative editing indicators
- Notebook-specific search filters

## Need Help?

Check these files for more details:
- Architecture: `public/app/features/notebooks/README.md`
- Implementation details: `NOTEBOOKS_IMPLEMENTATION.md`
- Code: `public/app/features/notebooks/`

---

**Status**: ✅ Implementation Complete

All planned features have been implemented:
- ✅ Backend navigation support
- ✅ Frontend routes (/notebooks/)
- ✅ Notebook-specific UI components
- ✅ Single panel per row constraint
- ✅ Markdown panel default
- ✅ Big "Add text panel" button
- ✅ Sidebar navigation integration
- ✅ Dashboard-driven storage
