import { Utils, UIUtils, FileUtils } from '../../core/utils.js';
import logger from '../../core/logger.js';

class DocumentForger {
  constructor() {
    this.templates = {
      'ktp': 'templates/documents/ktp-template.html',
      'kk': 'templates/documents/kk-template.html',
      'sim': 'templates/documents/sim-template.html',
      'passport': 'templates/documents/passport-template.html',
      'diploma': 'templates/documents/diploma-template.html',
      'stnk': 'templates/documents/stnk-template.html',
      'bpkb': 'templates/documents/bpkb-template.html',
      'npwp': 'templates/documents/npwp-template.html',
      'rekening': 'templates/documents/rekening-template.html',
      'kartu-kredit': 'templates/documents/kartu-kredit.html',
      'kartu-mahasiswa': 'templates/documents/kartu-mahasiswa.html',
      'kartu-pegawai': 'templates/documents/kartu-pegawai.html',
      'surat-keterangan': 'templates/documents/surat-keterangan.html',
      'invoice': 'templates/documents/invoice-template.html',
      'kontrak': 'templates/documents/kontrak-template.html'
    };
  }

  async generateDocument(type, data) {
    try {
      logger.info(`Generating ${type.toUpperCase()} document`, data);
      
      // Load template
      const template = await this.loadTemplate(type);
      
      // Fill template with data
      const filledTemplate = this.fillTemplate(template, data);
      
      // Create preview
      this.showPreview(filledTemplate, type);
      
      // Enable download
      this.setupDownload(filledTemplate, type, data);
      
      UIUtils.showNotification(`${type.toUpperCase()} generated successfully!`, 'success');
      
      return filledTemplate;
      
    } catch (error) {
      logger.error(`Failed to generate ${type} document`, error);
      UIUtils.showNotification(`Error generating document: ${error.message}`, 'error');
      throw error;
    }
  }

  async loadTemplate(type) {
    const templatePath = this.templates[type];
    if (!templatePath) {
      throw new Error(`Template not found for type: ${type}`);
    }
    
    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      // Fallback to default template
      return this.getDefaultTemplate(type);
    }
  }

  fillTemplate(template, data) {
    let filled = template;
    
    // Replace all placeholders with data
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder, 'g');
      filled = filled.replace(regex, data[key]);
    });
    
    // Generate random IDs if needed
    filled = this.generateMissingData(filled, data);
    
    return filled;
  }

  generateMissingData(template, data) {
    let result = template;
    
    // Generate NIK if not provided
    if (template.includes('{{NIK}}') && !data.NIK) {
      const nik = Utils.generateNIK();
      result = result.replace(/{{NIK}}/g, nik);
    }
    
    // Generate phone number if not provided
    if (template.includes('{{PHONE}}') && !data.PHONE) {
      const phone = Utils.generatePhone();
      result = result.replace(/{{PHONE}}/g, phone);
    }
    
    // Generate dates if not provided
    if (template.includes('{{DATE}}') && !data.DATE) {
      const date = Utils.formatDate(new Date(), 'DD/MM/YYYY');
      result = result.replace(/{{DATE}}/g, date);
    }
    
    return result;
  }

  showPreview(template, type) {
    const previewContainer = document.getElementById('document-preview');
    if (previewContainer) {
      previewContainer.innerHTML = template;
      
      // Add watermark for demo
      this.addWatermark(previewContainer);
    }
  }

  setupDownload(template, type, data) {
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const filename = `${type}_${data.NIK || data.NAME || 'document'}_${Date.now()}.html`;
        FileUtils.downloadFile(template, filename, 'text/html');
        
        // Also generate PDF if possible
        this.generatePDF(template, filename.replace('.html', '.pdf'));
      };
    }
  }

  addWatermark(container) {
    const watermark = document.createElement('div');
    watermark.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 40px;
      color: rgba(255,0,0,0.1);
      font-weight: bold;
      z-index: 9999;
      pointer-events: none;
    `;
    watermark.textContent = 'SAMPLE DOCUMENT - FOR TRAINING ONLY';
    container.appendChild(watermark);
  }

  getDefaultTemplate(type) {
    const defaults = {
      'ktp': `<div>KTP Template - ${type}</div>`,
      'kk': `<div>KK Template - ${type}</div>`,
      'sim': `<div>SIM Template - ${type}</div>`,
      // ... other defaults
    };
    
    return defaults[type] || `<div>Template for ${type}</div>`;
  }
}

export default DocumentForger;