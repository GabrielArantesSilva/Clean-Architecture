"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/core/components/ui/button";

/**
 * Toggle claro/escuro do showcase — alterna a classe `.dark` no <html>,
 * que é o gatilho do `@custom-variant dark` no globals.css. Intencionalmente
 * sem `next-themes` (o template não força essa dependência — ver ADR-0012).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setDark((v) => !v)}
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
