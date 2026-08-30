import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { IProductModel } from '@shared/services/models/product.interface';
import { ModalService } from '@shared/utilities/modal-services';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-product-form-modal',
  templateUrl: './product-form-modal.component.html',
  styleUrls: ['./product-form-modal.component.scss']
})
export class ProductFormModalComponent implements OnInit {
  form: FormGroup;
  product?: IProductModel;
  selectedFile: File | null = null;
  previewUrl: string = CONSTANTS.IMAGE.FALLBACK;
  loading = false;
  fileError = '';
  private initialValue: any;

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) data: { product?: IProductModel; isPromotion?: boolean } | null,
    private fb: FormBuilder,
    private apiService: ApiService,
    private modalService: ModalService,
    private modalRef: NzModalRef
  ) {
    this.product = data?.product;
    this.form = this.fb.group({
      title: [null, [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      points: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      state: [false],
      is_promotion: [false],
      promotion_start_at: [null],
      promotion_end_at: [null]
    });
    if (!this.product && data?.isPromotion) this.form.patchValue({ is_promotion: true });
  }

  ngOnInit(): void {
    if (this.product) {
      this.form.patchValue({
        title: this.product.title,
        price: Number(this.product.public_price ?? this.product.price),
        points: Number(this.product.points),
        stock: Number(this.product.stock),
        state: this.product.state === true || Number(this.product.state) === 1,
        is_promotion: this.product.is_promotion === true || Number(this.product.is_promotion) === 1,
        promotion_start_at: this.toDateTimeInput(this.product.promotion_start_at),
        promotion_end_at: this.toDateTimeInput(this.product.promotion_end_at)
      });
      this.previewUrl = this.getImageUrl(this.product.file_image?.path);
    }
    this.initialValue = this.form.getRawValue();
    this.updatePromotionValidators();
    this.form.get('is_promotion')?.valueChanges.subscribe(() => this.updatePromotionValidators());
  }

  get isEdit(): boolean {
    return Boolean(this.product?.id);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError = '';
    this.selectedFile = null;

    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.fileError = 'La imagen debe ser PNG, JPG, JPEG o WEBP.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'La imagen no debe superar los 5 MB.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  submit(): void {
    if (this.form.get('is_promotion')?.value) {
      const start = this.form.get('promotion_start_at')?.value;
      const end = this.form.get('promotion_end_at')?.value;
      if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
        this.form.get('promotion_end_at')?.setErrors({ dateOrder: true });
      }
    }
    if (this.form.invalid || this.fileError) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const request = this.isEdit ? this.update() : this.create();
    request.subscribe(
      response => {
        this.loading = false;
        if (!response?.success) {
          this.modalService.error(this.getErrorMessage(response));
          return;
        }
        this.modalRef.close(true);
        this.modalService.success(this.isEdit ? 'Producto actualizado correctamente.' : 'Producto creado Sin publicar.');
      },
      error => {
        this.loading = false;
        this.modalService.error(this.getErrorMessage(error));
      }
    );
  }

  cancel(): void {
    this.modalRef.close(false);
  }

  private create() {
    const value = this.form.getRawValue();
    const data = new FormData();
    data.append('title', value.title.trim());
    data.append('price', String(value.price));
    data.append('points', String(value.points));
    data.append('stock', String(value.stock));
    data.append('state', '0');
    data.append('is_promotion', value.is_promotion ? '1' : '0');
    if (value.is_promotion) {
      data.append('promotion_start_at', value.promotion_start_at);
      data.append('promotion_end_at', value.promotion_end_at);
    }
    if (this.selectedFile) data.append('file', this.selectedFile);
    return this.apiService.createProduct(data);
  }

  private update() {
    const current = this.form.getRawValue();
    const changed: any = {};
    Object.keys(current).forEach(key => {
      if (current[key] !== this.initialValue[key]) changed[key] = current[key];
    });

    if (!this.selectedFile) {
      return this.apiService.updateProduct(this.product!.id, changed);
    }

    const data = new FormData();
    data.append('_method', 'PUT');
    Object.keys(changed).forEach(key => {
      const value = key === 'state' || key === 'is_promotion' ? (changed[key] ? '1' : '0') : String(changed[key] ?? '');
      data.append(key, value);
    });
    data.append('file', this.selectedFile);
    return this.apiService.updateProductWithImage(this.product!.id, data);
  }

  private getImageUrl(path?: string): string {
    if (!path) return CONSTANTS.IMAGE.FALLBACK;
    return `${environment.apiStorageUrl}/${path.replace(/^\/?storage\//, '')}`;
  }

  private updatePromotionValidators(): void {
    const required = this.form.get('is_promotion')?.value ? [Validators.required] : [];
    ['promotion_start_at', 'promotion_end_at'].forEach(field => {
      const control = this.form.get(field);
      control?.setValidators(required);
      if (!this.form.get('is_promotion')?.value) control?.setValue(null, { emitEvent: false });
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private toDateTimeInput(value?: string | null): string | null {
    return value ? value.replace(' ', 'T').slice(0, 16) : null;
  }

  private getErrorMessage(error: any): string {
    const body = error?.error ?? error;
    const data = body?.data;
    if (data && typeof data === 'object') {
      const messages = Object.values(data).reduce<string[]>((all, value) => {
        if (Array.isArray(value)) return all.concat(value.map(String));
        if (value !== null && value !== undefined) all.push(String(value));
        return all;
      }, []);
      if (messages.length) return messages.join('\n');
    }
    return body?.message || 'No se pudo guardar el producto.';
  }
}
