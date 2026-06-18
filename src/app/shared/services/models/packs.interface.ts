import { FileModel } from "./file-model.interface";

export interface PackModel{
  id: string;
  title: string;
  price: string;
  points: number;
  state: boolean;
  image: number;
  file: FileModel;
}
