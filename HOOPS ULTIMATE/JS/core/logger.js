// ===== LOGGER SYSTEM =====
class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.enabled = true;
    }
    
    log(message, type = 'info', data = null) {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            data: data,
            level: this.getLevel(type)
        };
        
        this.logs.unshift(logEntry); // Add to beginning
        
        // Keep only maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
        
        // Save to localStorage
        this.saveLogs();
        
        // Console output
        const colors = {
            info: 'color: #00ff41',
            success: 'color: #00ff88',
            warning: 'color: #ffaa00',
            error: 'color: #ff3333',
            debug: 'color: #8888ff'
        };
        
        console.log(`%c[HOOPSTEAM ${type.toUpperCase()}] ${message}`, colors[type] || colors.info);
        
        if (data) console.log(data);
        
        // Trigger event for UI updates
        this.triggerLogEvent(logEntry);
    }
    
    info(message, data) {
        this.log(message, 'info', data);
    }
    
    success(message, data) {
        this.log(message, 'success', data);
    }
    
    warning(message, data) {
        this.log(message, 'warning', data);
    }
    
    error(message, data) {
        this.log(message, 'error', data);
    }
    
    debug(message, data) {
        if (HOOPSTEAM_CONFIG?.DEBUG_MODE) {
            this.log(message, 'debug', data);
        }
    }
    
    getLevel(type) {
        const levels = {
            error: 4,
            warning: 3,
            info: 2,
            success: 1,
            debug: 0
        };
        return levels[type] || 2;
    }
    
    saveLogs() {
        try {
            localStorage.setItem('hoopsteam_logs', JSON.stringify(this.logs));
        } catch (e) {
            console.error('Failed to save logs:', e);
        }
    }
    
    loadLogs() {
        try {
            const saved = localStorage.getItem('hoopsteam_logs');
            if (saved) {
                this.logs = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load logs:', e);
        }
    }
    
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('hoopsteam_logs');
    }
    
    getLogs(limit = 50, type = null) {
        let filtered = this.logs;
        
        if (type) {
            filtered = filtered.filter(log => log.type === type);
        }
        
        return filtered.slice(0, limit);
    }
    
    exportLogs(format = 'json') {
        const data = this.getLogs(1000);
        
        switch(format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.toCSV(data);
            case 'txt':
                return data.map(log => 
                    `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
                ).join('\n');
            default:
                return data;
        }
    }
    
    toCSV(data) {
        if (data.length === 0) return '';
        
        const headers = ['Timestamp', 'Type', 'Message', 'Data'];
        const rows = data.map(log => [
            log.timestamp,
            log.type,
            log.message.replace(/"/g, '""'),
            JSON.stringify(log.data).replace(/"/g, '""')
        ]);
        
        const csv = [
            headers.join(','),
            ...rows.map(row => `"${row.join('","')}"`)
        ].join('\n');
        
        return csv;
    }
    
    triggerLogEvent(logEntry) {
        // Dispatch custom event for UI listeners
        const event = new CustomEvent('hoopsteam:log', {
            detail: logEntry
        });
        window.dispatchEvent(event);
    }
}

// Create global logger instance
const hoopsteamLogger = new Logger();
hoopsteamLogger.loadLogs();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hoopsteamLogger;
}