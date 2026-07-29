import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "@/features/orders/api/orders-api";
import type { Order, OrderStatus } from "@/features/orders/orders.types";

export const ordersQueryKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersQueryKeys.all, "list"] as const,
  detail: (orderId: string) =>
    [...ordersQueryKeys.all, "detail", orderId] as const,
};

export function useOrdersQuery() {
  return useQuery({
    queryKey: ordersQueryKeys.lists(),
    queryFn: getOrders,
  });
}

export function useOrderQuery(orderId: string | null) {
  return useQuery({
    enabled: Boolean(orderId),
    queryKey: orderId
      ? ordersQueryKeys.detail(orderId)
      : [...ordersQueryKeys.all, "detail", "none"],
    queryFn: () => {
      if (!orderId) {
        throw new Error("Order ID is required.");
      }

      return getOrderById(orderId);
    },
  });
}

interface UpdateOrderStatusVariables {
  orderId: string;
  nextStatus: OrderStatus;
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, nextStatus }: UpdateOrderStatusVariables) =>
      updateOrderStatus(orderId, nextStatus),
    onSuccess: (updatedOrder: Order) => {
      queryClient.setQueryData<Order[]>(
        ordersQueryKeys.lists(),
        (currentOrders) =>
          currentOrders?.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order,
          ),
      );
      queryClient.setQueryData(
        ordersQueryKeys.detail(updatedOrder.id),
        updatedOrder,
      );
    },
  });
}
