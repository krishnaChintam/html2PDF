import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import html2pdf from 'html2pdf.js';

@Injectable({ providedIn: 'root'})
export class DownloadService {
  constructor() {
    try {
      (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
    } catch (error) {
      console.error('Error initializing pdfMake:', error);
    }
  }

  // Show a simple loading overlay while PDF is generating
  private showLoading(): void {
    if (document.getElementById('pdf-loading-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'pdf-loading-overlay';
    overlay.style.cssText = `position: fixed;top: 0;left: 0;width: 100%;height: 100%;background-color: rgba(0,0,0,0.5);display: flex;align-items: center;justify-content: center;z-index: 9999;`;
    const message = document.createElement('div');
    message.textContent = 'Generating PDF...';
    message.style.cssText = `background: rgba(0,0,0,0.85);color: white;padding: 1rem 2rem;border-radius: 8px;font-size: 16px;`;
    overlay.appendChild(message);
    document.body.appendChild(overlay);
  }

  // Remove the loading overlay
  private hideLoading(): void {
    const overlay = document.getElementById('pdf-loading-overlay');
    if (overlay) overlay.remove();
  }
 // Download PDF from element ID
  public async downloadElementAsPdf(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID '${elementId}' not found.`);
      return;
    }
    this.showLoading();
    try {
      const processedElement = this.preprocessElement(element);
      const docContent = await this.extractTextContent(processedElement);
      const docDefinition = this.getPdfDocDefinition(docContent, fileName);
      pdfMake.createPdf(docDefinition as any).download(`${fileName}.pdf`);
      setTimeout(() => this.hideLoading(), 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.hideLoading();
      alert('PDF generation failed.');
    }
  }

  // Preprocess the DOM for PDF extraction
  private preprocessElement(element: HTMLElement): HTMLElement {
    const clone = element.cloneNode(true) as HTMLElement;
    const tabPanes = clone.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
      (pane as HTMLElement).style.display = 'block';
      (pane as HTMLElement).classList.add('active', 'show');
    });
    return clone;
  }

  // Define the base doc definition
  private getPdfDocDefinition(content: any[], fileName: string) {
    return {
      content,
      defaultStyle: { fontSize: 11, lineHeight: 1.2, font: 'Roboto' },
      styles: {
        header1: { fontSize: 22, bold: true, margin: [0, 5, 0, 10] },
        header2: { fontSize: 16, bold: true, margin: [0, 5, 0, 5] },
        header3: { fontSize: 14, bold: true, margin: [0, 3, 0, 3] },
        header4: { fontSize: 12, bold: true, margin: [0, 2, 0, 2] },
        tableHeader: { bold: true, fontSize: 12, fillColor: '#f8f9fa' },
        link: { decoration: 'underline', color: '#0563c1' }
      },
      pageMargins: [30, 30, 30, 30],
      info: { title: fileName, author: 'PDF Generator', subject: 'HTML to PDF Export', creator: 'Angular Service' }
    };
  }

    // Entry point: Extract structured content from HTML element
  private async extractTextContent(element: HTMLElement): Promise<any[]> {
    return await this.processElement(element, new Set());
  }

  // Dispatch processing to the appropriate element handler
  private async processElement(element: HTMLElement, headings: Set<string>): Promise<any[]> {
    const content: any[] = [];
    const tag = element.tagName.toLowerCase();
    const processor = this.elementProcessors[tag];
    if (processor) {
      await processor(element, headings, content);
    } else {
      await this.processDefault(element, headings, content);
    }
    return content;
  }

  // Map of element tag names to processing functions
  private elementProcessors: Record<string, (e: HTMLElement, h: Set<string>, c: any[]) => Promise<void>> = {
    h1: async (e, h, c) => this.processHeading(e, h, c),
    h2: async (e, h, c) => this.processHeading(e, h, c),
    h3: async (e, h, c) => this.processHeading(e, h, c),
    h4: async (e, h, c) => this.processHeading(e, h, c),
    h5: async (e, h, c) => this.processHeading(e, h, c),
    h6: async (e, h, c) => this.processHeading(e, h, c),
    p: async (e, h, c) => this.processParagraph(e, h, c),
    a: async (e, h, c) => this.processLink(e, h, c),
    ul: async (e, h, c) => this.processList(e, c, false),
    ol: async (e, h, c) => this.processList(e, c, true),
    table: async (e, h, c) => this.processTable(e, h, c),
    div: async (e, h, c) => this.processContainer(e, h, c),
    section: async (e, h, c) => this.processContainer(e, h, c),
    article: async (e, h, c) => this.processContainer(e, h, c),
    main: async (e, h, c) => this.processContainer(e, h, c),
    aside: async (e, h, c) => this.processContainer(e, h, c),
    span: async (e, h, c) => this.processSpan(e, h, c),
    label: async (e, h, c) => this.processLabel(e, h, c),
    img: async (e, h, c) => this.processImage(e, h, c)
  };

  public async downloadCombinedPdf(elementIds: string[], fileName: string = 'combined-report'): Promise<void> {
    if (!elementIds.length) {
      console.error('No element IDs provided.');
      return;
    }
    this.showLoading();
    try {
      const combinedContent: any[] = [];
      for (let index = 0; index < elementIds.length; index++) {
        const id = elementIds[index];
        const el = document.getElementById(id);
        if (!el) {
          console.warn(`Element with ID '${id}' not found.`);
          continue;
        }
        const processed = this.preprocessElement(el);
        const content = await this.extractTextContent(processed);
        combinedContent.push(...content);
        if (index < elementIds.length - 1) {
          combinedContent.push({ text: '', pageBreak: 'after' });
        }
      }
      if (!combinedContent.length) {
        console.error('No content found in provided element IDs.');
        this.hideLoading();
        return;
      }
      const docDefinition = this.getPdfDocDefinition(combinedContent, fileName);
      pdfMake.createPdf(docDefinition as any).download(`${fileName}.pdf`);
      setTimeout(() => this.hideLoading(), 1000);
    } catch (err) {
      console.error('Error generating combined PDF:', err);
      this.hideLoading();
      alert('Failed to generate combined PDF.');
    }
  }

    private async processHeading(el: HTMLElement, headings: Set<string>, content: any[]): Promise<void> {
    const text = el.textContent?.trim() || '';
    if (headings.has(text)) return;
    const styles: any = {
      h1: ['header1', [0, 5, 0, 10], 'center'],
      h2: ['header2', [0, 5, 0, 5], 'left'],
      h3: ['header3', [0, 3, 0, 3], 'left'],
      h4: ['header4', [0, 2, 0, 2], 'left']
    };
    const [style, margin, align] = styles[el.tagName.toLowerCase()] || ['header4', [0, 2, 0, 2], 'left'];
    content.push({ text, style, margin, alignment: el.style.textAlign || align });
    headings.add(text);
  }

  private async processParagraph(el: HTMLElement, _: Set<string>, content: any[]): Promise<void> {
    content.push({ text: el.textContent, margin: [0, 1, 0, 1], alignment: el.style.textAlign || 'left' });
  }

  private async processLink(el: HTMLElement, _: Set<string>, content: any[]): Promise<void> {
    const href = el.getAttribute('href');
    content.push(href ? this.buildLink(el.textContent, href) : { text: el.textContent });
  }

  private async processLabel(el: HTMLElement, _: Set<string>, content: any[]): Promise<void> {
    if (el.textContent?.trim()) content.push({ text: el.textContent, margin: [0, 0, 0, 0] });
  }

  private async processSpan(el: HTMLElement, _: Set<string>, content: any[]): Promise<void> {
    if (el.classList.contains('badge')) content.push(this.extractBadgeText(el));
    else if (el.textContent?.trim()) content.push({ text: el.textContent });
  }

  private async processImage(el: HTMLElement, _: Set<string>, content: any[]): Promise<void> {
    const src = el.getAttribute('src');
    if (!src) return;
    const base64 = src.startsWith('data:') ? src : await this.loadImageAndConvertToBase64(src);
    if (!base64) return;
    content.push({ image: base64, fit: [parseInt(el.getAttribute('width') || '200'), parseInt(el.getAttribute('height') || '200')], margin: [0, 5, 0, 5] });
  }

  private loadImageAndConvertToBase64(src: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = src;
    });
  }

  private buildLink(text: string | null, href: string): any {
    return { text, link: href, color: 'blue', decoration: 'underline', style: 'link' };
  }

  private extractBadgeText(el: Element): any {
    return { text: el.textContent, background: '#0d6efd', color: 'white', bold: true, fontSize: 10, padding: [4, 2, 4, 2], borderRadius: 5 };
  }

    private async processList(el: HTMLElement, content: any[], ordered: boolean): Promise<void> {
    const items = Array.from(el.querySelectorAll('li')).map(li => {
      const badge = li.querySelector('.badge');
      const link = li.querySelector('a');
      if (badge) return [{ text: li.textContent?.replace(badge.textContent || '', '') || '' }, this.extractBadgeText(badge)];
      if (link) return [this.buildLink(link.textContent, link.getAttribute('href') || ''), { text: li.textContent?.replace(link.textContent || '', '') }];
      return li.textContent;
    });
    if (items.length) content.push({ [ordered ? 'ol' : 'ul']: items, margin: [0, 5, 0, 5] });
  }

  private async processTable(el: HTMLElement, headings: Set<string>, content: any[]): Promise<void> {
    const body: any[][] = [];
    const headers = Array.from(el.querySelectorAll('thead th')).map((th: any) => this.buildTableCell(th, true, headings));
    if (headers.length) body.push(headers);
    el.querySelectorAll('tbody tr').forEach(tr => {
      const row = Array.from(tr.querySelectorAll('td')).map(td => this.buildTableCell(td));
      if (row.length) body.push(row);
    });
    if (body.length)
      content.push({
        table: { headerRows: headers.length ? 1 : 0, widths: Array(body[0].length).fill('*'), body, dontBreakRows: true },
        layout: this.getTableLayout(), margin: [0, 2, 0, 8], unbreakable: true
      });
  }

  private async processContainer(el: HTMLElement, headings: Set<string>, content: any[]): Promise<void> {
    const isCard = el.classList.contains('card') || el.classList.contains('report-container');
    const titleEl = el.querySelector('.card-header, .report-title');
    const titleText = titleEl?.textContent?.trim();
    if (isCard && titleText && !headings.has(titleText)) {
      content.push({ text: titleText, style: 'header3', fillColor: '#f8f9fa', padding: [6, 6, 6, 6], margin: [0, 0, 0, 0] });
      headings.add(titleText);
    }
    const stack: any[] = [];
    for (const child of Array.from(el.children)) {
      if (this.shouldIncludeElement(child as HTMLElement)) {
        const childContent = await this.processElement(child as HTMLElement, headings);
        stack.push(...childContent);
      }
    }
    if (isCard && stack.length) {
      content.push({ stack, margin: [0, 0, 0, 8], padding: [6, 6, 6, 6], background: '#fff', border: [1, 1, 1, 1], borderColor: '#ddd', borderRadius: 5, unbreakable: true });
    } else {
      content.push(...stack);
    }
  }

  private async processDefault(el: HTMLElement, headings: Set<string>, content: any[]): Promise<void> {
    if (el.textContent?.trim()) {
      content.push({ text: el.textContent.trim() });
    } else {
      for (const child of Array.from(el.children)) {
        if (this.shouldIncludeElement(child as HTMLElement)) {
          const childContent = await this.processElement(child as HTMLElement, headings);
          content.push(...childContent);
        }
      }
    }
  }

  private buildTableCell(td: HTMLElement, isHeader = false, headings?: Set<string>): any {
    const text = td.textContent?.trim() || '';
    if (isHeader && headings?.has(text) && /Regional Breakdown|Key Financial Metrics|Top Products/.test(text)) return { text: '' };
    const badge = td.querySelector('.badge');
    const link = td.querySelector('a');
    if (badge) return this.extractBadgeText(badge);
    if (link && link.getAttribute('href')) return this.buildLink(link.textContent, link.getAttribute('href')!);
    return { text, style: isHeader ? 'tableHeader' : undefined, fillColor: isHeader ? '#f8f9fa' : undefined, alignment: td.getAttribute('align') || 'left' };
  }

  private getTableLayout() {
    return {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#dddddd',
      vLineColor: () => '#dddddd',
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6
    };
  }

  private shouldIncludeElement(el: HTMLElement): boolean {
    return !(el.style.display === 'none' ||
             el.style.visibility === 'hidden' ||
             el.classList.contains('d-none') ||
             el.classList.contains('nav-tabs') ||
             el.classList.contains('nav-link') ||
             el.getAttribute('role') === 'tablist');
  }
}