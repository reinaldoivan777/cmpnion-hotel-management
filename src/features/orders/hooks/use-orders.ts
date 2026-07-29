import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDashboardOverview,
  getOrderById,
  getOrdersPage,
  updateOrderStatus,
} from "@/features/orders/api/orders-api";
import type {
  Order,
  OrderListParams,
  OrderListResponse,
  OrderStatus,
} from "@/features/orders/orders.types";

export const ordersQueryKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersQueryKeys.all, "list"] as const,
  list: (params: OrderListParams) =>
    [...ordersQueryKeys.lists(), params] as const,
  detail: (orderId: string) =>
    [...ordersQueryKeys.all, "detail", orderId] as const,
};

export const dashboardQueryKeys = {
  overview: ["dashboard", "overview"] as const,
};

export function useOrdersPageQuery(params: OrderListParams) {
  return useQuery<OrderListResponse>({
    queryKey: ordersQueryKeys.list(params),
    queryFn: () => getOrdersPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useDashboardOverviewQuery() {
  return useQuery({
    queryKey: dashboardQueryKeys.overview,
    queryFn: getDashboardOverview,
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
      queryClient.setQueryData(
        ordersQueryKeys.detail(updatedOrder.id),
        updatedOrder,
      );
      void queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.overview,
      });
    },
  });
}
