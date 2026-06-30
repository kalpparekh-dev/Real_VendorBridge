import PDFDocument from 'pdfkit';

type ExecutiveReportData = {
  summary: any;
  charts: any;
  topVendors: any[];
  largestPurchaseOrders: any[];
  invoiceAging: any[];
  insights: {
    healthScore: number;
    healthLabel: string;
    recommendations: string[];
    riskAlerts: string[];
  };
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (date?: Date | string) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const colors = {
  background: '#0A0C10',
  surface: '#111318',
  elevated: '#1A1D24',
  border: '#2A2F3A',
  text: '#111827',
  muted: '#6B7280',
  accent: '#2563EB',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  white: '#FFFFFF',
  light: '#F8FAFC',
};

const page = {
  margin: 40,
  width: 595,
  height: 842,
};

const addPageBackground = (doc: PDFKit.PDFDocument) => {
  doc.rect(0, 0, page.width, page.height).fill(colors.light);
};

const addHeader = (doc: PDFKit.PDFDocument) => {
  doc
    .fillColor(colors.accent)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('VendorBridge', page.margin, 32);

  doc
    .fillColor(colors.muted)
    .fontSize(9)
    .font('Helvetica')
    .text('Enterprise Procurement & Vendor Management SaaS', page.margin, 58);

  doc
    .fillColor(colors.text)
    .fontSize(10)
    .font('Helvetica')
    .text(`Generated: ${formatDate(new Date())}`, 400, 36, {
      width: 150,
      align: 'right',
    });

  doc
    .moveTo(page.margin, 78)
    .lineTo(page.width - page.margin, 78)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();
};

const addFooter = (doc: PDFKit.PDFDocument, pageNumber: number) => {
  doc
    .moveTo(page.margin, 805)
    .lineTo(page.width - page.margin, 805)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();

  doc
    .fillColor(colors.muted)
    .fontSize(8)
    .font('Helvetica')
    .text('VendorBridge Executive Report', page.margin, 815);

  doc
    .fillColor(colors.muted)
    .fontSize(8)
    .text(`Page ${pageNumber}`, 500, 815, {
      width: 50,
      align: 'right',
    });
};

const sectionTitle = (
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number
) => {
  doc
    .fillColor(colors.text)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(title, x, y);

  doc
    .moveTo(x, y + 22)
    .lineTo(page.width - page.margin, y + 22)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();
};

const metricCard = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  color = colors.accent
) => {
  doc
    .roundedRect(x, y, width, 76, 12)
    .fillAndStroke(colors.white, '#E5E7EB');

  doc
    .fillColor(colors.muted)
    .fontSize(8)
    .font('Helvetica')
    .text(label.toUpperCase(), x + 14, y + 16, {
      width: width - 28,
    });

  doc
    .fillColor(color)
    .fontSize(15)
    .font('Helvetica-Bold')
    .text(value, x + 14, y + 38, {
      width: width - 28,
    });
};

const tableHeader = (
  doc: PDFKit.PDFDocument,
  headers: string[],
  x: number,
  y: number,
  widths: number[]
) => {
  let currentX = x;

  doc
    .roundedRect(x, y, widths.reduce((a, b) => a + b, 0), 28, 6)
    .fill(colors.elevated);

  headers.forEach((header, index) => {
    doc
      .fillColor(colors.white)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(header, currentX + 8, y + 10, {
        width: widths[index] - 16,
      });

    currentX += widths[index];
  });
};

const tableRow = (
  doc: PDFKit.PDFDocument,
  values: string[],
  x: number,
  y: number,
  widths: number[]
) => {
  let currentX = x;

  doc
    .roundedRect(x, y, widths.reduce((a, b) => a + b, 0), 30, 4)
    .fillAndStroke(colors.white, '#E5E7EB');

  values.forEach((value, index) => {
    doc
      .fillColor(colors.text)
      .fontSize(8)
      .font('Helvetica')
      .text(value, currentX + 8, y + 10, {
        width: widths[index] - 16,
        ellipsis: true,
      });

    currentX += widths[index];
  });
};

const bulletList = (
  doc: PDFKit.PDFDocument,
  items: string[],
  x: number,
  y: number,
  color = colors.text
) => {
  let currentY = y;

  items.forEach((item) => {
    doc
      .fillColor(color)
      .fontSize(9)
      .font('Helvetica')
      .text(`• ${item}`, x, currentY, {
        width: page.width - x - page.margin,
      });

    currentY += 18;
  });

  return currentY;
};

const createInsightsFromData = (data: ExecutiveReportData) => {
  const summary = data.summary || {};
  const invoiceAging = data.invoiceAging || [];
  const topVendors = data.topVendors || [];

  const overdueInvoices = invoiceAging.filter(
    (invoice: any) => invoice.status === 'OVERDUE'
  );

  const highRiskInvoices = invoiceAging.filter(
    (invoice: any) => invoice.status !== 'PAID' && Number(invoice.ageDays || 0) > 30
  );

  const approvalRate = Number(summary.approvalRate || 0);
  const paymentCompletionRate = Number(summary.paymentCompletionRate || 0);

  let healthScore = 100;

  if (approvalRate < 80) healthScore -= 10;
  if (paymentCompletionRate < 75) healthScore -= 15;
  if (overdueInvoices.length > 0) {
    healthScore -= Math.min(overdueInvoices.length * 5, 20);
  }
  if (highRiskInvoices.length > 0) {
    healthScore -= Math.min(highRiskInvoices.length * 5, 15);
  }
  if (Number(summary.submittedQuotations || 0) > 5) {
    healthScore -= 10;
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthLabel =
    healthScore >= 90
      ? 'Excellent'
      : healthScore >= 75
      ? 'Good'
      : healthScore >= 60
      ? 'Warning'
      : 'Critical';

  const recommendations: string[] = [];

  if (Number(summary.overdueInvoices || 0) > 0) {
    recommendations.push(
      `Prioritize overdue invoices worth ${formatCurrency(summary.overdueAmount || 0)}.`
    );
  }

  if (Number(summary.submittedQuotations || 0) > 0) {
    recommendations.push(
      `Review ${summary.submittedQuotations} pending quotations to reduce procurement delays.`
    );
  }

  if (paymentCompletionRate < 80) {
    recommendations.push(
      'Improve payment completion by clearing pending and approved invoices.'
    );
  }

  if (topVendors[0]) {
    recommendations.push(
      `Negotiate better pricing with ${topVendors[0].companyName}, your highest-spend vendor.`
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      'Procurement operations look stable. Continue monitoring vendor spend, invoice aging and approval delays.'
    );
  }

  const riskAlerts: string[] = [];

  if (Number(summary.overdueInvoices || 0) > 0) {
    riskAlerts.push(`${summary.overdueInvoices} overdue invoices detected.`);
  }

  if (highRiskInvoices.length > 0) {
    riskAlerts.push(`${highRiskInvoices.length} invoices are older than 30 days.`);
  }

  if (Number(summary.submittedQuotations || 0) > 5) {
    riskAlerts.push(`${summary.submittedQuotations} quotations are waiting for approval.`);
  }

  if (paymentCompletionRate < 70) {
    riskAlerts.push(`Payment completion is low at ${paymentCompletionRate}%.`);
  }

  if (!riskAlerts.length) {
    riskAlerts.push('No major procurement risks detected.');
  }

  return {
    healthScore,
    healthLabel,
    recommendations,
    riskAlerts,
  };
};

export const generateExecutiveReportPdf = (
  data: ExecutiveReportData
): PDFKit.PDFDocument => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: page.margin,
  });

  const insights = data.insights || createInsightsFromData(data);
  const summary = data.summary || {};
  const charts = data.charts || {};
  const topVendors = data.topVendors || [];
  const largestPurchaseOrders = data.largestPurchaseOrders || [];
  const invoiceAging = data.invoiceAging || [];

  let pageNumber = 1;

  addPageBackground(doc);
  addHeader(doc);
  addFooter(doc, pageNumber);

  doc
    .fillColor(colors.text)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('Executive Procurement Report', page.margin, 110);

  doc
    .fillColor(colors.muted)
    .fontSize(10)
    .font('Helvetica')
    .text(
      'A consolidated executive overview of procurement spend, vendor performance, invoice risk, purchase orders and AI-driven recommendations.',
      page.margin,
      145,
      {
        width: 500,
        lineGap: 4,
      }
    );

  doc
    .roundedRect(page.margin, 190, 515, 92, 14)
    .fillAndStroke(colors.white, '#E5E7EB');

  doc
    .fillColor(colors.accent)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(`${insights.healthScore}/100`, page.margin + 22, 216);

  doc
    .fillColor(colors.text)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(`Procurement Health Score — ${insights.healthLabel}`, page.margin + 130, 213);

  doc
    .fillColor(colors.muted)
    .fontSize(9)
    .font('Helvetica')
    .text(
      'Calculated using approval rate, payment completion, overdue invoices, high-risk aging and pending approval pressure.',
      page.margin + 130,
      236,
      {
        width: 350,
        lineGap: 3,
      }
    );

  metricCard(
    doc,
    'Total Spend',
    formatCurrency(summary.totalSpend || 0),
    page.margin,
    315,
    120,
    colors.accent
  );

  metricCard(
    doc,
    'Total Paid',
    formatCurrency(summary.totalPaid || 0),
    page.margin + 132,
    315,
    120,
    colors.success
  );

  metricCard(
    doc,
    'Outstanding',
    formatCurrency(summary.outstandingAmount || 0),
    page.margin + 264,
    315,
    120,
    colors.warning
  );

  metricCard(
    doc,
    'Overdue',
    formatCurrency(summary.overdueAmount || 0),
    page.margin + 396,
    315,
    120,
    colors.danger
  );

  metricCard(
    doc,
    'Approval Rate',
    `${summary.approvalRate || 0}%`,
    page.margin,
    410,
    120,
    colors.success
  );

  metricCard(
    doc,
    'Payment Rate',
    `${summary.paymentCompletionRate || 0}%`,
    page.margin + 132,
    410,
    120,
    colors.success
  );

  metricCard(
    doc,
    'Vendors',
    String(summary.vendors || 0),
    page.margin + 264,
    410,
    120,
    colors.accent
  );

  metricCard(
    doc,
    'Invoices',
    String(summary.invoices || 0),
    page.margin + 396,
    410,
    120,
    colors.accent
  );

  sectionTitle(doc, 'AI Recommendations', page.margin, 525);

  bulletList(doc, insights.recommendations, page.margin, 565, colors.text);

  sectionTitle(doc, 'Risk Alerts', page.margin, 670);

  bulletList(doc, insights.riskAlerts, page.margin, 710, colors.danger);

  doc.addPage();
  pageNumber += 1;

  addPageBackground(doc);
  addHeader(doc);
  addFooter(doc, pageNumber);

  sectionTitle(doc, 'Procurement Summary', page.margin, 110);

  metricCard(
    doc,
    'RFQs',
    String(summary.rfqs || 0),
    page.margin,
    150,
    120,
    colors.accent
  );

  metricCard(
    doc,
    'Quotations',
    String(summary.quotations || 0),
    page.margin + 132,
    150,
    120,
    colors.accent
  );

  metricCard(
    doc,
    'Purchase Orders',
    String(summary.purchaseOrders || 0),
    page.margin + 264,
    150,
    120,
    colors.accent
  );

  metricCard(
    doc,
    'Payments',
    String(summary.payments || 0),
    page.margin + 396,
    150,
    120,
    colors.success
  );

  metricCard(
    doc,
    'Pending Invoices',
    String(summary.pendingInvoices || 0),
    page.margin,
    245,
    120,
    colors.warning
  );

  metricCard(
    doc,
    'Paid Invoices',
    String(summary.paidInvoices || 0),
    page.margin + 132,
    245,
    120,
    colors.success
  );

  metricCard(
    doc,
    'Overdue Invoices',
    String(summary.overdueInvoices || 0),
    page.margin + 264,
    245,
    120,
    colors.danger
  );

  metricCard(
    doc,
    'Savings',
    formatCurrency(summary.estimatedSavings || 0),
    page.margin + 396,
    245,
    120,
    colors.success
  );

  sectionTitle(doc, 'Spend by Category', page.margin, 365);

  tableHeader(
    doc,
    ['Category', 'Amount'],
    page.margin,
    405,
    [300, 180]
  );

  let y = 442;

  (charts.spendByCategory || []).slice(0, 8).forEach((item: any) => {
    tableRow(
      doc,
      [
        item.category || 'Uncategorized',
        formatCurrency(Number(item.amount || 0)),
      ],
      page.margin,
      y,
      [300, 180]
    );

    y += 34;
  });

    sectionTitle(doc, 'Top Vendors by Spend', page.margin, y + 20);

  tableHeader(
    doc,
    ['Vendor', 'Purchase Orders', 'Spend'],
    page.margin,
    y + 55,
    [240, 120, 120]
  );

  let vendorY = y + 92;

  topVendors.slice(0, 8).forEach((vendor: any) => {
    tableRow(
      doc,
      [
        vendor.companyName || 'Unknown Vendor',
        String(vendor.purchaseOrders || 0),
        formatCurrency(Number(vendor.spend || 0)),
      ],
      page.margin,
      vendorY,
      [240, 120, 120]
    );

    vendorY += 34;
  });

  doc.addPage();
  pageNumber++;

  addPageBackground(doc);
  addHeader(doc);
  addFooter(doc, pageNumber);

  sectionTitle(doc, 'Largest Purchase Orders', page.margin, 110);

  tableHeader(
    doc,
    ['PO Number', 'Vendor', 'Amount', 'Status'],
    page.margin,
    145,
    [110, 190, 100, 90]
  );

  let poY = 182;

  largestPurchaseOrders.forEach((po: any) => {
    tableRow(
      doc,
      [
        po.poNumber || '-',
        po.vendor || '-',
        formatCurrency(Number(po.amount || 0)),
        po.status || '-',
      ],
      page.margin,
      poY,
      [110, 190, 100, 90]
    );

    poY += 34;
  });

  sectionTitle(doc, 'Invoice Aging', page.margin, poY + 25);

  tableHeader(
    doc,
    ['Invoice', 'Vendor', 'Status', 'Age', 'Amount'],
    page.margin,
    poY + 60,
    [90, 180, 70, 60, 90]
  );

  let invoiceY = poY + 97;

  invoiceAging.slice(0, 10).forEach((invoice: any) => {
    tableRow(
      doc,
      [
        invoice.invoiceNumber || '-',
        invoice.vendor || '-',
        invoice.status || '-',
        `${invoice.ageDays || 0} days`,
        formatCurrency(Number(invoice.amount || 0)),
      ],
      page.margin,
      invoiceY,
      [90, 180, 70, 60, 90]
    );

    invoiceY += 34;
  });

  sectionTitle(doc, 'Executive Notes', page.margin, invoiceY + 25);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(colors.text)
    .text(
      `This report was automatically generated by VendorBridge Enterprise SaaS.

The Procurement Health Score is calculated using approval rate, payment completion, overdue invoices, invoice aging and workflow efficiency.

The AI recommendations shown in this report are generated from current procurement data and are intended to support executive decision making.

VendorBridge provides procurement visibility across Vendors, RFQs, Quotations, Purchase Orders, Invoices, Payments, Audit Logs and Executive Analytics.`,
      page.margin,
      invoiceY + 55,
      {
        width: 500,
        lineGap: 6,
      }
    );

  doc
    .moveDown(2)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.accent)
    .text('VendorBridge Enterprise Procurement Platform', page.margin);

  doc.end();

  return doc;
};