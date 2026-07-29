export interface DashboardMetric {
  id:
    | "active-guests"
    | "pending-orders"
    | "revenue-today"
    | "completed-orders"
    | "average-order-value";
  label: string;
  value: number;
  format: "number" | "currency";
  description: string;
}

export interface TopSellingService {
  service: string;
  quantity: number;
  orderCount: number;
  revenue: number;
}

export interface DashboardOverview {
  metrics: DashboardMetric[];
  topServices: TopSellingService[];
}
