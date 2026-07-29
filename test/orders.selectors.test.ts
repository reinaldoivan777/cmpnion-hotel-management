import { describe, expect, test } from "bun:test";

import { selectFilteredOrders } from "@/features/orders/orders.selectors";
import type { Order, OrderFilters } from "@/features/orders/orders.types";

const orders: Order[] = [
  {
    id: "ORD-1001",
    guestName: "Maya Chen",
    roomNumber: "204",
    service: "Room Service",
    quantity: 2,
    amount: 48,
    currency: "USD",
    specialRequest: null,
    orderTime: "2026-07-29T08:10:00.000Z",
    status: "New",
    paymentStatus: "Paid",
  },
  {
    id: "ORD-1002",
    guestName: "Daniel Brooks",
    roomNumber: "918",
    service: "Housekeeping",
    quantity: 1,
    amount: 0,
    currency: "USD",
    specialRequest: null,
    orderTime: "2026-07-29T08:20:00.000Z",
    status: "Acknowledged",
    paymentStatus: "Pending",
  },
  {
    id: "ORD-1003",
    guestName: "Sofia Martinez",
    roomNumber: "502",
    service: "Laundry",
    quantity: 4,
    amount: 36,
    currency: "USD",
    specialRequest: null,
    orderTime: "2026-07-29T08:30:00.000Z",
    status: "Completed",
    paymentStatus: "Paid",
  },
  {
    id: "ORD-1004",
    guestName: "Maya Brooks",
    roomNumber: "1204",
    service: "Room Service",
    quantity: 1,
    amount: 24,
    currency: "USD",
    specialRequest: null,
    orderTime: "2026-07-29T08:40:00.000Z",
    status: "Completed",
    paymentStatus: "Failed",
  },
];

const defaultFilters: OrderFilters = {
  search: "",
  status: "All",
  service: "All",
  sort: "newest",
};

function selectIds(filters: Partial<OrderFilters>): string[] {
  return selectFilteredOrders(orders, {
    ...defaultFilters,
    ...filters,
  }).map((order) => order.id);
}

describe("selectFilteredOrders", () => {
  test("finds orders by partial guest name without matching case", () => {
    expect(selectIds({ search: "maya" })).toEqual(["ORD-1004", "ORD-1001"]);
  });

  test("finds orders by partial order ID", () => {
    expect(selectIds({ search: "1002" })).toEqual(["ORD-1002"]);
  });

  test("finds orders by room number and trims whitespace", () => {
    expect(selectIds({ search: " 204 " })).toEqual(["ORD-1004", "ORD-1001"]);
  });

  test("combines search and status filters as an intersection", () => {
    expect(selectIds({ search: "maya", status: "New" })).toEqual(["ORD-1001"]);
  });

  test("combines status and service filters as an intersection", () => {
    expect(
      selectIds({ status: "Completed", service: "Room Service" }),
    ).toEqual(["ORD-1004"]);
  });

  test("sorts newest first by order time", () => {
    expect(selectIds({ sort: "newest" })).toEqual([
      "ORD-1004",
      "ORD-1003",
      "ORD-1002",
      "ORD-1001",
    ]);
  });

  test("sorts oldest first by order time", () => {
    expect(selectIds({ sort: "oldest" })).toEqual([
      "ORD-1001",
      "ORD-1002",
      "ORD-1003",
      "ORD-1004",
    ]);
  });
});
