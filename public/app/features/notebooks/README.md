# Notebooks Feature

Notebooks are a specialized view of Grafana dashboards designed for documentation and narrative-style content presentation.

## Overview

Notebooks extend the existing dashboard functionality with the following constraints and features:

- **Single panel per row**: Each panel takes up the full width of the notebook (24 grid units)
- **Markdown-first**: The "Add panel" button defaults to adding text/markdown panels
- **Clean layout**: Panels are stacked vertically for a document-like reading experience
- **Dashboard-driven**: Notebooks are stored as regular dashboards with a "notebook" tag

## Architecture

### Backend

- **Navigation** (`pkg/services/navtree/navtreeimpl/navtree.go`):
  - Added "Notebooks" section to the navigation tree
  - Positioned after Dashboards with appropriate permissions
  - Includes "New notebook" create action

### Frontend

#### Routes (`public/app/routes/routes.tsx`)

- `/notebooks` - List all notebooks
- `/notebooks/new` - Create a new notebook
- `/n/:uid/:slug?` - View/edit a specific notebook

#### Components

- **NotebooksListPage** - Main list view showing all notebooks
- **NotebookPage** - Main notebook editor/viewer (extends dashboard functionality)
- **NotebookPageProxy** - Route proxy for notebooks
- **NotebookNav** - Custom navigation bar with "Add text panel" button
- **NotebookGrid** - Grid layout that enforces single-panel-per-row constraint
- **NotebooksList** - List component showing notebook cards

#### Utilities (`utils/notebookUtils.ts`)

- `createNewNotebook()` - Creates a new notebook with defaults
- `isNotebook()` - Checks if a dashboard is a notebook
- `convertToNotebook()` - Converts an existing dashboard to notebook format
- `ensureSinglePanelPerRow()` - Enforces layout constraints
- `getNotebookUrl()` - Generate notebook URLs

## How It Works

### Creating Notebooks

1. User clicks "New notebook" in the navigation or list page
2. System initializes a new dashboard with:
   - `notebook` tag for identification
   - Default welcome text panel
   - Full-width layout (x=0, w=24)

### Storing Notebooks

Notebooks are stored as regular dashboards in the database with:
- A `notebook` tag to identify them
- Standard dashboard metadata
- The same permissions and access control as dashboards

### Single Panel Per Row Constraint

The `NotebookGrid` component enforces the constraint by:
1. Automatically adjusting panel positions on render
2. Setting all panels to x=0, w=24 (full width)
3. Stacking panels vertically with sequential Y positions
4. Disabling horizontal dragging (only vertical resizing allowed)

### Default Text Panels

When adding a new panel via the "Add text panel" button:
1. The system creates a text/markdown panel by default
2. Panel is added at the bottom of the notebook
3. Panel is immediately opened for editing
4. Panel takes full width (24 grid units)

## Usage Example

```typescript
import { createNewNotebook, isNotebook, getNotebookUrl } from 'app/features/notebooks';

// Create a new notebook
const newNotebook = createNewNotebook();

// Check if a dashboard is a notebook
if (isNotebook(dashboard)) {
  // Navigate to notebook view
  const url = getNotebookUrl(dashboard.uid, dashboard.slug);
}
```

## Integration Points

### With Dashboards

- Notebooks use the existing dashboard infrastructure
- All dashboard features (variables, time range, etc.) work in notebooks
- Can convert between notebooks and dashboards by adding/removing the tag

### With Panels

- All panel types are supported
- Text/markdown panels are the default
- Panels automatically adjust to full-width layout

### With Navigation

- Notebooks appear as a top-level navigation item
- Separate from dashboards for clarity
- Same permissions as dashboard creation/viewing

## Future Enhancements

Potential improvements:
- Dedicated notebook search/filtering
- Notebook templates
- Export to PDF/Markdown
- Collaborative editing indicators
- Version history view
- Notebook-specific variables/templates
