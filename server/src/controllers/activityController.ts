import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/*
  Enterprise Audit Trail Controller
*/

export const getActivities = async (req: any, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      userId,
      action,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);

    const where: any = {};

    if (userId) {
      where.userId = String(userId);
    }

    if (action) {
      where.action = String(action);
    }

    if (search) {
      where.OR = [
        {
          action: {
            contains: String(search),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: String(search),
            mode: 'insensitive',
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(String(startDate));
      }

      if (endDate) {
        where.createdAt.lte = new Date(String(endDate));
      }
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),

      prisma.activity.count({
        where,
      }),
    ]);

    res.json({
      data: activities,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};