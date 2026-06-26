import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatDateTime = (date: string): string => {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

export const calculateQuotationScore = (
  price: number,
  deliveryDays: number,
  vendorRating: number,
  minPrice: number,
  maxPrice: number,
  minDelivery: number,
  maxDelivery: number
): number => {
  const normalizedPrice = (price - minPrice) / (maxPrice - minPrice || 1);
  const normalizedDelivery = (deliveryDays - minDelivery) / (maxDelivery - minDelivery || 1);

  const score =
    (1 - normalizedPrice) * 0.5 +
    (1 - normalizedDelivery) * 0.3 +
    (vendorRating / 5) * 0.2;

  return Math.round(score * 100);
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ACTIVE: 'text-success',
    INACTIVE: 'text-text-muted',
    BLACKLISTED: 'text-danger',
    DRAFT: 'text-text-muted',
    PUBLISHED: 'text-accent',
    CLOSED: 'text-text-secondary',
    AWARDED: 'text-success',
    SUBMITTED: 'text-accent',
    UNDER_REVIEW: 'text-warning',
    APPROVED: 'text-success',
    REJECTED: 'text-danger',
    PENDING: 'text-warning',
    ISSUED: 'text-accent',
    DELIVERED: 'text-success',
    CANCELLED: 'text-danger',
    PAID: 'text-success',
    OVERDUE: 'text-danger',
  };
  return colors[status] || 'text-text-secondary';
};

export const getStatusBadge = (status: string): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};
