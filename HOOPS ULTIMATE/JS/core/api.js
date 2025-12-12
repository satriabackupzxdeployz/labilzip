// ===== API MANAGER =====
class ApiManager {
    constructor() {
        this.baseURLs = HOOPSTEAM_CONFIG?.APIS || {};
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }
    
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            headers = {},
            cache = false,
            timeout = HOOPSTEAM_CONFIG?.DEFAULTS?.TIMEOUT || 10000
        } = options;
        
        // Check cache first
        const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}`;
        if (cache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheDuration) {
                hoopsteamLogger.debug('API: Using cached response', { endpoint });
                return cached.data;
            }
        }
        
        // Prepare request
        const requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `HOOPSTEAM/${HOOPSTEAM_CONFIG?.VERSION || '2.0'}`,
                ...headers
            },
            signal: AbortSignal.timeout(timeout)
        };
        
        if (data && method !== 'GET') {
            requestOptions.body = JSON.stringify(data);
        }
        
        // Add API key if needed
        const url = this.prepareURL(endpoint, data, method);
        
        try {
            hoopsteamLogger.info(`API: ${method} ${url}`);
            
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Cache the result
            if (cache) {
                this.cache.set(cacheKey, {
                    timestamp: Date.now(),
                    data: result
                });
            }
            
            return result;
            
        } catch (error) {
            hoopsteamLogger.error(`API: Request failed`, {
                endpoint,
                error: error.message
            });
            throw error;
        }
    }
    
    prepareURL(endpoint, data, method) {
        let url = endpoint;
        
        // If endpoint is a key from config, use the actual URL
        if (this.baseURLs[endpoint]) {
            url = this.baseURLs[endpoint];
        }
        
        // Add query parameters for GET requests
        if (method === 'GET' && data) {
            const params = new URLSearchParams(data);
            url += (url.includes('?') ? '&' : '?') + params.toString();
        }
        
        // Replace API key placeholders
        url = url.replace('{SHODAN_KEY}', HOOPSTEAM_CONFIG?.API_KEYS?.SHODAN || '');
        url = url.replace('{VT_KEY}', HOOPSTEAM_CONFIG?.API_KEYS?.VIRUSTOTAL || '');
        
        return url;
    }
    
    // Convenience methods
    get(endpoint, params = {}, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            data: params,
            ...options
        });
    }
    
    post(endpoint, data = {}, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            data: data,
            ...options
        });
    }
    
    // Specific API calls
    async ipLookup(ip = '') {
        try {
            const url = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json';
            return await this.get(url, {}, { cache: true });
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async whoisLookup(domain) {
        try {
            const response = await this.get('HACKERTARGET', {
                q: domain,
                function: 'whois'
            });
            return { data: response };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async portScan(host) {
        try {
            const response = await this.get('HACKERTARGET', {
                q: host,
                function: 'nmap'
            });
            return { data: response };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async dnsLookup(domain) {
        try {
            const response = await this.get('HACKERTARGET', {
                q: domain,
                function: 'dns'
            });
            return { data: response };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async subdomainScan(domain) {
        try {
            const response = await this.get('HACKERTARGET', {
                q: domain,
                function: 'subdomain'
            });
            return { data: response };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        hoopsteamLogger.info('API: Cache cleared');
    }
    
    // Get cache info
    getCacheInfo() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create global API instance
const hoopsteamAPI = new ApiManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hoopsteamAPI;
}