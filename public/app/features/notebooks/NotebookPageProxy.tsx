import { useParams } from 'react-router-dom-v5-compat';
import { useAsync } from 'react-use';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import DashboardScenePage from 'app/features/dashboard-scene/pages/DashboardScenePage';
import { getDashboardScenePageStateManager } from 'app/features/dashboard-scene/pages/DashboardScenePageStateManager';
import { DashboardRoutes } from 'app/types/dashboard';

import { DashboardPageError } from '../dashboard/containers/DashboardPageError';
import { DashboardPageRouteParams, DashboardPageRouteSearchParams } from '../dashboard/containers/types';

export type NotebookPageProxyProps = Omit<
  GrafanaRouteComponentProps<DashboardPageRouteParams, DashboardPageRouteSearchParams>,
  'match'
>;

function NotebookPageProxy(props: NotebookPageProxyProps) {
  const params = useParams<{ uid?: string; slug?: string }>();
  const stateManager = getDashboardScenePageStateManager();

  const dashboard = useAsync(async () => {
    return stateManager.fetchDashboard({
      route: DashboardRoutes.Normal,
      uid: params.uid ?? '',
      slug: params.slug,
    });
  }, [params.uid]);

  if (dashboard.error) {
    return <DashboardPageError error={dashboard.error} />;
  }

  if (dashboard.loading) {
    return null;
  }

  return <DashboardScenePage {...props} />;
}

export default NotebookPageProxy;
