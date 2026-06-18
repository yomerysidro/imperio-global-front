export interface IResponse<T> {
  success: boolean,
  message: string,
  data: T
}

export interface IResponsePaginationModel<T> {
  pagination: PaginationModel,
  items: T
}

class PaginationModel{
  pageCount: number;
  pageIndex: number;
  total: number;
  pageSize: number;
  serial: string;
}
