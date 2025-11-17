import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';

/**
 * Creates a new notebook with default settings
 */
export function createNewNotebook(): any {
  return {
    title: 'New Notebook',
    tags: ['notebook'],
    timezone: 'browser',
    schemaVersion: 38,
    version: 0,
    refresh: '',
    panels: [
      {
        id: 1,
        type: 'text',
        title: 'Welcome to your notebook',
        gridPos: { x: 0, y: 0, w: 24, h: 8 },
        options: {
          mode: 'markdown',
          content: `# Welcome to your notebook

Start documenting your findings here. You can:

- Add text panels with markdown
- Add visualizations
- Each panel takes up a full row for a clean, narrative layout

Click "Add text panel" above to add more content.`,
        },
      },
    ],
  };
}

/**
 * Checks if a dashboard is a notebook based on tags or metadata
 */
export function isNotebook(dashboard: DashboardModel): boolean {
  const tags = dashboard.tags || [];
  return tags.includes('notebook');
}

/**
 * Converts a dashboard to a notebook by adding the notebook tag
 */
export function convertToNotebook(dashboard: DashboardModel): void {
  if (!isNotebook(dashboard)) {
    const tags = dashboard.tags || [];
    dashboard.tags = [...tags, 'notebook'];
  }

  // Ensure all panels are in single-row layout
  ensureSinglePanelPerRow(dashboard);
}

/**
 * Ensures all panels in a dashboard follow the single-panel-per-row constraint
 */
export function ensureSinglePanelPerRow(dashboard: DashboardModel): void {
  let currentY = 0;

  dashboard.panels.forEach((panel) => {
    // Force each panel to full width and sequential Y positions
    panel.updateGridPos({
      x: 0,
      y: currentY,
      w: 24,
      h: panel.gridPos.h,
    });

    currentY += panel.gridPos.h;
  });
}

/**
 * Gets the URL for a notebook
 */
export function getNotebookUrl(uid: string, slug?: string): string {
  return `/n/${uid}${slug ? `/${slug}` : ''}`;
}

/**
 * Gets the edit URL for a notebook
 */
export function getNotebookEditUrl(uid: string, slug?: string): string {
  return `${getNotebookUrl(uid, slug)}?editPanel=new`;
}
