import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPurchaseOrders = async (req: any, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        quotation: {
          include: {
            vendor: true,
            rfq: true,
          },
        },
        invoice: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.json(pos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPurchaseOrder = async (req: any, res: Response) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        quotation: {
          include: {
            vendor: true,
            rfq: {
              include: { items: true },
            },
            items: true,
          },
        },
        invoice: true,
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    res.json(po);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
