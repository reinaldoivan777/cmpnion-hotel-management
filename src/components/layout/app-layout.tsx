import { Bell, CircleHelp, Hotel } from "lucide-react";
import { Outlet } from "react-router-dom";

import { IconButton } from "@/components/ui/icon-button";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hotel className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                CMPNION
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Hotel service operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Open help">
              <CircleHelp className="size-5" aria-hidden="true" />
            </IconButton>
            <IconButton label="View notifications">
              <Bell className="size-5" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
