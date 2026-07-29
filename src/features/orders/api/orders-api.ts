import { mockOrders } from "@/mocks/data/orders";
import { orderSchema, ordersSchema } from "@/features/orders/orders.schema";
import type { Order, OrderStatus } from "@/features/orders/orders.types";
import { canTransition } from "@/features/orders/orders.utils";

const READ_DELAY_RANGE_MS = [500, 800] as const;
const MUTATION_DELAY_RANGE_MS = [300, 600] as const;

interface MockApiFailureState {
  failNextRead: boolean;
  failNextMutation: boolean;
}

const failureState: MockApiFailureState = {
  failNextRead: false,
  failNextMutation: false,
};

let ordersStore = cloneOrders(mockOrders);

function cloneOrder(order: Order): Order {
  return structuredClone(order);
}

function cloneOrders(orders: Order[]): Order[] {
  return structuredClone(orders);
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
}

export async function getOrders(): Promise<Order[]> {
  await randomDelay(READ_DELAY_RANGE_MS);

  if (consumeFailure("failNextRead")) {
    throw new Error("Unable to load orders.");
  }

  return ordersSchema.parse(cloneOrders(ordersStore));
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
