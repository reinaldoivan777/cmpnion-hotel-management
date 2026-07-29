import {
  ORDER_STATUSES,
  SERVICE_TYPES,
} from "@/features/orders/orders.constants";
import type { OrderFilters } from "@/features/orders/orders.types";

export const defaultOrderFilters: OrderFilters = {
  search: "",
  status: "All",
  service: "All",
  sort: "newest",
};

const validStatuses = new Set<string>(["All", ...ORDER_STATUSES]);
const validServices = new Set<string>(["All", ...SERVICE_TYPES]);
const validSorts = new Set<string>(["newest", "oldest"]);

export function parseOrderFiltersFromSearchParams(
  searchParams: URLSearchParams,
): OrderFilters {
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? defaultOrderFilters.status;
  const service = searchParams.get("service") ?? defaultOrderFilters.service;
  const sort = searchParams.get("sort") ?? defaultOrderFilters.sort;

  return {
    search,
    status: validStatuses.has(status)
      ? (status as OrderFilters["status"])
      : defaultOrderFilters.status,
    service: validServices.has(service)
      ? (service as OrderFilters["service"])
      : defaultOrderFilters.service,
    sort: validSorts.has(sort)
      ? (sort as OrderFilters["sort"])
      : defaultOrderFilters.sort,
  };
}

export function serializeOrderFiltersToSearchParams(
  filters: OrderFilters,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  const search = filters.search.trim();

  if (search.length > 0) {
    searchParams.set("search", search);
  }

  if (filters.status !== defaultOrderFilters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.service !== defaultOrderFilters.service) {
    searchParams.set("service", filters.service);
  }

  if (filters.sort !== defaultOrderFilters.sort) {
    searchParams.set("sort", filters.sort);
  }

  return searchParams;
}

export function hasActiveOrderFilters(filters: OrderFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.status !== defaultOrderFilters.status ||
    filters.service !== defaultOrderFilters.service ||
    filters.sort !== defaultOrderFilters.sort
  );
}
