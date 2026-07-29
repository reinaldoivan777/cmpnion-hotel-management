import { ClipboardList, Search, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MetricCard,
  MetricCardSkeleton,
} from "@/features/dashboard/components/metric-card";
import {
  TopServicesCard,
  TopServicesCardSkeleton,
} from "@/features/dashboard/components/top-services-card";
import { selectDashboardOverview } from "@/features/dashboard/dashboard.selectors";
import { useOrdersQuery } from "@/features/orders/hooks/use-orders";
import { isSlaBreached } from "@/features/orders/orders.utils";

export function DashboardPage() {
  const ordersQuery = useOrdersQuery();
  const orders = ordersQuery.data ?? [];
  const dashboardOverview = useMemo(
    () => selectDashboardOverview(orders),
    [orders],
  );
  const breachedSlaCount = orders.filter((order) =>
    isSlaBreached(order, new Date()),
  ).length;

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
        <Button variant="secondary">
          <SlidersHorizontal className="mr-2 size-4" aria-hidden="true" />
          Filters
        </Button>
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
        <Card className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Guest Service Orders
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mock order data is available for dashboard selectors.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary">
                <Search className="mr-2 size-4" aria-hidden="true" />
                Search
              </Button>
              <Button>
                <ClipboardList className="mr-2 size-4" aria-hidden="true" />
                View Queue
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="rounded-md border border-dashed border-border bg-muted p-8 text-center">
              <p className="text-sm font-semibold text-foreground">
                {ordersQuery.isLoading
                  ? "Loading mock orders..."
                  : `${orders.length} mock orders loaded`}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {ordersQuery.isError
                  ? "Unable to retrieve mock order data. The query hook is ready for a retry state in a later phase."
                  : `${breachedSlaCount} new order${breachedSlaCount === 1 ? "" : "s"} currently breach the 15-minute SLA rule.`}
              </p>
            </div>
          </div>
        </Card>

        {ordersQuery.isLoading ? (
          <TopServicesCardSkeleton />
        ) : (
          <TopServicesCard services={dashboardOverview.topServices} />
        )}
      </section>
    </div>
  );
}
