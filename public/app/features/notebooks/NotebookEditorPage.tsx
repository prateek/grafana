import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { getBackendSrv } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { NotebookEditor } from './NotebookEditor';

export default function NotebookEditorPage(props: GrafanaRouteComponentProps) {
  const navigate = useNavigate();

  const handleSave = async (dashboard: any) => {
    try {
      // Mark as notebook type
      dashboard.type = 'notebook';
      
      const result = await getBackendSrv().post('/api/notebooks/db', {
        dashboard,
        overwrite: false,
      });

      if (result.uid) {
        navigate(`/notebooks/${result.uid}`);
      }
    } catch (error) {
      console.error('Failed to save notebook:', error);
    }
  };

  return (
    <Page navId="notebooks/browse">
      <Page.Contents>
        <NotebookEditor onSave={handleSave} />
      </Page.Contents>
    </Page>
  );
}
