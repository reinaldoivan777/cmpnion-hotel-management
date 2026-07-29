import { beforeEach, describe, expect, test } from "bun:test";

import {
  failNextOrderMutation,
  failNextOrdersRead,
  getDashboardOverview,
  getOrderById,
  getOrdersPage,
  resetMockOrders,
  updateOrderStatus,
} from "@/features/orders/api/orders-api";
import { defaultOrderFilters } from "@/features/orders/orders.url-state";

describe("orders mock API failure scenarios", () => {
  beforeEach(() => {
    resetMockOrders();
  });

  test("fails the next read once and then succeeds on retry", async () => {
    failNextOrdersRead();

    await expect(
      getOrdersPage({
        filters: defaultOrderFilters,
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toThrow("Unable to load orders.");

    const retryOrders = await getOrdersPage({
      filters: defaultOrderFilters,
      page: 1,
      pageSize: 10,
    });
    expect(retryOrders.orders.length).toBeGreaterThan(0);
  });

  test("returns a server-side order page with total metadata", async () => {
    const orderPage = await getOrdersPage({
      filters: defaultOrderFilters,
      page: 2,
      pageSize: 20,
    });

    expect(orderPage.page).toBe(2);
    expect(orderPage.pageSize).toBe(20);
    expect(orderPage.total).toBe(150);
    expect(orderPage.orders).toHaveLength(20);
  });

  test("applies filters before paginating order results", async () => {
    const orderPage = await getOrdersPage({
      filters: {
        ...defaultOrderFilters,
        status: "New",
      },
      page: 1,
      pageSize: 50,
    });

    expect(orderPage.total).toBeGreaterThan(0);
    expect(orderPage.orders.every((order) => order.status === "New")).toBe(true);
  });

  test("normalizes out-of-range pages to the last available page", async () => {
    const orderPage = await getOrdersPage({
      filters: defaultOrderFilters,
      page: 999,
      pageSize: 50,
    });

    expect(orderPage.page).toBe(3);
    expect(orderPage.orders.at(-1)?.id).toBe("ORD-1150");
  });

  test("returns dashboard overview without requiring a full order list client fetch", async () => {
    const overview = await getDashboardOverview();

    expect(overview.metrics).toHaveLength(5);
    expect(overview.topServices.length).toBeGreaterThan(0);
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
