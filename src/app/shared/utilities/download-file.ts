import { Injectable } from '@angular/core';
import { Buffer } from 'buffer';

@Injectable({
    providedIn: 'root'
})
export class DownloadFile {

    constructor(){}

    Download(response:any){
        var blob = new Blob([this.s2ab(Buffer.from(response.base64, 'base64').toString('utf-8'))], { type: response.mimeType });
        var a = document.createElement('a');
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = response.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    DownloadPdf(response:any){
        var a = document.createElement('a');
        var url = "data:application/pdf;base64," + response.base64;
        a.href = url;
        a.download = response.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    DownloadDocumentBase64(fileName: string, base64: string , mimeType: string){
        var a = document.createElement('a');
        var url = "data:"+mimeType+";base64," + base64;
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    s2ab(s: any) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    };

}