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
- Light and dark mode with persisted user preference.
- Desktop order table and mobile/tablet order cards.
- Server-side order pagination with selectable page sizes: 8, 10, 20, or 50 orders per page.
- Order details drawer with complete request context.
- Valid lifecycle actions only: `New -> Acknowledged -> In Progress -> Completed`.
- Cancellation confirmation for non-final orders.
- Optimistic status updates with rollback when a mutation fails.
- SLA breach indicators for New orders older than 15 minutes.
- Real-time toast notifications for new orders and overdue New orders.
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
- `src/mocks`: local order dataset with 150 example orders.
- `test`: Bun unit tests for business logic and mock API failure scenarios.

## State Management

TanStack Query owns async order state, loading/error states, caching, retries, paginated list requests, aggregate dashboard requests, and mutation updates. Status mutations optimistically update cached order pages and detail records, snapshot previous cache data, roll back on failure, and revalidate affected list and overview queries after settlement. A mock real-time subscription emits new-order and overdue-order events, updates detail cache entries, and invalidates affected paginated list and dashboard overview queries. React Router search parameters own order discovery state: search, status filter, service filter, and sort. Local React state is used for UI-only concerns such as selected order, cancellation dialog state, current page, page size, transient toast notifications, and feedback messages. Derived values such as metrics, filtered order counts, paginated orders, SLA state, and status actions are calculated from API data rather than duplicated in state.

## Theme

The app supports light and dark mode through CSS theme tokens and Tailwind's class-based dark mode. Light mode uses the original dashboard color palette and is the default for first-time visitors. The selected theme is stored in `localStorage` under `cmpnion-theme`. The header toggle switches modes without affecting URL state or query cache state.

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

- `getOrdersPage({ filters, page, pageSize })`
- `getDashboardOverview()`
- `getOrderById(orderId)`
- `subscribeToOrderRealtimeEvents(listener)`
- `updateOrderStatus(orderId, nextStatus)`

It clones returned data, validates order responses with Zod, applies search/filter/sort before slicing paginated results, enforces the status machine with `canTransition`, emits mock real-time events, and includes deterministic failure toggles for read and mutation scenarios. Mutations use optimistic cache updates with rollback, then invalidate paginated order-list and dashboard-overview queries so cached pages and aggregate metrics are refreshed without assuming the client has all orders in memory.

The local fixture exports 150 example orders, from `ORD-1001` through `ORD-1150`, so table pagination can be tested without a backend.

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

The dashboard uses stacked layouts on small screens, two- and three-column metric layouts on tablet widths, and a full operational grid on large screens. Orders render as cards below the large desktop breakpoint and as a full table on wide screens. Pagination controls are shared by both order layouts, with compact page status on mobile and numbered page buttons on wider screens. The order details drawer becomes a full-screen sheet on mobile.

## Trade-offs

- The app uses local mock data instead of a production backend.
- Query parameters are validated with lightweight helper functions rather than a router-level schema.
- The mock API simulates server-side filtering, sorting, and pagination in memory; a production API should push those operations into indexed backend queries.
- Toasts are implemented as inline live feedback instead of adding a separate notification dependency.
- The UI avoids authentication and role-based permissions because they are outside the take-home scope.

## Known Limitations

- No real backend persistence.
- No authentication or authorization.
- No table virtualization for extremely dense single-page table views.
- Component interaction tests are limited by the current no-DOM Bun test setup.

## Future Improvements

- Add table virtualization for extremely dense single-page table views.
- Add a production API layer and real persistence.
- Replace the mock real-time event stream with WebSocket or server-sent events.
- Add component tests with a DOM test environment.
- Add role-based permissions and audit history.

## Deployment

Deployment URL: https://cmpnion-hotel-management.vercel.app/dashboard
