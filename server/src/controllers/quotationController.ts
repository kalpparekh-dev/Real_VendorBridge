import { Response } from 'express';
import { PrismaClient, QuotationStatus, ApprovalStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const quotationSchema = z.object({
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  items: z.array(
    z.object({
      rfqItemId: z.string().uuid(),
      unitPrice: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ),
  deliveryDays: z.number().int().positive(),
  validUntil: z.string(),
  notes: z.string().optional(),
});

export const getQuotations = async (req: any, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        rfq: {
          include: { items: true },
        },
        vendor: true,
        items: true,
        approval: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(quotations);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getQuotation = async (req: any, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        rfq: {
          include: { items: true },
        },
        vendor: true,
        items: true,
        approval: true,
        purchaseOrder: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createQuotation = async (req: any, res: Response) => {
  try {
    const data = quotationSchema.parse(req.body);

    const rfq = await prisma.rFQ.findUnique({
      where: { id: data.rfqId },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    if (rfq.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'RFQ is not open for quotations' });
    }

    if (new Date() > rfq.deadline) {
      return res.status(400).json({ error: 'RFQ deadline has passed' });
    }

    const validUntil = new Date(data.validUntil);
    if (validUntil < new Date()) {
      return res.status(400).json({ error: 'Valid until date must be in the future' });
    }

    // Calculate total amount
    const items = data.items.map((item) => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const quotation = await prisma.quotation.create({
      data: {
        rfqId: data.rfqId,
        vendorId: data.vendorId,
        totalAmount,
        deliveryDays: data.deliveryDays,
        validUntil,
        notes: data.notes,
        status: QuotationStatus.SUBMITTED,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    // Notify procurement officer
    await prisma.notification.create({
      data: {
        userId: rfq.createdBy,
        title: 'New Quotation Submitted',
        body: `A new quotation has been submitted for ${rfq.title}`,
      },
    });

    res.status(201).json(quotation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const approveQuotation = async (req: any, res: Response) => {
  try {
    const { comments } = req.body;

    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { rfq: true, vendor: { include: { users: true } } },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Update or create approval
    const approval = await prisma.approval.upsert({
      where: { quotationId: quotation.id },
      update: {
        status: ApprovalStatus.APPROVED,
        comments,
        reviewedBy: req.userId,
      },
      create: {
        quotationId: quotation.id,
        status: ApprovalStatus.APPROVED,
        comments,
        reviewedBy: req.userId,
      },
    });

    // Update quotation status
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: QuotationStatus.APPROVED },
    });

    // Create PO
    const po = await prisma.purchaseOrder.create({
      data: {
        quotationId: quotation.id,
        poNumber: `PO-${Date.now()}`,
        deliveryDate: new Date(Date.now() + quotation.deliveryDays * 24 * 60 * 60 * 1000),
        status: 'ISSUED',
      },
    });

    // Notify vendor
    const vendorUserId = quotation.vendor.users[0]?.id;
    if (vendorUserId) {
      await prisma.notification.create({
        data: {
          userId: vendorUserId,
          title: 'Quotation Approved',
          body: `Your quotation for ${quotation.rfq.title} has been approved. PO: ${po.poNumber}`,
        },
      });
    }

    res.json({ approval, purchaseOrder: po });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectQuotation = async (req: any, res: Response) => {
  try {
    const { comments } = req.body;

    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { vendor: { include: { users: true } }, rfq: true },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    await prisma.approval.upsert({
      where: { quotationId: quotation.id },
      update: {
        status: ApprovalStatus.REJECTED,
        comments,
        reviewedBy: req.userId,
      },
      create: {
        quotationId: quotation.id,
        status: ApprovalStatus.REJECTED,
        comments,
        reviewedBy: req.userId,
      },
    });

    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: QuotationStatus.REJECTED },
    });

    // Notify vendor
    const vendorUserId = quotation.vendor.users[0]?.id;
    if (vendorUserId) {
      await prisma.notification.create({
        data: {
          userId: vendorUserId,
          title: 'Quotation Rejected',
          body: `Your quotation for ${quotation.rfq.title} has been rejected`,
        },
      });
    }

    res.json({ message: 'Quotation rejected' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
