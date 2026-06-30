import { Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { z } from 'zod';
import { sendEmail } from '../services/email.service';
import { generateInvoicePDFBuffer } from '../services/invoicePdf.service';
import { logActivity } from '../services/activity.service';

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

const invoiceFullInclude = {
  payment: true,
  purchaseOrder: {
    include: {
      quotation: {
        include: {
          vendor: true,
          rfq: {
            include: {
              items: true,
            },
          },
          items: true,
        },
      },
    },
  },
};

const formatMoney = (amount: any) => {
  const value = Number(amount || 0);

  return `INR ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date: any) => {
  if (!date) return 'N/A';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const safeText = (value: any) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
};

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

    await logActivity({
      userId: req.userId,
      action: 'INVOICE_VIEWED',
      entity: 'INVOICE',
      entityId: invoice.id,
      description: `Viewed invoice ${invoice.invoiceNumber || invoice.id}`,
    });

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

    await prisma.notification.create({
      data: {
        userId: req.userId,
        title: 'New Invoice Received',
        body: `Invoice ${data.invoiceNumber} is pending approval`,
      },
    });

    await logActivity({
      userId: req.userId,
      action: 'INVOICE_CREATED',
      entity: 'INVOICE',
      entityId: invoice.id,
      description: `Created invoice ${invoice.invoiceNumber}`,
      meta: {
        amount: invoice.amount,
        purchaseOrderId: invoice.purchaseOrderId,
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
        payment: true,
        purchaseOrder: {
          include: {
            quotation: {
              include: {
                vendor: {
                  include: {
                    users: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === InvoiceStatus.PAID || invoice.payment) {
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

    const vendorUserId = invoice.purchaseOrder.quotation.vendor.users[0]?.id;

    if (vendorUserId) {
      await prisma.notification.create({
        data: {
          userId: vendorUserId,
          title: 'Payment Received',
          body: `Payment of ₹${data.amount.toLocaleString(
            'en-IN'
          )} has been received for invoice ${invoice.invoiceNumber}`,
        },
      });
    }

    await logActivity({
      userId: req.userId,
      action: 'INVOICE_PAID',
      entity: 'INVOICE',
      entityId: invoice.id,
      description: `Marked invoice ${invoice.invoiceNumber} as paid`,
      meta: {
        amount: data.amount,
        method: data.method,
        reference: data.reference,
      },
    });

    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getInvoicePDF = async (req: any, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: invoiceFullInclude,
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDFBuffer(invoice);
    const fileName = `${invoice.invoiceNumber || 'invoice'}.pdf`;

    await logActivity({
      userId: req.userId,
      action: 'INVOICE_PDF_DOWNLOADED',
      entity: 'INVOICE',
      entityId: invoice.id,
      description: `Downloaded PDF for invoice ${invoice.invoiceNumber || invoice.id}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const sendInvoiceEmail = async (req: any, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: invoiceFullInclude,
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const vendor = invoice.purchaseOrder?.quotation?.vendor;

    if (!vendor || !(vendor as any).email) {
      return res.status(400).json({
        error: 'Vendor email not found for this invoice',
      });
    }

    const pdfBuffer = await generateInvoicePDFBuffer(invoice);
    const invoiceNumber = invoice.invoiceNumber || 'Invoice';
    const poNumber = invoice.purchaseOrder?.poNumber || 'N/A';

    const result = await sendEmail({
      to: (vendor as any).email,
      subject: `Invoice ${invoiceNumber} - VendorBridge`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin-bottom: 8px;">Invoice ${invoiceNumber}</h2>
          <p>Dear ${safeText((vendor as any).companyName)},</p>
          <p>Please find attached the invoice document generated from VendorBridge.</p>
          <p><strong>Invoice Number:</strong> ${safeText(invoice.invoiceNumber)}</p>
          <p><strong>PO Number:</strong> ${safeText(poNumber)}</p>
          <p><strong>Amount:</strong> ${formatMoney(invoice.amount)}</p>
          <p><strong>Status:</strong> ${safeText(invoice.status)}</p>
          <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
          <br />
          <p>Regards,<br />VendorBridge Finance Team</p>
        </div>
      `,
      text: `Invoice ${invoiceNumber}

Dear ${safeText((vendor as any).companyName)},

Please find attached the invoice document generated from VendorBridge.

Invoice Number: ${safeText(invoice.invoiceNumber)}
PO Number: ${safeText(poNumber)}
Amount: ${formatMoney(invoice.amount)}
Status: ${safeText(invoice.status)}
Due Date: ${formatDate(invoice.dueDate)}

Regards,
VendorBridge Finance Team`,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await logActivity({
      userId: req.userId,
      action: 'INVOICE_EMAIL_SENT',
      entity: 'INVOICE',
      entityId: invoice.id,
      description: `Emailed invoice ${invoice.invoiceNumber || invoice.id} to ${(vendor as any).email}`,
      meta: {
        recipient: (vendor as any).email,
        messageId: result.messageId,
      },
    });

    res.json({
      message: 'Invoice email sent successfully',
      email: result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};