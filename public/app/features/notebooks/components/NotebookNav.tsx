import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2, ToolbarButton } from '@grafana/ui';
import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';

interface Props {
  dashboard: DashboardModel;
  title: string;
  folderTitle?: string;
  isFullscreen: boolean;
  onAddPanel: () => void;
}

export const NotebookNav = ({ dashboard, title, folderTitle, isFullscreen, onAddPanel }: Props) => {
  const styles = useStyles2(getStyles);

  if (isFullscreen) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
        {folderTitle && <span className={styles.folder}>{folderTitle}</span>}
      </div>
      <div className={styles.actions}>
        <Button
          icon="plus"
          onClick={onAddPanel}
          variant="primary"
          size="md"
          tooltip="Add a new text panel to your notebook"
        >
          Add text panel
        </Button>
        {dashboard.meta.canSave && (
          <ToolbarButton icon="save" onClick={() => dashboard.saveModel()} tooltip="Save notebook">
            Save
          </ToolbarButton>
        )}
        {dashboard.meta.canShare && (
          <ToolbarButton icon="share-alt" onClick={() => {}} tooltip="Share notebook">
            Share
          </ToolbarButton>
        )}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    backgroundColor: theme.colors.background.primary,
  }),
  titleSection: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  }),
  title: css({
    margin: 0,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
  }),
  folder: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  actions: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
});
