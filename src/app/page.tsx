import Link from 'next/link';
import { ArrowRight, GitBranch, Play, Sparkles } from 'lucide-react';

import { productProfile } from '@/app/workflow/product-profile';

export default async function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GitBranch className="size-4" />
              </div>
              <span className="text-sm font-semibold tracking-wide">
                {productProfile.name}
              </span>
            </div>
            <Link
              href={productProfile.links.workflow}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Open canvas
              <ArrowRight className="size-4" />
            </Link>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5" />
                {productProfile.tagline}
              </div>
              <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
                {productProfile.name}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                {productProfile.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={productProfile.links.workflow}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="size-4" />
                  Open lineage map
                </Link>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-sm font-medium">
                    {productProfile.defaultFlowName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Client thought to filed 1099-B
                  </p>
                </div>
                <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Ready
                </span>
              </div>
              <div className="space-y-3">
                {productProfile.workflowStages.map((stage) => (
                  <div
                    key={stage.index}
                    className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-md border bg-background p-3"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">
                      {stage.index}
                    </span>
                    <span className="text-sm font-medium">{stage.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {stage.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
