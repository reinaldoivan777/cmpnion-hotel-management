import { beforeEach, describe, expect, test } from "bun:test";

import {
  failNextOrderMutation,
  failNextOrdersRead,
  getOrderById,
  getOrders,
  resetMockOrders,
  updateOrderStatus,
} from "@/features/orders/api/orders-api";

describe("orders mock API failure scenarios", () => {
  beforeEach(() => {
    resetMockOrders();
  });

  test("fails the next read once and then succeeds on retry", async () => {
    failNextOrdersRead();

    await expect(getOrders()).rejects.toThrow("Unable to load orders.");

    const retryOrders = await getOrders();
    expect(retryOrders.length).toBeGreaterThan(0);
  });

  test("fails the next mutation once and preserves the previous status", async () => {
    failNextOrderMutation();

    await expect(updateOrderStatus("ORD-1001", "Acknowledged")).rejects.toThrow(
      "Unable to update order status.",
    );

    const unchangedOrder = await getOrderById("ORD-1001");
    expect(unchangedOrder.status).toBe("New");
  });

  test("rejects invalid status transitions", async () => {
    await expect(updateOrderStatus("ORD-1005", "New")).rejects.toThrow(
      "Invalid status transition from Completed to New.",
    );
  });

  test("does not automatically cancel an order with failed payment", async () => {
    const failedPaymentOrder = await getOrderById("ORD-1004");
    expect(failedPaymentOrder.paymentStatus).toBe("Failed");
    expect(failedPaymentOrder.status).toBe("In Progress");
  });

  test("applies a valid status transition and returns a cloned order", async () => {
    const updatedOrder = await updateOrderStatus("ORD-1001", "Acknowledged");
    updatedOrder.status = "Cancelled";

    const storedOrder = await getOrderById("ORD-1001");
    expect(storedOrder.status).toBe("Acknowledged");
  });
});
