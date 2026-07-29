import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais (clsx) e resolve conflitos do Tailwind
 * (tailwind-merge). Toda a UI base do Kami usa `cn` para permitir que o
 * projeto consumidor sobrescreva estilos via `className` sem duplicar utilitários.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
