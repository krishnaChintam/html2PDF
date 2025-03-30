import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private loadingIndicator: HTMLElement | null = null;
  
  constructor() { }

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
   * Converts an HTML element to PDF and downloads it
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

    const options = {
      scale: 2, // Higher scale for better quality
      useCORS: true, // To handle images from different origins
      logging: false, // Disable logs
      scrollX: 0,
      scrollY: 0
    };

    html2canvas(element, options).then(canvas => {
      // Calculate PDF dimensions based on canvas
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

      // Add more pages if content exceeds A4 height
      let heightLeft = imgHeight - pageHeight;
      
      // If content is larger than a single page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save PDF
      pdf.save(`${fileName || 'report'}.pdf`);
      
      // Hide loading indicator
      this.hideLoading();
    }).catch(error => {
      console.error('Error generating PDF:', error);
      // Hide loading indicator on error too
      this.hideLoading();
    });
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

    const options = {
      scale: 2,
      useCORS: true,
      logging: false
    };

    // Create the PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    
    // Track whether we're on the first page (to avoid adding a page before the first element)
    let isFirstElement = true;
    
    // Process each element sequentially using promises
    const processElements = async () => {
      try {
        for (let i = 0; i < elementIds.length; i++) {
          const elementId = elementIds[i];
          const element = document.getElementById(elementId);
          
          if (!element) {
            console.warn(`Element with ID ${elementId} not found, skipping...`);
            continue;
          }
          
          // Create a completely isolated environment using an iframe
          const iframe = document.createElement('iframe');
          iframe.style.position = 'absolute';
          iframe.style.top = '-9999px';
          iframe.style.width = '1000px';  // Large enough for content
          iframe.style.height = '9999px'; // Large enough for content
          iframe.style.visibility = 'hidden';
          
          document.body.appendChild(iframe);
          
          // Wait for iframe to load
          await new Promise<void>(resolve => {
            iframe.onload = () => resolve();
            
            // Clone the element's content
            const elementContent = element.cloneNode(true) as HTMLElement;
            
            // Create a clean HTML document in the iframe with only bootstrap and the element
            if (iframe.contentDocument) {
              const iframeDoc = iframe.contentDocument;
              iframeDoc.open();
              iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Report</title>
                  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
                  <style>
                    body { 
                      margin: 0; 
                      padding: 20px;
                      font-family: Arial, sans-serif;
                      width: 210mm; /* A4 width */
                    }
                    .report-container {
                      background-color: #fff;
                      border-radius: 0.25rem;
                      margin-bottom: 1rem;
                      position: relative;
                    }
                    .report-title {
                      background-color: #f8f9fa;
                    }
                    .report-body {
                      padding-bottom: 1rem;
                    }
                    /* Reset common problematic styles */
                    * {
                      position: relative !important;
                      overflow: visible !important;
                      z-index: auto !important;
                    }
                    /* Hide any buttons in the PDF */
                    button {
                      display: none;
                    }
                  </style>
                </head>
                <body>
                  <div id="container"></div>
                </body>
                </html>
              `);
              iframeDoc.close();
              
              // Add the element to the iframe's DOM
              const container = iframeDoc.getElementById('container');
              if (container) {
                container.appendChild(elementContent);
                
                // Force all tabs to be visible in the iframe
                const tabPanes = iframeDoc.querySelectorAll('.tab-pane');
                tabPanes.forEach(pane => {
                  (pane as HTMLElement).style.display = 'block';
                  (pane as HTMLElement).style.opacity = '1';
                  (pane as HTMLElement).classList.add('active', 'show');
                  (pane as HTMLElement).classList.remove('fade');
                });

                // Remove any bootstrap tab navigation, we don't need it in the PDF
                const tabNavs = iframeDoc.querySelectorAll('.nav-tabs, [role="tablist"]');
                tabNavs.forEach(nav => nav.remove());
              }
            } else {
              resolve();
            }
          });
          
          // Wait extra time for rendering and fonts loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update loading text with progress
          if (this.loadingIndicator) {
            this.loadingIndicator.innerText = `Generating PDF... (${i + 1}/${elementIds.length})`;
          }          
          // Add a page break between reports (except the first one)
          if (!isFirstElement) {
            pdf.addPage();
          }
          
          try {
            // Capture the iframe content
            if (iframe.contentDocument && iframe.contentDocument.body) {
              const contentBody = iframe.contentDocument.body;
              
              // Generate canvas from the iframe content
              const canvas = await html2canvas(contentBody, {
                ...options,
                windowWidth: 1000,
                windowHeight: 9999,
                x: 0,
                y: 0,
                width: contentBody.scrollWidth,
                height: contentBody.scrollHeight
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgHeight = canvas.height * imgWidth / canvas.width;
              
              // Add image to PDF
              pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
              
              // If the content is larger than a single page, add additional pages
              let heightLeft = imgHeight - pageHeight;
              let position = 0;
              
              while (heightLeft > 0) {
                position = -pageHeight; // Start from the top of the new page
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
              }
            }
          } catch (error) {
            console.error(`Error processing element ${elementId}:`, error);
          }
          
          // Remove the iframe from DOM
          document.body.removeChild(iframe);
          
          isFirstElement = false;
        }
        
        // Save the final PDF
        pdf.save(`${fileName}.pdf`);
        
        // Hide loading indicator
        this.hideLoading();
      } catch (error) {
        console.error('Error generating combined PDF:', error);
        // Hide loading indicator on error
        this.hideLoading();
      }
    };
    
    // Start processing
    processElements();
  }
}
