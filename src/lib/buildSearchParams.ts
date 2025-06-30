// utils/buildSearchParams.ts
import { type IFilterProps } from "@/interface/filterProps.interface";
import { type IPaginationProps } from "@/interface/PaginationProps.interface";
import { type ISearchProps } from "@/interface/SearchProps.interface";
import { type ISortProps } from "@/interface/SortProps.interface";

export type SearchParams = ISortProps &
  IPaginationProps &
  ISearchProps &
  IFilterProps;

/**
 * Builds a URLSearchParams object based on the given SearchParams.
 *
 * @param {SearchParams} props
 * @returns {URLSearchParams}
 */

export const buildSearchParams = (props: SearchParams): URLSearchParams => {
  const params = new URLSearchParams();

  // Pagination
  if (props.page !== undefined) {
    params.append("page", props.page.toString());
  }
  if (props.limit !== undefined) {
    params.append("limit", props.limit.toString());
  }

  // Sorting
  if (props.sort?.by) {
    params.append("sort[by]", props.sort.by);
  }
  if (props.sort?.order) {
    params.append("sort[order]", props.sort.order);
  }

  if (props.search) {
    params.append("search", props.search);
  }
  if (props.filter) {
    for (const key in props.filter) {
      if (Object.prototype.hasOwnProperty.call(props.filter, key)) {
        const value = props.filter[key];
        params.append(key, value);
      }
    }
  }
  return params;
};
