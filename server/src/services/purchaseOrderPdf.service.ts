import PDFDocument = require('pdfkit');

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

export const generatePurchaseOrderPDFBuffer = async (
  po: any
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const vendor = po.quotation?.vendor;
      const rfq = po.quotation?.rfq;
      const quotationItems = po.quotation?.items || [];
      const rfqItems = rfq?.items || [];
      const totalAmount = Number(po.quotation?.totalAmount || 0);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('VendorBridge', 50, 45);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text('B2B Procurement & Vendor Management Platform', 50, 72);

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('PURCHASE ORDER', 360, 45, {
          align: 'right',
        });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text(`PO No: ${safeText(po.poNumber)}`, 360, 72, {
          align: 'right',
        })
        .text(
          `Date: ${formatDate((po as any).issuedAt || (po as any).createdAt)}`,
          360,
          88,
          {
            align: 'right',
          }
        );

      doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#DDDDDD').stroke();

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Company Details', 50, 140);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text('VendorBridge Procurement Team', 50, 160)
        .text('Gandhinagar, Gujarat, India', 50, 176)
        .text('Email: procurement@vendorbridge.local', 50, 192);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Vendor Details', 315, 140);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`Company: ${safeText(vendor?.companyName)}`, 315, 160)
        .text(`Email: ${safeText((vendor as any)?.email)}`, 315, 176)
        .text(`Phone: ${safeText((vendor as any)?.phone)}`, 315, 192)
        .text(`Category: ${safeText((vendor as any)?.category)}`, 315, 208);

      doc.roundedRect(50, 245, 495, 70, 8).strokeColor('#DDDDDD').stroke();

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('RFQ Reference', 65, 260);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`RFQ Title: ${safeText(rfq?.title)}`, 65, 280)
        .text(`Quotation Amount: ${formatMoney(totalAmount)}`, 65, 296);

      const tableTop = 355;

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Line Items', 50, 330);

      doc.roundedRect(50, tableTop, 495, 28, 4).fillColor('#F3F4F6').fill();

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Item', 60, tableTop + 9)
        .text('Qty', 265, tableTop + 9)
        .text('Unit Price', 335, tableTop + 9)
        .text('Total', 455, tableTop + 9);

      let y = tableTop + 38;
      const itemCount = Math.max(rfqItems.length, quotationItems.length);

      if (itemCount === 0) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#555555')
          .text('No item details available.', 60, y);
      } else {
        for (let index = 0; index < itemCount; index++) {
          const rfqItem: any = rfqItems[index] || {};
          const quotationItem: any = quotationItems[index] || {};

          const itemName =
            rfqItem.name || quotationItem.name || `Item ${index + 1}`;
          const quantity = Number(
            rfqItem.quantity || quotationItem.quantity || 1
          );
          const totalPrice = Number(quotationItem.totalPrice || 0);
          const unitPrice =
            quantity > 0 ? totalPrice / quantity : totalPrice;

          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#333333')
            .text(safeText(itemName), 60, y, { width: 185 })
            .text(String(quantity), 265, y)
            .text(formatMoney(unitPrice), 335, y)
            .text(formatMoney(totalPrice), 455, y);

          y += 28;
        }
      }

      doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#DDDDDD').stroke();

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Grand Total', 350, y + 22)
        .text(formatMoney(totalAmount), 455, y + 22);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};