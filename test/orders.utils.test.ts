import { describe, expect, test } from "bun:test";

import type { Order } from "@/features/orders/orders.types";
import {
  canTransition,
  getNextPrimaryStatus,
  isSlaBreached,
} from "@/features/orders/orders.utils";

function createOrder(overrides: Partial<Order>): Order {
  return {
    id: "ORD-TEST",
    guestName: "Test Guest",
    roomNumber: "101",
    service: "Room Service",
    quantity: 1,
    amount: 10,
    currency: "USD",
    specialRequest: null,
    orderTime: "2026-07-29T08:00:00.000Z",
    status: "New",
    paymentStatus: "Paid",
    ...overrides,
  };
}

describe("isSlaBreached", () => {
  const now = new Date("2026-07-29T08:20:00.000Z");

  test("returns true for a New order older than 15 minutes", () => {
    expect(
      isSlaBreached(
        createOrder({ orderTime: "2026-07-29T08:04:59.000Z" }),
        now,
      ),
    ).toBe(true);
  });

  test("returns false for a New order exactly 15 minutes old", () => {
    expect(
      isSlaBreached(
        createOrder({ orderTime: "2026-07-29T08:05:00.000Z" }),
        now,
      ),
    ).toBe(false);
  });

  test("returns false for non-New orders even when they are older than SLA", () => {
    expect(
      isSlaBreached(
        createOrder({
          orderTime: "2026-07-29T07:00:00.000Z",
          status: "Acknowledged",
        }),
        now,
      ),
    ).toBe(false);
  });
});

describe("canTransition", () => {
  test("allows the active workflow sequence", () => {
    expect(canTransition("New", "Acknowledged")).toBe(true);
    expect(canTransition("Acknowledged", "In Progress")).toBe(true);
    expect(canTransition("In Progress", "Completed")).toBe(true);
  });

  test("allows cancellation from non-final statuses", () => {
    expect(canTransition("New", "Cancelled")).toBe(true);
    expect(canTransition("Acknowledged", "Cancelled")).toBe(true);
    expect(canTransition("In Progress", "Cancelled")).toBe(true);
  });

  test("rejects invalid transitions from final statuses", () => {
    expect(canTransition("Completed", "New")).toBe(false);
    expect(canTransition("Cancelled", "In Progress")).toBe(false);
  });
});

describe("getNextPrimaryStatus", () => {
  test("returns the expected primary action target for active statuses", () => {
    expect(getNextPrimaryStatus("New")).toBe("Acknowledged");
    expect(getNextPrimaryStatus("Acknowledged")).toBe("In Progress");
    expect(getNextPrimaryStatus("In Progress")).toBe("Completed");
  });

  test("returns null for final statuses", () => {
    expect(getNextPrimaryStatus("Completed")).toBeNull();
    expect(getNextPrimaryStatus("Cancelled")).toBeNull();
  });
});
