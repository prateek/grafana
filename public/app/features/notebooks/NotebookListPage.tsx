import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { Button, useStyles2, Card, Stack, Text } from '@grafana/ui';

import { Page } from 'app/core/components/Page/Page';

import { notebooksApi, NotebookDTO } from './api/notebooksApi';

function NotebookListPage() {
  const styles = useStyles2(getStyles);
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState<NotebookDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    try {
      const data = await notebooksApi.getNotebooks();
      setNotebooks(data);
    } catch (error) {
      console.error('Failed to load notebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = () => {
    navigate('/dashboard/new');
  };

  return (
    <Page navId="notebooks">
      <Page.Contents>
        <div className={styles.header}>
          <Text element="h1">
            <Trans i18nKey="notebooks.list.title">Notebooks</Trans>
          </Text>
          <Button icon="plus" onClick={handleCreateNotebook}>
            <Trans i18nKey="notebooks.list.new-button">New Notebook</Trans>
          </Button>
        </div>

        {loading ? (
          <div>
            <Trans i18nKey="notebooks.list.loading">Loading...</Trans>
          </div>
        ) : notebooks.length === 0 ? (
          <div className={styles.empty}>
            <Text element="h2">
              <Trans i18nKey="notebooks.list.empty-title">No notebooks yet</Trans>
            </Text>
            <Text color="secondary">
              <Trans i18nKey="notebooks.list.empty-description">Create your first notebook to get started</Trans>
            </Text>
            <Button icon="plus" onClick={handleCreateNotebook} variant="primary">
              <Trans i18nKey="notebooks.list.create-button">Create Notebook</Trans>
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {notebooks.map((notebook) => (
              <Card key={notebook.uid} href={`/n/${notebook.uid}`} noMargin>
                <Card.Heading>{notebook.title}</Card.Heading>
                {notebook.description && <Card.Description>{notebook.description}</Card.Description>}
                <Card.Meta>
                  <Stack gap={1}>
                    {notebook.tags?.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </Stack>
                </Card.Meta>
              </Card>
            ))}
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
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
  }),
  empty: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(4),
    textAlign: 'center',
  }),
  tag: css({
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});

export default NotebookListPage;
