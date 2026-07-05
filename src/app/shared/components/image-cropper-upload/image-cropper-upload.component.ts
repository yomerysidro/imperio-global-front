import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-image-cropper-upload',
  templateUrl: './image-cropper-upload.component.html',
  styleUrls: ['./image-cropper-upload.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule
  ]
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
    // Si se recibió un archivo al abrir el modal, procesarlo
    if (this.file && this.file instanceof Blob) {
      this.processFile(this.file);
    }
  }

  onFileSelected(event: any): void {
    // Obtener el archivo del evento
    const files = event.target?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        this.processFile(file);
      }
    }
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  }

  processFile(file: any): void {
    console.log('Procesando archivo:', file);

    if (file instanceof Blob) {
      this.readAndPreview(file);
      this.imageCroppedBlob = file;
    } 
    else if (file && typeof file === 'object' && file.size !== undefined && file.type !== undefined) {
      const blob = new Blob([file], { type: file.type });
      this.readAndPreview(blob);
      this.imageCroppedBlob = blob;
    } 
    else {
      console.error('El archivo no es válido:', file);
    }
  }

  private readAndPreview(file: Blob): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.previewImage = null;
    this.imageCroppedBlob = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  public handleCancel(): void {
    this.modalRef.close({ file: null });
  }

  public handleOk(): void {
    if (this.imageCroppedBlob) {
      this.loadingSubmit = true;
      // 🔥 Crear un archivo con nombre y tipo correcto
      const file = new File([this.imageCroppedBlob], 'avatar.png', { type: 'image/png' });
      // 🔥 Cerrar el modal y devolver el archivo al padre
      this.modalRef.close({ file: file });
      this.loadingSubmit = false;
    } else {
      this.modalRef.close({ file: null });
    }
  }
}