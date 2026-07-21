export const DEFAULT_PAGE_SIZE = 20;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
