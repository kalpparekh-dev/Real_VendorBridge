import { Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const invoiceSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  invoiceNumber: z.string(),
  amount: z.number().positive(),
  dueDate: z.string(),
  fileUrl: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string(),
  reference: z.string().optional(),
});

export const getInvoices = async (req: any, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        purchaseOrder: {
          include: {
            quotation: {
              include: {
                vendor: true,
                rfq: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getInvoice = async (req: any, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrder: {
          include: {
            quotation: {
              include: {
                vendor: true,
                rfq: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createInvoice = async (req: any, res: Response) => {
  try {
    const data = invoiceSchema.parse(req.body);

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: {
        quotation: true,
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    // Validate amount (±5% tolerance)
    const poAmount = Number(po.quotation.totalAmount);
    const invoiceAmount = data.amount;
    const tolerance = poAmount * 0.05;

    if (Math.abs(invoiceAmount - poAmount) > tolerance) {
      return res.status(400).json({
        error: `Invoice amount must be within ±5% of PO amount (${poAmount})`,
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        purchaseOrderId: data.purchaseOrderId,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        fileUrl: data.fileUrl,
        status: InvoiceStatus.PENDING,
      },
    });

    // Notify finance
    await prisma.notification.create({
      data: {
        userId: req.userId,
        title: 'New Invoice Received',
        body: `Invoice ${data.invoiceNumber} is pending approval`,
      },
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const payInvoice = async (req: any, res: Response) => {
  try {
    const data = paymentSchema.parse(req.body);

    if (data.method === 'Bank Transfer' && !data.reference) {
      return res.status(400).json({
        error: 'Payment reference is required for Bank Transfer',
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrder: {
          include: {
            quotation: {
              include: { vendor: { include: { users: true } } },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.payment) {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: InvoiceStatus.PAID },
    });

    // Notify vendor
    const vendorUserId = invoice.purchaseOrder.quotation.vendor.users[0]?.id;
    if (vendorUserId) {
      await prisma.notification.create({
        data: {
          userId: vendorUserId,
          title: 'Payment Received',
          body: `Payment of ₹${data.amount.toLocaleString('en-IN')} has been received for invoice ${invoice.invoiceNumber}`,
        },
      });
    }

    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
