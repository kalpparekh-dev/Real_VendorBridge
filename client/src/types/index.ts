export type Role = 'ADMIN' | 'PROCUREMENT_OFFICER' | 'MANAGER' | 'FINANCE' | 'VENDOR';
export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
export type RFQStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'AWARDED';
export type QuotationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'AWARDED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type POStatus = 'ISSUED' | 'DELIVERED' | 'CANCELLED';
export type InvoiceStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  vendor?: Vendor;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  status: VendorStatus;
  createdAt: string;
}

export interface RFQItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
}

export interface RFQ {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  status: RFQStatus;
  createdBy: string;
  items: RFQItem[];
  quotations?: Quotation[];
  createdAt: string;
}

export interface QuotationItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  rfqId: string;
  rfq?: RFQ;
  vendorId: string;
  vendor?: Vendor;
  totalAmount: number;
  deliveryDays: number;
  validUntil: string;
  notes?: string;
  status: QuotationStatus;
  items: QuotationItem[];
  approval?: Approval;
  purchaseOrder?: PurchaseOrder;
  createdAt: string;
}

export interface Approval {
  id: string;
  quotationId: string;
  reviewedBy: string;
  status: ApprovalStatus;
  comments?: string;
  reviewedAt: string;
}

export interface PurchaseOrder {
  id: string;
  quotationId: string;
  quotation?: Quotation;
  poNumber: string;
  issuedAt: string;
  deliveryDate: string;
  status: POStatus;
  invoice?: Invoice;
}

export interface Invoice {
  id: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrder;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  fileUrl?: string;
  payment?: Payment;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: any;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
