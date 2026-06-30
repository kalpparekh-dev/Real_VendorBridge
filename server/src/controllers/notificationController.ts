import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: any, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const skip = (page - 1) * limit;

    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: req.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      prisma.notification.count({
        where: {
          userId: req.userId,
        },
      }),

      prisma.notification.count({
        where: {
          userId: req.userId,
          read: false,
        },
      }),
    ]);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount: unread,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    await prisma.notification.update({
      where: {
        id: req.params.id,
      },
      data: {
        read: true,
      },
    });

    res.json({
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const markAllAsRead = async (req: any, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const deleteNotification = async (req: any, res: Response) => {
  try {
    await prisma.notification.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: 'Notification deleted',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};