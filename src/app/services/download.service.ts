import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private loadingIndicator: HTMLElement | null = null;
  
  constructor() {
    try {
      // Set up pdfMake fonts
      (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
    } catch (error) {
      console.error('Error initializing pdfMake:', error);
    }
  }

  /**
   * Creates and shows a simple loading indicator
   */
  private showLoading(): void {
    // If already showing, don't create another one
    if (this.loadingIndicator) {
      return;
    }
    
    // Create overlay to block interaction
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9998';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    // Create loading indicator
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.style.padding = '15px 25px';
    this.loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.loadingIndicator.style.color = 'white';
    this.loadingIndicator.style.borderRadius = '8px';
    this.loadingIndicator.style.zIndex = '9999';
    this.loadingIndicator.style.fontSize = '16px';
    this.loadingIndicator.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    this.loadingIndicator.innerText = 'Generating PDF...';
    
    // Add to DOM
    document.body.appendChild(overlay);
    overlay.appendChild(this.loadingIndicator);
  }
  
  /**
   * Removes the loading indicator
   */
  private hideLoading(): void {
    if (this.loadingIndicator) {
      // Find the parent overlay and remove it
      const overlay = this.loadingIndicator.parentElement;
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }
    this.loadingIndicator = null;
  }

  /**
   * Extracts text content from an HTML element, preserving structure
   * @param element The HTML element to extract content from
   * @returns An array of pdfMake content objects
   */
  private extractTextContent(element: HTMLElement): any[] {
    // Keep track of headings to avoid duplication
    const processedHeadings = new Set<string>();
    
    // Process element with heading tracking
    return this.processElement(element, processedHeadings);
  }

  /**
   * Converts an image element to a base64 data URL using a canvas.
   * @param element - The HTMLImageElement to convert.
   * @returns The base64 data URL string of the image, or an empty string if conversion fails.
   */
  private convertImageToBase64(element: HTMLElement): string {
    if (!(element instanceof HTMLImageElement)) {
      return '';
    }
    
    const img = element as HTMLImageElement;
    
    // Ensure the image is fully loaded
    if (!img.complete || img.naturalWidth === 0) {
      console.warn('Image is not fully loaded or failed to load.');
      return '';
    }
    
    try {
      // Create a canvas element to draw the image
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        // Get the data URL from the canvas in PNG format
        return canvas.toDataURL('image/png');
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
    }
    
    return '';
  }
  
  /**
   * Processes an element and its children for PDF content extraction
   */
  private processElement(element: HTMLElement, processedHeadings: Set<string>): any[] {
    const content: any[] = [];
    
    // Handle elements by their type
    switch (element.tagName.toLowerCase()) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        this.processHeading(element, processedHeadings, content);
        break;
      case 'p':
        content.push({ 
          text: element.textContent, 
          margin: [0, 1, 0, 1],
          alignment: element.style.textAlign || 'left'
        });
        break;
      case 'a':
        this.processLink(element, content);
        break;
      case 'ul':
        this.processUnorderedList(element, content);
        break;
      case 'ol':
        this.processOrderedList(element, content);
        break;
      case 'table':
        this.processTable(element, processedHeadings, content);
        break;
      case 'div':
      case 'section':
      case 'article':
      case 'main':
      case 'aside':
        this.processContainer(element, processedHeadings, content);
        break;
      case 'span':
        this.processSpan(element, content);
        break;
      case 'label':
        if (element.textContent?.trim()) {
          content.push({ text: element.textContent, margin: [0, 0, 0, 0] });
        }
        break;
      case 'img':
        this.processImage(element, content);
        break;
      case 'button':
      case 'input':
      case 'select':
      case 'textarea':
        // Skip form elements
        break;
      default:
        this.processDefault(element, processedHeadings, content);
        break;
    }
    
    return content;
  }

  /**
   * Process heading elements (h1-h6)
   */
  private processHeading(element: HTMLElement, processedHeadings: Set<string>, content: any[]): void {
    const headingText = element.textContent?.trim() || '';
    if (processedHeadings.has(headingText)) {
      return;
    }
    
    const tag = element.tagName.toLowerCase();
    let style = 'header4';
    let margin: number[] = [0, 2, 0, 2];
    
    if (tag === 'h1') {
      style = 'header1';
      margin = [0, 5, 0, 10];
    } else if (tag === 'h2') {
      style = 'header2';
      margin = [0, 5, 0, 5];
    } else if (tag === 'h3') {
      style = 'header3';
      margin = [0, 3, 0, 3];
    }
    
    content.push({ 
      text: headingText, 
      style: style, 
      margin: margin,
      alignment: element.style.textAlign || (tag === 'h1' ? 'center' : 'left')
    });
    
    processedHeadings.add(headingText);
  }

  /**
   * Process link elements
   */
  private processLink(element: HTMLElement, content: any[]): void {
    const href = element.getAttribute('href');
    if (href) {
      content.push({
        text: element.textContent,
        link: href,
        color: 'blue',
        decoration: 'underline',
        style: 'link'
      });
    } else {
      content.push({ text: element.textContent });
    }
  }

  /**
   * Process unordered list elements
   */
  private processUnorderedList(element: HTMLElement, content: any[]): void {
    const ulItems: any[] = [];
    
    Array.from(element.querySelectorAll('li')).forEach(li => {
      const badge = li.querySelector('.badge');
      
      if (badge) {
        const badgeText = badge.textContent;
        ulItems.push({
          text: [
            { text: li.textContent?.replace(badgeText || '', '') || '', margin: [0, 0, 5, 0] },
            { 
              text: badgeText, 
              background: this.getColorForBadge(badge),
              color: 'white',
              bold: true,
              fontSize: 10,
              padding: [4, 2, 4, 2],
              borderRadius: 5
            }
          ]
        });
      } else {
        const link = li.querySelector('a');
        
        if (link) {
          const href = link.getAttribute('href');
          const linkText = link.textContent;
          const restText = li.textContent?.replace(linkText || '', '').trim();
          
          if (href) {
            ulItems.push({
              text: [
                { 
                  text: linkText, 
                  link: href,
                  color: 'blue',
                  decoration: 'underline',
                  style: 'link'
                },
                { text: restText ? ' - ' + restText : '' }
              ]
            });
          } else {
            ulItems.push(li.textContent);
          }
        } else {
          ulItems.push(li.textContent);
        }
      }
    });
    
    if (ulItems.length > 0) {
      content.push({ ul: ulItems, margin: [0, 5, 0, 5] });
    }
  }

  /**
   * Process ordered list elements
   */
  private processOrderedList(element: HTMLElement, content: any[]): void {
    const olItems: any[] = [];
    
    Array.from(element.querySelectorAll('li')).forEach(li => {
      const link = li.querySelector('a');
      
      if (link) {
        const href = link.getAttribute('href');
        const linkText = link.textContent;
        const restText = li.textContent?.replace(linkText || '', '').trim();
        
        if (href) {
          olItems.push({
            text: [
              { 
                text: linkText, 
                link: href,
                color: 'blue',
                decoration: 'underline',
                style: 'link'
              },
              { text: restText ? ' - ' + restText : '' }
            ]
          });
        } else {
          olItems.push(li.textContent);
        }
      } else {
        olItems.push(li.textContent);
      }
    });
    
    if (olItems.length > 0) {
      content.push({ ol: olItems, margin: [0, 5, 0, 5] });
    }
  }

  /**
   * Process table elements
   */
  private processTable(element: HTMLElement, processedHeadings: Set<string>, content: any[]): void {
    const tableBody: any[][] = [];
    
    // Process header rows
    const headerRow: any[] = [];
    const headerCells = element.querySelectorAll('thead th');
    
    if (headerCells.length > 0) {
      headerCells.forEach(th => {
        const headerText = th.textContent?.trim() || '';
        const isDuplicateHeader = processedHeadings.has(headerText) && 
                                 (headerText.includes("Regional Breakdown") || 
                                  headerText.includes("Key Financial Metrics") ||
                                  headerText.includes("Top Products"));
        
        headerRow.push({ 
          text: isDuplicateHeader ? '' : headerText, 
          style: 'tableHeader',
          fillColor: '#f8f9fa',
          alignment: th.getAttribute('align') || 'left'
        });
      });
      
      tableBody.push(headerRow);
    }
    
    // Process body rows
    element.querySelectorAll('tbody tr').forEach(tr => {
      const row: any[] = [];
      
      tr.querySelectorAll('td').forEach(td => {
        const badge = td.querySelector('.badge');
        
        if (badge) {
          row.push({
            text: badge.textContent,
            fillColor: this.getColorForBadge(badge),
            color: 'white',
            bold: true,
            alignment: 'center',
            fontSize: 10,
            padding: [5, 3, 5, 3]
          });
        } else {
          const link = td.querySelector('a');
          
          if (link && link.getAttribute('href')) {
            row.push({
              text: link.textContent,
              link: link.getAttribute('href'),
              color: 'blue',
              decoration: 'underline',
              style: 'link',
              alignment: td.getAttribute('align') || 'left'
            });
          } else {
            row.push({
              text: td.textContent,
              alignment: td.getAttribute('align') || 'left'
            });
          }
        }
      });
      
      if (row.length > 0) {
        tableBody.push(row);
      }
    });
    
    if (tableBody.length > 0) {
      content.push({
        table: {
          headerRows: headerCells.length > 0 ? 1 : 0,
          widths: Array(tableBody[0].length).fill('*'),
          body: tableBody,
          dontBreakRows: true
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#dddddd',
          vLineColor: () => '#dddddd',
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6
        },
        margin: [0, 2, 0, 8],
        unbreakable: true
      });
    }
  }

  /**
   * Process container elements like div, section, etc.
   */
  private processContainer(element: HTMLElement, processedHeadings: Set<string>, content: any[]): void {
    const isCard = element.classList.contains('card') || element.classList.contains('report-container');
    
    // For title or header sections
    if (element.classList.contains('report-title') || element.classList.contains('card-header')) {
      const titleText = element.textContent?.trim() || '';
      
      if (!processedHeadings.has(titleText)) {
        content.push({ 
          text: titleText, 
          style: 'header3', 
          fillColor: '#f8f9fa',
          margin: [0, 0, 0, 0],
          padding: [6, 6, 6, 6]
        });
        
        processedHeadings.add(titleText);
      }
    }
    // For actual cards with content
    else if (isCard) {
      const cardContent: any[] = [];
      
      // Process title first if it exists
      const cardTitle = element.querySelector('.card-header, .report-title');
      if (cardTitle) {
        const titleText = cardTitle.textContent?.trim() || '';
        
        if (!processedHeadings.has(titleText)) {
          cardContent.push({
            text: titleText,
            style: 'header3',
            fillColor: '#f8f9fa',
            padding: [6, 6, 6, 6],
            margin: [0, 0, 0, 0]
          });
          
          processedHeadings.add(titleText);
        }
      }
      
      // Process the rest of the content
      Array.from(element.children).forEach(child => {
        if (this.shouldIncludeElement(child as HTMLElement) && 
            (child !== cardTitle) && 
            !child.classList.contains('card-header') && 
            !child.classList.contains('report-title')) {
          cardContent.push(...this.processElement(child as HTMLElement, processedHeadings));
        }
      });
      
      // Add the card as a table-like structure
      if (cardContent.length > 0) {
        content.push({
          stack: cardContent,
          margin: [0, 0, 0, 8],
          padding: [6, 6, 6, 6],
          background: '#ffffff',
          border: [1, 1, 1, 1],
          borderColor: '#dddddd',
          borderRadius: 5,
          unbreakable: true
        });
      }
    } 
    // For regular containers
    else {
      // Process children recursively
      Array.from(element.children).forEach(child => {
        if (this.shouldIncludeElement(child as HTMLElement)) {
          content.push(...this.processElement(child as HTMLElement, processedHeadings));
        }
      });
      
      // If it has direct text content (not just whitespace)
      if (element.childNodes.length && element.textContent?.trim()) {
        let hasDirectText = false;
        
        for (let i = 0; i < element.childNodes.length; i++) {
          const node = element.childNodes[i];
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            hasDirectText = true;
            break;
          }
        }
        
        if (hasDirectText) {
          content.push({ 
            text: this.getDirectTextContent(element), 
            margin: [0, 1, 0, 1] 
          });
        }
      }
    }
  }

  /**
   * Process span elements
   */
  private processSpan(element: HTMLElement, content: any[]): void {
    if (element.classList.contains('badge')) {
      const backgroundColor = this.getColorForBadge(element);
      content.push({
        text: element.textContent,
        background: backgroundColor,
        color: 'white',
        bold: true,
        fontSize: 10,
        padding: [4, 2, 4, 2],
        borderRadius: 5
      });
    } else if (element.textContent?.trim()) {
      content.push({ text: element.textContent, margin: [0, 0, 0, 0] });
    }
  }

  /**
   * Process image elements
   */
  private processImage(element: HTMLElement, content: any[]): void {
    const src = element.getAttribute('src');
    if (!src) return;
    
    let imageData: string | null = null;
    
    // If the src is already a base64 data URL, use it directly
    if (src.startsWith('data:')) {
      imageData = src;
    } else {
      imageData = this.convertImageToBase64(element);
    }
    
    if (imageData) {
      content.push({
        image: imageData,
        fit: [
          parseInt(element.getAttribute('width') || '200', 10),
          parseInt(element.getAttribute('height') || '200', 10)
        ],
        margin: [0, 5, 0, 5]
      });
    }
  }

  /**
   * Process other elements
   */
  private processDefault(element: HTMLElement, processedHeadings: Set<string>, content: any[]): void {
    if (element.textContent?.trim()) {
      content.push({ text: element.textContent.trim() });
    } else if (element.children.length > 0) {
      Array.from(element.children).forEach(child => {
        if (this.shouldIncludeElement(child as HTMLElement)) {
          content.push(...this.processElement(child as HTMLElement, processedHeadings));
        }
      });
    }
  }
  
  /**
   * Gets the color to use for badges
   */
  private getColorForBadge(badge: Element): string {
    if (badge.classList.contains('bg-primary') || badge.classList.contains('badge-primary')) {
      return '#0d6efd';
    } else if (badge.classList.contains('bg-secondary') || badge.classList.contains('badge-secondary')) {
      return '#6c757d';
    } else if (badge.classList.contains('bg-success') || badge.classList.contains('badge-success')) {
      return '#198754';
    } else if (badge.classList.contains('bg-danger') || badge.classList.contains('badge-danger')) {
      return '#dc3545';
    } else if (badge.classList.contains('bg-warning') || badge.classList.contains('badge-warning')) {
      return '#ffc107';
    } else if (badge.classList.contains('bg-info') || badge.classList.contains('badge-info')) {
      return '#0dcaf0';
    } else if (badge.textContent?.includes('45%') || 
               badge.textContent?.includes('30%') || 
               badge.textContent?.includes('20%') || 
               badge.textContent?.includes('5%')) {
      return '#0d6efd'; // Primary color
    }
    
    return '#6c757d'; // Default secondary color
  }

  /**
   * Determines if an element should be included in the PDF
   */
  private shouldIncludeElement(element: HTMLElement): boolean {
    return !(element.style.display === 'none' || 
             element.style.visibility === 'hidden' ||
             element.classList.contains('d-none') ||
             element.classList.contains('nav-tabs') ||
             element.classList.contains('nav-link') ||
             element.getAttribute('role') === 'tablist');
  }
  
  /**
   * Gets only the direct text content, not including text from child elements
   */
  private getDirectTextContent(element: HTMLElement): string {
    let text = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        text += node.textContent;
      }
    }
    return text.trim();
  }

  /**
   * Preprocesses an element, making all tabs visible if it contains tabs
   */
  private preprocessElement(element: HTMLElement): HTMLElement {
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Force all tabs to be visible in the clone
    const tabPanes = clone.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
      (pane as HTMLElement).style.display = 'block';
      (pane as HTMLElement).style.opacity = '1';
      (pane as HTMLElement).classList.add('active', 'show');
      (pane as HTMLElement).classList.remove('fade');
    });

    // Remove tab navigation
    const tabNavs = clone.querySelectorAll('.nav-tabs, [role="tablist"]');
    tabNavs.forEach(nav => nav.remove());
    
    return clone;
  }

  /**
   * Get standard PDF styles and document definition
   */
  private getPdfDocDefinition(content: any[], fileName: string) {
    return {
      content,
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.2,
        font: 'Roboto'
      },
      styles: {
        header1: {
          fontSize: 22,
          bold: true,
          color: '#212529',
          margin: [0, 5, 0, 10]
        },
        header2: {
          fontSize: 16, 
          bold: true,
          color: '#212529',
          margin: [0, 5, 0, 5]
        },
        header3: {
          fontSize: 14,
          bold: true,
          color: '#333333',
          margin: [0, 3, 0, 3]
        },
        header4: {
          fontSize: 12,
          bold: true,
          color: '#444444',
          margin: [0, 2, 0, 2]
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: '#495057',
          fillColor: '#f8f9fa'
        },
        link: {
          decoration: 'underline',
          color: '#0563c1'
        }
      },
      pageMargins: [30, 30, 30, 30] as [number, number, number, number],
      info: {
        title: fileName,
        author: 'PDF Generator',
        subject: 'Report',
        creator: 'PDF Generator'
      },
      pageBreakBefore: () => false
    };
  }

  /**
   * Converts an HTML element to PDF and downloads it with selectable text
   * @param elementId The ID of the element to convert
   * @param fileName The name of the PDF file (without extension)
   */
  downloadElementAsPdf(elementId: string, fileName: string): void {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID ${elementId} not found.`);
      return;
    }

    // Show loading indicator
    this.showLoading();
    
    try {
      // Process the element to make all tabs visible
      const processedElement = this.preprocessElement(element);
      
      // Extract content using pdfMake approach
      const docContent = this.extractTextContent(processedElement);
      
      // Create PDF document definition
      const docDefinition = this.getPdfDocDefinition(docContent, fileName);
      
      // Generate the PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF
      pdfDoc.download(`${fileName}.pdf`);
      
      // Hide loading after a short delay
      setTimeout(() => this.hideLoading(), 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.hideLoading();
      alert('Could not generate PDF. Please try again or contact support.');
      
      // Try fallback method
      this.fallbackHtml2PdfGeneration(element, fileName);
    }
  }
  
  /**
   * Fallback method using html2pdf.js
   */
  private fallbackHtml2PdfGeneration(element: HTMLElement, fileName: string): void {
    console.log('Using fallback PDF generation with html2pdf.js');
    this.showLoading();
    
    try {
      // Process element to make all tabs visible
      const processedElement = this.preprocessElement(element);
      
      // Configure html2pdf options
      const options = {
        margin: 10,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['tr', 'td', '.card', '.report-container', 'h1', 'h2', 'h3', 'h4']
        },
        enableLinks: true
      };
      
      // Generate PDF
      html2pdf()
        .from(processedElement)
        .set(options)
        .save()
        .then(() => {
          console.log('PDF generated successfully with html2pdf.js');
          this.hideLoading();
        })
        .catch((error: Error) => {
          console.error('Error with html2pdf.js fallback:', error);
          this.hideLoading();
          alert('Could not generate PDF. Please try a different browser or contact support.');
        });
    } catch (error) {
      console.error('Error setting up html2pdf.js fallback:', error);
      this.hideLoading();
    }
  }

  /**
   * Downloads multiple reports as a combined PDF
   * @param elementIds Array of element IDs to include in the PDF
   * @param fileName The name of the PDF file (without extension)
   */
  downloadCombinedPdf(elementIds: string[], fileName: string = 'combined-reports'): void {
    if (!elementIds?.length) {
      console.error('No element IDs provided for combined PDF');
      return;
    }

    // Show loading indicator
    this.showLoading();
    
    try {
      // Get and process all elements, extracting content
      const combinedContent: any[] = [];
      
      elementIds.forEach((id, index) => {
        const element = document.getElementById(id);
        if (!element) {
          console.warn(`Element with ID ${id} not found, skipping...`);
          return;
        }
        
        // Process element to make all tabs visible
        const processedElement = this.preprocessElement(element);
        
        // Extract content
        const content = this.extractTextContent(processedElement);
        
        // Add to combined content
        combinedContent.push(...content);
        
        // Add page break between elements (except the last one)
        if (index < elementIds.length - 1) {
          combinedContent.push({ text: '', pageBreak: 'after' });
        }
      });
      
      if (!combinedContent.length) {
        console.error('No content extracted for combined PDF');
        this.hideLoading();
        return;
      }
      
      // Create PDF document definition
      const docDefinition = this.getPdfDocDefinition(combinedContent, fileName);
      
      // Generate the PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF
      pdfDoc.download(`${fileName}.pdf`);
      
      // Hide loading after a short delay
      setTimeout(() => this.hideLoading(), 1000);
      
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      this.hideLoading();
      alert('Could not generate combined PDF. Please try again or contact support.');
      
      // Try fallback with the first element as a simple example
      if (elementIds.length > 0) {
        const firstElement = document.getElementById(elementIds[0]);
        if (firstElement) {
          this.fallbackHtml2PdfGeneration(firstElement, fileName);
        }
      }
    }
  }
}
