import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const normalize = (text: string) => text.toLowerCase().trim();

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

const isThisMonth = (dateValue: any) => {
  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

const isLastMonth = (dateValue: any) => {
  const date = new Date(dateValue);
  const now = new Date();

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return (
    date.getMonth() === lastMonth.getMonth() &&
    date.getFullYear() === lastMonth.getFullYear()
  );
};

export const getAIProcurementAnswer = async (message: string) => {
  const query = normalize(message);

  const [vendors, rfqs, quotations, purchaseOrders, invoices, payments] =
    await Promise.all([
      prisma.vendor.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rFQ.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.findMany({
        include: {
          vendor: true,
          rfq: true,
        },
        orderBy: { createdAt: 'desc' },
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
        orderBy: { issuedAt: 'desc' },
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        include: {
          invoice: true,
        },
        orderBy: { paidAt: 'desc' },
      }),
    ]);

  const totalSpend = purchaseOrders.reduce(
    (sum, po: any) => sum + Number(po.quotation?.totalAmount || 0),
    0
  );

  const totalPaid = payments.reduce(
    (sum, payment: any) => sum + Number(payment.amount || 0),
    0
  );

  const outstanding = Math.max(totalSpend - totalPaid, 0);

  const pendingInvoices = invoices.filter((invoice: any) => invoice.status === 'PENDING');
  const paidInvoices = invoices.filter((invoice: any) => invoice.status === 'PAID');
  const overdueInvoices = invoices.filter((invoice: any) => invoice.status === 'OVERDUE');
  const approvedInvoices = invoices.filter((invoice: any) => invoice.status === 'APPROVED');

  const approvedQuotations = quotations.filter((quotation: any) => quotation.status === 'APPROVED');
  const rejectedQuotations = quotations.filter((quotation: any) => quotation.status === 'REJECTED');
  const pendingApprovals = quotations.filter(
    (quotation: any) =>
      quotation.status === 'SUBMITTED' || quotation.status === 'UNDER_REVIEW'
  );

  const approvalRate =
    quotations.length > 0
      ? Math.round((approvedQuotations.length / quotations.length) * 100)
      : 0;

  const paymentCompletionRate =
    invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0;

  const vendorSpendMap: Record<string, any> = {};

  purchaseOrders.forEach((po: any) => {
    const vendor = po.quotation?.vendor;
    const vendorId = vendor?.id || 'unknown';
    const amount = Number(po.quotation?.totalAmount || 0);

    if (!vendorSpendMap[vendorId]) {
      vendorSpendMap[vendorId] = {
        companyName: vendor?.companyName || 'Unknown Vendor',
        category: vendor?.category || 'Uncategorized',
        spend: 0,
        purchaseOrders: 0,
      };
    }

    vendorSpendMap[vendorId].spend += amount;
    vendorSpendMap[vendorId].purchaseOrders += 1;
  });

  const topVendors = Object.values(vendorSpendMap).sort(
    (a: any, b: any) => b.spend - a.spend
  );

  const largestPO = purchaseOrders
    .map((po: any) => ({
      poNumber: po.poNumber,
      vendor: po.quotation?.vendor?.companyName || 'Unknown Vendor',
      amount: Number(po.quotation?.totalAmount || 0),
      issuedAt: po.issuedAt,
      status: po.status,
    }))
    .sort((a, b) => b.amount - a.amount)[0];

  const highestRatedVendor = [...vendors].sort(
    (a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0)
  )[0];

  const thisMonthSpend = purchaseOrders
    .filter((po: any) => isThisMonth(po.issuedAt))
    .reduce((sum, po: any) => sum + Number(po.quotation?.totalAmount || 0), 0);

  const lastMonthSpend = purchaseOrders
    .filter((po: any) => isLastMonth(po.issuedAt))
    .reduce((sum, po: any) => sum + Number(po.quotation?.totalAmount || 0), 0);

  const invoiceAging = invoices.map((invoice: any) => {
    const ageDays =
      invoice.status === 'PAID'
        ? daysBetween(invoice.createdAt, invoice.payment?.paidAt || new Date())
        : daysBetween(invoice.createdAt, new Date());

    return {
      invoiceNumber: invoice.invoiceNumber,
      vendor:
        invoice.purchaseOrder?.quotation?.vendor?.companyName ||
        'Unknown Vendor',
      amount: Number(invoice.amount || 0),
      status: invoice.status,
      ageDays,
    };
  });

  const highRiskInvoices = invoiceAging
    .filter((invoice) => invoice.status !== 'PAID' && invoice.ageDays > 30)
    .sort((a, b) => b.ageDays - a.ageDays);

  const overdueAmount = overdueInvoices.reduce(
    (sum: number, invoice: any) => sum + Number(invoice.amount || 0),
    0
  );

  const averageVendorRating =
  vendors.length > 0
    ? vendors.reduce((sum: number, vendor: any) => sum + Number(vendor.rating || 0), 0) / vendors.length
    : 0;

let healthScore = 100;

if (approvalRate < 80) healthScore -= 10;
if (paymentCompletionRate < 75) healthScore -= 15;
if (overdueInvoices.length > 0) healthScore -= Math.min(overdueInvoices.length * 5, 20);
if (pendingApprovals.length > 5) healthScore -= 10;
if (highRiskInvoices.length > 0) healthScore -= Math.min(highRiskInvoices.length * 5, 15);
if (averageVendorRating > 0 && averageVendorRating < 3.5) healthScore -= 10;

healthScore = Math.max(0, Math.min(100, healthScore));

const scoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Warning';
  return 'Critical';
};

const recommendations: string[] = [];

if (overdueInvoices.length > 0) {
  recommendations.push(`Prioritize ${overdueInvoices.length} overdue invoices worth ${money(overdueAmount)}.`);
}

if (pendingApprovals.length > 0) {
  recommendations.push(`Review ${pendingApprovals.length} pending quotations to avoid procurement delays.`);
}

if (paymentCompletionRate < 80) {
  recommendations.push('Improve payment completion rate by clearing pending and approved invoices.');
}

if (topVendors[0]) {
  recommendations.push(`Negotiate pricing with ${topVendors[0].companyName}, your highest-spend vendor.`);
}

if (highRiskInvoices.length > 0) {
  recommendations.push(`Escalate ${highRiskInvoices.length} high-risk invoices older than 30 days.`);
}

if (recommendations.length === 0) {
  recommendations.push('Procurement operations look stable. Continue monitoring vendor spend and payment cycles.');
}

const riskAlerts: string[] = [];

if (overdueInvoices.length > 0) {
  riskAlerts.push(`${overdueInvoices.length} overdue invoices detected.`);
}

if (highRiskInvoices.length > 0) {
  riskAlerts.push(`${highRiskInvoices.length} high-risk invoices are older than 30 days.`);
}

if (pendingApprovals.length > 5) {
  riskAlerts.push(`${pendingApprovals.length} quotations are pending approval.`);
}

if (paymentCompletionRate < 70) {
  riskAlerts.push(`Payment completion rate is low at ${paymentCompletionRate}%.`);
}

if (!riskAlerts.length) {
  riskAlerts.push('No major procurement risks detected right now.');
}

  const pendingInvoiceAmount = pendingInvoices.reduce(
    (sum: number, invoice: any) => sum + Number(invoice.amount || 0),
    0
  );

  if (
  query.includes('insight') ||
  query.includes('executive insight') ||
  query.includes('today insight') ||
  query.includes('procurement insight') ||
  query.includes('copilot')
) {
  return `VendorBridge Executive Insights

Procurement Health Score: ${healthScore}/100 (${scoreLabel(healthScore)})

Spend Overview:
Total Spend: ${money(totalSpend)}
This Month: ${money(thisMonthSpend)}
Last Month: ${money(lastMonthSpend)}

Financial Position:
Total Paid: ${money(totalPaid)}
Outstanding: ${money(outstanding)}
Overdue Amount: ${money(overdueAmount)}
Payment Completion: ${paymentCompletionRate}%

Workflow:
RFQs: ${rfqs.length}
Purchase Orders: ${purchaseOrders.length}
Pending Approvals: ${pendingApprovals.length}
Approval Rate: ${approvalRate}%

Top Vendor:
${topVendors[0] ? `${topVendors[0].companyName} — ${money(topVendors[0].spend)}` : 'No vendor spend data'}

Largest Purchase Order:
${largestPO ? `${largestPO.poNumber} — ${largestPO.vendor} — ${money(largestPO.amount)}` : 'No purchase orders found'}

Risk Alerts:
${riskAlerts.map((risk) => `- ${risk}`).join('\n')}

AI Recommendations:
${recommendations.map((item) => `- ${item}`).join('\n')}`;
}

if (
  query.includes('health score') ||
  query.includes('procurement health') ||
  query.includes('business health')
) {
  return `Procurement Health Score: ${healthScore}/100 (${scoreLabel(healthScore)})

Score Factors:
Approval Rate: ${approvalRate}%
Payment Completion: ${paymentCompletionRate}%
Overdue Invoices: ${overdueInvoices.length}
High-Risk Invoices: ${highRiskInvoices.length}
Pending Approvals: ${pendingApprovals.length}
Average Vendor Rating: ${averageVendorRating.toFixed(1)}

Recommendation:
${recommendations[0]}`;
}

if (
  query.includes('recommendation') ||
  query.includes('suggestion') ||
  query.includes('what should we do') ||
  query.includes('next action')
) {
  return `AI Procurement Recommendations

${recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
}

if (
  query.includes('risk alerts') ||
  query.includes('risk alert') ||
  query.includes('procurement risk')
) {
  return `Procurement Risk Alerts

${riskAlerts.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
}


  if (
    query.includes('this month') &&
    (query.includes('spend') || query.includes('spent'))
  ) {
    return `This month procurement spend is ${money(thisMonthSpend)} across ${
      purchaseOrders.filter((po: any) => isThisMonth(po.issuedAt)).length
    } purchase orders.`;
  }

  if (
    query.includes('last month') &&
    (query.includes('spend') || query.includes('spent'))
  ) {
    return `Last month procurement spend was ${money(lastMonthSpend)} across ${
      purchaseOrders.filter((po: any) => isLastMonth(po.issuedAt)).length
    } purchase orders.`;
  }

  if (
    query.includes('compare') &&
    query.includes('month')
  ) {
    const difference = thisMonthSpend - lastMonthSpend;
    const direction = difference >= 0 ? 'higher' : 'lower';

    return `This month spend is ${money(thisMonthSpend)}. Last month spend was ${money(
      lastMonthSpend
    )}. This month is ${money(Math.abs(difference))} ${direction} than last month.`;
  }

  if (
    query.includes('total spend') ||
    query.includes('how much') ||
    query.includes('spent') ||
    query.includes('spend')
  ) {
    return `Total procurement spend is ${money(totalSpend)} across ${
      purchaseOrders.length
    } purchase orders.`;
  }

  if (query.includes('paid') || query.includes('payment')) {
    return `Total paid amount is ${money(totalPaid)}. Payment completion rate is ${paymentCompletionRate}%. There are ${paidInvoices.length} paid invoices.`;
  }

  if (
    query.includes('outstanding') ||
    query.includes('unpaid') ||
    query.includes('pending invoice')
  ) {
    if (pendingInvoices.length === 0) {
      return `There are no pending invoices. Outstanding amount is ${money(outstanding)}.`;
    }

    const invoiceList = pendingInvoices
      .slice(0, 5)
      .map((invoice: any, index: number) => {
        const vendor =
          invoice.purchaseOrder?.quotation?.vendor?.companyName ||
          'Unknown Vendor';

        return `${index + 1}. ${invoice.invoiceNumber} — ${vendor} — ${money(
          Number(invoice.amount || 0)
        )}`;
      })
      .join('\n');

    return `Outstanding amount is ${money(outstanding)}. Pending invoice amount is ${money(
      pendingInvoiceAmount
    )}.

Top pending invoices:
${invoiceList}`;
  }

  if (query.includes('overdue')) {
    if (overdueInvoices.length === 0) {
      return 'There are no overdue invoices right now.';
    }

    const invoiceList = overdueInvoices
      .slice(0, 5)
      .map((invoice: any, index: number) => {
        const vendor =
          invoice.purchaseOrder?.quotation?.vendor?.companyName ||
          'Unknown Vendor';

        return `${index + 1}. ${invoice.invoiceNumber} — ${vendor} — ${money(
          Number(invoice.amount || 0)
        )}`;
      })
      .join('\n');

    return `There are ${overdueInvoices.length} overdue invoices totaling ${money(
      overdueAmount
    )}.

Top overdue invoices:
${invoiceList}`;
  }

  if (
    query.includes('high risk') ||
    query.includes('risk invoice') ||
    query.includes('aging risk')
  ) {
    if (highRiskInvoices.length === 0) {
      return 'No high-risk invoices found. All unpaid invoices are within acceptable aging limits.';
    }

    return highRiskInvoices
      .slice(0, 5)
      .map(
        (invoice, index) =>
          `${index + 1}. ${invoice.invoiceNumber} — ${invoice.vendor} — ${money(
            invoice.amount
          )} — ${invoice.ageDays} days old`
      )
      .join('\n');
  }

  if (
    query.includes('pending approval') ||
    query.includes('approvals') ||
    query.includes('approval pending')
  ) {
    if (pendingApprovals.length === 0) {
      return 'There are no quotations waiting for manager approval.';
    }

    const approvalList = pendingApprovals
      .slice(0, 5)
      .map((quotation: any, index: number) => {
        return `${index + 1}. ${quotation.rfq?.title || 'RFQ'} — ${
          quotation.vendor?.companyName || 'Unknown Vendor'
        } — ${money(Number(quotation.totalAmount || 0))}`;
      })
      .join('\n');

    return `${pendingApprovals.length} quotations are waiting for manager approval.

Top pending approvals:
${approvalList}`;
  }

  if (query.includes('approval rate')) {
    return `Current approval rate is ${approvalRate}%.

Approved quotations: ${approvedQuotations.length}
Rejected quotations: ${rejectedQuotations.length}
Pending review: ${pendingApprovals.length}`;
  }

  if (
    query.includes('top vendor') ||
    query.includes('top vendors') ||
    query.includes('vendor spend') ||
    query.includes('highest spend vendor')
  ) {
    if (topVendors.length === 0) {
      return 'No vendor spend data is available yet.';
    }

    return topVendors
      .slice(0, 5)
      .map(
        (vendor: any, index: number) =>
          `${index + 1}. ${vendor.companyName} — ${money(vendor.spend)} across ${
            vendor.purchaseOrders
          } purchase orders`
      )
      .join('\n');
  }

  if (
    query.includes('highest rated vendor') ||
    query.includes('best vendor') ||
    query.includes('highest rating')
  ) {
    if (!highestRatedVendor) {
      return 'No vendor data found.';
    }

    return `Highest rated vendor is ${highestRatedVendor.companyName} with rating ${Number(
      highestRatedVendor.rating || 0
    ).toFixed(1)}. Category: ${highestRatedVendor.category || 'Uncategorized'}.`;
  }

  if (
    query.includes('largest purchase order') ||
    query.includes('largest po') ||
    query.includes('biggest purchase order')
  ) {
    if (!largestPO) {
      return 'No purchase orders found.';
    }

    return `Largest purchase order is ${largestPO.poNumber} for ${
      largestPO.vendor
    }, worth ${money(largestPO.amount)}. Status: ${largestPO.status}.`;
  }

  if (query.includes('rfq')) {
    const matchedRFQs = rfqs.filter((rfq: any) =>
      query.includes(normalize(rfq.title))
    );

    if (matchedRFQs.length > 0) {
      return matchedRFQs
        .slice(0, 5)
        .map(
          (rfq: any, index: number) =>
            `${index + 1}. ${rfq.title} — ${rfq.status} — Deadline: ${new Date(
              rfq.deadline
            ).toLocaleDateString('en-IN')}`
        )
        .join('\n');
    }

    return `There are ${rfqs.length} RFQs in the system. Latest RFQs:
${rfqs
  .slice(0, 5)
  .map(
    (rfq: any, index: number) =>
      `${index + 1}. ${rfq.title} — ${rfq.status}`
  )
  .join('\n')}`;
  }

  if (
    query.includes('vendor count') ||
    query.includes('vendors') ||
    query.includes('supplier')
  ) {
    return `There are ${vendors.length} registered vendors in VendorBridge. Active vendor categories include: ${Array.from(
      new Set(vendors.map((vendor: any) => vendor.category).filter(Boolean))
    ).join(', ') || 'No categories assigned yet'}.`;
  }

  if (query.includes('invoice')) {
    return `Invoice summary:
Total invoices: ${invoices.length}
Pending: ${pendingInvoices.length}
Approved: ${approvedInvoices.length}
Paid: ${paidInvoices.length}
Overdue: ${overdueInvoices.length}
Outstanding amount: ${money(outstanding)}`;
  }

  if (
    query.includes('summary') ||
    query.includes('report') ||
    query.includes('executive summary')
  ) {
    const topVendor = topVendors[0];

    return `VendorBridge Executive Summary

Total Spend: ${money(totalSpend)}
Total Paid: ${money(totalPaid)}
Outstanding: ${money(outstanding)}
Overdue Amount: ${money(overdueAmount)}
Vendors: ${vendors.length}
RFQs: ${rfqs.length}
Purchase Orders: ${purchaseOrders.length}
Invoices: ${invoices.length}
Approval Rate: ${approvalRate}%
Payment Completion: ${paymentCompletionRate}%
Top Vendor: ${topVendor ? topVendor.companyName : 'No spend data'}

Recommendation:
Review overdue invoices, prioritize high-risk payments, and negotiate better pricing with high-spend vendors.`;
  }

 return `I can help with procurement insights. Try asking:

- Executive insights
- Procurement health score
- AI recommendations
- Risk alerts
- How much did we spend?
- This month spend
- Last month spend
- Compare this month vs last month
- Show overdue invoices
- Show unpaid invoices
- High risk invoices
- Top vendors by spend
- Highest rated vendor
- Pending approvals
- Largest purchase order
- Search RFQ by title
- Give procurement summary`;
};