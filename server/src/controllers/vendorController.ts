import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const vendorSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactEmail: z.string().email('Valid contact email is required'),
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
    res.status(500).json({ error: 'Failed to load vendors' });
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
    res.status(500).json({ error: 'Failed to load vendor details' });
  }
};

export const createVendor = async (req: any, res: Response) => {
  try {
    const data = vendorSchema.parse(req.body);

    const existingVendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { companyName: data.companyName },
          { contactEmail: data.contactEmail },
        ],
      },
    });

    if (existingVendor) {
      return res.status(409).json({
        error: 'Vendor with this company name or email already exists',
      });
    }

    const vendor = await prisma.vendor.create({
      data,
    });

    res.status(201).json(vendor);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.issues[0]?.message || 'Invalid vendor data',
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        error: 'Vendor with this company name or email already exists',
      });
    }

    res.status(500).json({ error: 'Failed to create vendor' });
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.issues[0]?.message || 'Invalid vendor data',
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        error: 'Vendor with this company name or email already exists',
      });
    }

    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

export const deleteVendor = async (req: any, res: Response) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            quotations: true,
            users: true,
          },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (vendor._count.quotations > 0 || vendor._count.users > 0) {
      return res.status(409).json({
        error:
          'Cannot delete this vendor because it is linked with quotations or users. Mark it inactive instead.',
      });
    }

    await prisma.vendor.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
};