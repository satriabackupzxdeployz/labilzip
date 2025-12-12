/**
 * HOOPSTEAM-ULTIMATE Utilities
 * Kumpulan fungsi utilitas untuk semua tools
 */

// ==================== STRING UTILITIES ====================
class StringUtils {
  /**
   * Generate random string dengan panjang tertentu
   */
  static randomString(length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let result = '';
    const charsetLength = charset.length;
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charsetLength));
    }
    return result;
  }

  /**
   * Generate UUID v4
   */
  static uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Slugify string (untuk URL/file names)
   */
  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Capitalize first letter
   */
  static capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Mask email/phone untuk privasi
   */
  static maskData(data, type = 'email') {
    if (type === 'email') {
      const [username, domain] = data.split('@');
      const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
      return `${maskedUsername}@${domain}`;
    } else if (type === 'phone') {
      return data.replace(/\d(?=\d{4})/g, '*');
    }
    return data;
  }

  /**
   * Format bytes ke human readable
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Validasi format email
   */
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validasi format URL
   */
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validasi format IP address
   */
  static isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Extract domain dari URL
   */
  static extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Generate password kuat
   */
  static generatePassword(length = 12, options = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  }) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = '';
    if (options.lowercase) charset += lowercase;
    if (options.uppercase) charset += uppercase;
    if (options.numbers) charset += numbers;
    if (options.symbols) charset += symbols;
    
    if (charset.length === 0) charset = lowercase + uppercase + numbers;
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}

// ==================== NUMBER UTILITIES ====================
class NumberUtils {
  /**
   * Generate random number dalam range
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Format angka dengan separator ribuan
   */
  static formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Round number dengan desimal tertentu
   */
  static round(num, decimals = 2) {
    return parseFloat(num.toFixed(decimals));
  }

  /**
   * Convert hex ke decimal
   */
  static hexToDecimal(hex) {
    return parseInt(hex.replace('#', ''), 16);
  }

  /**
   * Convert decimal ke hex
   */
  static decimalToHex(decimal) {
    return decimal.toString(16).toUpperCase();
  }

  /**
   * Generate nomor telepon acak (Indonesia)
   */
  static generatePhoneNumber() {
    const prefixes = ['0812', '0813', '0814', '0815', '0816', '0817', '0818', '0819', 
                     '0852', '0853', '0855', '0856', '0857', '0858',
                     '0877', '0878', '0879',
                     '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889',
                     '0895', '0896', '0897', '0898', '0899'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(10000000 + Math.random() * 90000000);
    
    return prefix + suffix.toString().substring(0, 8);
  }

  /**
   * Generate nomor KTP acak (16 digit)
   */
  static generateNIK(provinceCode = '32', cityCode = '73') {
    const birthDate = StringUtils.randomString(6, '0123456789');
    const randomDigits = StringUtils.randomString(4, '0123456789');
    
    return provinceCode + cityCode + birthDate + randomDigits;
  }
}

// ==================== DATE UTILITIES ====================
class DateUtils {
  /**
   * Format tanggal ke string
   */
  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = date instanceof Date ? date : new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Parse string ke Date object
   */
  static parseDate(dateString) {
    return new Date(dateString);
  }

  /**
   * Add days/months/years ke tanggal
   */
  static addToDate(date, amount, unit = 'days') {
    const result = new Date(date);
    
    switch (unit) {
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
    }
    
    return result;
  }

  /**
   * Generate tanggal acak dalam range
   */
  static randomDate(start, end) {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime);
  }

  /**
   * Hitung umur dari tanggal lahir
   */
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}

// ==================== FILE UTILITIES ====================
class FileUtils {
  /**
   * Download data sebagai file
   */
  static downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Download JSON sebagai file
   */
  static downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    this.downloadFile(jsonString, filename, 'application/json');
  }

  /**
   * Download CSV sebagai file
   */
  static downloadCSV(data, filename) {
    const csvString = this.convertToCSV(data);
    this.downloadFile(csvString, filename, 'text/csv');
  }

  /**
   * Convert array of objects ke CSV
   */
  static convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const cell = row[header];
          return typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  /**
   * Baca file sebagai text
   */
  static readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  /**
   * Baca file sebagai DataURL
   */
  static readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate filename dengan timestamp
   */
  static generateFilename(prefix = 'file', extension = 'txt') {
    const timestamp = DateUtils.formatDate(new Date(), 'YYYYMMDD_HHmmss');
    return `${prefix}_${timestamp}.${extension}`;
  }

  /**
   * Extract extension dari filename
   */
  static getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Validasi file size
   */
  static validateFileSize(file, maxSizeMB = 10) {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    return file.size <= maxSize;
  }
}

// ==================== NETWORK UTILITIES ====================
class NetworkUtils {
  /**
   * Check koneksi internet
   */
  static async checkConnection() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get client IP (menggunakan API gratis)
   */
  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Failed to get IP:', error);
      return '127.0.0.1';
    }
  }

  /**
   * Ping ke host
   */
  static async ping(host, timeout = 3000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const img = new Image();
      
      img.onload = img.onerror = () => {
        const latency = Date.now() - startTime;
        resolve({ success: true, latency, host });
      };
      
      setTimeout(() => {
        img.src = '';
        resolve({ success: false, latency: timeout, host });
      }, timeout);
      
      img.src = `https://${host}/favicon.ico?t=${startTime}`;
    });
  }

  /**
   * Resolve domain ke IP
   */
  static async resolveDomain(domain) {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const data = await response.json();
      
      if (data.Answer && data.Answer.length > 0) {
        return data.Answer.map(answer => answer.data);
      }
      
      return [];
    } catch (error) {
      console.warn('DNS resolution failed:', error);
      return [];
    }
  }

  /**
   * Check port status
   */
  static async checkPort(host, port, timeout = 2000) {
    return new Promise((resolve) => {
      const socket = new WebSocket(`ws://${host}:${port}`);
      
      const timer = setTimeout(() => {
        resolve({ open: false, host, port });
      }, timeout);
      
      socket.onopen = () => {
        clearTimeout(timer);
        socket.close();
        resolve({ open: true, host, port });
      };
      
      socket.onerror = () => {
        clearTimeout(timer);
        resolve({ open: false, host, port });
      };
    });
  }
}

// ==================== ENCRYPTION UTILITIES ====================
class CryptoUtils {
  /**
   * Hash string dengan algorithm tertentu
   */
  static async hash(data, algorithm = 'SHA-256') {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate MD5 hash (simulasi)
   */
  static md5(data) {
    // Simulasi MD5 (untuk demo saja)
    return StringUtils.randomString(32, '0123456789abcdef');
  }

  /**
   * Base64 encode
   */
  static base64Encode(data) {
    return btoa(unescape(encodeURIComponent(data)));
  }

  /**
   * Base64 decode
   */
  static base64Decode(data) {
    return decodeURIComponent(escape(atob(data)));
  }

  /**
   * Caesar cipher encryption
   */
  static caesarCipher(text, shift) {
    return text.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode((char.charCodeAt(0) - base + shift) % 26 + base);
    });
  }

  /**
   * Generate random encryption key
   */
  static generateKey(length = 32) {
    return StringUtils.randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*');
  }
}

// ==================== VALIDATION UTILITIES ====================
class ValidationUtils {
  /**
   * Validasi input berdasarkan tipe
   */
  static validate(input, type) {
    const validators = {
      email: StringUtils.isValidEmail,
      url: StringUtils.isValidURL,
      ip: StringUtils.isValidIP,
      phone: (phone) => /^[0-9]{10,15}$/.test(phone),
      domain: (domain) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain),
      port: (port) => {
        const num = parseInt(port);
        return !isNaN(num) && num >= 1 && num <= 65535;
      }
    };
    
    const validator = validators[type];
    return validator ? validator(input) : true;
  }

  /**
   * Validasi form fields
   */
  static validateForm(fields) {
    const errors = {};
    
    Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
      const { value, type, required = true, minLength, maxLength } = fieldConfig;
      
      if (required && (!value || value.trim() === '')) {
        errors[fieldName] = 'Field is required';
        return;
      }
      
      if (value && minLength && value.length < minLength) {
        errors[fieldName] = `Minimum length is ${minLength}`;
        return;
      }
      
      if (value && maxLength && value.length > maxLength) {
        errors[fieldName] = `Maximum length is ${maxLength}`;
        return;
      }
      
      if (value && type && !this.validate(value, type)) {
        errors[fieldName] = `Invalid ${type} format`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// ==================== UI UTILITIES ====================
class UIUtils {
  /**
   * Show notification/toast
   */
  static showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    // Styling dasar
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * Show loading spinner
   */
  static showLoading(container = document.body, message = 'Loading...') {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;
    
    loading.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9998;
    `;
    
    loading.querySelector('.loading-content').style.cssText = `
      text-align: center;
      color: white;
    `;
    
    loading.querySelector('.loading-spinner').style.cssText = `
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid #fff;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px auto;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    container.appendChild(loading);
    
    return {
      hide: () => {
        if (loading.parentNode) {
          loading.remove();
        }
      }
    };
  }

  /**
   * Copy text ke clipboard
   */
  static copyToClipboard(text) {
    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      textarea.select();
      textarea.setSelectionRange(0, 99999); // Untuk mobile
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          this.showNotification('Copied to clipboard!', 'success');
          resolve();
        } else {
          reject(new Error('Copy failed'));
        }
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  /**
   * Create modal dialog
   */
  static createModal(options = {}) {
    const {
      title = 'Modal',
      content = '',
      buttons = [{ text: 'Close', action: 'close' }],
      width = '500px',
      closeOnClickOutside = true
    } = options;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal-container" style="width: ${width}">
        <div class="modal-