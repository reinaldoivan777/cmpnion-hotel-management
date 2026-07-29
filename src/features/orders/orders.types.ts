import type {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SERVICE_TYPES,
} from "@/features/orders/orders.constants";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type ServiceType = (typeof SERVICE_TYPES)[number];

export interface Order {
  id: string;
  guestName: string;
  roomNumber: string;
  service: ServiceType;
  quantity: number;
  amount: number;
  currency: "USD";
  specialRequest: string | null;
  orderTime: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

export interface OrderFilters {
  search: string;
  status: OrderStatus | "All";
  service: ServiceType | "All";
  sort: "newest" | "oldest";
}

export interface OrderListParams {
  filters: OrderFilters;
  page: number;
  pageSize: number;
}

export interface OrderListResponse {
  orders: Order[];
  page: number;
  pageSize: number;
  total: number;
}

export type OrderRealtimeEventType = "new-order" | "overdue-order";

export interface OrderRealtimeEvent {
  id: string;
  order: Order;
  occurredAt: string;
  type: OrderRealtimeEventType;
}
