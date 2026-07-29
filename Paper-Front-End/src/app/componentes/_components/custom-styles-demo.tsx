"use client";

import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/lib/utils";

import styles from "./custom-styles-demo.module.css";

/**
 * Prova viva de que a UI base aceita os três mecanismos de customização:
 * tema por arquivo (tokens), `styles.classe` (CSS Module via className) e
 * utilitários Tailwind via className. Nenhum exige mudar o componente.
 */
export function CustomStylesDemo() {
  return (
    <div className="flex w-full flex-wrap items-start gap-6">
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-xs text-muted-foreground">1 · Tokens default</p>
        <div className="flex items-center gap-3">
          <Button>Salvar alterações</Button>
          <Badge>Ativo</Badge>
        </div>
      </div>

      <div className={cn("space-y-3 rounded-lg border p-4", styles.temaExemplo)}>
        <p className="text-xs text-muted-foreground">
          2 · Tema por arquivo — mesmos componentes, tokens redefinidos
        </p>
        <div className="flex items-center gap-3">
          <Button>Salvar alterações</Button>
          <Badge>Ativo</Badge>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-xs text-muted-foreground">
          3 · Overrides via className
        </p>
        <div className="flex items-center gap-3">
          <Button className={styles.botaoDestaque}>Baixar relatório</Button>
          <Button className="rounded-full px-8">Enviar convite</Button>
        </div>
      </div>
    </div>
  );
}
