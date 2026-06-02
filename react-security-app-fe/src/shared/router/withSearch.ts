/** Append the current location.search to a target pathname. */
export function withSearch(pathname: string, search: string): string {
  return search ? `${pathname}${search}` : pathname;
}
