import { Dashboard } from '@grafana/schema';
import { NOTEBOOK_PLUGIN_ID, TEXT_PANEL_PLUGIN_ID } from '../constants';

export function buildNewNotebookSaveModel(): Dashboard {
  return {
    title: 'New Notebook',
    tags: [],
    timezone: 'browser',
    schemaVersion: 39,
    version: 0,
    refresh: '',
    pluginId: NOTEBOOK_PLUGIN_ID,
    panels: [
      {
        id: 1,
        type: TEXT_PANEL_PLUGIN_ID,
        title: 'Welcome',
        gridPos: { x: 0, y: 0, w: 24, h: 8 },
        options: {
          mode: 'markdown',
          content: '# Welcome to your new notebook\n\nStart adding text panels to document your analysis.',
        },
      },
    ],
  };
}
