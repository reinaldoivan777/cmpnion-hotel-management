import {
  FINAL_ORDER_STATUSES,
  SLA_LIMIT_MINUTES,
} from "@/features/orders/orders.constants";
import type { Order, OrderStatus } from "@/features/orders/orders.types";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  New: ["Acknowledged", "Cancelled"],
  Acknowledged: ["In Progress", "Cancelled"],
  "In Progress": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export function canTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function isFinalOrderStatus(status: OrderStatus): boolean {
  return FINAL_ORDER_STATUSES.includes(
    status as (typeof FINAL_ORDER_STATUSES)[number],
  );
}

export function isSlaBreached(order: Order, now: Date): boolean {
  if (order.status !== "New") {
    return false;
  }

  const orderTime = new Date(order.orderTime);
  const ageInMinutes = (now.getTime() - orderTime.getTime()) / 60_000;

  return ageInMinutes > SLA_LIMIT_MINUTES;
}

export function getNextPrimaryStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case "New":
      return "Acknowledged";
    case "Acknowledged":
      return "In Progress";
    case "In Progress":
      return "Completed";
    case "Completed":
    case "Cancelled":
      return null;
  }
}
