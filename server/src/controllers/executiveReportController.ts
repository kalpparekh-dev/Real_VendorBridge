import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateExecutiveReportPdf } from '../services/executiveReportPdf.service';

const prisma = new PrismaClient();

const daysBetween = (start: any, end: any) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
};

export const downloadExecutiveReportPdf = async (req: any, res: Response) => {
  try {
    const [vendors, rfqs, quotations, purchaseOrders, invoices, payments] =
      await Promise.all([
        prisma.vendor.findMany(),
        prisma.rFQ.findMany(),
        prisma.quotation.findMany({
          include: {
            vendor: true,
            rfq: true,
          },
        }),
        prisma.purchaseOrder.findMany({
          include: {
            quotation: {
              include: {
                vendor: true,
                rfq: true,
              },
            },
          },
          orderBy: {
            issuedAt: 'desc',
          },
        }),
        prisma.invoice.findMany({
          include: {
            payment: true,
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
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.payment.findMany({
          include: {
            invoice: true,
          },
        }),
      ]);

    const totalSpend = purchaseOrders.reduce(
      (sum: number, po: any) => sum + Number(po.quotation?.totalAmount || 0),
      0
    );

    const totalPaid = payments.reduce(
      (sum: number, payment: any) => sum + Number(payment.amount || 0),
      0
    );

    const pendingInvoices = invoices.filter((invoice: any) => invoice.status === 'PENDING').length;
    const paidInvoices = invoices.filter((invoice: any) => invoice.status === 'PAID').length;
    const overdueInvoices = invoices.filter((invoice: any) => invoice.status === 'OVERDUE').length;

    const approvedQuotations = quotations.filter((quotation: any) => quotation.status === 'APPROVED').length;
    const rejectedQuotations = quotations.filter((quotation: any) => quotation.status === 'REJECTED').length;
    const submittedQuotations = quotations.filter(
      (quotation: any) =>
        quotation.status === 'SUBMITTED' || quotation.status === 'UNDER_REVIEW'
    ).length;

    const approvalRate =
      quotations.length > 0 ? Math.round((approvedQuotations / quotations.length) * 100) : 0;

    const paymentCompletionRate =
      invoices.length > 0 ? Math.round((paidInvoices / invoices.length) * 100) : 0;

    const outstandingAmount = Math.max(totalSpend - totalPaid, 0);
    const overdueAmount = invoices
      .filter((invoice: any) => invoice.status === 'OVERDUE')
      .reduce((sum: number, invoice: any) => sum + Number(invoice.amount || 0), 0);

    const estimatedSavings = Math.round(totalSpend * 0.08);

    const categorySpendMap: Record<string, number> = {};

    purchaseOrders.forEach((po: any) => {
      const category = po.quotation?.vendor?.category || 'Uncategorized';
      const amount = Number(po.quotation?.totalAmount || 0);
      categorySpendMap[category] = (categorySpendMap[category] || 0) + amount;
    });

    const spendByCategory = Object.entries(categorySpendMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    const vendorSpendMap: Record<string, any> = {};

    purchaseOrders.forEach((po: any) => {
      const vendor = po.quotation?.vendor;
      const vendorId = vendor?.id || 'unknown';
      const amount = Number(po.quotation?.totalAmount || 0);

      if (!vendorSpendMap[vendorId]) {
        vendorSpendMap[vendorId] = {
          id: vendorId,
          companyName: vendor?.companyName || 'Unknown Vendor',
          spend: 0,
          purchaseOrders: 0,
        };
      }

      vendorSpendMap[vendorId].spend += amount;
      vendorSpendMap[vendorId].purchaseOrders += 1;
    });

    const topVendors = Object.values(vendorSpendMap)
      .sort((a: any, b: any) => b.spend - a.spend)
      .slice(0, 8);

    const largestPurchaseOrders = purchaseOrders
      .map((po: any) => ({
        id: po.id,
        poNumber: po.poNumber,
        vendor: po.quotation?.vendor?.companyName || 'Unknown Vendor',
        amount: Number(po.quotation?.totalAmount || 0),
        status: po.status,
        issuedAt: po.issuedAt,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    const invoiceAging = invoices.map((invoice: any) => {
      const ageDays =
        invoice.status === 'PAID'
          ? daysBetween(invoice.createdAt, invoice.payment?.paidAt || new Date())
          : daysBetween(invoice.createdAt, new Date());

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        vendor: invoice.purchaseOrder?.quotation?.vendor?.companyName || 'Unknown Vendor',
        status: invoice.status,
        amount: Number(invoice.amount || 0),
        ageDays,
      };
    });

    const data = {
      summary: {
        totalSpend,
        totalPaid,
        outstandingAmount,
        overdueAmount,
        estimatedSavings,
        approvalRate,
        paymentCompletionRate,
        vendors: vendors.length,
        rfqs: rfqs.length,
        quotations: quotations.length,
        purchaseOrders: purchaseOrders.length,
        invoices: invoices.length,
        payments: payments.length,
        pendingInvoices,
        paidInvoices,
        overdueInvoices,
        approvedQuotations,
        rejectedQuotations,
        submittedQuotations,
      },
      charts: {
        spendByCategory,
      },
      topVendors,
      largestPurchaseOrders,
      invoiceAging,
      insights: {
        healthScore: 0,
        healthLabel: '',
        recommendations: [],
        riskAlerts: [],
      },
    };

    const pdf = generateExecutiveReportPdf(data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="vendorbridge-executive-report.pdf"'
    );

    pdf.pipe(res);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};