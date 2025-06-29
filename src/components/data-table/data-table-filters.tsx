import { useDebounce } from "@/hooks/use-debounce";
import { type Table as TableType } from "@tanstack/react-table";
// 1. MIGRATED: TanStack Router hooks are no longer needed.
import { useEffect, useState } from "react";
import { type IfacetedFilters } from ".";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { AppSearchInput } from "../app/AppSearchInput";

export default function DataTableFilters<TData>({
  table,
  facetedFilters,
}: {
  table: TableType<TData>;
  facetedFilters: IfacetedFilters[];
}) {
  // 2. A helper function to read the 'search' param directly from the browser's URL.
  const getSearchFromURL = () => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("search") ?? "";
  };

  // 3. Initialize the input's state directly from the URL.
  const [inputValue, setInputValue] = useState(getSearchFromURL());
  const debouncedInputValue = useDebounce(inputValue, 500); // wait 500ms

  // 4. This effect syncs the debounced input value to the URL and the table filter.
  // It runs whenever the user stops typing.
  useEffect(() => {
    // Update the URL using the History API.
    const currentUrl = new URL(window.location.href);
    if (debouncedInputValue) {
      currentUrl.searchParams.set("search", debouncedInputValue);
    } else {
      currentUrl.searchParams.delete("search");
    }
    // `replaceState` modifies the URL without adding a new entry to the browser's history.
    window.history.replaceState({}, "", currentUrl);

    // Update the TanStack Table global filter.
    table.setGlobalFilter(debouncedInputValue);
  }, [debouncedInputValue, table]);

  // 5. This effect handles browser back/forward navigation.
  // It listens for the `popstate` event, which fires when the URL changes due to navigation.
  useEffect(() => {
    const handlePopState = () => {
      // When the user navigates, read the new search param from the URL
      // and update the component's state to match.
      setInputValue(getSearchFromURL());
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup by removing the event listener when the component unmounts.
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount.

  return (
    <div className="flex justify-start items-start gap-2 flex-col">
      <AppSearchInput
        placeholder="Search..."
        value={inputValue}
        onChange={(e) => setInputValue(e.currentTarget.value)}
        className="md:w-xs lg:w-sm xl:w-md"
      />
      <div className="flex flex-wrap gap-2">
        {facetedFilters?.map(
          (filter) =>
            table.getColumn(filter.column) && (
              <DataTableFacetedFilter
                key={filter.column}
                column={table.getColumn(filter.column)}
                title={filter.title}
                options={filter.options}
              />
            )
        )}
      </div>
    </div>
  );
}
