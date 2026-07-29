"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useResource } from "@/hooks";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/core/components/ui/pagination";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  status: "Ativa" | "Pendente";
};

type PageResult = {
  items: Usuario[];
  total: number;
};

const PAGE_SIZE = 5;

/** Massa de dados estática do showcase — no app real isto vem do API client. */
const USUARIOS: Usuario[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  nome: `Usuário ${String(i + 1).padStart(2, "0")}`,
  email: `usuario${i + 1}@exemplo.com`,
  status: i % 3 === 0 ? "Pendente" : "Ativa",
}));

/**
 * Mock de endpoint paginado com latência simulada — exercita o `isLoading`
 * (anti-flicker) e a proteção de race do `useResource` ao trocar de página rápido.
 */
function fetchUsuarios(page: number): Promise<PageResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const start = (page - 1) * PAGE_SIZE;
      resolve({
        items: USUARIOS.slice(start, start + PAGE_SIZE),
        total: USUARIOS.length,
      });
    }, 500);
  });
}

/** Linhas de skeleton exibidas enquanto o recurso carrega. */
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }, (_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-5 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Tabela + paginação dirigidas pelo `useResource` (padrão do time):
 * a página é estado local e a `action` é memoizada com `useCallback([page])` —
 * a mudança de identidade da action é o gatilho de reload do hook.
 */
export function PaginatedTableDemo() {
  const [page, setPage] = useState(1);

  const action = useCallback(() => fetchUsuarios(page), [page]);
  const { data, isLoading } = useResource({ action });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const goTo = (next: number) => {
    if (next >= 1 && next <= totalPages && next !== page) setPage(next);
  };

  return (
    <div className="w-full space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading || !data ? (
            <SkeletonRows />
          ) : (
            data.items.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {usuario.email}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      usuario.status === "Ativa" ? "secondary" : "outline"
                    }
                  >
                    {usuario.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                goTo(page - 1);
              }}
            >
              <ChevronLeft />
              <span className="hidden sm:block">Anterior</span>
            </PaginationPrevious>
          </PaginationItem>

          {pages.map((n) => (
            <PaginationItem key={n}>
              <PaginationLink
                href="#"
                isActive={n === page}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(n);
                }}
              >
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={page === totalPages}
              className={
                page === totalPages ? "pointer-events-none opacity-50" : ""
              }
              onClick={(e) => {
                e.preventDefault();
                goTo(page + 1);
              }}
            >
              <span className="hidden sm:block">Próxima</span>
              <ChevronRight />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
