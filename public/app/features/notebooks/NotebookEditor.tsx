import { css } from '@emotion/css';
import { useState, useEffect } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2, Text } from '@grafana/ui';

import { DashboardModel } from '../dashboard/state/DashboardModel';
import { PanelModel } from '../dashboard/state/PanelModel';
import { DashboardGrid } from '../dashboard/dashgrid/DashboardGrid';
import { AddPanelButton } from '../dashboard/components/AddPanel/AddPanelButton';

interface NotebookEditorProps {
  onSave: (dashboard: any) => void;
  dashboard?: DashboardModel;
}

export function NotebookEditor({ onSave, dashboard: initialDashboard }: NotebookEditorProps) {
  const styles = useStyles2(getStyles);
  const [dashboard, setDashboard] = useState<DashboardModel | null>(initialDashboard || null);

  useEffect(() => {
    if (!dashboard) {
      // Create a new notebook dashboard with a default markdown panel
      const newDashboard = new DashboardModel({
        title: 'New Notebook',
        type: 'notebook',
        tags: ['notebook'],
        schemaVersion: 38,
        version: 0,
        panels: [
          {
            id: 1,
            type: 'text',
            gridPos: { x: 0, y: 0, w: 24, h: 8 },
            title: 'Welcome',
            options: {
              content: '# Welcome to your notebook\n\nStart writing your markdown content here...\n\nYou can add more panels using the "Add Markdown Panel" button above.',
              mode: 'markdown',
            },
          },
        ],
      });
      setDashboard(newDashboard);
    }
  }, [dashboard]);

  const handleAddMarkdownPanel = () => {
    if (!dashboard) return;

    const panels = dashboard.panels.filter((p) => p.type !== 'row');
    const maxY = Math.max(...panels.map((p) => p.gridPos.y + p.gridPos.h), 0);

    const newPanel = new PanelModel({
      id: Math.max(...panels.map((p) => p.id), 0) + 1,
      type: 'text',
      gridPos: { x: 0, y: maxY, w: 24, h: 8 }, // Full width, one per row
      title: 'New Panel',
      options: {
        content: '# New Panel\n\nStart writing your markdown content here...',
        mode: 'markdown',
      },
    });

    dashboard.addPanel(newPanel);
    
    // Ensure all panels are full width (notebook restriction)
    enforceNotebookLayout(dashboard);
    
    setDashboard(dashboard.getSaveModelClone());
  };

  // Enforce notebook layout: one panel per row, full width
  const enforceNotebookLayout = (dash: DashboardModel) => {
    const panels = dash.panels.filter((p) => p.type !== 'row');
    
    // Sort panels by y position
    panels.sort((a, b) => a.gridPos.y - b.gridPos.y);
    
    // Ensure each panel is full width and positioned correctly
    let currentY = 0;
    panels.forEach((panel) => {
      panel.gridPos.x = 0;
      panel.gridPos.w = 24; // Full width
      panel.gridPos.y = currentY;
      currentY += panel.gridPos.h;
    });
  };

  const handleSave = () => {
    if (!dashboard) return;
    onSave(dashboard.getSaveModelClone());
  };

  if (!dashboard) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>{dashboard.title || 'New Notebook'}</h1>
          <Text variant="body" color="secondary">
            Notebooks allow one panel per row, perfect for markdown and text panels
          </Text>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      <div className={styles.addPanelSection}>
        <Button
          icon="plus"
          variant="secondary"
          size="lg"
          onClick={handleAddMarkdownPanel}
          className={styles.addButton}
        >
          Add Markdown Panel
        </Button>
      </div>

      <div className={styles.gridContainer}>
        <NotebookGrid 
          dashboard={dashboard} 
          isEditable={true}
        />
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  actions: css({
    display: 'flex',
    gap: theme.spacing(1),
  }),
  addPanelSection: css({
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  }),
  addButton: css({
    minWidth: '200px',
  }),
  gridContainer: css({
    flex: 1,
    overflow: 'auto',
  }),
});
