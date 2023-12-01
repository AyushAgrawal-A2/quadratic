import express, { Response } from 'express';
import { ApiSchemas, ApiTypes } from 'quadratic-shared/typesAndSchemas';
import { z } from 'zod';
import dbClient from '../../dbClient';
import { userMiddleware } from '../../middleware/user';
import { validateAccessToken } from '../../middleware/validateAccessToken';
import { validateRequestSchema } from '../../middleware/validateRequestSchema';
import { RequestWithAuth, RequestWithUser } from '../../types/Request';
const router = express.Router();

const Schema = z.object({
  // TODO do we put a limit on the name length?
  body: ApiSchemas['/v0/teams.POST.request'],
});

router.post(
  '/',
  validateAccessToken,
  validateRequestSchema(Schema),
  userMiddleware,
  async (req: RequestWithAuth & RequestWithUser, res: Response<ApiTypes['/v0/teams.POST.response']>) => {
    const {
      body: { name, picture },
      user: { id: userId },
    } = req;
    const select = {
      uuid: true,
      name: true,
      picture: picture ? true : false,
    };

    const team = await dbClient.team.create({
      data: {
        name,
        // TODO picture
        UserTeamRole: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      select,
    });

    // TODO should return the same as `/teams/:uuid`
    return res.status(201).json(team);
  }
);

export default router;
