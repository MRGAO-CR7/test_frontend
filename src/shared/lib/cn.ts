/**
 * Tiny class-name joiner.
 *
 * Equivalent to `clsx`/`classnames` for the very common cases we need:
 *   - strings
 *   - conditional booleans (`x && 'foo'`)
 *   - undefined / null / false
 *
 * Avoiding a dependency keeps the client bundle smaller.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
