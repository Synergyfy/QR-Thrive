import { Prisma } from '@prisma/client';

export const softDeleteExtension = (client: any) => {
  return client.$extends({
    name: 'softDelete',
    query: {
      $allModels: {
        async delete({ model, args }) {
          return (client as any)[model].update({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
        async deleteMany({ model, args }) {
          return (client as any)[model].updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
        async findFirst({ model, args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        async findMany({ model, args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        async count({ model, args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        // findUnique is tricky because it doesn't allow extra 'where' fields
        // so we check after fetching
        async findUnique({ model, args, query }) {
          const result = await query(args);
          if (result && (result as any).deletedAt) {
            return null;
          }
          return result;
        },
      },
    },
  });
};
