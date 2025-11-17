import { useLocation, useParams } from 'react-router-dom-v5-compat';
import { useAsync } from 'react-use';

import { config } from '@grafana/runtime';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import DashboardScenePage from 'app/features/dashboard-scene/pages/DashboardScenePage';
import { getDashboardScenePageStateManager } from 'app/features/dashboard-scene/pages/DashboardScenePageStateManager';
import { DashboardRoutes } from 'app/types/dashboard';

import { isDashboardV2Resource } from '../../dashboard/api/utils';

import NotebookPage, { NotebookPageParams } from './NotebookPage';
import { DashboardPageError } from '../../dashboard/containers/DashboardPageError';
import { DashboardPageRouteParams, DashboardPageRouteSearchParams } from '../../dashboard/containers/types';

export type NotebookPageProxyProps = Omit<
  GrafanaRouteComponentProps<DashboardPageRouteParams, DashboardPageRouteSearchParams>,
  'match'
>;

// NotebookPageProxy - similar to DashboardPageProxy but for notebooks
// Notebooks are dashboards with constraints (single panel per row, default markdown panels)
function NotebookPageProxy(props: NotebookPageProxyProps) {
  const forceScenes = props.queryParams.scenes === true;
  const forceOld = props.queryParams.scenes === false;
  const params = useParams<NotebookPageParams>();
  const location = useLocation();
  const stateManager = getDashboardScenePageStateManager();

  if (forceScenes || (config.featureToggles.dashboardScene && !forceOld)) {
    // For now, use DashboardScenePage - we can create NotebookScenePage later if needed
    return <DashboardScenePage {...props} />;
  }

  const isScenesSupportedRoute = Boolean(
    props.route.routeName === DashboardRoutes.Home ||
      props.route.routeName === DashboardRoutes.Template ||
      (props.route.routeName === DashboardRoutes.Normal && params.uid)
  );

  // Pre-fetch dashboard/notebook
  const dashboard = useAsync(async () => {
    if (params.type === 'snapshot') {
      return null;
    }

    return stateManager.fetchDashboard({
      route: props.route.routeName as DashboardRoutes,
      uid: params.uid ?? '',
      type: params.type,
      slug: params.slug,
    });
  }, [params.uid, props.route.routeName]);

  if (dashboard.error) {
    return <DashboardPageError error={dashboard.error} />;
  }

  if (dashboard.loading) {
    return null;
  }

  const uid =
    dashboard.value && isDashboardV2Resource(dashboard.value)
      ? dashboard.value.metadata.name
      : dashboard.value?.meta.uid;
  const canEdit =
    dashboard.value && isDashboardV2Resource(dashboard.value)
      ? dashboard.value?.access.canEdit
      : dashboard.value?.meta?.canEdit || dashboard.value?.meta?.canMakeEditable;
  const isNew = !uid;

  if (uid !== params.uid && !isNew) {
    return null;
  }

  if (!config.featureToggles.dashboardSceneForViewers) {
    return <NotebookPage {...props} params={params} location={location} />;
  }

  if (!canEdit && isScenesSupportedRoute && !forceOld) {
    return <DashboardScenePage {...props} />;
  } else {
    return <NotebookPage {...props} params={params} location={location} />;
  }
}

export default NotebookPageProxy;
