import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type LogActivityParams = {
  userId?: string;
  action: string;
  description?: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, any>;
};

export const logActivity = async ({
  userId,
  action,
  description,
  entity = 'SYSTEM',
  entityId = 'N/A',
  meta = {},
}: LogActivityParams) => {
  try {
    if (!userId) {
      return;
    }

    await prisma.activity.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        meta: {
          description,
          ...meta,
        },
      },
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};