import Link from 'next/link';
import { ArrowRight, GitBranch } from 'lucide-react';

import { workspaceCatalog } from '@/app/workspace-catalog';
import { productProfile } from '@/app/workflow/product-profile';

export default async function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6">
          <header className="flex items-center gap-3 border-b pb-4">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GitBranch className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">
                {productProfile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {productProfile.tagline}
              </p>
            </div>
          </header>

          <div className="flex flex-1 flex-col py-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Choose a workspace
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {productProfile.description}
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-xl border bg-card">
              {workspaceCatalog.map((workspace) => {
                const statusLabel =
                  workspace.status === 'ready' ? 'Ready' : 'Next';

                if (workspace.status === 'ready') {
                  return (
                    <Link
                      key={workspace.id}
                      href={workspace.href}
                      className="flex w-full items-center gap-4 border-b px-5 py-5 text-left transition hover:bg-accent last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-medium">
                            {workspace.name}
                          </span>
                          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {statusLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {workspace.description}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                }

                return (
                  <div
                    key={workspace.id}
                    className="flex items-center gap-4 px-5 py-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-medium">
                          {workspace.name}
                        </span>
                        <span className="rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {workspace.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
