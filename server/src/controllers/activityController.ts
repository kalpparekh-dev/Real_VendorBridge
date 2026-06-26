import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getActivities = async (req: any, res: Response) => {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(activities);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
