declare module 'pdfmake/build/pdfmake' {
  export interface TDocumentDefinitions {
    content: any[];
    styles?: any;
    defaultStyle?: any;
    pageSize?: string;
    pageOrientation?: string;
    pageMargins?: [number, number, number, number];
    header?: any;
    footer?: any;
    background?: any;
    [key: string]: any;
  }

  export interface TCreatedPdf {
    download: (defaultFileName?: string) => void;
    open: (options?: any) => void;
    print: (options?: any) => void;
    getDataUrl: (callback: (dataUrl: string) => void) => void;
    getBlob: (callback: (blob: Blob) => void) => void;
    getBase64: (callback: (base64: string) => void) => void;
    getBuffer: (callback: (buffer: ArrayBuffer) => void) => void;
    save: (filename: string) => void;
  }

  function createPdf(documentDefinition: TDocumentDefinitions): TCreatedPdf;
  
  export { createPdf };
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: { [key: string]: string };
  export = { pdfMake: { vfs } };
} 