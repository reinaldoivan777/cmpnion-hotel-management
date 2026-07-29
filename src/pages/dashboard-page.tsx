import { useMemo } from "react";

import {
  MetricCard,
  MetricCardSkeleton,
} from "@/features/dashboard/components/metric-card";
import {
  TopServicesCard,
  TopServicesCardSkeleton,
} from "@/features/dashboard/components/top-services-card";
import { selectDashboardOverview } from "@/features/dashboard/dashboard.selectors";
import { OrderManagement } from "@/features/orders/components/order-management";
import { useOrdersQuery } from "@/features/orders/hooks/use-orders";

export function DashboardPage() {
  const ordersQuery = useOrdersQuery();
  const orders = ordersQuery.data ?? [];
  const dashboardOverview = useMemo(
    () => selectDashboardOverview(orders),
    [orders],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Service Management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
            Hotel Operations Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor guest requests, surface urgent work, and process service
            orders from one operational view.
          </p>
        </div>
      </section>

      <section
        aria-label="Operational metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {ordersQuery.isLoading
          ? Array.from({ length: 5 }, (_, index) => (
              <MetricCardSkeleton key={index} />
            ))
          : dashboardOverview.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <OrderManagement
          isError={ordersQuery.isError}
          isLoading={ordersQuery.isLoading}
          onRetry={() => {
            void ordersQuery.refetch();
          }}
          orders={orders}
        />

        {ordersQuery.isLoading ? (
          <TopServicesCardSkeleton />
        ) : (
          <TopServicesCard services={dashboardOverview.topServices} />
        )}
      </section>
    </div>
  );
}
