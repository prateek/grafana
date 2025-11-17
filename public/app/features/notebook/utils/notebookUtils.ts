import { DashboardDTO } from 'app/types/dashboard';
import { buildNewDashboardSaveModel } from 'app/features/dashboard-scene/serialization/buildNewDashboardSaveModel';

/**
 * Builds a new notebook save model - similar to buildNewDashboardSaveModel but adds the "notebook" tag
 */
export async function buildNewNotebookSaveModel(urlFolderUid?: string): Promise<DashboardDTO> {
  const dashboardDTO = await buildNewDashboardSaveModel(urlFolderUid);
  
  // Add notebook tag
  if (!dashboardDTO.dashboard.tags) {
    dashboardDTO.dashboard.tags = [];
  }
  
  if (!dashboardDTO.dashboard.tags.includes('notebook')) {
    dashboardDTO.dashboard.tags.push('notebook');
  }
  
  // Set title to "New notebook"
  dashboardDTO.dashboard.title = 'New notebook';
  
  return dashboardDTO;
}

/**
 * Checks if a dashboard is a notebook based on its tags
 */
export function isNotebook(dashboard: { tags?: string[] }): boolean {
  return dashboard.tags?.includes('notebook') ?? false;
}
