import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Eye,
  Loader2,
  PlayCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import {
  ORDER_STATUSES,
  SERVICE_TYPES,
} from "@/features/orders/orders.constants";
import { useUpdateOrderStatusMutation } from "@/features/orders/hooks/use-orders";
import type {
  Order,
  OrderFilters,
  OrderStatus,
  PaymentStatus,
} from "@/features/orders/orders.types";
import {
  getNextPrimaryStatus,
  getOrderAgeInMinutes,
  isFinalOrderStatus,
  isSlaBreached,
} from "@/features/orders/orders.utils";

const defaultFilters: OrderFilters = {
  search: "",
  status: "All",
  service: "All",
  sort: "newest",
};

const primaryActionLabels: Partial<Record<OrderStatus, string>> = {
  New: "Acknowledge",
  Acknowledged: "Start Processing",
  "In Progress": "Mark as Completed",
};

const actionDescriptions: Partial<Record<OrderStatus, string>> = {
  New: "Confirm that staff have seen this guest request.",
  Acknowledged: "Move the request into active fulfillment.",
  "In Progress": "Close the request after the service is delivered.",
};

interface OrderManagementProps {
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  orders: Order[];
}

interface FeedbackMessage {
  tone: "success" | "error";
  text: string;
}

export function OrderManagement({
  isError,
  isLoading,
  onRetry,
  orders,
}: OrderManagementProps) {
  const [filters, setFilters] = useState<OrderFilters>(defaultFilters);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const now = useMemo(() => new Date(), [orders]);
  const updateStatusMutation = useUpdateOrderStatusMutation();
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const filteredOrders = useMemo(() => {
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
  }, [filters, orders]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "All" ||
    filters.service !== "All" ||
    filters.sort !== "newest";

  useEffect(() => {
    if (selectedOrder) {
      drawerCloseRef.current?.focus();
    }
  }, [selectedOrder]);

  function openOrderDetails(orderId: string) {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelectedOrderId(orderId);
  }

  function closeOrderDetails() {
    setSelectedOrderId(null);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }

  async function updateOrderStatus(order: Order, nextStatus: OrderStatus) {
    setFeedback(null);

    try {
      const updatedOrder = await updateStatusMutation.mutateAsync({
        orderId: order.id,
        nextStatus,
      });

      setFeedback({
        tone: "success",
        text: `${updatedOrder.id} moved from ${order.status} to ${updatedOrder.status}.`,
      });
      setCancelOrder(null);
      setSelectedOrderId(updatedOrder.id);
    } catch (error) {
      setFeedback({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update order status.",
      });
    }
  }

  function clearFilters() {
    setFilters(defaultFilters);
  }

  const mutatingOrderId = updateStatusMutation.variables?.orderId ?? null;

  if (isLoading) {
    return <OrderManagementSkeleton />;
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Guest Service Orders
        </h2>
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-950">
            Unable to load orders.
          </p>
          <p className="mt-1 text-sm text-red-800">Please try again.</p>
          <Button className="mt-4" onClick={onRetry}>
            <RotateCcw className="mr-2 size-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Guest Service Orders
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length === 0
                ? "No orders yet. New guest requests will appear here."
                : `${filteredOrders.length} of ${orders.length} orders shown`}
            </p>
          </div>
          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearFilters}>
              <X className="mr-2 size-4" aria-hidden="true" />
              Clear Filters
            </Button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_200px_160px]">
          <label className="relative block">
            <span className="sr-only">Search orders</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search guest, room, or order"
            />
          </label>
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value as OrderFilters["status"],
              }))
            }
            options={["All", ...ORDER_STATUSES]}
          />
          <SelectField
            label="Service"
            value={filters.service}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                service: value as OrderFilters["service"],
              }))
            }
            options={["All", ...SERVICE_TYPES]}
          />
          <SelectField
            label="Sort"
            value={filters.sort}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                sort: value as OrderFilters["sort"],
              }))
            }
            options={[
              { label: "Newest first", value: "newest" },
              { label: "Oldest first", value: "oldest" },
            ]}
          />
        </div>

        {feedback ? (
          <div
            className={cn(
              "mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
              feedback.tone === "success" &&
                "border-emerald-200 bg-emerald-50 text-emerald-950",
              feedback.tone === "error" &&
                "border-red-200 bg-red-50 text-red-950",
            )}
            role="status"
          >
            {feedback.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet."
          description="New guest requests will appear here."
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No orders found."
          description="Try changing your search or filters."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <Th>Order</Th>
                  <Th>Guest</Th>
                  <Th>Room</Th>
                  <Th>Service</Th>
                  <Th>Time</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th>Amount</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <OrderTableRow
                    key={order.id}
                    isMutating={mutatingOrderId === order.id}
                    isUpdatingAnyOrder={updateStatusMutation.isPending}
                    now={now}
                    onCancel={() => setCancelOrder(order)}
                    onPrimaryAction={(nextStatus) =>
                      updateOrderStatus(order, nextStatus)
                    }
                    onView={() => openOrderDetails(order.id)}
                    order={order}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {filteredOrders.map((order) => (
              <OrderMobileCard
                key={order.id}
                isMutating={mutatingOrderId === order.id}
                isUpdatingAnyOrder={updateStatusMutation.isPending}
                now={now}
                onCancel={() => setCancelOrder(order)}
                onPrimaryAction={(nextStatus) =>
                  updateOrderStatus(order, nextStatus)
                }
                onView={() => openOrderDetails(order.id)}
                order={order}
              />
            ))}
          </div>
        </>
      )}

      {selectedOrder ? (
        <OrderDetailsDrawer
          closeButtonRef={drawerCloseRef}
          isMutating={mutatingOrderId === selectedOrder.id}
          isUpdatingAnyOrder={updateStatusMutation.isPending}
          now={now}
          onCancel={() => setCancelOrder(selectedOrder)}
          onClose={closeOrderDetails}
          onPrimaryAction={(nextStatus) =>
            updateOrderStatus(selectedOrder, nextStatus)
          }
          order={selectedOrder}
        />
      ) : null}

      {cancelOrder ? (
        <CancelDialog
          isMutating={updateStatusMutation.isPending}
          onClose={() => setCancelOrder(null)}
          onConfirm={() => updateOrderStatus(cancelOrder, "Cancelled")}
          order={cancelOrder}
        />
      ) : null}
    </section>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<string | { label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <span className="relative block">
        <select
          className="h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        >
          {options.map((option) => {
            const optionValue =
              typeof option === "string" ? option : option.value;
            const optionLabel =
              typeof option === "string" ? option : option.label;

            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

function OrderTableRow({
  isMutating,
  isUpdatingAnyOrder,
  now,
  onCancel,
  onPrimaryAction,
  onView,
  order,
}: {
  isMutating: boolean;
  isUpdatingAnyOrder: boolean;
  now: Date;
  onCancel: () => void;
  onPrimaryAction: (nextStatus: OrderStatus) => void;
  onView: () => void;
  order: Order;
}) {
  const slaBreached = isSlaBreached(order, now);
  const nextStatus = getNextPrimaryStatus(order.status);

  return (
    <tr
      className={cn(
        "align-top transition hover:bg-muted/50",
        slaBreached && "bg-amber-50",
      )}
    >
      <Td>
        <button
          className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={onView}
          type="button"
        >
          {order.id}
        </button>
        {slaBreached ? <SlaBadge order={order} now={now} /> : null}
      </Td>
      <Td>{order.guestName}</Td>
      <Td>{order.roomNumber}</Td>
      <Td>
        {order.service}
        <span className="block text-xs text-muted-foreground">
          Qty {order.quantity}
        </span>
      </Td>
      <Td>
        <RelativeAge order={order} now={now} />
      </Td>
      <Td>
        <StatusBadge status={order.status} />
      </Td>
      <Td>
        <PaymentBadge status={order.paymentStatus} />
      </Td>
      <Td>{formatCurrency(order.amount, order.currency)}</Td>
      <Td className="min-w-48">
        <div className="flex justify-end gap-2">
          <IconButton label={`View ${order.id}`} onClick={onView}>
            <Eye className="size-4" aria-hidden="true" />
          </IconButton>
          {nextStatus ? (
            <Button
              className="min-w-32 px-3"
              disabled={isUpdatingAnyOrder}
              onClick={() => onPrimaryAction(nextStatus)}
            >
              {isMutating ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {primaryActionLabels[order.status]}
            </Button>
          ) : null}
          {!isFinalOrderStatus(order.status) ? (
            <Button
              className="px-3 text-red-700 hover:bg-red-50"
              disabled={isUpdatingAnyOrder}
              onClick={onCancel}
              variant="secondary"
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </Td>
    </tr>
  );
}

function OrderMobileCard({
  isMutating,
  isUpdatingAnyOrder,
  now,
  onCancel,
  onPrimaryAction,
  onView,
  order,
}: {
  isMutating: boolean;
  isUpdatingAnyOrder: boolean;
  now: Date;
  onCancel: () => void;
  onPrimaryAction: (nextStatus: OrderStatus) => void;
  onView: () => void;
  order: Order;
}) {
  const nextStatus = getNextPrimaryStatus(order.status);

  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={onView}
            type="button"
          >
            {order.id}
          </button>
          <p className="mt-1 text-sm text-foreground">
            {order.guestName} · Room {order.roomNumber}
          </p>
        </div>
        <RelativeAge order={order} now={now} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Info label="Service" value={`${order.service} · Qty ${order.quantity}`} />
        <Info label="Amount" value={formatCurrency(order.amount, order.currency)} />
        <Info label="Status" value={<StatusBadge status={order.status} />} />
        <Info
          label="Payment"
          value={<PaymentBadge status={order.paymentStatus} />}
        />
      </div>
      {isSlaBreached(order, now) ? <SlaBadge order={order} now={now} /> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button className="px-3" onClick={onView} variant="secondary">
          <Eye className="mr-2 size-4" aria-hidden="true" />
          View
        </Button>
        {nextStatus ? (
          <Button
            className="px-3"
            disabled={isUpdatingAnyOrder}
            onClick={() => onPrimaryAction(nextStatus)}
          >
            {isMutating ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {primaryActionLabels[order.status]}
          </Button>
        ) : null}
        {!isFinalOrderStatus(order.status) ? (
          <Button
            className="px-3 text-red-700 hover:bg-red-50"
            disabled={isUpdatingAnyOrder}
            onClick={onCancel}
            variant="secondary"
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function OrderDetailsDrawer({
  closeButtonRef,
  isMutating,
  isUpdatingAnyOrder,
  now,
  onCancel,
  onClose,
  onPrimaryAction,
  order,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement>;
  isMutating: boolean;
  isUpdatingAnyOrder: boolean;
  now: Date;
  onCancel: () => void;
  onClose: () => void;
  onPrimaryAction: (nextStatus: OrderStatus) => void;
  order: Order;
}) {
  const nextStatus = getNextPrimaryStatus(order.status);

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <aside
        aria-describedby="order-details-description"
        aria-labelledby="order-details-title"
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose();
          }
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-primary">
              {order.id}
              {isMutating ? (
                <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Updating
                </span>
              ) : null}
            </p>
            <h3
              className="mt-1 text-xl font-semibold text-foreground"
              id="order-details-title"
            >
              {order.guestName}
            </h3>
            <p
              className="mt-1 text-sm text-muted-foreground"
              id="order-details-description"
            >
              Room {order.roomNumber} · {order.service}
            </p>
          </div>
          <IconButton label="Close details" onClick={onClose} ref={closeButtonRef}>
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Order ID" value={order.id} />
            <Info label="Guest" value={order.guestName} />
            <Info label="Room" value={order.roomNumber} />
            <Info label="Service" value={order.service} />
            <Info label="Quantity" value={String(order.quantity)} />
            <Info label="Amount" value={formatCurrency(order.amount, order.currency)} />
            <Info label="Order time" value={formatDateTime(order.orderTime)} />
            <Info label="Waiting" value={`${getOrderAgeInMinutes(order, now)} min`} />
            <Info label="Status" value={<StatusBadge status={order.status} />} />
            <Info
              label="Payment"
              value={<PaymentBadge status={order.paymentStatus} />}
            />
          </div>

          <div className="mt-5 rounded-md border border-border p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Special Request
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {order.specialRequest ?? "No special request provided."}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              SLA State
            </p>
            {isSlaBreached(order, now) ? (
              <SlaBadge order={order} now={now} />
            ) : (
              <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-950">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Within SLA
              </p>
            )}
          </div>

          <ActionPanel
            isMutating={isMutating}
            nextStatus={nextStatus}
            order={order}
          />
        </div>

        <div className="border-t border-border p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
            {!isFinalOrderStatus(order.status) ? (
              <Button
                className="text-red-700 hover:bg-red-50"
                disabled={isUpdatingAnyOrder}
                onClick={onCancel}
                variant="secondary"
              >
                Cancel Order
              </Button>
            ) : null}
            {nextStatus ? (
              <Button
                disabled={isUpdatingAnyOrder}
                onClick={() => onPrimaryAction(nextStatus)}
              >
                {isMutating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {primaryActionLabels[order.status]}
              </Button>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ActionPanel({
  isMutating,
  nextStatus,
  order,
}: {
  isMutating: boolean;
  nextStatus: OrderStatus | null;
  order: Order;
}) {
  if (!nextStatus) {
    return (
      <div className="mt-5 rounded-md border border-border bg-muted/60 p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Available Actions
        </p>
        <div className="mt-3 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              No further workflow actions
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {order.status === "Completed"
                ? "This request is complete and remains available for review."
                : "This request is cancelled and cannot be moved back into the active workflow."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-md border border-border p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Available Actions
      </p>
      <div className="mt-3 space-y-3">
        <div className="flex items-start gap-3">
          <ActionIcon status={order.status} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {primaryActionLabels[order.status]} → {nextStatus}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {actionDescriptions[order.status]}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 size-5 shrink-0 text-red-700" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Cancel → Cancelled
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Requires confirmation and is only available while the order is not
              final.
            </p>
          </div>
        </div>
        {isMutating ? (
          <p className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-sm font-semibold text-primary">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Updating {order.id}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ActionIcon({ status }: { status: OrderStatus }) {
  if (status === "New") {
    return <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-primary" />;
  }

  if (status === "Acknowledged") {
    return <PlayCircle className="mt-0.5 size-5 shrink-0 text-primary" />;
  }

  return <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />;
}

function CancelDialog({
  isMutating,
  onClose,
  onConfirm,
  order,
}: {
  isMutating: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order;
}) {
  const returnButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    returnButtonRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isMutating) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby="cancel-order-description"
        aria-labelledby="cancel-order-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-surface p-5 shadow-2xl"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !isMutating) {
            onClose();
          }
        }}
        role="alertdialog"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              className="text-lg font-semibold text-foreground"
              id="cancel-order-title"
            >
              Cancel {order.id}?
            </h3>
            <p
              className="mt-2 text-sm leading-6 text-muted-foreground"
              id="cancel-order-description"
            >
              This will close the request for {order.guestName} in room{" "}
              {order.roomNumber}. The order cannot move through the active
              workflow after cancellation.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            disabled={isMutating}
            onClick={onClose}
            ref={returnButtonRef}
            variant="secondary"
          >
            Return
          </Button>
          <Button
            className="bg-red-700 text-white hover:bg-red-800"
            disabled={isMutating}
            onClick={onConfirm}
          >
            {isMutating ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Cancel Order
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
        status === "New" && "border-sky-200 bg-sky-50 text-sky-950",
        status === "Acknowledged" &&
          "border-indigo-200 bg-indigo-50 text-indigo-950",
        status === "In Progress" &&
          "border-amber-200 bg-amber-50 text-amber-950",
        status === "Completed" &&
          "border-emerald-200 bg-emerald-50 text-emerald-950",
        status === "Cancelled" && "border-slate-200 bg-slate-100 text-slate-700",
      )}
    >
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold",
        status === "Paid" && "border-emerald-200 bg-emerald-50 text-emerald-950",
        status === "Pending" && "border-slate-200 bg-slate-100 text-slate-700",
        status === "Failed" && "border-red-200 bg-red-50 text-red-950",
      )}
    >
      {status === "Failed" ? (
        <AlertTriangle className="size-3.5" aria-hidden="true" />
      ) : null}
      {status}
    </span>
  );
}

function SlaBadge({ now, order }: { now: Date; order: Order }) {
  return (
    <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      SLA breached · waiting {getOrderAgeInMinutes(order, now)} min
    </span>
  );
}

function RelativeAge({ now, order }: { now: Date; order: Order }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Clock3 className="size-4" aria-hidden="true" />
      {getOrderAgeInMinutes(order, now)} min ago
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function EmptyState({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function OrderManagementSkeleton() {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="h-6 w-56 rounded bg-muted" />
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_200px_160px]">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-10 rounded-md bg-muted" />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-14 rounded-md bg-muted" />
        ))}
      </div>
    </section>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3 font-semibold", className)} scope="col">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

function formatCurrency(amount: number, currency: Order["currency"]): string {
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(amount);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
