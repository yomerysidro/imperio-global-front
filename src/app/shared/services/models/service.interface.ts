import { FileModel } from "./file-model.interface";


export class ServiceModel{
  id?: string;
  name: string;
  description: string;
  price: number;
  type_service: ParameterModel;
  file: FileModel;
  quantity?: number;
}

class ParameterModel{
  description: string;
}



