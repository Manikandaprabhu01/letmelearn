import { createFileRoute } from "@tanstack/react-router";
import { CompilerWorkbench } from "@/components/compiler/CompilerWorkbench";

export const Route = createFileRoute("/compiler")({ component: CompilerPage });

function CompilerPage() {
  return (
    <main>
      <header className="border-b border-border px-5 py-8 sm:px-8 lg:px-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Menu</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Code Compiler
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
          A scratchpad for the code in the chapters. Python, JavaScript, TypeScript and SQL run in a
          sandboxed frame in this tab — nothing leaves your machine. Java is compiled and run by a
          public compiler service. Each language keeps its own draft in this browser.
        </p>
      </header>
      <CompilerWorkbench />
    </main>
  );
}
