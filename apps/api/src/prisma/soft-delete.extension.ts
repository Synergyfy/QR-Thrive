import { Prisma } from '@prisma/client';

export const softDeleteExtension = (client: any) => {
  const SOFT_DELETE_MODELS = ['User', 'Folder', 'QRCode', 'Form'];

  return client.$extends({
    name: 'softDelete',
    query: {
      $allModels: {
        async delete({ model, args }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return client[model].delete(args);
          }
          return client[model].update({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
        async deleteMany({ model, args }) {
          if (!SOFT_DELETE_MODELS.includes(model)) {
            return client[model].deleteMany(args);
          }
          return client[model].updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        // findUnique is tricky because it doesn't allow extra 'where' fields
        // so we check after fetching
        async findUnique({ model, args, query }) {
          const result = await query(args);
          if (
            SOFT_DELETE_MODELS.includes(model) &&
            result &&
            result.deletedAt
          ) {
            return null;
          }
          return result;
        },
      },
    },
  });
};
