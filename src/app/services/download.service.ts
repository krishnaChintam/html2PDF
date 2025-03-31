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
    const content: any[] = [];
    // Keep track of headings to avoid duplication
    const processedHeadings = new Set<string>();
    
    // Process element with heading tracking
    return this.processElement(element, processedHeadings);
  }
  
  /**
   * Processes an element and its children for PDF content extraction
   */
  private processElement(element: HTMLElement, processedHeadings: Set<string>): any[] {
    const content: any[] = [];
    
    // Handle elements by their type
    switch (element.tagName.toLowerCase()) {
      case 'h1':
        // Skip if this heading has already been processed
        if (!processedHeadings.has(element.textContent?.trim() || '')) {
          content.push({ 
            text: element.textContent, 
            style: 'header1', 
            margin: [0, 5, 0, 10],
            alignment: 'center'
          });
          // Add to processed headings
          processedHeadings.add(element.textContent?.trim() || '');
        }
        break;
      case 'h2':
        // Skip if this heading has already been processed
        if (!processedHeadings.has(element.textContent?.trim() || '')) {
          content.push({ 
            text: element.textContent, 
            style: 'header2', 
            margin: [0, 5, 0, 5],
            alignment: element.style.textAlign || 'left'
          });
          // Add to processed headings
          processedHeadings.add(element.textContent?.trim() || '');
        }
        break;
      case 'h3':
        // Skip if this heading has already been processed
        if (!processedHeadings.has(element.textContent?.trim() || '')) {
          content.push({ 
            text: element.textContent, 
            style: 'header3', 
            margin: [0, 3, 0, 3],
            alignment: element.style.textAlign || 'left'
          });
          // Add to processed headings
          processedHeadings.add(element.textContent?.trim() || '');
        }
        break;
      case 'h4':
      case 'h5':
      case 'h6':
        // Skip if this heading has already been processed
        if (!processedHeadings.has(element.textContent?.trim() || '')) {
          content.push({ 
            text: element.textContent, 
            style: 'header4', 
            margin: [0, 2, 0, 2],
            alignment: element.style.textAlign || 'left'
          });
          // Add to processed headings
          processedHeadings.add(element.textContent?.trim() || '');
        }
        break;
      case 'p':
        content.push({ 
          text: element.textContent, 
          margin: [0, 1, 0, 1],
          alignment: element.style.textAlign || 'left'
        });
        break;
      case 'ul':
        const ulItems: any[] = [];
        Array.from(element.querySelectorAll('li')).forEach(li => {
          // Check if there's a percentage badge
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
            ulItems.push(li.textContent);
          }
        });
        if (ulItems.length > 0) {
          content.push({ ul: ulItems, margin: [0, 5, 0, 5] });
        }
        break;
      case 'ol':
        const olItems: any[] = [];
        Array.from(element.querySelectorAll('li')).forEach(li => {
          olItems.push(li.textContent);
        });
        if (olItems.length > 0) {
          content.push({ ol: olItems, margin: [0, 5, 0, 5] });
        }
        break;
      case 'table':
        const tableBody: any[][] = [];
        
        // Process header rows (th)
        const headerRow: any[] = [];
        const headerCells = element.querySelectorAll('thead th');
        if (headerCells.length > 0) {
          headerCells.forEach(th => {
            const headerText = th.textContent?.trim() || '';
            // Skip duplicating section headers that have already appeared
            if (processedHeadings.has(headerText) && 
                (headerText.includes("Regional Breakdown") || 
                 headerText.includes("Key Financial Metrics") ||
                 headerText.includes("Top Products"))) {
              headerRow.push({ 
                text: '', // Empty text for duplicate headers
                style: 'tableHeader',
                fillColor: '#f8f9fa',
                alignment: th.getAttribute('align') || 'left'
              });
            } else {
              headerRow.push({ 
                text: headerText, 
                style: 'tableHeader',
                fillColor: '#f8f9fa',
                alignment: th.getAttribute('align') || 'left'
              });
            }
          });
          tableBody.push(headerRow);
        }
        
        // Process body rows (td)
        element.querySelectorAll('tbody tr').forEach(tr => {
          const row: any[] = [];
          tr.querySelectorAll('td').forEach(td => {
            // Check if cell contains a badge
            const badge = td.querySelector('.badge');
            if (badge) {
              const badgeText = badge.textContent;
              row.push({
                text: badgeText,
                fillColor: this.getColorForBadge(badge),
                color: 'white',
                bold: true,
                alignment: 'center',
                fontSize: 10,
                padding: [5, 3, 5, 3]
              });
            } else {
              row.push({
                text: td.textContent,
                alignment: td.getAttribute('align') || 'left'
              });
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
              // Keep tables together on the same page when possible
              dontBreakRows: true
            },
            layout: {
              hLineWidth: (i: number, node: any) => 1,
              vLineWidth: (i: number, node: any) => 1,
              hLineColor: (i: number, node: any) => '#dddddd',
              vLineColor: (i: number, node: any) => '#dddddd',
              paddingLeft: (i: number, node: any) => 8,
              paddingRight: (i: number, node: any) => 8,
              paddingTop: (i: number, node: any) => 6,
              paddingBottom: (i: number, node: any) => 6
            },
            margin: [0, 2, 0, 8],
            unbreakable: true // Try to keep table on one page
          });
        }
        break;
      case 'div':
      case 'section':
      case 'article':
      case 'main':
      case 'aside':
        // Check if it's a card-like container
        const isCard = element.classList.contains('card') || 
                       element.classList.contains('report-container');
        
        // For title or header sections
        if (element.classList.contains('report-title') || element.classList.contains('card-header')) {
          const titleText = element.textContent?.trim() || '';
          // Skip duplicating headers that have already appeared
          if (!processedHeadings.has(titleText)) {
            content.push({ 
              text: titleText, 
              style: 'header3', 
              fillColor: '#f8f9fa',
              margin: [0, 0, 0, 0],
              padding: [6, 6, 6, 6]
            });
            // Add to processed headings
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
            // Skip duplicating headers that have already appeared
            if (!processedHeadings.has(titleText)) {
              cardContent.push({
                text: titleText,
                style: 'header3',
                fillColor: '#f8f9fa',
                padding: [6, 6, 6, 6],
                margin: [0, 0, 0, 0]
              });
              // Add to processed headings
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
              unbreakable: true // Try to keep card on one page
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
          
          // If it has direct text content (not just whitespace), add it
          if (element.childNodes.length && element.textContent && element.textContent.trim()) {
            let hasDirectText = false;
            for (let i = 0; i < element.childNodes.length; i++) {
              const node = element.childNodes[i];
              if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
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
        break;
      case 'span':
        // Handle badge spans specially
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
        } else if (element.textContent && element.textContent.trim()) {
          content.push({ text: element.textContent, margin: [0, 0, 0, 0] });
        }
        break;
      case 'label':
        if (element.textContent && element.textContent.trim()) {
          content.push({ text: element.textContent, margin: [0, 0, 0, 0] });
        }
        break;
      case 'img':
        // Skip images for now as they require base64 conversion
        break;
      case 'button':
      case 'input':
      case 'select':
      case 'textarea':
        // Skip form elements
        break;
      default:
        // For other elements, check if they have direct text content
        if (element.textContent && element.textContent.trim()) {
          content.push({ text: element.textContent.trim() });
        } else if (element.children.length > 0) {
          // Otherwise process children
          Array.from(element.children).forEach(child => {
            if (this.shouldIncludeElement(child as HTMLElement)) {
              content.push(...this.processElement(child as HTMLElement, processedHeadings));
            }
          });
        }
        break;
    }
    
    return content;
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
    } else if (badge.textContent?.includes('45%')) {
      return '#0d6efd'; // Primary color
    } else if (badge.textContent?.includes('30%')) {
      return '#0d6efd'; // Primary color
    } else if (badge.textContent?.includes('20%')) {
      return '#0d6efd'; // Primary color
    } else if (badge.textContent?.includes('5%')) {
      return '#0d6efd'; // Primary color
    }
    return '#6c757d'; // Default secondary color
  }

  /**
   * Determines if an element should be included in the PDF
   */
  private shouldIncludeElement(element: HTMLElement): boolean {
    // Skip hidden elements and navigation tabs
    const isHidden = element.style.display === 'none' || 
                    element.style.visibility === 'hidden' ||
                    element.classList.contains('d-none') ||
                    element.classList.contains('nav-tabs') ||
                    element.classList.contains('nav-link') ||
                    element.getAttribute('role') === 'tablist';
                    
    return !isHidden;
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
      const docDefinition = {
        content: docContent,
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
          }
        },
        // Reduce margins to prevent wasted space
        pageMargins: [30, 30, 30, 30] as [number, number, number, number],
        info: {
          title: fileName,
          author: 'PDF Generator',
          subject: 'Report',
          creator: 'PDF Generator'
        },
        // Prevent unnecessary page breaks
        pageBreakBefore: function(currentNode: any, followingNodesOnPage: any, nodesOnNextPage: any, previousNodesOnPage: any) {
          // Only break before nodes that really need it
          return false;
        }
      };
      
      // Generate the PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF
      pdfDoc.download(`${fileName}.pdf`);
      
      // Hide loading after a short delay
      setTimeout(() => {
        this.hideLoading();
      }, 1000);
      
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
        // Prevent content splitting that can cause extra pages
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['tr', 'td', '.card', '.report-container', 'h1', 'h2', 'h3', 'h4']
        }
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
    if (!elementIds || elementIds.length === 0) {
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
      
      if (combinedContent.length === 0) {
        console.error('No content extracted for combined PDF');
        this.hideLoading();
        return;
      }
      
      // Create PDF document definition
      const docDefinition = {
        content: combinedContent,
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
          }
        },
        // Reduce margins to prevent wasted space
        pageMargins: [30, 30, 30, 30] as [number, number, number, number],
        info: {
          title: fileName,
          author: 'PDF Generator',
          subject: 'Combined Report',
          creator: 'PDF Generator'
        },
        // Prevent unnecessary page breaks
        pageBreakBefore: function(currentNode: any, followingNodesOnPage: any, nodesOnNextPage: any, previousNodesOnPage: any) {
          // Only break before nodes that really need it
          return false;
        }
      };
      
      // Generate the PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF
      pdfDoc.download(`${fileName}.pdf`);
      
      // Hide loading after a short delay
      setTimeout(() => {
        this.hideLoading();
      }, 1000);
      
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
