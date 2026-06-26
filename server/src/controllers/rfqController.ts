import { Response } from 'express';
import { PrismaClient, RFQStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const rfqSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  deadline: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number().int().positive(),
      unit: z.string(),
    })
  ),
});

export const getRFQs = async (req: any, res: Response) => {
  try {
    const rfqs = await prisma.rFQ.findMany({
      include: {
        items: true,
        quotations: true,
        _count: {
          select: { quotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rfqs);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getRFQ = async (req: any, res: Response) => {
  try {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        quotations: {
          include: {
            vendor: true,
            items: true,
          },
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createRFQ = async (req: any, res: Response) => {
  try {
    const data = rfqSchema.parse(req.body);

    const deadline = new Date(data.deadline);
    const minDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    if (deadline < minDeadline) {
      return res.status(400).json({
        error: 'Deadline must be at least 3 days in the future',
      });
    }

    const rfq = await prisma.rFQ.create({
      data: {
        title: data.title,
        description: data.description,
        deadline,
        status: RFQStatus.DRAFT,
        createdBy: req.userId,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(rfq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateRFQ = async (req: any, res: Response) => {
  try {
    const data = rfqSchema.partial().parse(req.body);

    const rfq = await prisma.rFQ.update({
      where: { id: req.params.id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
      include: {
        items: true,
      },
    });

    res.json(rfq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const publishRFQ = async (req: any, res: Response) => {
  try {
    const rfq = await prisma.rFQ.update({
      where: { id: req.params.id },
      data: { status: RFQStatus.PUBLISHED },
      include: {
        items: true,
      },
    });

    // Notify all active vendors
    const vendors = await prisma.vendor.findMany({
      where: { status: 'ACTIVE' },
      include: { users: true },
    });

    const notifications = vendors
      .map((vendor) => vendor.users[0]?.id)
      .filter(Boolean)
      .map((userId) => ({
        userId: userId as string,
        title: 'New RFQ Published',
        body: `${rfq.title} is now open for quotations`,
      }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    res.json(rfq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
