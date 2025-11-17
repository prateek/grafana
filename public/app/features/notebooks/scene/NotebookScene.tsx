import { SceneTimeRange } from '@grafana/scenes';

import { DashboardScene, DashboardSceneState } from 'app/features/dashboard-scene/scene/DashboardScene';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import { NOTEBOOK_PLUGIN_ID } from '../constants';

export interface NotebookSceneState extends DashboardSceneState {
  pluginId: string;
}

export class NotebookScene extends DashboardScene {
  public constructor(state: Partial<NotebookSceneState>) {
    super(
      {
        title: 'Notebook',
        meta: { ...state.meta, pluginId: NOTEBOOK_PLUGIN_ID },
        editable: true,
        $timeRange: state.$timeRange ?? new SceneTimeRange({}),
        body: state.body ?? DefaultGridLayoutManager.fromVizPanels([]),
        links: state.links ?? [],
        ...state,
      },
      'v1'
    );
  }
}
