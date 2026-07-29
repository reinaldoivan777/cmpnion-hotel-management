import { describe, expect, test } from "bun:test";

import {
  defaultOrderFilters,
  hasActiveOrderFilters,
  parseOrderFiltersFromSearchParams,
  serializeOrderFiltersToSearchParams,
} from "@/features/orders/orders.url-state";

describe("order URL state", () => {
  test("parses valid search, filter, and sort params", () => {
    const filters = parseOrderFiltersFromSearchParams(
      new URLSearchParams(
        "search=%20204%20&status=New&service=Room+Service&sort=oldest",
      ),
    );

    expect(filters).toEqual({
      search: "204",
      status: "New",
      service: "Room Service",
      sort: "oldest",
    });
  });

  test("falls back to defaults for invalid filter and sort values", () => {
    const filters = parseOrderFiltersFromSearchParams(
      new URLSearchParams(
        "search=maya&status=Archived&service=Concierge&sort=random",
      ),
    );

    expect(filters).toEqual({
      search: "maya",
      status: "All",
      service: "All",
      sort: "newest",
    });
  });

  test("omits default values when serializing filters", () => {
    expect(
      serializeOrderFiltersToSearchParams(defaultOrderFilters).toString(),
    ).toBe("");
  });

  test("serializes active filters into canonical query params", () => {
    const searchParams = serializeOrderFiltersToSearchParams({
      search: "  Maya Chen ",
      status: "Acknowledged",
      service: "Spa & Massage",
      sort: "oldest",
    });

    expect(searchParams.toString()).toBe(
      "search=Maya+Chen&status=Acknowledged&service=Spa+%26+Massage&sort=oldest",
    );
  });

  test("reports active filters only when they differ from defaults", () => {
    expect(hasActiveOrderFilters(defaultOrderFilters)).toBe(false);
    expect(
      hasActiveOrderFilters({
        ...defaultOrderFilters,
        search: "ORD-1001",
      }),
    ).toBe(true);
    expect(
      hasActiveOrderFilters({
        ...defaultOrderFilters,
        sort: "oldest",
      }),
    ).toBe(true);
  });
});
