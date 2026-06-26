import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const vendorSchema = z.object({
  companyName: z.string().min(2),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
});

export const getVendors = async (req: any, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: { quotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(vendors);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getVendor = async (req: any, res: Response) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        quotations: {
          include: {
            rfq: true,
          },
        },
        users: true,
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createVendor = async (req: any, res: Response) => {
  try {
    const data = vendorSchema.parse(req.body);

    const vendor = await prisma.vendor.create({
      data,
    });

    res.status(201).json(vendor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateVendor = async (req: any, res: Response) => {
  try {
    const data = vendorSchema.partial().parse(req.body);

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data,
    });

    res.json(vendor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteVendor = async (req: any, res: Response) => {
  try {
    await prisma.vendor.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
