import type { Order } from "@/features/orders/orders.types";

const now = Date.now();
const guestNames = [
  "Emma Wilson",
  "Liam Carter",
  "Olivia Bennett",
  "James Patel",
  "Ava Thompson",
  "William Garcia",
  "Isabella Nguyen",
  "Benjamin Lee",
  "Mia Robinson",
  "Henry Clark",
  "Charlotte Lewis",
  "Alexander Young",
  "Amelia King",
  "Michael Scott",
  "Harper Adams",
  "Daniel Rivera",
  "Evelyn Turner",
  "Matthew Phillips",
  "Abigail Campbell",
  "Joseph Mitchell",
  "Ella Roberts",
  "Samuel Green",
  "Grace Baker",
  "David Nelson",
  "Chloe Hill",
  "Gabriel Ramirez",
  "Victoria Parker",
  "Owen Evans",
  "Lily Edwards",
  "Jack Collins",
] as const;
const roomNumbers = [
  "102",
  "118",
  "219",
  "223",
  "314",
  "327",
  "409",
  "418",
  "526",
  "534",
  "612",
  "629",
  "704",
  "733",
  "815",
  "824",
  "901",
  "936",
  "1014",
  "1028",
  "1112",
  "1135",
  "1208",
  "1224",
] as const;
const generatedServices = [
  "Room Service",
  "Housekeeping",
  "Laundry",
  "Extra Bed",
  "Spa & Massage",
] as const satisfies readonly Order["service"][];
const generatedStatuses = [
  "New",
  "Acknowledged",
  "In Progress",
  "Completed",
  "Cancelled",
] as const satisfies readonly Order["status"][];
const generatedPaymentStatuses = [
  "Paid",
  "Pending",
  "Failed",
] as const satisfies readonly Order["paymentStatus"][];
const specialRequests = [
  "Please call before arriving.",
  "Guest requested quiet handling.",
  "Deliver to reception if room is occupied.",
  "Prioritize before checkout.",
  null,
] as const;
const serviceBaseAmounts: Record<Order["service"], number> = {
  "Room Service": 24,
  Housekeeping: 0,
  Laundry: 9,
  "Extra Bed": 30,
  "Spa & Massage": 120,
};

function minutesAgo(minutes: number): string {
  return new Date(now - minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(now - hours * 60 * 60_000).toISOString();
}

const initialOrders: Order[] = [
  {
    id: "ORD-1001",
    guestName: "Maya Chen",
    roomNumber: "204",
    service: "Room Service",
    quantity: 2,
    amount: 48,
    currency: "USD",
    specialRequest: "No onions. Please call before delivery.",
    orderTime: minutesAgo(22),
    status: "New",
    paymentStatus: "Paid",
  },
  {
    id: "ORD-1002",
    guestName: "Daniel Brooks",
    roomNumber: "918",
    service: "Housekeeping",
    quantity: 1,
    amount: 0,
    currency: "USD",
    specialRequest: "Fresh towels and room refresh.",
    orderTime: minutesAgo(11),
    status: "New",
    paymentStatus: "Pending",
  },
  {
    id: "ORD-1003",
    guestName: "Sofia Martinez",
    roomNumber: "502",
    service: "Laundry",
    quantity: 4,
    amount: 36,
    currency: "USD",
    specialRequest: null,
    orderTime: minutesAgo(38),
    status: "Acknowledged",
    paymentStatus: "Paid",
  },
  {
    id: "ORD-1004",
    guestName: "Ethan Wright",
    roomNumber: "711",
    service: "Spa & Massage",
    quantity: 1,
    amount: 120,
    currency: "USD",
    specialRequest: "Prefer female therapist.",
    orderTime: hoursAgo(1.5),
    status: "In Progress",
    paymentStatus: "Failed",
  },
  {
    id: "ORD-1005",
    guestName: "Aisha Rahman",
    roomNumber: "305",
    service: "Extra Bed",
    quantity: 1,
    amount: 30,
    currency: "USD",
    specialRequest: "Set up before 8 PM.",
    orderTime: hoursAgo(2),
    status: "Completed",
    paymentStatus: "Paid",
  },
  {
    id: "ORD-1006",
    guestName: "Noah Kim",
    roomNumber: "1201",
    service: "Room Service",
    quantity: 1,
    amount: 24,
    currency: "USD",
    specialRequest: "Leave at door.",
    orderTime: hoursAgo(3),
    status: "Cancelled",
    paymentStatus: "Pending",
  },
  {
    id: "ORD-1007",
    guestName: "Priya Shah",
    roomNumber: "407",
    service: "Laundry",
    quantity: 2,
    amount: 18,
    currency: "USD",
    specialRequest: "Express service requested.",
    orderTime: minutesAgo(7),
    status: "Acknowledged",
    paymentStatus: "Paid",
  },
  {
    id: "ORD-1008",
    guestName: "Lucas Meyer",
    roomNumber: "816",
    service: "Housekeeping",
    quantity: 1,
    amount: 0,
    currency: "USD",
    specialRequest: null,
    orderTime: hoursAgo(4),
    status: "Completed",
    paymentStatus: "Paid",
  },
];

function createGeneratedOrder(index: number): Order {
  const orderNumber = 1009 + index;
  const service = generatedServices[index % generatedServices.length];
  const quantity =
    service === "Spa & Massage" || service === "Extra Bed"
      ? 1
      : (index % 4) + 1;
  const status = generatedStatuses[index % generatedStatuses.length];

  return {
    id: `ORD-${orderNumber}`,
    guestName: guestNames[index % guestNames.length],
    roomNumber: roomNumbers[index % roomNumbers.length],
    service,
    quantity,
    amount: serviceBaseAmounts[service] * quantity,
    currency: "USD",
    specialRequest: specialRequests[index % specialRequests.length],
    orderTime: minutesAgo(5 + index * 4),
    status,
    paymentStatus:
      generatedPaymentStatuses[index % generatedPaymentStatuses.length],
  };
}

export const mockOrders: Order[] = [
  ...initialOrders,
  ...Array.from({ length: 142 }, (_, index) => createGeneratedOrder(index)),
];
