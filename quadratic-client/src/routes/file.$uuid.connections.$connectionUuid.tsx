import { ConnectionDialogBody } from '@/app/ui/connections/ConnectionDialogBody';
import { apiClient } from '@/shared/api/apiClient';
import { ROUTES } from '@/shared/constants/routes';
import { ApiTypes } from 'quadratic-shared/typesAndSchemas';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect, useLoaderData } from 'react-router-dom';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { connectionUuid } = params as { uuid: string; connectionUuid: string };
  const connection = await apiClient.connections.get(connectionUuid);
  return connection;
};

type Action = UpdateConnectionAction | DeleteConnectionAction;

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { uuid, connectionUuid } = params as { uuid: string; connectionUuid: string };
  const data: Action = await request.json();

  if (data._intent === 'update-connection') {
    const { _intent, ...body } = data;
    // TODO: (connections) fix type issue
    await apiClient.connections.update(connectionUuid, body as ApiTypes['/v0/connections/:uuid.PUT.request']);
    return redirect(ROUTES.FILE_CONNECTIONS(uuid));
  }

  if (data._intent === 'delete-connection') {
    await apiClient.connections.delete(connectionUuid);
    return redirect(ROUTES.FILE_CONNECTIONS(uuid));
  }

  return { ok: false };
};

type UpdateConnectionAction = ReturnType<typeof getUpdateConnectionAction>;
export const getUpdateConnectionAction = (uuid: string, body: ApiTypes['/v0/connections/:uuid.PUT.request']) => {
  return {
    _intent: 'update-connection',
    ...body,
  };
};

type DeleteConnectionAction = ReturnType<typeof getDeleteConnectionAction>;
export const getDeleteConnectionAction = (uuid: string) => {
  return {
    _intent: 'delete-connection',
  };
};

export const Component = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  return <ConnectionDialogBody connectionType={'POSTGRES'} initialData={initialData} />;
};

// TODO: (connections) make some nice error boundary routes for the dialog
