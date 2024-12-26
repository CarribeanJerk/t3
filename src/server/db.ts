import { Client } from "@planetscale/database";
import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

const psClient = new Client({ url: env.DATABASE_URL });

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    query: {
      async $allOperations<T>({ args, query }: { 
        args: unknown; 
        query: (args: unknown) => Promise<T>;
      }): Promise<T> {
        return psClient.transaction(async () => query(args));
      },
    },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;