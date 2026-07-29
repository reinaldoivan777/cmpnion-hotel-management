import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  getDashboardOverview,
  getOrderById,
  getOrdersPage,
  subscribeToOrderRealtimeEvents,
  updateOrderStatus,
} from "@/features/orders/api/orders-api";
import type {
  Order,
  OrderListParams,
  OrderListResponse,
  OrderRealtimeEvent,
  OrderStatus,
} from "@/features/orders/orders.types";

type OrderListQuerySnapshot = [
  QueryKey,
  OrderListResponse | undefined,
];

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

interface UpdateOrderStatusContext {
  previousDetail: Order | undefined;
  previousOrderLists: OrderListQuerySnapshot[];
}

const maxRealtimeNotifications = 6;

export function useOrderRealtimeNotifications() {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<OrderRealtimeEvent[]>([]);

  useEffect(() => {
    return subscribeToOrderRealtimeEvents((event) => {
      queryClient.setQueryData(
        ordersQueryKeys.detail(event.order.id),
        event.order,
      );
      void queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.overview,
      });

      setNotifications((currentNotifications) => [
        event,
        ...currentNotifications.filter(
          (notification) => notification.id !== event.id,
        ),
      ].slice(0, maxRealtimeNotifications));
    });
  }, [queryClient]);

  return {
    dismissNotification: (notificationId: string) => {
      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (notification) => notification.id !== notificationId,
        ),
      );
    },
    notifications,
  };
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, nextStatus }: UpdateOrderStatusVariables) =>
      updateOrderStatus(orderId, nextStatus),
    onMutate: async ({ orderId, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists() });
      await queryClient.cancelQueries({
        queryKey: ordersQueryKeys.detail(orderId),
      });

      const previousDetail = queryClient.getQueryData<Order>(
        ordersQueryKeys.detail(orderId),
      );
      const previousOrderLists =
        queryClient.getQueriesData<OrderListResponse>({
          queryKey: ordersQueryKeys.lists(),
        });

      const optimisticOrderFromLists = previousOrderLists
        .flatMap(([, orderList]) => orderList?.orders ?? [])
        .find((order) => order.id === orderId);
      const optimisticOrder = previousDetail ?? optimisticOrderFromLists;

      if (optimisticOrder) {
        queryClient.setQueryData<Order>(ordersQueryKeys.detail(orderId), {
          ...optimisticOrder,
          status: nextStatus,
        });
      }

      for (const [queryKey, orderList] of previousOrderLists) {
        if (!orderList) {
          continue;
        }

        queryClient.setQueryData<OrderListResponse>(queryKey, {
          ...orderList,
          orders: orderList.orders.map((order) =>
            order.id === orderId ? { ...order, status: nextStatus } : order,
          ),
        });
      }

      return { previousDetail, previousOrderLists };
    },
    onError: (_error, { orderId }, context) => {
      if (!context) {
        return;
      }

      if (context.previousDetail) {
        queryClient.setQueryData(
          ordersQueryKeys.detail(orderId),
          context.previousDetail,
        );
      } else {
        queryClient.removeQueries({
          exact: true,
          queryKey: ordersQueryKeys.detail(orderId),
        });
      }

      for (const [queryKey, orderList] of context.previousOrderLists) {
        queryClient.setQueryData(queryKey, orderList);
      }
    },
    onSuccess: (updatedOrder: Order) => {
      queryClient.setQueryData(
        ordersQueryKeys.detail(updatedOrder.id),
        updatedOrder,
      );
      queryClient.setQueriesData<OrderListResponse>(
        { queryKey: ordersQueryKeys.lists() },
        (orderList) => {
          if (!orderList) {
            return orderList;
          }

          return {
            ...orderList,
            orders: orderList.orders.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order,
            ),
          };
        },
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.overview,
      });
    },
  });
}
