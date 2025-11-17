import { css } from '@emotion/css';
import { useState, useEffect } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2, Card, LinkButton } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';

interface Notebook {
  uid: string;
  title: string;
  url: string;
  folderTitle?: string;
  updated?: string;
}

export const NotebooksList = () => {
  const styles = useStyles2(getStyles);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    try {
      // Search for dashboards with a notebook tag or metadata
      const response = await getBackendSrv().search({
        type: 'dash-db',
        tag: ['notebook'],
        limit: 100,
      });

      const notebookList = response.map((item: any) => ({
        uid: item.uid,
        title: item.title,
        url: `/n/${item.uid}/${item.slug || item.title}`,
        folderTitle: item.folderTitle,
        updated: item.updated,
      }));

      setNotebooks(notebookList);
    } catch (error) {
      console.error('Error loading notebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading notebooks...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Notebooks</h1>
        <LinkButton href="/notebooks/new" icon="plus">
          New notebook
        </LinkButton>
      </div>

      {notebooks.length === 0 && (
        <Card className={styles.emptyState}>
          <Card.Heading>No notebooks yet</Card.Heading>
          <Card.Description>
            Notebooks let you document your findings with a combination of text, visualizations, and data. Each panel
            is displayed in its own row for a clean, narrative layout.
          </Card.Description>
          <Card.Actions>
            <LinkButton href="/notebooks/new" icon="plus" variant="primary">
              Create your first notebook
            </LinkButton>
          </Card.Actions>
        </Card>
      )}

      <div className={styles.grid}>
        {notebooks.map((notebook) => (
          <Card key={notebook.uid} href={notebook.url} className={styles.card}>
            <Card.Heading>{notebook.title}</Card.Heading>
            {notebook.folderTitle && <Card.Meta>{notebook.folderTitle}</Card.Meta>}
            {notebook.updated && (
              <Card.Meta>
                Updated {new Date(notebook.updated).toLocaleDateString()}
              </Card.Meta>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    padding: theme.spacing(2),
    maxWidth: '1200px',
    margin: '0 auto',
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  }),
  card: css({
    cursor: 'pointer',
    '&:hover': {
      boxShadow: theme.shadows.z3,
    },
  }),
  emptyState: css({
    maxWidth: '600px',
    margin: '0 auto',
    marginTop: theme.spacing(8),
    textAlign: 'center',
  }),
});
