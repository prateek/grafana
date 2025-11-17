import { t } from '@grafana/i18n';
import { Dashboard } from '@grafana/schema';

import { NOTEBOOK_PLUGIN_ID, TEXT_PANEL_PLUGIN_ID } from '../constants';

export function buildNewNotebookSaveModel(): Dashboard {
  return {
    title: t('notebooks.new.title', 'New Notebook'),
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
        title: t('notebooks.new.welcome-title', 'Welcome'),
        gridPos: { x: 0, y: 0, w: 24, h: 8 },
        options: {
          mode: 'markdown',
          content: t(
            'notebooks.new.welcome-content',
            '# Welcome to your new notebook\n\nStart adding text panels to document your analysis.'
          ),
        },
      },
    ],
  };
}
