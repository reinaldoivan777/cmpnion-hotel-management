import type { Order } from "@/features/orders/orders.types";
import type {
  DashboardMetric,
  DashboardOverview,
  TopSellingService,
} from "@/features/dashboard/dashboard.types";

const PENDING_STATUSES = new Set<Order["status"]>([
  "New",
  "Acknowledged",
  "In Progress",
]);

function isNonCancelled(order: Order): boolean {
  return order.status !== "Cancelled";
}

function isPaidNonCancelled(order: Order): boolean {
  return isNonCancelled(order) && order.paymentStatus === "Paid";
}

function isSameLocalDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function sumAmounts(orders: Order[]): number {
  return orders.reduce((total, order) => total + order.amount, 0);
}

export function selectActiveGuests(orders: Order[]): number {
  return new Set(
    orders.filter(isNonCancelled).map((order) => order.roomNumber),
  ).size;
}

export function selectPendingOrders(orders: Order[]): number {
  return orders.filter((order) => PENDING_STATUSES.has(order.status)).length;
}

export function selectRevenueToday(orders: Order[], now = new Date()): number {
  return sumAmounts(
    orders.filter(
      (order) =>
        isPaidNonCancelled(order) &&
        isSameLocalDay(new Date(order.orderTime), now),
    ),
  );
}

export function selectCompletedOrders(orders: Order[]): number {
  return orders.filter((order) => order.status === "Completed").length;
}

export function selectAverageOrderValue(orders: Order[]): number {
  const paidOrders = orders.filter(isPaidNonCancelled);

  if (paidOrders.length === 0) {
    return 0;
  }

  return sumAmounts(paidOrders) / paidOrders.length;
}

export function selectTopSellingServices(orders: Order[]): TopSellingService[] {
  const services = new Map<string, TopSellingService>();

  for (const order of orders.filter(isNonCancelled)) {
    const current = services.get(order.service) ?? {
      service: order.service,
      quantity: 0,
      orderCount: 0,
      revenue: 0,
    };

    services.set(order.service, {
      ...current,
      quantity: current.quantity + order.quantity,
      orderCount: current.orderCount + 1,
      revenue: current.revenue + order.amount,
    });
  }

  return Array.from(services.values()).sort((serviceA, serviceB) => {
    if (serviceB.quantity !== serviceA.quantity) {
      return serviceB.quantity - serviceA.quantity;
    }

    return serviceB.revenue - serviceA.revenue;
  });
}

export function selectDashboardOverview(
  orders: Order[],
  now = new Date(),
): DashboardOverview {
  const metrics: DashboardMetric[] = [
    {
      id: "active-guests",
      label: "Active Guests",
      value: selectActiveGuests(orders),
      format: "number",
      description: "Unique rooms with non-cancelled orders",
    },
    {
      id: "pending-orders",
      label: "Pending Orders",
      value: selectPendingOrders(orders),
      format: "number",
      description: "New, acknowledged, or in progress",
    },
    {
      id: "revenue-today",
      label: "Revenue Today",
      value: selectRevenueToday(orders, now),
      format: "currency",
      description: "Paid non-cancelled orders today",
    },
    {
      id: "completed-orders",
      label: "Completed Orders",
      value: selectCompletedOrders(orders),
      format: "number",
      description: "Requests finished by staff",
    },
    {
      id: "average-order-value",
      label: "Average Order Value",
      value: selectAverageOrderValue(orders),
      format: "currency",
      description: "Paid non-cancelled order average",
    },
  ];

  return {
    metrics,
    topServices: selectTopSellingServices(orders),
  };
}
