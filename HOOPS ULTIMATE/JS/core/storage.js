// ===== STORAGE MANAGER =====
class StorageManager {
    constructor() {
        this.prefix = 'hoopsteam_';
        this.encryptionEnabled = true;
    }
    
    // Simple encryption (for demo only)
    encrypt(data) {
        if (!this.encryptionEnabled) return data;
        
        try {
            // Base64 encode with simple XOR
            const str = JSON.stringify(data);
            let result = '';
            for (let i = 0; i < str.length; i++) {
                result += String.fromCharCode(str.charCodeAt(i) ^ 0x42);
            }
            return btoa(result);
        } catch (e) {
            console.error('Encryption failed:', e);
            return data;
        }
    }
    
    decrypt(data) {
        if (!this.encryptionEnabled) return data;
        
        try {
            // Base64 decode with XOR
            const decoded = atob(data);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ 0x42);
            }
            return JSON.parse(result);
        } catch (e) {
            console.error('Decryption failed:', e);
            return data;
        }
    }
    
    // Save data
    set(key, value, encrypt = true) {
        try {
            const fullKey = this.prefix + key;
            const data = encrypt ? this.encrypt(value) : value;
            localStorage.setItem(fullKey, data);
            hoopsteamLogger.debug(`Storage: Saved ${key}`, { encrypted: encrypt });
            return true;
        } catch (e) {
            hoopsteamLogger.error(`Storage: Failed to save ${key}`, e);
            return false;
        }
    }
    
    // Get data
    get(key, encrypted = true) {
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);
            
            if (!data) return null;
            
            return encrypted ? this.decrypt(data) : data;
        } catch (e) {
            hoopsteamLogger.error(`Storage: Failed to get ${key}`, e);
            return null;
        }
    }
    
    // Remove data
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            hoopsteamLogger.debug(`Storage: Removed ${key}`);
            return true;
        } catch (e) {
            hoopsteamLogger.error(`Storage: Failed to remove ${key}`, e);
            return false;
        }
    }
    
    // Check if exists
    has(key) {
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }
    
    // Clear all app data
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            hoopsteamLogger.info('Storage: Cleared all app data');
            return true;
        } catch (e) {
            hoopsteamLogger.error('Storage: Failed to clear all data', e);
            return false;
        }
    }
    
    // Get all keys
    getAllKeys() {
        const keys = Object.keys(localStorage);
        return keys
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.substring(this.prefix.length));
    }
    
    // Get storage usage
    getUsage() {
        let total = 0;
        const keys = this.getAllKeys();
        
        keys.forEach(key => {
            const value = localStorage.getItem(this.prefix + key);
            total += (key.length + value.length) * 2; // Approximate size in bytes
        });
        
        return {
            keys: keys.length,
            bytes: total,
            kilobytes: (total / 1024).toFixed(2),
            megabytes: (total / (1024 * 1024)).toFixed(4)
        };
    }
    
    // Export all data
    exportData() {
        const data = {};
        const keys = this.getAllKeys();
        
        keys.forEach(key => {
            data[key] = this.get(key, false); // Get raw data
        });
        
        return {
            timestamp: new Date().toISOString(),
            version: HOOPSTEAM_CONFIG?.VERSION || '1.0',
            data: data
        };
    }
    
    // Import data
    importData(data) {
        try {
            if (data.version && data.data) {
                Object.keys(data.data).forEach(key => {
                    localStorage.setItem(this.prefix + key, data.data[key]);
                });
                hoopsteamLogger.info('Storage: Data imported successfully');
                return true;
            }
            return false;
        } catch (e) {
            hoopsteamLogger.error('Storage: Import failed', e);
            return false;
        }
    }
}

// Create global storage instance
const hoopsteamStorage = new StorageManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hoopsteamStorage;
}