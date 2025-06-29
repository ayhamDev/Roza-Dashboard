import { useQueryState } from "nuqs";

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  handlePageChange: (newPage: number) => void;
  handlePageSizeChange: (newPageSize: number) => void;
  paginationParams: {
    page: number;
    limit: number;
  };
}

export const usePagination = ({
  initialPage = 1,
  initialPageSize = 10,
}: UsePaginationProps = {}): UsePaginationReturn => {
  const [page, setPage] = useQueryState("page", {
    parse: (value) => parseInt(value) || initialPage,
    serialize: (value) => value?.toString() || initialPage.toString(),
  });

  const [pageSize, setPageSize] = useQueryState("limit", {
    parse: (value) => parseInt(value) || initialPageSize,
    serialize: (value) => value?.toString() || initialPageSize.toString(),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };

  return {
    page: page || initialPage,
    pageSize: pageSize || initialPageSize,
    setPage,
    setPageSize,
    handlePageChange,
    handlePageSizeChange,
    paginationParams: {
      page: page || initialPage,
      limit: pageSize || initialPageSize,
    },
  };
};
