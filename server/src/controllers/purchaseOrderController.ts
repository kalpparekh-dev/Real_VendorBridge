import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/email.service';
import { logActivity } from '../services/activity.service';
import { generatePurchaseOrderPDFBuffer } from '../services/purchaseOrderPdf.service';

const prisma = new PrismaClient();

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

  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const safeText = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return String(value);
};

const purchaseOrderInclude = {
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
  invoice: true,
};

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
      include: purchaseOrderInclude,
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    await logActivity({
      userId: req.userId,
      action: 'PURCHASE_ORDER_VIEWED',
      description: `Viewed purchase order ${po.poNumber || po.id}`,
    });

    res.json(po);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPurchaseOrderPDF = async (req: any, res: Response) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: purchaseOrderInclude,
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    const pdfBuffer = await generatePurchaseOrderPDFBuffer(po);
    const fileName = `${po.poNumber || 'purchase-order'}.pdf`;

    await logActivity({
      userId: req.userId,
      action: 'PURCHASE_ORDER_PDF_DOWNLOADED',
      description: `Downloaded PDF for purchase order ${po.poNumber || po.id}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const sendPurchaseOrderEmail = async (req: any, res: Response) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: purchaseOrderInclude,
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    const vendor = po.quotation?.vendor;

    const recipientEmail = (vendor as any)?.email || process.env.SMTP_USER;

if (!recipientEmail) {
  return res.status(400).json({
    error: 'Vendor email not found and fallback email is not configured',
  });
}

    const pdfBuffer = await generatePurchaseOrderPDFBuffer(po);
    const poNumber = po.poNumber || 'Purchase Order';

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Purchase Order ${poNumber} - VendorBridge`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin-bottom: 8px;">Purchase Order ${poNumber}</h2>
          <p>Dear ${safeText((vendor as any).companyName)},</p>
          <p>Please find attached the official purchase order generated from VendorBridge.</p>
          <p><strong>PO Number:</strong> ${safeText(po.poNumber)}</p>
          <p><strong>Total Amount:</strong> ${formatMoney(po.quotation?.totalAmount)}</p>
          <p><strong>Issued Date:</strong> ${formatDate((po as any).issuedAt || (po as any).createdAt)}</p>
          <br />
          <p>Regards,<br />VendorBridge Procurement Team</p>
        </div>
      `,
      text: `Purchase Order ${poNumber}

Dear ${safeText((vendor as any).companyName)},

Please find attached the official purchase order generated from VendorBridge.

PO Number: ${safeText(po.poNumber)}
Total Amount: ${formatMoney(po.quotation?.totalAmount)}
Issued Date: ${formatDate((po as any).issuedAt || (po as any).createdAt)}

Regards,
VendorBridge Procurement Team`,
      attachments: [
        {
          filename: `${poNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await logActivity({
      userId: req.userId,
      action: 'PURCHASE_ORDER_EMAIL_SENT',
      description: `Emailed purchase order ${po.poNumber || po.id} to ${recipientEmail}`,
    });

    res.json({
      message: 'Purchase order email sent successfully',
      email: result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};