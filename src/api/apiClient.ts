import { v4 as uuid } from 'uuid';

import * as Sentry from '@sentry/react';
import mixpanel from 'mixpanel-browser';
import { ConnectionConfiguration } from '../../quadratic-api/src/routes/connections/types/Base'; // TODO: fix this path
import { downloadFileInBrowser } from '../helpers/downloadFileInBrowser';
import { generateKeyBetween } from '../utils/fractionalIndexing';
import { fetchFromApi } from './fetchFromApi';
import { ApiSchemas, ApiTypes } from './types';

const DEFAULT_FILE: any = {
  sheets: [
    {
      name: 'Sheet 1',
      id: { id: uuid() },
      order: generateKeyBetween(null, null),
      cells: [],
      code_cells: [],
      formats: [],
      columns: [],
      rows: [],
      offsets: [[], []],
      borders: {},
    },
  ],
  // TODO(ddimaria): make this dynamic
  version: '1.4',
};

export const apiClient = {
  async getFiles() {
    return fetchFromApi<ApiTypes['/v0/files.GET.response']>(
      `/v0/files`,
      { method: 'GET' },
      ApiSchemas['/v0/files.GET.response']
    );
  },

  async getFile(uuid: string) {
    return fetchFromApi<ApiTypes['/v0/files/:uuid.GET.response']>(
      `/v0/files/${uuid}`,
      { method: 'GET' },
      ApiSchemas['/v0/files/:uuid.GET.response']
    );
  },

  async createFile(
    body: ApiTypes['/v0/files.POST.request'] = {
      name: 'Untitled',
      contents: JSON.stringify(DEFAULT_FILE),
      version: DEFAULT_FILE.version,
    }
  ) {
    return fetchFromApi<ApiTypes['/v0/files.POST.response']>(
      `/v0/files/`,
      { method: 'POST', body: JSON.stringify(body) },
      ApiSchemas['/v0/files.POST.response']
    );
  },

  async downloadFile(uuid: string) {
    mixpanel.track('[Files].downloadFile', { id: uuid });
    return this.getFile(uuid).then((json) => downloadFileInBrowser(json.file.name, json.file.contents));
  },

  async deleteFile(uuid: string) {
    mixpanel.track('[Files].deleteFile', { id: uuid });
    return fetchFromApi<ApiTypes['/v0/files/:uuid.DELETE.response']>(
      `/v0/files/${uuid}`,
      { method: 'DELETE' },
      ApiSchemas['/v0/files/:uuid.DELETE.response']
    );
  },

  async updateFile(uuid: string, body: ApiTypes['/v0/files/:uuid.POST.request']) {
    return fetchFromApi<ApiTypes['/v0/files/:uuid.POST.response']>(
      `/v0/files/${uuid}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      ApiSchemas['/v0/files/:uuid.POST.response']
    );
  },

  async getFileSharing(uuid: string) {
    return fetchFromApi<ApiTypes['/v0/files/:uuid/sharing.GET.response']>(
      `/v0/files/${uuid}/sharing`,
      {
        method: 'GET',
      },
      ApiSchemas['/v0/files/:uuid/sharing.GET.response']
    );
  },
  async updateFileSharing(uuid: string, body: ApiTypes['/v0/files/:uuid/sharing.POST.request']) {
    return fetchFromApi<ApiTypes['/v0/files/:uuid/sharing.POST.response']>(
      `/v0/files/${uuid}/sharing`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      ApiSchemas['/v0/files/:uuid/sharing.POST.response']
    );
  },

  async postFeedback(body: ApiTypes['/v0/feedback.POST.request']) {
    return fetchFromApi<ApiTypes['/v0/feedback.POST.response']>(
      `/v0/feedback`,
      { method: 'POST', body: JSON.stringify(body) },
      ApiSchemas['/v0/feedback.POST.response']
    );
  },

  async getSupportedConnections() {
    return fetchFromApi(
      `/v0/connections/supported`,
      { method: 'GET' },
      ApiSchemas['/v0/connections/supported.GET.response']
    ) as Promise<ConnectionConfiguration[]>;
  },

  async createConnection(body: ApiTypes['/v0/connections.POST.request']) {
    return fetchFromApi(
      `/v0/connections`,
      { method: 'POST', body: JSON.stringify(body) },
      ApiSchemas['/v0/connections.POST.response']
    );
  },

  async runConnection(uuid: string, body: ApiTypes['/v0/connections/:uuid/run.POST.request']) {
    return fetchFromApi(
      `/v0/connections/${uuid}/run`,
      { method: 'POST', body: JSON.stringify(body) },
      ApiSchemas['/v0/connections.POST.response']
    );
  },

  getApiUrl() {
    const url = process.env.REACT_APP_QUADRATIC_API_URL;
    if (!url) {
      const message = 'REACT_APP_QUADRATIC_API_URL env variable is not set.';
      Sentry.captureEvent({
        message,
        level: 'fatal',
      });
      throw new Error(message);
    }

    return url;
  },

  // Someday: figure out how to fit in the calls for the AI chat
};
