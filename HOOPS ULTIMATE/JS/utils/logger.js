/**
 * Logger utility untuk HOOPSTEAM-ULTIMATE
 */
class Logger {
  constructor(options = {}) {
    this.options = {
      level: options.level || 'info',
      prefix: options.prefix || 'HOOPSTEAM',
      colors: options.colors !== false,
      timestamp: options.timestamp !== false
    };
    
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  log(level, message, data = null) {
    if (this.levels[level] < this.levels[this.options.level]) {
      return;
    }
    
    const timestamp = this.options.timestamp ? new Date().toISOString() : '';
    const prefix = `[${this.options.prefix}]`;
    
    const styles = {
      debug: 'color: #888; font-weight: bold;',
      info: 'color: #2196F3; font-weight: bold;',
      warn: 'color: #FF9800; font-weight: bold;',
      error: 'color: #F44336; font-weight: bold;'
    };
    
    if (this.options.colors && console[level]) {
      console[level](`%c${prefix} ${timestamp} ${message}`, styles[level], data || '');
    } else {
      console[`${level}`](`${prefix} ${timestamp} ${message}`, data || '');
    }
    
    // Simpan ke storage untuk history
    this.saveToHistory(level, message, data);
  }

  debug(message, data = null) {
    this.log('debug', message, data);
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  saveToHistory(level, message, data) {
    try {
      const logs = JSON.parse(localStorage.getItem('hoopsteam_logs') || '[]');
      
      logs.push({
        level,
        message,
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('hoopsteam_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem('hoopsteam_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearHistory() {
    localStorage.removeItem('hoopsteam_logs');
  }
}

// Global logger instance
const logger = new Logger({
  level: 'info',
  prefix: 'HOOPSTEAM-ULTIMATE'
});

export default logger;