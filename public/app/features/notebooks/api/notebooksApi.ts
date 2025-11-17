import { getBackendSrv } from '@grafana/runtime';
import { DashboardDTO } from 'app/types/dashboard';

export interface NotebookDTO extends DashboardDTO {
  pluginId: string;
}

export class NotebooksAPI {
  async getNotebooks(): Promise<NotebookDTO[]> {
    return getBackendSrv().get('/api/notebooks');
  }

  async getNotebook(uid: string): Promise<NotebookDTO> {
    return getBackendSrv().get(`/api/notebooks/uid/${uid}`);
  }

  async createNotebook(notebook: Partial<NotebookDTO>): Promise<NotebookDTO> {
    return getBackendSrv().post('/api/notebooks', notebook);
  }

  async updateNotebook(uid: string, notebook: Partial<NotebookDTO>): Promise<NotebookDTO> {
    return getBackendSrv().put(`/api/notebooks/uid/${uid}`, notebook);
  }

  async deleteNotebook(uid: string): Promise<void> {
    return getBackendSrv().delete(`/api/notebooks/uid/${uid}`);
  }
}

export const notebooksApi = new NotebooksAPI();
