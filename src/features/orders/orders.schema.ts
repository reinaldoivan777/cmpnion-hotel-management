import { z } from "zod";

import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SERVICE_TYPES,
} from "@/features/orders/orders.constants";

export const orderSchema = z.object({
  id: z.string().min(1),
  guestName: z.string().min(1),
  roomNumber: z.string().min(1),
  service: z.enum(SERVICE_TYPES),
  quantity: z.number().int().positive(),
  amount: z.number().nonnegative(),
  currency: z.literal("USD"),
  specialRequest: z.string().nullable(),
  orderTime: z.string().datetime(),
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

export const ordersSchema = z.array(orderSchema);
