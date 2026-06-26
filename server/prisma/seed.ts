import { PrismaClient, Role, VendorStatus, RFQStatus, QuotationStatus, ApprovalStatus, POStatus, InvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQItem.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();

  const hashedPassword = await bcrypt.hash('demo123', 10);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@vendorbridge.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const procurementOfficer = await prisma.user.create({
    data: {
      name: 'Procurement Officer',
      email: 'procurement@vendorbridge.com',
      password: hashedPassword,
      role: Role.PROCUREMENT_OFFICER,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Manager User',
      email: 'manager@vendorbridge.com',
      password: hashedPassword,
      role: Role.MANAGER,
    },
  });

  const finance = await prisma.user.create({
    data: {
      name: 'Finance User',
      email: 'finance@vendorbridge.com',
      password: hashedPassword,
      role: Role.FINANCE,
    },
  });

  // Create Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      companyName: 'Tech Supplies Ltd',
      contactEmail: 'contact@techsupplies.com',
      phone: '+91 98765 43210',
      address: 'Mumbai, Maharashtra',
      category: 'Technology',
      rating: 4.5,
      status: VendorStatus.ACTIVE,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      companyName: 'Office Essentials Co',
      contactEmail: 'info@officeessentials.com',
      phone: '+91 98765 43211',
      address: 'Delhi, NCR',
      category: 'Office Supplies',
      rating: 4.2,
      status: VendorStatus.ACTIVE,
    },
  });

  const vendor3 = await prisma.vendor.create({
    data: {
      companyName: 'Industrial Equipment Inc',
      contactEmail: 'sales@industrial.com',
      phone: '+91 98765 43212',
      address: 'Bangalore, Karnataka',
      category: 'Industrial',
      rating: 3.8,
      status: VendorStatus.ACTIVE,
    },
  });

  // Create Vendor Users
  const vendorUser1 = await prisma.user.create({
    data: {
      name: 'Vendor 1 User',
      email: 'vendor1@techsupplies.com',
      password: hashedPassword,
      role: Role.VENDOR,
      vendorId: vendor1.id,
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      name: 'Vendor 2 User',
      email: 'vendor2@officeessentials.com',
      password: hashedPassword,
      role: Role.VENDOR,
      vendorId: vendor2.id,
    },
  });

  const vendorUser3 = await prisma.user.create({
    data: {
      name: 'Vendor 3 User',
      email: 'vendor3@industrial.com',
      password: hashedPassword,
      role: Role.VENDOR,
      vendorId: vendor3.id,
    },
  });

  // Create RFQs
  const rfq1 = await prisma.rFQ.create({
    data: {
      title: 'Laptops and Monitors for Q4',
      description: 'Procurement of 50 laptops and 50 monitors for new hires',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: RFQStatus.PUBLISHED,
      createdBy: procurementOfficer.id,
      items: {
        create: [
          {
            name: 'Laptop - Dell Latitude 5540',
            description: 'i7, 16GB RAM, 512GB SSD',
            quantity: 50,
            unit: 'units',
          },
          {
            name: 'Monitor - Dell 27" 4K',
            description: '27-inch 4K UHD monitor',
            quantity: 50,
            unit: 'units',
          },
          {
            name: 'Docking Station',
            description: 'USB-C universal docking station',
            quantity: 50,
            unit: 'units',
          },
        ],
      },
    },
    include: { items: true },
  });

  const rfq2 = await prisma.rFQ.create({
    data: {
      title: 'Office Furniture Procurement',
      description: 'Ergonomic chairs and desks for new office space',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: RFQStatus.PUBLISHED,
      createdBy: procurementOfficer.id,
      items: {
        create: [
          {
            name: 'Ergonomic Chair',
            description: 'High-back ergonomic chair with lumbar support',
            quantity: 100,
            unit: 'units',
          },
          {
            name: 'Standing Desk',
            description: 'Electric height-adjustable desk',
            quantity: 50,
            unit: 'units',
          },
          {
            name: 'Filing Cabinet',
            description: '3-drawer locking cabinet',
            quantity: 20,
            unit: 'units',
          },
        ],
      },
    },
    include: { items: true },
  });

  // Create Quotations for RFQ 1
  const quotation1 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendor1.id,
      totalAmount: 2500000,
      deliveryDays: 7,
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Best pricing for bulk order',
      status: QuotationStatus.SUBMITTED,
      items: {
        create: [
          { rfqItemId: rfq1.items[0].id, unitPrice: 35000, quantity: 50, totalPrice: 1750000 },
          { rfqItemId: rfq1.items[1].id, unitPrice: 12000, quantity: 50, totalPrice: 600000 },
          { rfqItemId: rfq1.items[2].id, unitPrice: 3000, quantity: 50, totalPrice: 150000 },
        ],
      },
    },
  });

  const quotation2 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendor2.id,
      totalAmount: 2650000,
      deliveryDays: 10,
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Includes extended warranty',
      status: QuotationStatus.UNDER_REVIEW,
      items: {
        create: [
          { rfqItemId: rfq1.items[0].id, unitPrice: 37000, quantity: 50, totalPrice: 1850000 },
          { rfqItemId: rfq1.items[1].id, unitPrice: 13000, quantity: 50, totalPrice: 650000 },
          { rfqItemId: rfq1.items[2].id, unitPrice: 3000, quantity: 50, totalPrice: 150000 },
        ],
      },
    },
  });

  const quotation3 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendor3.id,
      totalAmount: 2800000,
      deliveryDays: 14,
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Premium quality products',
      status: QuotationStatus.SUBMITTED,
      items: {
        create: [
          { rfqItemId: rfq1.items[0].id, unitPrice: 40000, quantity: 50, totalPrice: 2000000 },
          { rfqItemId: rfq1.items[1].id, unitPrice: 14000, quantity: 50, totalPrice: 700000 },
          { rfqItemId: rfq1.items[2].id, unitPrice: 2000, quantity: 50, totalPrice: 100000 },
        ],
      },
    },
  });

  // Create Quotations for RFQ 2
  const quotation4 = await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      vendorId: vendor1.id,
      totalAmount: 1800000,
      deliveryDays: 15,
      validUntil: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      notes: 'Competitive pricing',
      status: QuotationStatus.SUBMITTED,
      items: {
        create: [
          { rfqItemId: rfq2.items[0].id, unitPrice: 8000, quantity: 100, totalPrice: 800000 },
          { rfqItemId: rfq2.items[1].id, unitPrice: 15000, quantity: 50, totalPrice: 750000 },
          { rfqItemId: rfq2.items[2].id, unitPrice: 12500, quantity: 20, totalPrice: 250000 },
        ],
      },
    },
  });

  const quotation5 = await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      vendorId: vendor2.id,
      totalAmount: 1950000,
      deliveryDays: 12,
      validUntil: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      notes: 'Quick delivery guaranteed',
      status: QuotationStatus.SUBMITTED,
      items: {
        create: [
          { rfqItemId: rfq2.items[0].id, unitPrice: 8500, quantity: 100, totalPrice: 850000 },
          { rfqItemId: rfq2.items[1].id, unitPrice: 16000, quantity: 50, totalPrice: 800000 },
          { rfqItemId: rfq2.items[2].id, unitPrice: 15000, quantity: 20, totalPrice: 300000 },
        ],
      },
    },
  });

  const quotation6 = await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      vendorId: vendor3.id,
      totalAmount: 2100000,
      deliveryDays: 20,
      validUntil: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      notes: 'Industrial grade furniture',
      status: QuotationStatus.SUBMITTED,
      items: {
        create: [
          { rfqItemId: rfq2.items[0].id, unitPrice: 9000, quantity: 100, totalPrice: 900000 },
          { rfqItemId: rfq2.items[1].id, unitPrice: 18000, quantity: 50, totalPrice: 900000 },
          { rfqItemId: rfq2.items[2].id, unitPrice: 15000, quantity: 20, totalPrice: 300000 },
        ],
      },
    },
  });

  // Create Approval for quotation1 (approved)
  await prisma.approval.create({
    data: {
      quotationId: quotation1.id,
      reviewedBy: manager.id,
      status: ApprovalStatus.APPROVED,
      comments: 'Best value for money. Recommended for PO.',
    },
  });

  // Create Approval for quotation2 (pending)
  await prisma.approval.create({
    data: {
      quotationId: quotation2.id,
      reviewedBy: manager.id,
      status: ApprovalStatus.PENDING,
      comments: 'Under review',
    },
  });

  // Create Purchase Order for approved quotation
  const po = await prisma.purchaseOrder.create({
    data: {
      quotationId: quotation1.id,
      poNumber: 'PO-2024-001',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: POStatus.ISSUED,
    },
  });

  // Create Invoice for PO
  const invoice = await prisma.invoice.create({
    data: {
      purchaseOrderId: po.id,
      invoiceNumber: 'INV-2024-001',
      amount: 2500000,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue
      status: InvoiceStatus.OVERDUE,
    },
  });


  // Create Payment for one invoice
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: 2500000,
      method: 'Bank Transfer',
      reference: 'TXN-2024-001',
    },
  });

  // Create Activities
  /*await prisma.activity.createMany({
    data: [
      { userId: procurementOfficer.id, action: 'CREATED', entity: 'RFQ', entityId: rfq1.id },
      { userId: vendor1.id, action: 'SUBMITTED', entity: 'QUOTATION', entityId: quotation1.id },
      { userId: manager.id, action: 'APPROVED', entity: 'QUOTATION', entityId: quotation1.id },
      { userId: finance.id, action: 'PAID', entity: 'INVOICE', entityId: invoice.id },
    ],
  });

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: vendor1.id,
        title: 'New RFQ Available',
        body: 'Laptops and Monitors for Q4 is now open for quotations',
      },
      {
        userId: procurementOfficer.id,
        title: 'Quotation Submitted',
        body: 'Tech Supplies Ltd has submitted a quotation',
      },
      {
        userId: vendor1.id,
        title: 'Quotation Approved',
        body: 'Your quotation has been approved. PO will be issued soon.',
      },
      {
        userId: finance.id,
        title: 'New Invoice',
        body: 'Invoice INV-2024-001 is pending approval',
      },
    ],
  }); */

  console.log('✅ Seed data created successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Admin: admin@vendorbridge.com / demo123');
  console.log('Procurement: procurement@vendorbridge.com / demo123');
  console.log('Manager: manager@vendorbridge.com / demo123');
  console.log('Finance: finance@vendorbridge.com / demo123');
  console.log('Vendor 1: vendor1@techsupplies.com / demo123');
  console.log('Vendor 2: vendor2@officeessentials.com / demo123');
  console.log('Vendor 3: vendor3@industrial.com / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
