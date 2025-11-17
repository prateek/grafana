import { useParams, useLocation } from 'react-router-dom-v5-compat';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { NotebookPage, NotebookPageParams } from './NotebookPage';

export interface NotebookPageProxyProps
  extends Omit<GrafanaRouteComponentProps<NotebookPageParams>, 'match'> {}

// Proxy component to handle notebook-specific routing
function NotebookPageProxy(props: NotebookPageProxyProps) {
  const params = useParams<NotebookPageParams>();
  const location = useLocation();

  return <NotebookPage {...props} params={params} location={location} />;
}

export default NotebookPageProxy;
