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

export const generateInvoicePDFBuffer = async (invoice: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const po = invoice.purchaseOrder;
      const quotation = po.quotation;
      const vendor = quotation.vendor;
      const rfq = quotation.rfq;
      const rfqItems = rfq?.items || [];
      const quotationItems = quotation.items || [];
      const invoiceAmount = Number(invoice.amount || 0);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).font('Helvetica-Bold').fillColor('#111111').text('VendorBridge', 50, 45);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text('B2B Procurement & Vendor Management Platform', 50, 72);

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('INVOICE', 360, 45, {
          align: 'right',
        });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text(`Invoice No: ${safeText(invoice.invoiceNumber)}`, 360, 72, {
          align: 'right',
        })
        .text(`Due Date: ${formatDate(invoice.dueDate)}`, 360, 88, {
          align: 'right',
        });

      doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#DDDDDD').stroke();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Bill From', 50, 140);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text('VendorBridge Finance Team', 50, 160)
        .text('Gandhinagar, Gujarat, India', 50, 176)
        .text('Email: finance@vendorbridge.local', 50, 192);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Vendor Details', 315, 140);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`Company: ${safeText(vendor?.companyName)}`, 315, 160)
        .text(`Email: ${safeText((vendor as any)?.email)}`, 315, 176)
        .text(`Phone: ${safeText((vendor as any)?.phone)}`, 315, 192)
        .text(`Category: ${safeText((vendor as any)?.category)}`, 315, 208);

      doc.roundedRect(50, 245, 495, 78, 8).strokeColor('#DDDDDD').stroke();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Invoice Reference', 65, 260);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`PO Number: ${safeText(po.poNumber)}`, 65, 280)
        .text(`RFQ Title: ${safeText(rfq?.title)}`, 65, 296)
        .text(`Status: ${safeText(invoice.status)}`, 65, 312);

      const tableTop = 365;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Invoice Items', 50, 340);

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
        doc.fontSize(10).font('Helvetica').fillColor('#555555').text('No item details available.', 60, y);
        y += 24;
      } else {
        for (let index = 0; index < itemCount; index += 1) {
          const rfqItem: any = rfqItems[index] || {};
          const quotationItem: any = quotationItems[index] || {};

          if (y > 700) {
            doc.addPage();
            y = 60;
          }

          const itemName = rfqItem.name || quotationItem.name || `Item ${index + 1}`;
          const quantity = Number(rfqItem.quantity || quotationItem.quantity || 1);
          const totalPrice = Number(quotationItem.totalPrice || 0);
          const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;

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

      const gstAmount = invoiceAmount * 0.18;
      const subTotal = invoiceAmount - gstAmount;

      doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#DDDDDD').stroke();

      doc.fontSize(10).font('Helvetica').fillColor('#333333').text('Subtotal', 370, y + 22);
      doc.text(formatMoney(subTotal), 455, y + 22);

      doc.text('GST 18%', 370, y + 40);
      doc.text(formatMoney(gstAmount), 455, y + 40);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Grand Total', 370, y + 62);
      doc.text(formatMoney(invoiceAmount), 455, y + 62);

      const paymentTop = y + 105;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Payment Details', 50, paymentTop);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#444444')
        .text(`Status: ${safeText(invoice.status)}`, 50, paymentTop + 20)
        .text(`Payment Method: ${safeText(invoice.payment?.method)}`, 50, paymentTop + 36)
        .text(`Payment Reference: ${safeText(invoice.payment?.reference)}`, 50, paymentTop + 52)
        .text(`Paid Amount: ${invoice.payment ? formatMoney(invoice.payment.amount) : 'N/A'}`, 50, paymentTop + 68);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111111').text('Terms & Conditions', 50, paymentTop + 110);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#444444')
        .text('1. This invoice is linked to an approved purchase order.', 50, paymentTop + 130)
        .text('2. Payment must be made before the due date unless already paid.', 50, paymentTop + 146)
        .text('3. Duplicate payment attempts are blocked by VendorBridge.', 50, paymentTop + 162)
        .text('4. This is a system-generated invoice.', 50, paymentTop + 178);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Authorized Finance Signature', 360, paymentTop + 220);

      doc.moveTo(360, paymentTop + 212).lineTo(545, paymentTop + 212).strokeColor('#999999').stroke();

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#777777')
        .text('Generated by VendorBridge ERP', 50, 790, {
          align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};