import { mockOrders } from "@/mocks/data/orders";
import { selectDashboardOverview } from "@/features/dashboard/dashboard.selectors";
import { orderSchema, ordersSchema } from "@/features/orders/orders.schema";
import { selectFilteredOrders } from "@/features/orders/orders.selectors";
import type { DashboardOverview } from "@/features/dashboard/dashboard.types";
import type {
  Order,
  OrderListParams,
  OrderListResponse,
  OrderRealtimeEvent,
  OrderStatus,
} from "@/features/orders/orders.types";
import {
  canTransition,
  isSlaBreached,
} from "@/features/orders/orders.utils";

const READ_DELAY_RANGE_MS = [500, 800] as const;
const MUTATION_DELAY_RANGE_MS = [300, 600] as const;
const REALTIME_EVENT_INTERVAL_MS = 12_000;
const realtimeGuestNames = [
  "Nora Blake",
  "Leo Morgan",
  "Iris Coleman",
  "Caleb Foster",
  "Zara Hughes",
] as const;
const realtimeRooms = ["214", "528", "731", "942", "1106"] as const;
const realtimeServices = [
  "Room Service",
  "Housekeeping",
  "Laundry",
  "Extra Bed",
  "Spa & Massage",
] as const satisfies readonly Order["service"][];
const realtimeAmounts: Record<Order["service"], number> = {
  "Room Service": 26,
  Housekeeping: 0,
  Laundry: 12,
  "Extra Bed": 30,
  "Spa & Massage": 120,
};

interface MockApiFailureState {
  failNextRead: boolean;
  failNextMutation: boolean;
}

const failureState: MockApiFailureState = {
  failNextRead: false,
  failNextMutation: false,
};

let ordersStore = cloneOrders(mockOrders);
let realtimeOrderSequence = 0;
let realtimeInterval: ReturnType<typeof globalThis.setInterval> | null = null;
let realtimeTickCount = 0;
const realtimeListeners = new Set<(event: OrderRealtimeEvent) => void>();
const overdueNotificationOrderIds = new Set<string>();

function cloneOrder(order: Order): Order {
  return structuredClone(order);
}

function cloneOrders(orders: Order[]): Order[] {
  return structuredClone(orders);
}

function cloneDashboardOverview(overview: DashboardOverview): DashboardOverview {
  return structuredClone(overview);
}

function randomDelay([min, max]: readonly [number, number]): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delay);
  });
}

function consumeFailure(key: keyof MockApiFailureState): boolean {
  if (!failureState[key]) {
    return false;
  }

  failureState[key] = false;
  return true;
}

export function failNextOrdersRead(): void {
  failureState.failNextRead = true;
}

export function failNextOrderMutation(): void {
  failureState.failNextMutation = true;
}

export function resetMockOrders(): void {
  ordersStore = cloneOrders(mockOrders);
  failureState.failNextRead = false;
  failureState.failNextMutation = false;
  realtimeOrderSequence = 0;
  realtimeTickCount = 0;
  overdueNotificationOrderIds.clear();
}

function createRealtimeOrder(): Order {
  realtimeOrderSequence += 1;
  const index = realtimeOrderSequence - 1;
  const service = realtimeServices[index % realtimeServices.length];
  const quantity =
    service === "Spa & Massage" || service === "Extra Bed"
      ? 1
      : (index % 3) + 1;

  return {
    id: `ORD-${String(realtimeOrderSequence).padStart(4, "0")}`,
    guestName: realtimeGuestNames[index % realtimeGuestNames.length],
    roomNumber: realtimeRooms[index % realtimeRooms.length],
    service,
    quantity,
    amount: realtimeAmounts[service] * quantity,
    currency: "USD",
    specialRequest:
      index % 2 === 0 ? "Live request from the guest app." : null,
    orderTime: new Date().toISOString(),
    status: "New",
    paymentStatus: index % 4 === 0 ? "Pending" : "Paid",
  };
}

function createRealtimeEvent(
  type: OrderRealtimeEvent["type"],
  order: Order,
): OrderRealtimeEvent {
  return {
    id: `${type}-${order.id}-${Date.now()}`,
    order: cloneOrder(order),
    occurredAt: new Date().toISOString(),
    type,
  };
}

function emitRealtimeEvent(event: OrderRealtimeEvent): void {
  for (const listener of realtimeListeners) {
    listener(event);
  }
}

function emitNewOrderEvent(): OrderRealtimeEvent {
  const order = createRealtimeOrder();
  const event = createRealtimeEvent("new-order", order);

  ordersStore = [order, ...ordersStore];
  emitRealtimeEvent(event);

  return event;
}

function emitNextOverdueOrderEvent(): OrderRealtimeEvent | null {
  const overdueOrder = ordersStore.find(
    (order) =>
      order.status === "New" &&
      isSlaBreached(order, new Date()) &&
      !overdueNotificationOrderIds.has(order.id),
  );

  if (!overdueOrder) {
    return null;
  }

  overdueNotificationOrderIds.add(overdueOrder.id);
  const event = createRealtimeEvent("overdue-order", overdueOrder);
  emitRealtimeEvent(event);

  return event;
}

function tickRealtimeEvents(): void {
  realtimeTickCount += 1;

  if (realtimeTickCount % 2 === 1) {
    emitNewOrderEvent();
    return;
  }

  emitNextOverdueOrderEvent();
}

function startRealtimeEvents(): void {
  if (realtimeInterval) {
    return;
  }

  realtimeInterval = globalThis.setInterval(
    tickRealtimeEvents,
    REALTIME_EVENT_INTERVAL_MS,
  );
}

function stopRealtimeEvents(): void {
  if (!realtimeInterval) {
    return;
  }

  globalThis.clearInterval(realtimeInterval);
  realtimeInterval = null;
}

export function subscribeToOrderRealtimeEvents(
  listener: (event: OrderRealtimeEvent) => void,
): () => void {
  realtimeListeners.add(listener);
  startRealtimeEvents();

  return () => {
    realtimeListeners.delete(listener);

    if (realtimeListeners.size === 0) {
      stopRealtimeEvents();
    }
  };
}

export function triggerMockOrderRealtimeEvent(
  type: OrderRealtimeEvent["type"],
): OrderRealtimeEvent | null {
  return type === "new-order"
    ? emitNewOrderEvent()
    : emitNextOverdueOrderEvent();
}

export async function getOrdersPage({
  filters,
  page,
  pageSize,
}: OrderListParams): Promise<OrderListResponse> {
  await randomDelay(READ_DELAY_RANGE_MS);

  if (consumeFailure("failNextRead")) {
    throw new Error("Unable to load orders.");
  }

  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const filteredOrders = selectFilteredOrders(ordersStore, filters);
  const total = filteredOrders.length;
  const maxPage = Math.max(1, Math.ceil(total / safePageSize));
  const resolvedPage = Math.min(safePage, maxPage);
  const startIndex = (resolvedPage - 1) * safePageSize;
  const pageOrders = filteredOrders.slice(
    startIndex,
    startIndex + safePageSize,
  );

  return {
    orders: ordersSchema.parse(cloneOrders(pageOrders)),
    page: resolvedPage,
    pageSize: safePageSize,
    total,
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  await randomDelay(READ_DELAY_RANGE_MS);

  if (consumeFailure("failNextRead")) {
    throw new Error("Unable to load dashboard overview.");
  }

  return cloneDashboardOverview(selectDashboardOverview(ordersStore));
}

export async function getOrderById(orderId: string): Promise<Order> {
  await randomDelay(READ_DELAY_RANGE_MS);

  if (consumeFailure("failNextRead")) {
    throw new Error("Unable to load order.");
  }

  const order = ordersStore.find((item) => item.id === orderId);

  if (!order) {
    throw new Error(`Order ${orderId} was not found.`);
  }

  return orderSchema.parse(cloneOrder(order));
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<Order> {
  await randomDelay(MUTATION_DELAY_RANGE_MS);

  if (consumeFailure("failNextMutation")) {
    throw new Error("Unable to update order status.");
  }

  const orderIndex = ordersStore.findIndex((item) => item.id === orderId);

  if (orderIndex === -1) {
    throw new Error(`Order ${orderId} was not found.`);
  }

  const currentOrder = ordersStore[orderIndex];

  if (!canTransition(currentOrder.status, nextStatus)) {
    throw new Error(
      `Invalid status transition from ${currentOrder.status} to ${nextStatus}.`,
    );
  }

  const updatedOrder = {
    ...currentOrder,
    status: nextStatus,
  };

  ordersStore = ordersStore.map((order) =>
    order.id === orderId ? updatedOrder : order,
  );

  return orderSchema.parse(cloneOrder(updatedOrder));
}
