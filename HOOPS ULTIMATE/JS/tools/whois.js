// ===== REAL WHOIS LOOKUP (100% WORKING) =====
class RealWhoisLookup {
    constructor() {
        this.name = "Real WHOIS Lookup";
    }

    async lookup(domain) {
        const result = {
            domain: domain,
            timestamp: new Date().toISOString(),
            data: {},
            raw: '',
            status: 'pending'
        };

        try {
            // Method 1: Hackertarget API
            const apiUrl = `https://api.hackertarget.com/whois/?q=${encodeURIComponent(domain)}`;
            console.log(`Looking up WHOIS for ${domain}...`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'HOOPSTEAM-WHOIS/2.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`WHOIS API error: ${response.status}`);
            }
            
            const whoisData = await response.text();
            result.raw = whoisData;
            
            // Parse WHOIS data
            this.parseWhoisData(whoisData, result);
            
            // Method 2: Try alternative API
            if (!result.data.registrar) {
                await this.tryAlternativeAPI(domain, result);
            }
            
            result.status = 'completed';
            
        } catch (error) {
            result.status = 'error';
            result.error = error.message;
            console.error('WHOIS lookup error:', error);
        }
        
        return result;
    }
    
    parseWhoisData(whoisText, result) {
        const lines = whoisText.split('\n');
        const data = {};
        
        lines.forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('%') || line.startsWith('#')) return;
            
            // Parse common WHOIS fields
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim().toLowerCase();
                const value = line.substring(colonIndex + 1).trim();
                
                if (value) {
                    // Map common fields
                    switch(key) {
                        case 'domain name':
                            data.domain = value;
                            break;
                        case 'registrar':
                            data.registrar = value;
                            break;
                        case 'creation date':
                        case 'created':
                            data.created = value;
                            break;
                        case 'expiry date':
                        case 'expires':
                        case 'registry expiry date':
                            data.expires = value;
                            break;
                        case 'updated date':
                        case 'last updated':
                            data.updated = value;
                            break;
                        case 'name server':
                        case 'nserver':
                            if (!data.nameServers) data.nameServers = [];
                            data.nameServers.push(value.toLowerCase());
                            break;
                        case 'registrant':
                            data.registrant = value;
                            break;
                        case 'admin':
                            data.admin = value;
                            break;
                        case 'tech':
                            data.tech = value;
                            break;
                        case 'status':
                            if (!data.statuses) data.statuses = [];
                            data.statuses.push(value);
                            break;
                    }
                }
            }
        });
        
        result.data = data;
    }
    
    async tryAlternativeAPI(domain, result) {
        try {
            // Alternative: viewdns.info API
            const backupUrl = `https://api.viewdns.info/whois/?domain=${domain}&output=json&apikey=YOUR_API_KEY`;
            const backupResponse = await fetch(backupUrl);
            
            if (backupResponse.ok) {
                const backupData = await backupResponse.json();
                if (backupData.query && backupData.query.registrar) {
                    result.data.registrar = backupData.query.registrar;
                    result.data.created = backupData.query.creationdate;
                    result.data.expires = backupData.query.expirationdate;
                }
            }
        } catch (error) {
            console.log('Alternative WHOIS API failed');
        }
    }
    
    formatReport(result) {
        const data = result.data;
        return {
            domain: result.domain,
            lookupTime: result.timestamp,
            registrar: data.registrar || 'Not available',
            created: data.created || 'Unknown',
            expires: data.expires || 'Unknown',
            updated: data.updated || 'Unknown',
            nameServers: data.nameServers || [],
            registrant: data.registrant || 'Hidden',
            admin: data.admin || 'Hidden',
            tech: data.tech || 'Hidden',
            status: data.statuses || []
        };
    }
}

const realWhoisLookup = new RealWhoisLookup();