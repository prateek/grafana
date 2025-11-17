import { css } from '@emotion/css';
import { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { GrafanaTheme2, NavModel, NavModelItem, PageLayoutType } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Themeable2, withTheme2 } from '@grafana/ui';
import { notifyApp } from 'app/core/actions';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaContext, GrafanaContextType } from 'app/core/context/GrafanaContext';
import { getNavModel } from 'app/core/selectors/navModel';
import { DashboardLoading } from 'app/features/dashboard/components/DashboardLoading/DashboardLoading';
import { DashboardPrompt } from 'app/features/dashboard/components/DashboardPrompt/DashboardPrompt';
import { DashboardSettings } from 'app/features/dashboard/components/DashboardSettings/DashboardSettings';
import { PanelInspector } from 'app/features/dashboard/components/Inspector/PanelInspector';
import { PanelEditor } from 'app/features/dashboard/components/PanelEditor/PanelEditor';
import { ShareModal } from 'app/features/dashboard/components/ShareModal/ShareModal';
import { SubMenu } from 'app/features/dashboard/components/SubMenu/SubMenu';
import { cleanUpDashboardAndVariables } from 'app/features/dashboard/state/actions';
import { initDashboard } from 'app/features/dashboard/state/initDashboard';
import { PanelModel } from 'app/features/dashboard/state/PanelModel';
import { cancelVariables, templateVarsChangedInUrl } from 'app/features/variables/state/actions';
import { DashboardInitPhase, DashboardRoutes } from 'app/types/dashboard';
import { StoreState } from 'app/types/store';

import { NotebookNav } from './components/NotebookNav';
import { NotebookGrid } from './components/NotebookGrid';
import { DashboardPageRouteParams, DashboardPageRouteSearchParams } from '../dashboard/containers/types';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { getKioskMode } from 'app/core/navigation/kiosk';
import { KioskMode } from 'app/types/dashboard';
import { ScrollRefElement } from 'app/core/components/NativeScrollbar';
import { DashboardPageError } from '../dashboard/containers/DashboardPageError';
import { createErrorNotification } from 'app/core/copy/appNotification';
import { locationService } from '@grafana/runtime';
import { findTemplateVarChanges } from 'app/features/variables/utils';

export const mapStateToProps = (state: StoreState) => ({
  initPhase: state.dashboard.initPhase,
  initError: state.dashboard.initError,
  dashboard: state.dashboard.getModel(),
  navIndex: state.navIndex,
});

const mapDispatchToProps = {
  initDashboard,
  cleanUpDashboardAndVariables,
  notifyApp,
  cancelVariables,
  templateVarsChangedInUrl,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type NotebookPageParams = { slug: string; uid: string; type: string; accessToken: string };
export type Props = Themeable2 &
  Omit<GrafanaRouteComponentProps<DashboardPageRouteParams, DashboardPageRouteSearchParams>, 'match'> &
  ConnectedProps<typeof connector> & { params: Partial<NotebookPageParams> };

export interface State {
  editPanel: PanelModel | null;
  viewPanel: PanelModel | null;
  editView: string | null;
  updateScrollTop?: number;
  rememberScrollTop?: number;
  showLoadingState: boolean;
  panelNotFound: boolean;
  editPanelAccessDenied: boolean;
  scrollElement?: ScrollRefElement;
  pageNav?: NavModelItem;
  sectionNav?: NavModel;
}

export class NotebookPage extends PureComponent<Props, State> {
  static contextType = GrafanaContext;
  context!: GrafanaContextType;

  state: State = {
    editPanel: null,
    viewPanel: null,
    editView: null,
    showLoadingState: false,
    panelNotFound: false,
    editPanelAccessDenied: false,
  };

  async componentDidMount() {
    const { params, route } = this.props;

    // For new notebooks, we'll use a special URL pattern
    const isNew = !params.uid || params.uid === 'new';

    if (isNew) {
      // Initialize a new notebook with default content
      await this.props.initDashboard({
        urlSlug: undefined,
        urlUid: undefined,
        urlType: undefined,
        urlAccessToken: params.accessToken,
        routeName: DashboardRoutes.New,
        fixUrl: false,
      });

      // After initialization, ensure it has the notebook tag
      const { dashboard } = this.props;
      if (dashboard && !dashboard.tags?.includes('notebook')) {
        dashboard.tags = [...(dashboard.tags || []), 'notebook'];
        // Add a default text panel if empty
        if (dashboard.panels.length === 0) {
          dashboard.addPanel({
            type: 'text',
            title: 'Welcome to your notebook',
            gridPos: { x: 0, y: 0, w: 24, h: 8 },
            options: {
              mode: 'markdown',
              content: `# Welcome to your notebook\n\nStart documenting your findings here.`,
            },
          });
        }
      }
    } else {
      // Load existing notebook
      await this.props.initDashboard({
        urlSlug: params.slug,
        urlUid: params.uid,
        urlType: params.type,
        urlAccessToken: params.accessToken,
        routeName: route.routeName || DashboardRoutes.Normal,
        fixUrl: true,
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { dashboard, params, location } = this.props;

    if (!dashboard) {
      return;
    }

    // Check if we need to update due to URL param changes
    if (prevProps.params.uid !== params.uid) {
      this.componentDidMount();
    }

    // Handle variable changes from URL
    if (prevProps.location?.search !== location?.search) {
      const prevUrlParams = prevProps.location?.search;
      const urlParams = location?.search;

      if (urlParams && prevUrlParams) {
        const templateVarChanges = findTemplateVarChanges(dashboard.getVariablesFromState(), prevUrlParams, urlParams);
        if (templateVarChanges) {
          this.props.templateVarsChangedInUrl(templateVarChanges);
        }
      }
    }
  }

  componentWillUnmount() {
    this.props.cleanUpDashboardAndVariables();
    this.setPanelFullscreenClass(false);
  }

  setPanelFullscreenClass(isFullscreen: boolean) {
    document.body.classList.toggle('panel-in-fullscreen', isFullscreen);
  }

  onAddPanel = () => {
    const { dashboard } = this.props;

    if (!dashboard) {
      return;
    }

    // For notebooks, always add text/markdown panels
    const panelPlugin = 'text';
    
    // Find the last row to add after it
    const panels = dashboard.panels || [];
    let maxY = 0;
    panels.forEach((panel) => {
      const panelBottom = panel.gridPos.y + panel.gridPos.h;
      if (panelBottom > maxY) {
        maxY = panelBottom;
      }
    });

    const newPanel = {
      type: panelPlugin,
      title: 'New text panel',
      gridPos: { x: 0, y: maxY, w: 24, h: 8 },
    };

    dashboard.addPanel(newPanel);
    this.setState({
      editPanel: dashboard.panels[dashboard.panels.length - 1],
    });
  };

  onEditPanel = (panel: PanelModel) => {
    this.setState({ editPanel: panel });
  };

  onCloseEditPanel = () => {
    this.setState({ editPanel: null });
  };

  render() {
    const { dashboard, initError, initPhase, theme } = this.props;
    const { editPanel, viewPanel } = this.state;

    if (!dashboard || !dashboard.meta) {
      return <DashboardLoading initPhase={initPhase} />;
    }

    const kioskMode = getKioskMode(this.props.queryParams);
    const isFullscreen = kioskMode === KioskMode.Full;

    const styles = {
      wrapper: css({
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }),
    };

    return (
      <>
        <Page
          navId="notebooks"
          pageNav={this.state.pageNav}
          layout={PageLayoutType.Canvas}
          data-testid={selectors.pages.Dashboard.url(dashboard.uid)}
        >
          <NotebookNav
            dashboard={dashboard}
            title={dashboard.title}
            folderTitle={dashboard.meta.folderTitle}
            isFullscreen={isFullscreen}
            onAddPanel={this.onAddPanel}
          />
          {!editPanel && (
            <>
              {dashboard.panels.length === 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    padding: theme.spacing(4),
                  }}
                >
                  <h2>Empty notebook</h2>
                  <p>Start by adding a text panel to document your findings</p>
                </div>
              )}
              <NotebookGrid dashboard={dashboard} isEditable={dashboard.meta.canEdit ?? false} />
            </>
          )}
        </Page>

        {editPanel && (
          <PanelEditor
            dashboard={dashboard}
            sourcePanel={editPanel}
            onClose={this.onCloseEditPanel}
          />
        )}

        <DashboardPrompt dashboard={dashboard} />
      </>
    );
  }
}

export default withTheme2(connector(NotebookPage));
