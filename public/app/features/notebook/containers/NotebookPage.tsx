import { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { StoreState } from 'app/types/store';

import DashboardPage, { DashboardPageParams } from '../../dashboard/containers/DashboardPage';
import { DashboardPageRouteParams, DashboardPageRouteSearchParams } from '../../dashboard/containers/types';
import { initDashboard } from '../../dashboard/state/actions';
import { cleanUpDashboardAndVariables } from '../../dashboard/state/actions';

const mapStateToProps = (state: StoreState) => ({
  initPhase: state.dashboard.initPhase,
  initError: state.dashboard.initError,
  dashboard: state.dashboard.getModel(),
  navIndex: state.navIndex,
});

const mapDispatchToProps = {
  initDashboard,
  cleanUpDashboardAndVariables,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type NotebookPageParams = { slug: string; uid: string; type: string; accessToken: string };
export type Props = Omit<GrafanaRouteComponentProps<DashboardPageRouteParams, DashboardPageRouteSearchParams>, 'match'> &
  ConnectedProps<typeof connector> & { params: Partial<NotebookPageParams>; location: any };

// NotebookPage - wraps DashboardPage but adds notebook-specific behavior
// Notebooks are dashboards with:
// - Single panel per row constraint
// - Default to markdown/text panels
// - Easy markdown panel creation button
class NotebookPage extends PureComponent<Props> {
  render() {
    // For now, just pass through to DashboardPage
    // We'll add notebook-specific constraints in the dashboard model initialization
    return <DashboardPage {...this.props} params={this.props.params as any} location={this.props.location} />;
  }
}

export default connector(NotebookPage);
