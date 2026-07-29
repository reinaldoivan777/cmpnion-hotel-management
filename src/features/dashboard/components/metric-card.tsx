import type { DashboardMetric } from "@/features/dashboard/dashboard.types";
import { Card } from "@/components/ui/card";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatMetricValue(metric: DashboardMetric): string {
  if (metric.format === "currency") {
    return currencyFormatter.format(metric.value);
  }

  return numberFormatter.format(metric.value);
}

interface MetricCardProps {
  metric: DashboardMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-muted-foreground">
        {metric.label}
      </p>
      <p className="mt-3 text-2xl font-bold text-foreground">
        {formatMetricValue(metric)}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {metric.description}
      </p>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="mt-4 h-8 w-20 rounded bg-muted" />
      <div className="mt-3 h-3 w-36 rounded bg-muted" />
    </Card>
  );
}
