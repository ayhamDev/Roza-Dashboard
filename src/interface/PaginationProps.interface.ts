export interface IPaginationProps {
  page?: number;
  limit?: number;
}

export interface IPaginationResponse<T> {
  docs: T[];
  limit: number;
  total: number;
  totalPages: number;
  page: number;
}
