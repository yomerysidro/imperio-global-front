import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
// ❌ ELIMINAR ESTA IMPORTACIÓN
// import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-upload',
  templateUrl: './image-cropper-upload.component.html',
  styleUrls: ['./image-cropper-upload.component.scss']
})
export class ImageCropperUploadComponent implements OnInit {

  @Input() file: any = '';

  previewImage: string | null = null;
  imageCroppedBlob: Blob | null = null;
  loadingSubmit: boolean = false;

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) private modalData: any,
    private modalRef: NzModalRef,
  ) {
    if (this.modalData) {
      Object.assign(this, this.modalData);
    }
  }

  ngOnInit(): void {
    // Si se recibe un archivo inicial, mostrarlo
    if (this.file) {
      this.processFile(this.file);
    }
  }

  // ✅ Manejar selección de archivo
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  // ✅ Procesar el archivo seleccionado
  processFile(file: any): void {
    // Crear vista previa
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Guardar el blob
    this.imageCroppedBlob = file;
  }

  // ✅ Eliminar imagen
  removeImage(): void {
    this.previewImage = null;
    this.imageCroppedBlob = null;
    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // ✅ Cancelar
  public handleCancel(): void {
    this.modalRef.close({ file: null });
  }

  // ✅ Guardar
  public handleOk(): void {
    if (this.imageCroppedBlob) {
      this.loadingSubmit = true;
      // Crear un objeto File a partir del Blob
      const file = new File([this.imageCroppedBlob], 'cropped-image.png', { type: 'image/png' });
      this.modalRef.close({ file: file });
      this.loadingSubmit = false;
    }
  }
}