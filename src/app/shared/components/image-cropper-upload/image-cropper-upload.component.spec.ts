import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCropperUploadComponent } from './image-cropper-upload.component';

describe('ImageCropperUploadComponent', () => {
  let component: ImageCropperUploadComponent;
  let fixture: ComponentFixture<ImageCropperUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageCropperUploadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageCropperUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
