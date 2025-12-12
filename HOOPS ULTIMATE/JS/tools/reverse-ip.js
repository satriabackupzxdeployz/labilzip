// ===== REAL REVERSE IP LOOKUP (100% WORKING) =====
class RealReverseIP {
    constructor() {
        this.name = "Real Reverse IP Lookup";
    }

    async lookup(ip) {
        const result = {
            ip: ip,
            timestamp: new Date().toISOString(),
            domains: [],
            raw: '',
            status: 'pending'
        };

        try {
            // Using Hackertarget Reverse IP API
            const apiUrl = `https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(ip)}`;
            console.log(`Reverse IP lookup for ${ip}...`);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Reverse IP API error: ${response.status}`);
            }
            
            const data = await response.text();
            result.raw = data;
            
            // Parse domains
            this.parseDomains(data, result);
            
            // Try alternative API if no results
            if (result.domains.length === 0) {
                await this.tryAlternativeAPI(ip, result);
            }
            
            result.status = 'completed';
            
        } catch (error) {
            result.status = 'error';
            result.error = error.message;
            console.error('Reverse IP lookup error:', error);
        }
        
        return result;
    }
    
    parseDomains(data, result) {
        const lines = data.split('\n');
        const domains = [];
        
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.includes('API') && !line.includes('error')) {
                // Remove port numbers if present
                const domain = line.replace(/:\d+$/, '');
                
                if (this.isValidDomain(domain)) {
                    domains.push({
                        domain: domain,
                        ip: result.ip
                    });
                }
            }
        });
        
        // Remove duplicates
        result.domains = [...new Map(domains.map(item => [item.domain, item])).values()];
    }
    
    isValidDomain(domain) {
        // Basic domain validation
        const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        return pattern.test(domain);
    }
    
    async tryAlternativeAPI(ip, result) {
        try {
            // Alternative: yougetsignal.com API
            const backupUrl = `https://domains.yougetsignal.com/domains.php`;
            
            const formData = new FormData();
            formData.append('remoteAddress', ip);
            
            const backupResponse = await fetch(backupUrl, {
                method: 'POST',
                body: formData
            });
            
            if (backupResponse.ok) {
                const backupData = await backupResponse.json();
                if (backupData.domains && Array.isArray(backupData.domains)) {
                    backupData.domains.forEach(domainInfo => {
                        if (domainInfo.domain) {
                            result.domains.push({
                                domain: domainInfo.domain,
                                ip: ip
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.log('Alternative reverse IP API failed:', error.message);
        }
    }
    
    async bulkLookup(ips) {
        const results = [];
        
        for (const ip of ips) {
            if (this.isValidIP(ip)) {
                try {
                    const result = await this.lookup(ip);
                    results.push(result);
                    
                    // Delay to avoid rate limiting
                    await this.delay(1000);
                } catch (error) {
                    results.push({
                        ip: ip,
                        error: error.message,
                        domains: []
                    });
                }
            }
        }
        
        return results;
    }
    
    isValidIP(ip) {
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        if (ipv4Pattern.test(ip)) {
            return ip.split('.').every(segment => {
                const num = parseInt(segment, 10);
                return num >= 0 && num <= 255;
            });
        }
        
        return ipv6Pattern.test(ip);
    }
    
    generateReport(result) {
        return {
            ip: result.ip,
            totalDomains: result.domains.length,
            domains: result.domains.map(d => d.domain),
            lookupTime: result.timestamp,
            status: result.status
        };
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const realReverseIP = new RealReverseIP();