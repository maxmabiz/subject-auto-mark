import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nextVersion(current: string): string {
  const match = current.match(/^V(\d+)\.(\d+)\.(\d+)$/i);
  if (!match) return "V1.0.1";
  return `V${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
