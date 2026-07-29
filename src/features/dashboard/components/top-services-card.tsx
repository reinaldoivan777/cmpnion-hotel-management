import { Card } from "@/components/ui/card";
import type { TopSellingService } from "@/features/dashboard/dashboard.types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface TopServicesCardProps {
  services: TopSellingService[];
}

export function TopServicesCard({ services }: TopServicesCardProps) {
  const visibleServices = services.slice(0, 5);
  const maxQuantity = Math.max(...visibleServices.map((item) => item.quantity), 0);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Top Selling Services
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by quantity across non-cancelled orders
          </p>
        </div>
      </div>

      {visibleServices.length > 0 ? (
        <div className="mt-5 space-y-4">
          {visibleServices.map((service, index) => {
            const width =
              maxQuantity > 0 ? `${(service.quantity / maxQuantity) * 100}%` : "0%";

            return (
              <div key={service.service}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="truncate font-medium text-foreground">
                      {service.service}
                    </span>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {service.quantity} item{service.quantity === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {service.orderCount} order
                  {service.orderCount === 1 ? "" : "s"} |{" "}
                  {currencyFormatter.format(service.revenue)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-border bg-muted p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            No service sales yet
          </p>
        </div>
      )}
    </Card>
  );
}

export function TopServicesCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <div className="h-5 w-44 rounded bg-muted" />
      <div className="mt-2 h-4 w-52 rounded bg-muted" />
      <div className="mt-6 space-y-5">
        {[0, 1, 2].map((item) => (
          <div key={item}>
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-14 rounded bg-muted" />
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </Card>
  );
}
