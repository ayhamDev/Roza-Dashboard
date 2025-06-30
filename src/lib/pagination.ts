/**
 * Calculates the range of items for a given page and limit.
 *
 * @param page - The current page number (1-based index).
 * @param limit - The number of items per page.
 * @returns An object with `from` and `to` properties representing the zero-based
 *          index range of items for the specified page.
 */

import type { IPaginationResponse } from "@/interface/PaginationProps.interface";
import type { SearchParams } from "./buildSearchParams";

export function toRange(page: number, limit: number | undefined | null) {
  const from = (page - 1) * (limit ?? 10);
  return { from, to: from + (limit ?? 10) - 1 };
}

/**
 * Parses a page number from a string parameter, returning 1 if the input is invalid.
 *
 * @param rawPage - The raw page number string parameter, or undefined.
 * @returns A 1-based page number.
 */
export function parsePageParam(rawPage: number | string | undefined | null) {
  const page = Number(rawPage ?? "0") + 1;
  return isNaN(page) || page < 1 ? 1 : page;
}

/**
 * Builds a pagination response object that provides information about the paginated data.
 *
 * @param data - The array of data items for the current page.
 * @param searchParams - The search parameters containing pagination options like page and limit.
 * @param count - The total number of data items available.
 * @returns An object conforming to IPaginationResponse containing paginated data and metadata
 *          including docs, limit, total, totalPages, and page.
 */

export function buildPaginationResponse<T>(
  data: T[],
  searchParams: SearchParams,
  count: number | null
): IPaginationResponse<T> {
  return {
    docs: data ?? [],
    limit: searchParams.limit ?? 10,
    total: count ?? 0,
    totalPages: count ? Math.ceil(count / (searchParams.limit ?? 10)) : 1,
    page: searchParams.page ?? 1,
  };
}
