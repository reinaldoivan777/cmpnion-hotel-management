export const ORDER_STATUSES = [
  "New",
  "Acknowledged",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

export const PAYMENT_STATUSES = ["Paid", "Pending", "Failed"] as const;

export const SERVICE_TYPES = [
  "Room Service",
  "Housekeeping",
  "Laundry",
  "Extra Bed",
  "Spa & Massage",
] as const;

export const FINAL_ORDER_STATUSES = ["Completed", "Cancelled"] as const;

export const SLA_LIMIT_MINUTES = 15;
