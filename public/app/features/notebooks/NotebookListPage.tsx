import { css } from '@emotion/css';
import { memo, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import AutoSizer from 'react-virtualized-auto-sizer';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { config, reportInteraction } from '@grafana/runtime';
import { LinkButton, FilterInput, useStyles2, Text, Stack } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useDispatch } from 'app/types/store';

import { contextSrv } from '../../core/services/context_srv';
import { useSearchStateManager } from '../search/state/SearchStateManager';
import { getSearchPlaceholder } from '../search/tempI18nPhrases';

import { BrowseActions } from '../browse-dashboards/components/BrowseActions/BrowseActions';
import { BrowseFilters } from '../browse-dashboards/components/BrowseFilters';
import { BrowseView } from '../browse-dashboards/components/BrowseView';
import { SearchView } from '../browse-dashboards/components/SearchView';
import { useHasSelection } from '../browse-dashboards/state/hooks';
import { setAllSelection } from '../browse-dashboards/state/slice';

const NotebookListPage = memo(() => {
  const dispatch = useDispatch();
  const styles = useStyles2(getStyles);
  const [searchState, stateManager] = useSearchStateManager();
  const isSearching = stateManager.hasSearchFilters();
  const location = useLocation();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    // Initialize search state for notebooks
    stateManager.initStateFromUrl(undefined);
    
    // Set tag filter to notebooks - this will filter dashboards with 'notebook' tag
    // The search API will handle filtering by tags
    stateManager.setState({ 
      tags: ['notebook'],
    });

    // Clear selected state
    dispatch(
      setAllSelection({
        isSelected: false,
        folderUID: undefined,
      })
    );
  }, [dispatch, stateManager]);

  useEffect(() => {
    // Trigger search when "starred" query param changes
    stateManager.onSetStarred(search.has('starred'));
  }, [search, stateManager]);

  useEffect(() => {
    // Clear the search results when we leave SearchView
    if (!isSearching && searchState.result) {
      stateManager.setState({ result: undefined, includePanels: undefined });
    }
    if (isSearching && searchState.result?.totalRows === 0) {
      reportInteraction('grafana_empty_state_shown', { source: 'browse_notebooks' });
    }
  }, [isSearching, searchState.result, stateManager]);

  const hasSelection = useHasSelection();

  const canCreate = contextSrv.hasPermission('dashboards:create');

  return (
    <Page navId="notebooks/browse">
      <Page.Contents>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1>Notebooks</h1>
              <Text variant="body" color="secondary">
                Create and manage notebooks with markdown panels
              </Text>
            </div>
            {canCreate && (
              <LinkButton href="/notebooks/new" icon="plus" size="lg">
                New notebook
              </LinkButton>
            )}
          </div>

          <div className={styles.toolbar}>
            <FilterInput
              placeholder={getSearchPlaceholder('notebooks')}
              value={searchState.query}
              onChange={(e) => stateManager.onQueryChange(e.currentTarget.value)}
            />
            <BrowseFilters state={searchState} stateManager={stateManager} />
            {hasSelection && <BrowseActions />}
          </div>

          <div className={styles.content}>
            <AutoSizer>
              {({ width, height }) => {
                if (isSearching) {
                  return (
                    <SearchView
                      width={width}
                      height={height}
                      searchState={searchState}
                      stateManager={stateManager}
                    />
                  );
                }

                return (
                  <BrowseView
                    width={width}
                    height={height}
                    searchState={searchState}
                    stateManager={stateManager}
                  />
                );
              }}
            </AutoSizer>
          </div>
        </div>
      </Page.Contents>
    </Page>
  );
});

NotebookListPage.displayName = 'NotebookListPage';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  }),
  toolbar: css({
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  }),
  content: css({
    flex: 1,
    minHeight: 0,
  }),
});

export default NotebookListPage;
