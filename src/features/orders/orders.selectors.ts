import type { Order, OrderFilters } from "@/features/orders/orders.types";

export function selectFilteredOrders(
  orders: Order[],
  filters: OrderFilters,
): Order[] {
  const searchValue = filters.search.trim().toLocaleLowerCase();

  return orders
    .filter((order) => {
      const matchesSearch =
        searchValue.length === 0 ||
        order.guestName.toLocaleLowerCase().includes(searchValue) ||
        order.id.toLocaleLowerCase().includes(searchValue) ||
        order.roomNumber.toLocaleLowerCase().includes(searchValue);

      return (
        matchesSearch &&
        (filters.status === "All" || order.status === filters.status) &&
        (filters.service === "All" || order.service === filters.service)
      );
    })
    .sort((orderA, orderB) => {
      const orderATime = new Date(orderA.orderTime).getTime();
      const orderBTime = new Date(orderB.orderTime).getTime();

      return filters.sort === "newest"
        ? orderBTime - orderATime
        : orderATime - orderBTime;
    });
}
