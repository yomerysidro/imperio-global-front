import { FileModel } from "./file-model.interface";

export interface IProductModel{
  id: string;
  title: string;
  price: number | string;
  public_price: number;
  discount_percentage: number;
  final_price: number;
  points: number;
  state: boolean;
  stock: number;
  file: number | null;
  quantity?: number;
  file_image?: FileModel | null;
}
