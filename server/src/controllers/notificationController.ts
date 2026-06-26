import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: any, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
