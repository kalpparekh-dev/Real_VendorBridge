import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const monthKey = (date: Date) =>
  date.toLocaleString('en-IN', {
    month: 'short',
    year: 'numeric',
  });

const daysBetween = (start: any, end: any) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  const difference = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
};

export const getExecutiveDashboard = async (req: any, res: Response) => {
  try {
    const { from, to, vendorId, category, status } = req.query;

    const dateFilter: any = {};

    if (from) {
      dateFilter.gte = new Date(String(from));
    }

    if (to) {
      dateFilter.lte = new Date(String(to));
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const rfqWhere: any = {};
    const quotationWhere: any = {};
    const purchaseOrderWhere: any = {};
    const invoiceWhere: any = {};
    const paymentWhere: any = {};

    if (hasDateFilter) {
      rfqWhere.createdAt = dateFilter;
      quotationWhere.createdAt = dateFilter;
      purchaseOrderWhere.issuedAt = dateFilter;
      invoiceWhere.createdAt = dateFilter;
      paymentWhere.paidAt = dateFilter;
    }

    if (vendorId) {
      quotationWhere.vendorId = String(vendorId);

      purchaseOrderWhere.quotation = {
        vendorId: String(vendorId),
      };

      invoiceWhere.purchaseOrder = {
        quotation: {
          vendorId: String(vendorId),
        },
      };

      paymentWhere.invoice = {
        purchaseOrder: {
          quotation: {
            vendorId: String(vendorId),
          },
        },
      };
    }

    if (category) {
      const categoryValue = String(category);

      quotationWhere.vendor = {
        category: categoryValue,
      };

      purchaseOrderWhere.quotation = {
        ...(purchaseOrderWhere.quotation || {}),
        vendor: {
          category: categoryValue,
        },
      };

      invoiceWhere.purchaseOrder = {
        ...(invoiceWhere.purchaseOrder || {}),
        quotation: {
          ...(invoiceWhere.purchaseOrder?.quotation || {}),
          vendor: {
            category: categoryValue,
          },
        },
      };

      paymentWhere.invoice = {
        ...(paymentWhere.invoice || {}),
        purchaseOrder: {
          ...(paymentWhere.invoice?.purchaseOrder || {}),
          quotation: {
            ...(paymentWhere.invoice?.purchaseOrder?.quotation || {}),
            vendor: {
              category: categoryValue,
            },
          },
        },
      };
    }

    if (status) {
      invoiceWhere.status = String(status);
    }

    const [
      vendors,
      rfqs,
      quotations,
      purchaseOrders,
      invoices,
      payments,
      activities,
      allVendors,
    ] = await Promise.all([
      prisma.vendor.findMany(),
      prisma.rFQ.findMany({
        where: rfqWhere,
      }),
      prisma.quotation.findMany({
        where: quotationWhere,
        include: {
          vendor: true,
          rfq: true,
        },
      }),
      prisma.purchaseOrder.findMany({
        where: purchaseOrderWhere,
        include: {
          quotation: {
            include: {
              vendor: true,
              rfq: true,
            },
          },
          invoice: true,
        },
        orderBy: {
          issuedAt: 'desc',
        },
      }),
      prisma.invoice.findMany({
        where: invoiceWhere,
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
        where: paymentWhere,
        include: {
          invoice: true,
        },
        orderBy: {
          paidAt: 'desc',
        },
      }),
      prisma.activity.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
      prisma.vendor.findMany({
        select: {
          id: true,
          companyName: true,
          category: true,
        },
        orderBy: {
          companyName: 'asc',
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
      (quotation: any) => quotation.status === 'SUBMITTED' || quotation.status === 'UNDER_REVIEW'
    ).length;

    const approvalRate =
      quotations.length > 0 ? Math.round((approvedQuotations / quotations.length) * 100) : 0;

    const paymentCompletionRate =
      invoices.length > 0 ? Math.round((paidInvoices / invoices.length) * 100) : 0;

    const estimatedSavings = Math.round(totalSpend * 0.08);
    const outstandingAmount = Math.max(totalSpend - totalPaid, 0);

    const overdueAmount = invoices
      .filter((invoice: any) => invoice.status === 'OVERDUE')
      .reduce((sum: number, invoice: any) => sum + Number(invoice.amount || 0), 0);

    const averageInvoiceAmount =
      invoices.length > 0
        ? Math.round(
            invoices.reduce((sum: number, invoice: any) => sum + Number(invoice.amount || 0), 0) /
              invoices.length
          )
        : 0;

    const averagePOAmount =
      purchaseOrders.length > 0 ? Math.round(totalSpend / purchaseOrders.length) : 0;

    const spendByMonthMap: Record<string, number> = {};

    purchaseOrders.forEach((po: any) => {
      const date = new Date(po.issuedAt || Date.now());
      const key = monthKey(date);
      spendByMonthMap[key] = (spendByMonthMap[key] || 0) + Number(po.quotation?.totalAmount || 0);
    });

    const spendByMonth = Object.entries(spendByMonthMap).map(([month, amount]) => ({
      month,
      amount,
    }));

    const rfqVolumeMap: Record<string, number> = {};

    rfqs.forEach((rfq: any) => {
      const date = new Date(rfq.createdAt || Date.now());
      const key = monthKey(date);
      rfqVolumeMap[key] = (rfqVolumeMap[key] || 0) + 1;
    });

    const rfqVolume = Object.entries(rfqVolumeMap).map(([month, count]) => ({
      month,
      count,
    }));

    const vendorSpendMap: Record<string, any> = {};

    purchaseOrders.forEach((po: any) => {
      const vendor = po.quotation?.vendor;
      const vendorIdValue = vendor?.id || 'unknown';
      const vendorName = vendor?.companyName || 'Unknown Vendor';
      const amount = Number(po.quotation?.totalAmount || 0);

      if (!vendorSpendMap[vendorIdValue]) {
        vendorSpendMap[vendorIdValue] = {
          id: vendorIdValue,
          companyName: vendorName,
          category: vendor?.category || 'Uncategorized',
          spend: 0,
          purchaseOrders: 0,
        };
      }

      vendorSpendMap[vendorIdValue].spend += amount;
      vendorSpendMap[vendorIdValue].purchaseOrders += 1;
    });

    const topVendors = Object.values(vendorSpendMap)
      .sort((a: any, b: any) => b.spend - a.spend)
      .slice(0, 5);

    const categorySpendMap: Record<string, number> = {};

    purchaseOrders.forEach((po: any) => {
      const vendorCategory = po.quotation?.vendor?.category || 'Uncategorized';
      const amount = Number(po.quotation?.totalAmount || 0);

      categorySpendMap[vendorCategory] = (categorySpendMap[vendorCategory] || 0) + amount;
    });

    const spendByCategory = Object.entries(categorySpendMap).map(([categoryName, amount]) => ({
      category: categoryName,
      amount,
    }));

    const paymentTrendMap: Record<string, number> = {};

    payments.forEach((payment: any) => {
      const date = new Date(payment.paidAt || Date.now());
      const key = monthKey(date);
      paymentTrendMap[key] = (paymentTrendMap[key] || 0) + Number(payment.amount || 0);
    });

    const paymentTrend = Object.entries(paymentTrendMap).map(([month, amount]) => ({
      month,
      amount,
    }));

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

    const invoiceAgingBuckets = [
      {
        bucket: '0-7 days',
        count: invoiceAging.filter((invoice) => invoice.ageDays <= 7).length,
      },
      {
        bucket: '8-15 days',
        count: invoiceAging.filter((invoice) => invoice.ageDays >= 8 && invoice.ageDays <= 15).length,
      },
      {
        bucket: '16-30 days',
        count: invoiceAging.filter((invoice) => invoice.ageDays >= 16 && invoice.ageDays <= 30).length,
      },
      {
        bucket: '30+ days',
        count: invoiceAging.filter((invoice) => invoice.ageDays > 30).length,
      },
    ];

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
      .slice(0, 5);

    const categories = Array.from(
      new Set(allVendors.map((vendor: any) => vendor.category).filter(Boolean))
    );

    res.json({
      filters: {
        vendors: allVendors,
        categories,
        applied: {
          from: from || '',
          to: to || '',
          vendorId: vendorId || '',
          category: category || '',
          status: status || '',
        },
      },
      summary: {
        totalSpend,
        totalPaid,
        outstandingAmount,
        overdueAmount,
        estimatedSavings,
        averageInvoiceAmount,
        averagePOAmount,
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
        spendByMonth,
        rfqVolume,
        invoiceStatusDistribution: [
          { status: 'Pending', count: pendingInvoices },
          { status: 'Paid', count: paidInvoices },
          { status: 'Overdue', count: overdueInvoices },
        ],
        spendByCategory,
        paymentTrend,
        invoiceAgingBuckets,
      },
      topVendors,
      largestPurchaseOrders,
      invoiceAging,
      recentActivities: activities,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};