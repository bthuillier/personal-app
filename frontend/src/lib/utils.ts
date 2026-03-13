import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a backend enum value for display.
 * - CamelCase → "Camel Case" (e.g. "SolidState" → "Solid State")
 * - UPPER_SNAKE → "Upper Snake" (e.g. "NOISE_GATE" → "Noise Gate")
 * - Short uppercase like "CD" stays as-is
 */
export function formatEnum(value: string): string {
  // Already a simple word (e.g. "Tube", "CD", "Vinyl") — return as-is
  if (/^[A-Z][a-z]*$/.test(value) || /^[A-Z]{1,4}$/.test(value)) {
    return value;
  }

  // UPPER_SNAKE_CASE → Title Case
  if (/^[A-Z][A-Z0-9_]+$/.test(value)) {
    return value
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  }

  // CamelCase → split on boundaries
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}
