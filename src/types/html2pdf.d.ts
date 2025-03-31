declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number;
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  interface Html2Pdf {
    from(element: HTMLElement | string): Html2Pdf;
    set(options: Html2PdfOptions): Html2Pdf;
    save(): Promise<void>;
    outputPdf(): any;
    outputImg(): any;
  }

  function html2pdf(): Html2Pdf;
  function html2pdf(element: HTMLElement | string): Html2Pdf;
  function html2pdf(element: HTMLElement | string, options: Html2PdfOptions): Html2Pdf;

  export default html2pdf;
} 