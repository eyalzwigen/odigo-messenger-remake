import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class name values and merges conflicting Tailwind utility
 * classes using tailwind-merge.
 *
 * This is the standard shadcn/ui helper.  Pass any mix of strings, arrays,
 * or conditional objects and get back a single deduplicated class string.
 *
 * @param inputs - Any number of class values (strings, arrays, objects)
 * @returns A merged, deduplicated class name string
 *
 * @example
 * cn('px-2 py-1', condition && 'text-red-500', 'px-4')
 * // -> 'py-1 text-red-500 px-4'  (px-2 is overridden by px-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
