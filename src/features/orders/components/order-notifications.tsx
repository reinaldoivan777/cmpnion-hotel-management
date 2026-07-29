import { AlertTriangle, Bell, X } from "lucide-react";
import { useEffect } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import type { OrderRealtimeEvent } from "@/features/orders/orders.types";

interface OrderNotificationsProps {
  notifications: OrderRealtimeEvent[];
  onDismiss: (notificationId: string) => void;
}

const toastDurationMs = 10_000;

export function OrderNotifications({
  notifications,
  onDismiss,
}: OrderNotificationsProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <ol
      aria-label="Live order alerts"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
    >
      {notifications.map((notification) => (
        <OrderNotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </ol>
  );
}

function OrderNotificationToast({
  notification,
  onDismiss,
}: {
  notification: OrderRealtimeEvent;
  onDismiss: (notificationId: string) => void;
}) {
  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      onDismiss(notification.id);
    }, toastDurationMs);

    return () => globalThis.clearTimeout(timeoutId);
  }, [notification.id, onDismiss]);

  return (
    <li
      className={cn(
        "pointer-events-auto rounded-lg border bg-surface p-4 shadow-xl",
        notification.type === "overdue-order"
          ? "border-amber-300"
          : "border-emerald-200",
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <NotificationIcon notification={notification} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {getNotificationTitle(notification)}
          </p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {notification.order.id} · {notification.order.guestName} · Room{" "}
            {notification.order.roomNumber}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {formatNotificationTime(notification.occurredAt)}
          </p>
        </div>
        <IconButton
          className="size-8"
          label={`Dismiss ${notification.order.id} alert`}
          onClick={() => onDismiss(notification.id)}
        >
          <X className="size-3.5" aria-hidden="true" />
        </IconButton>
      </div>
    </li>
  );
}

function NotificationIcon({
  notification,
}: {
  notification: OrderRealtimeEvent;
}) {
  if (notification.type === "overdue-order") {
    return (
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
        <AlertTriangle className="size-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
      <Bell className="size-4" aria-hidden="true" />
    </span>
  );
}

function getNotificationTitle(notification: OrderRealtimeEvent): string {
  return notification.type === "overdue-order"
    ? "Order is overdue"
    : "New order received";
}

function formatNotificationTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
