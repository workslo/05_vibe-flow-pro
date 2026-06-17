import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/workflow/layouts/sidebar-layout/app-sidebar';
import { productProfile } from '@/app/workflow/product-profile';

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex h-screen w-full flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 pl-12 backdrop-blur">
          <SidebarTrigger className="absolute left-2 top-2.5 z-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {productProfile.defaultFlowName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Zustand canvas state · {productProfile.integrationStatus}
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="rounded-md border px-2 py-1">Draft workspace</span>
            <span className="rounded-md border px-2 py-1">Local dev</span>
          </div>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </main>
    </SidebarProvider>
  );
}
