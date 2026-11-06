const PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{ data: unknown; error: { message: string } | null }> & {
  readonly __row?: T;
};

/**
 * PostgREST silently caps a response at 1000 rows, so any list that can grow
 * past that has to be read page by page or it loses rows without an error.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PageResult<T>,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as T[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}
