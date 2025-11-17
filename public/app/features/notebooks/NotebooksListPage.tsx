import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { NotebooksList } from './components/NotebooksList';

export interface NotebooksListPageRouteParams {}

export interface NotebooksListPageProps extends GrafanaRouteComponentProps<NotebooksListPageRouteParams> {}

export default function NotebooksListPage(props: NotebooksListPageProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Notebooks - Grafana';
  }, []);

  return (
    <Page navId="notebooks">
      <Page.Contents>
        <NotebooksList />
      </Page.Contents>
    </Page>
  );
}
