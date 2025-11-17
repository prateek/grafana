import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import { Responsive as ResponsiveReactGridLayout } from 'react-grid-layout';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';
import { PanelModel } from 'app/features/dashboard/state/PanelModel';
import { DashboardPanel } from 'app/features/dashboard/dashgrid/DashboardPanel';

interface Props {
  dashboard: DashboardModel;
  isEditable: boolean;
}

export const NotebookGrid = ({ dashboard, isEditable }: Props) => {
  const styles = useStyles2(getStyles);
  const [panels, setPanels] = useState<PanelModel[]>([]);

  useEffect(() => {
    // Ensure all panels are in their own row (one panel per row constraint)
    const adjustedPanels = dashboard.panels.map((panel, index) => {
      // Calculate Y position based on previous panels
      let yPos = 0;
      for (let i = 0; i < index; i++) {
        yPos += dashboard.panels[i].gridPos.h;
      }

      // Enforce: x=0, w=24 (full width), each panel in its own row
      if (panel.gridPos.x !== 0 || panel.gridPos.w !== 24 || panel.gridPos.y !== yPos) {
        panel.updateGridPos({ x: 0, y: yPos, w: 24, h: panel.gridPos.h });
      }

      return panel;
    });

    setPanels(adjustedPanels);
  }, [dashboard, dashboard.panels]);

  // Build layout for react-grid-layout
  const layouts = {
    lg: panels.map((panel) => ({
      i: panel.id.toString(),
      x: panel.gridPos.x,
      y: panel.gridPos.y,
      w: panel.gridPos.w,
      h: panel.gridPos.h,
      isDraggable: false, // Disable dragging in notebooks
      isResizable: isEditable,
    })),
  };

  const onLayoutChange = (newLayout: any[]) => {
    if (!isEditable) {
      return;
    }

    // Only allow vertical resizing, maintain single-panel-per-row constraint
    newLayout.forEach((layoutItem) => {
      const panel = panels.find((p) => p.id.toString() === layoutItem.i);
      if (panel) {
        // Only update height, force x=0 and w=24
        panel.updateGridPos({
          x: 0,
          y: layoutItem.y,
          w: 24,
          h: layoutItem.h,
        });
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {panels.map((panel) => (
          <div key={panel.id} className={styles.panelWrapper}>
            <DashboardPanel
              panel={panel}
              dashboard={dashboard}
              isEditing={false}
              isViewing={false}
              lazy={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: '100%',
    height: '100%',
    overflow: 'auto',
  }),
  inner: css({
    maxWidth: '1400px',
    margin: '0 auto',
    padding: theme.spacing(2),
  }),
  panelWrapper: css({
    marginBottom: theme.spacing(2),
    width: '100%',
    // Ensure each panel takes full width
    '& > div': {
      width: '100% !important',
    },
  }),
});
