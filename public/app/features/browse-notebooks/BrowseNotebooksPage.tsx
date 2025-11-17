import { css } from '@emotion/css';
import { memo, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom-v5-compat';
import AutoSizer from 'react-virtualized-auto-sizer';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { config, reportInteraction } from '@grafana/runtime';
import { LinkButton, FilterInput, useStyles2, Text, Stack } from '@grafana/ui';
import { useGetFolderQueryFacade, useUpdateFolder } from 'app/api/clients/folder/v1beta1/hooks';
import { Page } from 'app/core/components/Page/Page';
import { getConfig } from 'app/core/config';
import { useDispatch } from 'app/types/store';

import { FolderRepo } from '../../core/components/NestedFolderPicker/FolderRepo';
import { contextSrv } from '../../core/services/context_srv';
import { ManagerKind } from '../apiserver/types';
import { buildNavModel, getDashboardsTabID } from '../folders/state/navModel';
import { ProvisionedFolderPreviewBanner } from '../provisioning/components/Folders/ProvisionedFolderPreviewBanner';
import { useGetResourceRepositoryView } from '../provisioning/hooks/useGetResourceRepositoryView';
import { useSearchStateManager } from '../search/state/SearchStateManager';
import { getSearchPlaceholder } from '../search/tempI18nPhrases';

import { BrowseActions } from '../browse-dashboards/components/BrowseActions/BrowseActions';
import { BrowseFilters } from '../browse-dashboards/components/BrowseFilters';
import { BrowseView } from '../browse-dashboards/components/BrowseView';
import CreateNewButton from '../browse-dashboards/components/CreateNewButton';
import { FolderActionsButton } from '../browse-dashboards/components/FolderActionsButton';
import { SearchView } from '../browse-dashboards/components/SearchView';
import { getFolderPermissions } from '../browse-dashboards/permissions';
import { useHasSelection } from '../browse-dashboards/state/hooks';
import { setAllSelection } from '../browse-dashboards/state/slice';

// Browse Notebooks page - similar to BrowseDashboardsPage but filters for notebooks
const BrowseNotebooksPage = memo(({ queryParams }: { queryParams: Record<string, string> }) => {
  const { uid: folderUID } = useParams();
  const dispatch = useDispatch();

  const styles = useStyles2(getStyles);
  const [searchState, stateManager] = useSearchStateManager();
  const isSearching = stateManager.hasSearchFilters();
  const location = useLocation();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const { isReadOnlyRepo, repoType } = useGetResourceRepositoryView({ folderName: folderUID });

  useEffect(() => {
    // Initialize with notebook tag filter
    stateManager.initStateFromUrl(folderUID, false);
    // Filter for notebooks by adding tag filter
    stateManager.onTagFilterChange(['notebook']);
  }, [dispatch, folderUID, stateManager]);

  // Trigger search when "starred" query param changes
  useEffect(() => {
    stateManager.onSetStarred(search.has('starred'));
  }, [search, stateManager]);

  useEffect(() => {
    // Clear the search results when we leave SearchView to prevent old results flashing
    if (!isSearching && searchState.result) {
      stateManager.setState({ result: undefined, includePanels: undefined });
    }
    if (isSearching && searchState.result?.totalRows === 0) {
      reportInteraction('grafana_empty_state_shown', { source: 'browse_notebooks' });
    }
  }, [isSearching, searchState.result, stateManager]);

  const { data: folderDTO } = useGetFolderQueryFacade(folderUID);
  const [saveFolder] = useUpdateFolder();
  const navModel = useMemo(() => {
    if (!folderDTO) {
      return undefined;
    }
    const model = buildNavModel(folderDTO);
    return model;
  }, [folderDTO]);

  const hasSelection = useHasSelection();

  // Fetch the root (aka general) folder if we're not in a specific folder
  const { data: rootFolderDTO } = useGetFolderQueryFacade(folderDTO ? undefined : 'general');
  const folder = folderDTO ?? rootFolderDTO;

  const {
    canEditFolders,
    canDeleteFolders,
    canDeleteDashboards,
    canEditDashboards,
    canCreateDashboards,
    canCreateFolders,
  } = getFolderPermissions(folder);
  const hasAdminRights = contextSrv.hasRole('Admin') || contextSrv.isGrafanaAdmin;
  const isProvisionedFolder = folder?.managedBy === ManagerKind.Repo;
  const showEditTitle = canEditFolders && folderUID && !isProvisionedFolder;
  const permissions = {
    canEditFolders,
    canEditDashboards,
    canDeleteFolders,
    canDeleteDashboards,
    isReadOnlyRepo,
  };

  const renderTitle = (title: string) => {
    return (
      <Stack alignItems={'center'} gap={2}>
        <Text element={'h1'}>{title}</Text> <FolderRepo folder={folder} />
      </Stack>
    );
  };

  return (
    <Page
      navId="notebooks/browse"
      pageNav={navModel}
      renderTitle={renderTitle}
      actions={
        <>
          {folderDTO && <FolderActionsButton folder={folderDTO} repoType={repoType} isReadOnlyRepo={isReadOnlyRepo} />}
          {canCreateDashboards && (
            <LinkButton variant="primary" href={getConfig().appSubUrl + '/notebooks/new'}>
              <Trans i18nKey="browse-notebooks.actions.new-notebook">New notebook</Trans>
            </LinkButton>
          )}
        </>
      }
    >
      <Page.Contents className={styles.pageContents}>
        <ProvisionedFolderPreviewBanner queryParams={queryParams} />
        <div>
          <FilterInput
            placeholder={getSearchPlaceholder(searchState.includePanels)}
            value={searchState.query}
            escapeRegex={false}
            onChange={(e) => stateManager.onQueryChange(e)}
          />
        </div>

        {hasSelection ? (
          <BrowseActions folderDTO={folderDTO} />
        ) : (
          <div className={styles.filters}>
            <BrowseFilters />
          </div>
        )}

        <div className={styles.subView}>
          <AutoSizer>
            {({ width, height }) =>
              isSearching ? (
                <SearchView
                  permissions={permissions}
                  width={width}
                  height={height}
                  searchState={searchState}
                  searchStateManager={stateManager}
                />
              ) : (
                <BrowseView
                  permissions={permissions}
                  width={width}
                  height={height}
                  folderUID={folderUID}
                  isReadOnlyRepo={isReadOnlyRepo}
                />
              )
            }
          </AutoSizer>
        </div>
      </Page.Contents>
    </Page>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  pageContents: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    height: '100%',
  }),

  subView: css({
    height: '100%',
  }),

  filters: css({
    display: 'none',

    [theme.breakpoints.up('md')]: {
      display: 'block',
    },
  }),
});

BrowseNotebooksPage.displayName = 'BrowseNotebooksPage';
export default BrowseNotebooksPage;
