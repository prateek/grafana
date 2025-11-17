import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { DashboardPage } from 'app/features/dashboard/containers/DashboardPage';

// NotebookPage wraps DashboardPage
// Notebooks are dashboards with type='notebook' tag
// The dashboard page will load them normally, and restrictions are enforced in the editor
export default function NotebookPage(props: GrafanaRouteComponentProps) {
  // Use DashboardPage - it will load the notebook via /api/notebooks/uid/:uid
  // which validates it's a notebook and returns it as a dashboard
  return <DashboardPage {...props} />;
}
