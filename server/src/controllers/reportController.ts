import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSpendByCategory = async (req: any, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        quotation: {
          include: {
            rfq: true,
          },
        },
      },
    });

    const categorySpend: Record<string, number> = {};

    pos.forEach((po) => {
      const category = po.quotation.rfq.title.split(' ')[0] || 'Other';
      categorySpend[category] = (categorySpend[category] || 0) + Number(po.quotation.totalAmount);
    });

    const data = Object.entries(categorySpend).map(([category, amount]) => ({
      category,
      amount,
    }));

    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getRFQVolume = async (req: any, res: Response) => {
  try {
    const rfqs = await prisma.rFQ.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const monthlyVolume: Record<string, number> = {};

    rfqs.forEach((rfq) => {
      const month = new Date(rfq.createdAt).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      monthlyVolume[month] = (monthlyVolume[month] || 0) + 1;
    });

    const data = Object.entries(monthlyVolume).map(([month, count]) => ({
      month,
      count,
    }));

    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getVendorPerformance = async (req: any, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        quotations: {
          include: {
            purchaseOrder: true,
          },
        },
      },
    });

    const performance = vendors.map((vendor) => {
      const totalPOs = vendor.quotations.filter((q) => q.purchaseOrder).length;
      const avgDeliveryDays =
        vendor.quotations.reduce((sum, q) => sum + q.deliveryDays, 0) / vendor.quotations.length || 0;
      const avgScore = vendor.rating || 0;

      return {
        id: vendor.id,
        companyName: vendor.companyName,
        avgDeliveryDays: Math.round(avgDeliveryDays),
        avgScore,
        totalPOs,
        onTimePercent: totalPOs > 0 ? 95 : 0, // Mock calculation
      };
    });

    res.json(performance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
