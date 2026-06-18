import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    constructor(
        private modal: NzModalService
    ) { }

    confirm(message: string, onOk: any = null, onCancel: any = null) {
        this.modal.confirm({
            nzKeyboard: false,
            nzTitle: 'Confirmación',
            nzContent: message,
            nzOkText: "Aceptar",
            nzOnOk: () => {
                if (onOk !== null)
                    onOk();
            },
            nzOnCancel: () => {
                if (onCancel !== null && onOk !== null)
                    onCancel();
            },
        });
    }

    info(message: string, onOk: any = null) {
        this.modal.info({
            nzKeyboard: false,
            nzTitle: 'Mensaje',
            nzContent: (message),
            nzOkText: "Aceptar",
            nzOnOk: () => {
                if (onOk !== null)
                    onOk();
            }
        });
    }

    success(message: string, onOk: any = null) {
        this.modal.success({
            nzKeyboard: false,
            nzTitle: 'Mensaje',
            nzContent: (message),
            nzOkText: "Aceptar",
            nzOnOk: () => {
                if (onOk !== null)
                    onOk();
            },
        });
    };

    error(message: string, onOk: any = null, onCancel: any = null, width: any = null) {
        this.modal.error({
            nzWidth: width === null ? '416px' : width,
            nzKeyboard: false,
            nzTitle: 'Mensaje',
            nzContent: (message),
            nzOkText: "Aceptar",
            nzOnOk() {
                if (onOk !== null && onOk !== null)
                    onOk();
            },
            nzOnCancel() {
                if (onCancel !== null && onOk !== null)
                    onCancel();
            },
        });
    };

    warning(message, onOk: any = null) {
        this.modal.warning({
            nzKeyboard: false,
            nzTitle: 'Mensaje',
            nzContent: (message),
            nzOkText: "Aceptar",
            nzOnOk() {
                if (onOk !== null && onOk !== null)
                    onOk();
            },
        });
    };
}