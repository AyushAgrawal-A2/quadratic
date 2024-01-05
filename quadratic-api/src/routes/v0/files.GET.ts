import { Response } from 'express';
import { ApiTypes } from 'quadratic-shared/typesAndSchemas';
import { generatePresignedUrl } from '../../aws/s3';
import dbClient from '../../dbClient';
import { userMiddleware } from '../../middleware/user';
import { validateAccessToken } from '../../middleware/validateAccessToken';
import { RequestWithUser } from '../../types/Request';

export default [validateAccessToken, userMiddleware, handler];

async function handler(req: RequestWithUser, res: Response<ApiTypes['/v0/files.GET.response']>) {
  const {
    user: { id },
  } = req;

  // Fetch files owned by the user from the database
  const files = await dbClient.file.findMany({
    where: {
      ownerUserId: id,
      deleted: false,
    },
    select: {
      uuid: true,
      name: true,
      thumbnail: true,
      createdDate: true,
      updatedDate: true,
      publicLinkAccess: true,
    },
    orderBy: [
      {
        updatedDate: 'desc',
      },
    ],
  });

  // get signed images for each file thumbnail using S3Client
  await Promise.all(
    files.map(async (file) => {
      if (file.thumbnail) {
        file.thumbnail = await generatePresignedUrl(file.thumbnail);
      }
    })
  );

  const data: ApiTypes['/v0/files.GET.response'] = files.map((file) => ({
    ...file,
    createdDate: file.createdDate.toISOString(),
    updatedDate: file.updatedDate.toISOString(),
  }));
  return res.status(200).json(data);
}
