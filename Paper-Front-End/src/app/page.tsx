import Link from "next/link";
import { Button } from "@/core/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Kami</h1>
        <p className="text-muted-foreground">
          Codebase-template da Origami Lab. A UI base vive em{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            core/components/ui
          </code>
          .
        </p>
      </div>
      <Button asChild>
        <Link href="/componentes">Ver componentes</Link>
      </Button>
    </main>
  );
}
