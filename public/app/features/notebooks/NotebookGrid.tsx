import { DashboardGrid, Props as DashboardGridProps } from '../dashboard/dashgrid/DashboardGrid';
import { DashboardModel } from '../dashboard/state/DashboardModel';

interface NotebookGridProps extends Omit<DashboardGridProps, 'dashboard'> {
  dashboard: DashboardModel;
  onLayoutChange?: () => void;
}

// NotebookGrid wraps DashboardGrid
// Layout restrictions (one panel per row) are enforced in NotebookEditor
// when panels are added or modified
export function NotebookGrid({ dashboard, isEditable }: NotebookGridProps) {
  return <DashboardGrid dashboard={dashboard} isEditable={isEditable} />;
}
