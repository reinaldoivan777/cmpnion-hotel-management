# CMPNION Hotel Service Management Dashboard

A React and TypeScript operations dashboard for hotel staff to monitor guest service requests, find urgent work, and move orders through a controlled lifecycle.

## Product Overview

CMPNION helps hotel operations teams manage service requests such as room service, housekeeping, laundry, extra beds, and spa bookings. The interface prioritizes fast scanning, clear exception handling, and safe operational actions over visual decoration.

## Product Problem

Hotel staff need one place to understand current workload, identify overdue requests, find orders by guest, room, or order ID, and process those orders without exposing invalid workflow transitions.

## Features

- Operational metrics for active guests, pending orders, revenue today, completed orders, average order value, and top selling services.
- Search by guest name, order ID, or room number.
- Filters for order status and service type.
- Newest/oldest sorting by order time.
- URL query parameters for shareable search, filters, and sort state.
- Desktop order table and mobile/tablet order cards.
- Order details drawer with complete request context.
- Valid lifecycle actions only: `New -> Acknowledged -> In Progress -> Completed`.
- Cancellation confirmation for non-final orders.
- SLA breach indicators for New orders older than 15 minutes.
- Loading, empty, error, success, and mutation feedback states.
- Focused Bun tests for selectors, SLA logic, status transitions, and mock API failure paths.

## Tech Stack

- React 18
- TypeScript
- Bun
- Vite
- Tailwind CSS
- TanStack Query
- React Router
- Zod
- Lucide React

## Installation

```sh
bun install
```

## Commands

```sh
bun run dev
bun run test
bun run typecheck
bun run build
bun run preview
```

## Architecture

The app is organized around feature folders and a thin app shell:

- `src/app`: providers, query client, and router.
- `src/components`: reusable layout and UI primitives.
- `src/features/dashboard`: dashboard selectors, metric cards, and top-services UI.
- `src/features/orders`: domain constants, schema, types, selectors, URL-state helpers, mock API, hooks, utilities, and order management UI.
- `src/mocks`: local order dataset.
- `test`: Bun unit tests for business logic and mock API failure scenarios.

## State Management

TanStack Query owns async order state, loading/error states, caching, retries, and mutation updates. React Router search parameters own order discovery state: search, status filter, service filter, and sort. Local React state is used for UI-only concerns such as selected order, cancellation dialog state, and feedback messages. Derived values such as metrics, filtered orders, SLA state, and status actions are calculated from order data rather than duplicated in state.

## URL State

The dashboard supports shareable and refresh-safe order discovery URLs:

```text
/dashboard?search=204&status=New&service=Room%20Service&sort=oldest
```

Supported query parameters:

- `search`: guest name, order ID, or room number.
- `status`: `All`, `New`, `Acknowledged`, `In Progress`, `Completed`, or `Cancelled`.
- `service`: `All`, `Room Service`, `Housekeeping`, `Laundry`, `Extra Bed`, or `Spa & Massage`.
- `sort`: `newest` or `oldest`.

Default values are omitted from the URL. Invalid query values fall back to defaults so malformed URLs do not break the dashboard.

## Mock API Strategy

The mock API in `src/features/orders/api/orders-api.ts` simulates asynchronous backend operations:

- `getOrders()`
- `getOrderById(orderId)`
- `updateOrderStatus(orderId, nextStatus)`

It clones returned data, validates responses with Zod, enforces the status machine with `canTransition`, and includes deterministic failure toggles for read and mutation scenarios.

## Loading and Error Handling

The dashboard renders skeleton states while orders load. Read failures show a clear error panel with a retry action. Mutations show success or error feedback, and failed mutations preserve the existing order state.

## Assumptions

- Currency is USD.
- Active guests are unique rooms with non-cancelled orders.
- Pending orders include New, Acknowledged, and In Progress.
- Revenue Today includes paid, non-cancelled orders created on the current local day.
- Completed Orders counts orders with Completed status.
- Average Order Value uses paid, non-cancelled orders.
- Top Selling Services are ranked by total quantity, then revenue.
- Failed payment does not automatically cancel an order.

## Accessibility Decisions

- Icon-only buttons include accessible labels.
- Keyboard focus is visible.
- A skip link targets the main content landmark.
- Dialogs and drawers have accessible titles and modal semantics.
- Modal interfaces trap focus and return focus on dismissal.
- SLA and payment failures include visible text and icons, not color alone.
- Loading and mutation regions expose busy or live status where practical.

## Responsive Strategy

The dashboard uses stacked layouts on small screens, two- and three-column metric layouts on tablet widths, and a full operational grid on large screens. Orders render as cards below the large desktop breakpoint and as a full table on wide screens. The order details drawer becomes a full-screen sheet on mobile.

## Trade-offs

- The app uses local mock data instead of a production backend.
- Query parameters are validated with lightweight helper functions rather than a router-level schema.
- The order list is client-side filtered and sorted, which is suitable for the current mock dataset but not large production volumes.
- Toasts are implemented as inline live feedback instead of adding a separate notification dependency.
- The UI avoids authentication and role-based permissions because they are outside the take-home scope.

## Known Limitations

- No real backend persistence.
- No authentication or authorization.
- No pagination or virtualization for large datasets.
- No real-time order notifications.
- Component interaction tests are limited by the current no-DOM Bun test setup.

## Future Improvements

- Add pagination or table virtualization.
- Add a production API layer and real persistence.
- Add real-time notifications for new and overdue orders.
- Add component tests with a DOM test environment.
- Add role-based permissions and audit history.

## Deployment

Deployment URL: https://cmpnion-hotel-management.vercel.app/dashboard
