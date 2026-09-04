import { globalSettings } from "@proofkit/webviewer";
import type { LucideIcon } from "lucide-react";
import { Database, Layers, Sparkles } from "lucide-react";

interface Step {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly body: string;
}

globalSettings.setWebViewerName("web");

const steps: readonly Step[] = [
  {
    body: "This starter renders safely in a normal browser. When you are ready, wire in FM MCP or hosted FileMaker setup with ProofKit commands.",
    icon: Database,
    title: "Connect FileMaker later",
  },
  {
    body: "Add layouts to proofkit.config.json, then run your typegen script to create strongly typed layout clients.",
    icon: Layers,
    title: "Generate clients when ready",
  },
  {
    body: "Tailwind v4 and shadcn are already initialized, so agents and developers can add components without extra setup.",
    icon: Sparkles,
    title: "Add shadcn components fast",
  },
] as const;

const App = () => (
  <main>
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10">
      <div className="mb-10 flex-1">
        <div className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm shadow-sm">
          <span className="bg-primary h-2 w-2 rounded-full" />
          ProofKit Web Viewer Starter
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="border-border bg-card/80 rounded-3xl border p-8 shadow-sm">
            <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">
              React + TypeScript + Vite
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Build browser-safe FileMaker Web Viewer apps without scaffolding
              against a hosted server.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
              This starter stays intentionally small, but it is already ready
              for Tailwind v4, shadcn component installs, hash-based TanStack
              Router navigation, React Query, and later ProofKit typegen output.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <code className="border-border bg-background rounded-full border px-3 py-1.5">
                pnpm dev
              </code>
              <code className="border-border bg-background rounded-full border px-3 py-1.5">
                pnpm typegen
              </code>
              <code className="border-border bg-background rounded-full border px-3 py-1.5">
                pnpm launch-fm
              </code>
            </div>
          </section>

          <aside className="border-border from-card via-card to-muted/50 rounded-3xl border bg-gradient-to-br p-8 shadow-sm">
            <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">
              Starter notes
            </p>
            <div className="text-muted-foreground mt-5 space-y-4 text-sm">
              <p>
                Update the default Web Viewer name in <code>src/app.tsx</code>{" "}
                to match your FileMaker layout object.
              </p>
              <p>
                When the app runs inside FileMaker, you can start using{" "}
                <code>fmFetch</code> or generated clients right away.
              </p>
              <p>
                The local helper scripts prefer FM MCP connected files before
                falling back to hosted server env vars.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="border-border bg-card rounded-2xl border p-6 shadow-sm"
            >
              <step.icon className="text-primary h-5 w-5" />
              <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {step.body}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  </main>
);

export default App;
