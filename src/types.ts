export type TableStatus = 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'RESERVED';

export type PrintDestination = 'KITCHEN' | 'BAR' | 'DESSERT';

export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';

export type OrderStatus = 'OPEN' | 'IN_PREPARATION' | 'SERVED' | 'CLOSED';

export type PaymentMethod = 'PIX' | 'CREDIT' | 'DEBIT' | 'CASH';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  printDestination: PrintDestination;
  image?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  destination: PrintDestination;
  status: OrderItemStatus;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId: string;
  tableName: string;
  waiterName: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  status: OrderStatus;
  printedToKitchen: boolean;
  printedAt?: string;
}

export interface Table {
  id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
  waiter?: string;
  openedAt?: string;
  customerCount?: number;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  tableId: string;
  tableName: string;
  waiterName: string;
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  itemsSummary: { name: string; quantity: number; price: number }[];
}

export interface PrintJob {
  id: string;
  orderId: string;
  orderNumber: number;
  tableName: string;
  waiterName: string;
  destination: PrintDestination;
  items: { name: string; quantity: number; price?: number; notes?: string }[];
  createdAt: string;
  status: 'PENDING' | 'PRINTED';
}

export interface DailySalesSummary {
  date: string; // YYYY-MM-DD
  totalRevenue: number;
  ordersCount: number;
  averageTicket: number;
  byPaymentMethod: Record<PaymentMethod, number>;
}
