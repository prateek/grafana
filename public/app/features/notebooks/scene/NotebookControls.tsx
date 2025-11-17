import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { SceneComponentProps, VizPanel } from '@grafana/scenes';
import { Button, Stack, useStyles2 } from '@grafana/ui';

import { DashboardControls, DashboardControlsState } from 'app/features/dashboard-scene/scene/DashboardControls';
import { buildGridItemForPanel } from 'app/features/dashboard-scene/serialization/transformSaveModelToScene';
import { getDashboardSceneFor } from 'app/features/dashboard-scene/utils/utils';

import { TEXT_PANEL_PLUGIN_ID } from '../constants';

export class NotebookControls extends DashboardControls {
  static Component = NotebookControlsRenderer;

  public constructor(state: Partial<DashboardControlsState>) {
    super(state);
  }
}

function NotebookControlsRenderer({ model }: SceneComponentProps<NotebookControls>) {
  const dashboard = getDashboardSceneFor(model);
  const styles = useStyles2(getStyles);

  const handleAddMarkdown = () => {
    const panelModel = {
      type: TEXT_PANEL_PLUGIN_ID,
      title: t('notebooks.controls.panel-title', 'Text'),
      gridPos: { x: 0, y: 0, w: 24, h: 8 },
      options: {
        mode: 'markdown',
        content: t('notebooks.controls.panel-content', '# New Text Panel\n\nStart editing...'),
      },
    };

    const vizPanel = buildGridItemForPanel(panelModel);
    if (vizPanel.body instanceof VizPanel) {
      dashboard.addPanel(vizPanel.body);
    }
  };

  return (
    <div className={styles.controls}>
      <Stack grow={1} wrap={'wrap'}>
        <Button icon="plus" onClick={handleAddMarkdown} variant="primary">
          <Trans i18nKey="notebooks.controls.add-markdown">Add Markdown</Trans>
        </Button>
      </Stack>
      <DashboardControls.Component model={model} />
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    controls: css({
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing(1),
      padding: theme.spacing(2),
      flexDirection: 'row',
      flexWrap: 'nowrap',
      width: '100%',
    }),
  };
}
