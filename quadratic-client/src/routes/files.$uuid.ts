import { apiClient } from '@/api/apiClient';
import { ROUTES } from '@/constants/routes';
import { ActionFunctionArgs, redirectDocument } from 'react-router-dom';

export const loader = async () => null;

export type Action = {
  response: { ok: boolean } | null;
  'request.delete': {
    action: 'delete';
  };
  'request.download': {
    action: 'download';
  };
  'request.duplicate': {
    action: 'duplicate';
    redirect?: boolean;
  };
  'request.rename': {
    action: 'rename';
    name: string;
  };
  request:
    | Action['request.delete']
    | Action['request.download']
    | Action['request.duplicate']
    | Action['request.rename'];
};

export const action = async ({ params, request }: ActionFunctionArgs): Promise<Action['response']> => {
  const json: Action['request'] = await request.json();
  const { uuid } = params as { uuid: string };
  const { action } = json;

  if (action === 'delete') {
    try {
      await apiClient.files.delete(uuid);
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  if (action === 'download') {
    try {
      await apiClient.files.download(uuid);
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  if (action === 'duplicate') {
    try {
      const { redirect } = json as Action['request.duplicate'];
      const { uuid: newFileUuid } = await apiClient.files.duplicate(uuid);
      return redirect ? redirectDocument(ROUTES.FILE(newFileUuid)) : { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  if (action === 'rename') {
    try {
      const { name } = json as Action['request.rename'];
      await apiClient.files.update(uuid, { name });
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  return null;
};
