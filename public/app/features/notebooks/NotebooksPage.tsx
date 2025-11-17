import { useCallback, useEffect, useMemo, useState } from 'react';

import { css } from '@emotion/css';
import { t } from '@grafana/i18n';
import { getBackendSrv, getConfig } from '@grafana/runtime';
import { Button, Card, FilterInput, Spinner, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardSearchHit } from 'app/features/search/types';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

const NotebooksPage = (_props: GrafanaRouteComponentProps) => {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<DashboardSearchHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canCreate = contextSrv.evaluatePermission(['dashboards:create']);

  const fetchNotebooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        type: 'dash-notebook',
      };
      if (query) {
        params.query = query;
      }
      const data = await getBackendSrv().get<DashboardSearchHit[]>('/api/search', params);
      setHits(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.notebook.errors.load', 'Failed to load notebooks'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const handle = setTimeout(fetchNotebooks, 200);
    return () => clearTimeout(handle);
  }, [fetchNotebooks]);

  const notebooksContent = useMemo(() => {
    if (loading) {
      return (
        <div className={styles.centered}>
          <Spinner inline />
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.centered}>
          <Text color="error">{error}</Text>
        </div>
      );
    }

    if (hits.length === 0) {
      return (
        <div className={styles.centered}>
          <Text>{t('dashboard.notebook.empty', 'No notebooks found')}</Text>
        </div>
      );
    }

    return (
      <div className={styles.cardGrid}>
        {hits.map((hit) => (
          <Card key={hit.uid} href={hit.url} title={hit.title} aria-label={hit.title}>
            <Card.Meta>
              <Text variant="bodySmall" color="secondary">
                {hit.folderTitle ?? t('dashboard.notebook.general-folder', 'General')}
              </Text>
            </Card.Meta>
            {hit.tags?.length > 0 && (
              <Stack gap={1} wrap>
                {hit.tags.map((tag) => (
                  <Text key={tag} variant="bodySmall" color="secondary">
                    #{tag}
                  </Text>
                ))}
              </Stack>
            )}
          </Card>
        ))}
      </div>
    );
  }, [error, hits, loading, styles.cardGrid, styles.centered]);

  return (
    <Page
      navId="notebooks/browse"
      pageNav={{
        text: t('dashboard.notebook.title', 'Notebooks'),
        subTitle: t('dashboard.notebook.subtitle', 'Create text-first experiences for storytelling and handoffs'),
      }}
      actions={
        <Button
          href={`${getConfig().appSubUrl}/notebooks/new`}
          icon="plus"
          variant="primary"
          disabled={!canCreate}
        >
          {t('dashboard.notebook.new', 'New notebook')}
        </Button>
      }
    >
      <Page.Contents>
        <FilterInput
          placeholder={t('dashboard.notebook.search-placeholder', 'Search notebooks')}
          value={query}
          onChange={setQuery}
          escapeRegex={false}
        />
        {notebooksContent}
      </Page.Contents>
    </Page>
  );
};

export default NotebooksPage;

const getStyles = () => ({
  cardGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  }),
  centered: css({
    marginTop: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
});
