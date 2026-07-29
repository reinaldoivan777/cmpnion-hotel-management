import { ClipboardList, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrdersQuery } from "@/features/orders/hooks/use-orders";
import { isSlaBreached } from "@/features/orders/orders.utils";

const shellMetrics = [
  "Active Guests",
  "Pending Orders",
  "Revenue Today",
  "Completed Orders",
  "Average Order Value",
];

export function DashboardPage() {
  const ordersQuery = useOrdersQuery();
  const orders = ordersQuery.data ?? [];
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
        {shellMetrics.map((label) => (
          <Card key={label}>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-bold text-foreground">--</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Awaiting order data
            </p>
          </Card>
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

        <Card>
          <h2 className="text-lg font-semibold text-foreground">
            Top Selling Services
          </h2>
          <div className="mt-5 space-y-3">
            {["Room Service", "Housekeeping", "Laundry"].map((service) => (
              <div key={service}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{service}</span>
                  <span className="text-muted-foreground">--</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
