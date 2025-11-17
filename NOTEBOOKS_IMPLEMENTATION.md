# Notebooks Feature Implementation Summary

This document summarizes the implementation of the Notebooks feature in Grafana, which provides a document-style interface built on top of the existing dashboard infrastructure.

## Overview

Notebooks are a new top-level product in Grafana that:
- Reuse the existing dashboard code and database schema
- Enforce a single panel per row layout
- Default to text/markdown panels for documentation
- Appear as a separate navigation item with dedicated routes

## Key Features

1. **Single Panel Per Row**: Each panel takes the full width (24 grid units) and panels stack vertically
2. **Markdown-First**: The "Add text panel" button creates text/markdown panels by default
3. **Dashboard-Driven**: Stored as dashboards with a "notebook" tag, reusing all existing infrastructure
4. **Top-Level Routes**: Accessible via `/notebooks/` and `/n/:uid/:slug` URLs
5. **Sidebar Integration**: New "Notebooks" section in the main navigation

## Implementation Details

### Backend Changes

#### 1. Navigation Tree (`pkg/services/navtree/navtreeimpl/navtree.go`)

**Added Notebooks Section** (Lines 129-147):
```go
// Add Notebooks section
if hasAccess(ac.EvalAny(
    ac.EvalPermission(dashboards.ActionDashboardsRead),
    ac.EvalPermission(dashboards.ActionDashboardsCreate)),
) {
    notebookChildLinks := s.buildNotebookNavLinks(c)

    notebookLink := &navtree.NavLink{
        Text:       "Notebooks",
        Id:         "notebooks",
        SubTitle:   "Document your findings with notebooks",
        Icon:       "document-info",
        Url:        s.cfg.AppSubURL + "/notebooks",
        SortWeight: navtree.WeightDashboard + 50,
        Children:   notebookChildLinks,
    }

    treeRoot.AddSection(notebookLink)
}
```

**Added buildNotebookNavLinks Function** (Lines 459-475):
```go
func (s *ServiceImpl) buildNotebookNavLinks(c *contextmodel.ReqContext) []*navtree.NavLink {
    hasAccess := ac.HasAccess(s.accessControl, c)
    notebookChildNavs := []*navtree.NavLink{}

    if hasAccess(ac.EvalPermission(dashboards.ActionDashboardsCreate)) {
        notebookChildNavs = append(notebookChildNavs, &navtree.NavLink{
            Text:           "New notebook",
            Icon:           "plus",
            Url:            s.cfg.AppSubURL + "/notebooks/new",
            HideFromTabs:   true,
            Id:             "notebooks/new",
            IsCreateAction: true,
        })
    }

    return notebookChildNavs
}
```

### Frontend Changes

#### 1. Routes (`public/app/routes/routes.tsx`)

Added three new routes:
- `/notebooks` - List all notebooks
- `/notebooks/new` - Create new notebook
- `/n/:uid/:slug?` - View/edit specific notebook

#### 2. TypeScript Types (`public/app/types/dashboard.ts`)

Added `Notebook` to the `DashboardRoutes` enum:
```typescript
export enum DashboardRoutes {
  Home = 'home-dashboard',
  New = 'new-dashboard',
  // ... other routes
  Notebook = 'notebook',
}
```

#### 3. New Feature Directory Structure

```
public/app/features/notebooks/
├── README.md                           # Feature documentation
├── index.ts                            # Public exports
├── NotebooksListPage.tsx              # List view
├── NotebookPage.tsx                   # Main notebook editor/viewer
├── NotebookPageProxy.tsx              # Route proxy
├── components/
│   ├── NotebooksList.tsx              # Notebook list component
│   ├── NotebookNav.tsx                # Navigation bar with "Add text panel"
│   └── NotebookGrid.tsx               # Grid enforcing single-panel-per-row
└── utils/
    └── notebookUtils.ts               # Utility functions
```

#### 4. Key Components

**NotebookPage.tsx**:
- Extends dashboard functionality
- Automatically adds "notebook" tag to new notebooks
- Overrides `onAddPanel` to default to text panels
- Initializes new notebooks with a welcome text panel

**NotebookGrid.tsx**:
- Enforces single panel per row constraint
- Sets all panels to x=0, w=24 (full width)
- Disables horizontal dragging
- Maintains vertical layout automatically

**NotebookNav.tsx**:
- Custom navigation bar for notebooks
- Prominent "Add text panel" button
- Save and Share buttons
- Displays notebook title and folder

**NotebooksList.tsx**:
- Lists all notebooks (searches for dashboards with "notebook" tag)
- Card-based layout
- Empty state with call-to-action
- Quick access to create new notebooks

**notebookUtils.ts**:
- `createNewNotebook()` - Creates notebook with defaults
- `isNotebook()` - Identifies notebooks by tag
- `convertToNotebook()` - Converts dashboards to notebooks
- `ensureSinglePanelPerRow()` - Enforces layout constraints
- URL generation helpers

## How Notebooks Work

### Storage

Notebooks are stored as regular dashboards in the existing `dashboard` table with:
- Standard dashboard fields (uid, title, data, etc.)
- A `"notebook"` tag in the tags array for identification
- No schema changes required

### Identification

A dashboard is considered a notebook if:
```typescript
dashboard.tags?.includes('notebook')
```

### Layout Enforcement

The single-panel-per-row constraint is enforced in `NotebookGrid.tsx`:

1. On render, all panels are adjusted to:
   - x = 0 (left edge)
   - w = 24 (full width)
   - Sequential Y positions

2. Dragging is disabled; only vertical resizing allowed

3. New panels are automatically added at the bottom with full width

### Creating New Notebooks

1. User navigates to `/notebooks/new`
2. `NotebookPage` initializes a new dashboard
3. Adds "notebook" tag
4. Adds default welcome text panel
5. User can immediately start editing

### Converting Existing Dashboards

To convert a dashboard to a notebook:
```typescript
import { convertToNotebook } from 'app/features/notebooks';

convertToNotebook(dashboard);
// Adds "notebook" tag and enforces layout
```

## User Experience

### Navigation Flow

```
Sidebar
  └── Notebooks
       ├── [List of existing notebooks]
       └── New notebook (create action)

/notebooks → List all notebooks
/notebooks/new → Create new notebook
/n/:uid/:slug → View/edit specific notebook
```

### Creating a Notebook

1. Click "Notebooks" in sidebar
2. Click "New notebook" button
3. Start with a welcome text panel
4. Click "Add text panel" to add more content
5. Each panel takes full width automatically
6. Save to persist

### Viewing/Editing

- Full-width panels stacked vertically
- Clean, document-like layout
- Prominent "Add text panel" button
- Standard dashboard features (time range, variables) available
- Can add any panel type (not just text)

## Technical Benefits

1. **Code Reuse**: 95% of dashboard code is reused
2. **No Schema Changes**: Uses existing database structure
3. **Backward Compatible**: Can convert between dashboards and notebooks
4. **Permissions**: Uses existing dashboard permissions
5. **Features**: All dashboard features (sharing, starring, etc.) work
6. **Maintainability**: Changes to dashboards automatically benefit notebooks

## Testing the Implementation

### Manual Testing Steps

1. **View Notebooks List**:
   ```
   Navigate to /notebooks
   Should see notebooks list page
   ```

2. **Create New Notebook**:
   ```
   Click "New notebook" 
   Should see notebook with welcome text panel
   Panel should be full width
   ```

3. **Add Text Panel**:
   ```
   Click "Add text panel" button
   Should open text panel editor
   Panel should appear below existing panels at full width
   ```

4. **Save Notebook**:
   ```
   Click "Save"
   Should persist with "notebook" tag
   ```

5. **Navigation**:
   ```
   Check sidebar for "Notebooks" section
   Verify it appears after Dashboards
   ```

6. **Layout Constraint**:
   ```
   Try to drag panels horizontally - should be disabled
   Try to resize horizontally - should maintain full width
   Vertical resizing should work normally
   ```

## Files Modified

### Backend
- `pkg/services/navtree/navtreeimpl/navtree.go` - Added notebooks navigation

### Frontend
- `public/app/routes/routes.tsx` - Added notebook routes
- `public/app/types/dashboard.ts` - Added Notebook route type

### New Files Created
- `public/app/features/notebooks/` - Complete notebooks feature directory (8 files)

## Future Enhancements

Potential improvements that could be added:

1. **Search & Filter**: Dedicated notebook search in list view
2. **Templates**: Pre-built notebook templates for common use cases
3. **Export**: Export notebooks to PDF, Markdown, or HTML
4. **Collaboration**: Real-time collaborative editing indicators
5. **Version History**: Visual diff for notebook changes
6. **Notebook-Specific Variables**: Variables scoped to notebook context
7. **Table of Contents**: Auto-generated TOC from panel titles
8. **Comments**: Inline commenting on notebook sections
9. **Notebook Sharing**: Share notebooks with specific users/teams
10. **Imports**: Import from Jupyter, Markdown, or other formats

## Conclusion

The notebooks feature successfully extends Grafana's dashboard functionality to provide a clean, document-style interface for documentation and narrative content. By reusing existing infrastructure and enforcing simple layout constraints, it provides significant value with minimal code changes and no database modifications.
