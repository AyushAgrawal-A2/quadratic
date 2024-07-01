import { Response } from 'express';
import { ApiSchemas, ApiTypes } from 'quadratic-shared/typesAndSchemas';
import { z } from 'zod';
import dbClient from '../../dbClient';
import { getTeam } from '../../middleware/getTeam';
import { userMiddleware } from '../../middleware/user';
import { validateAccessToken } from '../../middleware/validateAccessToken';
import { parseRequest } from '../../middleware/validateRequestSchema';
import { RequestWithUser } from '../../types/Request';
import { ApiError } from '../../utils/ApiError';

export default [validateAccessToken, userMiddleware, handler];

const schema = z.object({
  body: ApiSchemas['/v0/connections.POST.request'],
  query: z.object({ teamUuid: z.string().uuid() }),
});

/**
 * The front-end should call the connetion service BEFORE creating this
 * just to ensure it works.
 */
async function handler(req: RequestWithUser, res: Response<ApiTypes['/v0/connections.POST.response']>) {
  const {
    user: { id: userId },
  } = req;
  const {
    body: connection,
    query: { teamUuid },
  } = parseRequest(req, schema);
  const {
    team: { id: teamId },
    userMakingRequest: { permissions },
  } = await getTeam({ uuid: teamUuid, userId });

  // Do you have permission?
  if (!permissions.includes('TEAM_EDIT')) {
    throw new ApiError(403, 'You don’t have access to this team');
  }

  // Ok create the file
  const { name, type, typeDetails } = connection;
  const result = await dbClient.connection.create({
    data: {
      name,
      teamId,
      type,
      typeDetails: JSON.stringify(typeDetails),
    },
  });

  // Return its identifier
  return res.status(201).json({ uuid: result.uuid });
}
