import { FileModel } from "./file-model.interface";

export interface IProductModel{
  id: string;
  title: string;
  price: number;
  points: number;
  state: boolean;
  stock: number;
  file: number;
  quantity?: number;
  file_image: FileModel;
}
