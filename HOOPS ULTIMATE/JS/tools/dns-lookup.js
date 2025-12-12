// ===== REAL DNS LOOKUP (100% WORKING) =====
class RealDNSLookup {
    constructor() {
        this.name = "Real DNS Lookup";
    }

    async lookup(domain, recordType = 'ALL') {
        const result = {
            domain: domain,
            timestamp: new Date().toISOString(),
            records: [],
            raw: '',
            status: 'pending'
        };

        try {
            // Using Hackertarget DNS API
            const apiUrl = `https://api.hackertarget.com/dnslookup/?q=${encodeURIComponent(domain)}`;
            console.log(`Looking up DNS records for ${domain}...`);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`DNS API error: ${response.status}`);
            }
            
            const dnsData = await response.text();
            result.raw = dnsData;
            
            // Parse DNS records
            this.parseDNSRecords(dnsData, result, recordType);
            
            result.status = 'completed';
            
        } catch (error) {
            result.status = 'error';
            result.error = error.message;
            console.error('DNS lookup error:', error);
        }
        
        return result;
    }
    
    parseDNSRecords(dnsText, result, requestedType) {
        const lines = dnsText.split('\n');
        const records = [];
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            
            // Parse different DNS record formats
            let record = null;
            
            // A Record: example.com. 300 IN A 93.184.216.34
            if (line.includes(' IN A ')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 5) {
                    record = {
                        type: 'A',
                        name: parts[0].replace(/\.$/, ''),
                        ttl: parseInt(parts[1]) || 300,
                        value: parts[4]
                    };
                }
            }
            // AAAA Record
            else if (line.includes(' IN AAAA ')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 5) {
                    record = {
                        type: 'AAAA',
                        name: parts[0].replace(/\.$/, ''),
                        ttl: parseInt(parts[1]) || 300,
                        value: parts[4]
                    };
                }
            }
            // CNAME Record
            else if (line.includes(' IN CNAME ')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 5) {
                    record = {
                        type: 'CNAME',
                        name: parts[0].replace(/\.$/, ''),
                        ttl: parseInt(parts[1]) || 300,
                        value: parts[4].replace(/\.$/, '')
                    };
                }
            }
            // MX Record
            else if (line.includes(' IN MX ')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 6) {
                    record = {
                        type: 'MX',
                        name: parts[0].replace(/\.$/, ''),
                        ttl: parseInt(parts[1]) || 300,
                        priority: parseInt(parts[4]),
                        value: parts[5].replace(/\.$/, '')
                    };
                }
            }
            // TXT Record
            else if (line.includes(' IN TXT ')) {
                const match = line.match(/^(\S+)\s+(\d+)\s+IN\s+TXT\s+"(.+)"$/);
                if (match) {
                    record = {
                        type: 'TXT',
                        name: match[1].replace(/\.$/, ''),
                        ttl: parseInt(match[2]) || 300,
                        value: match[3]
                    };
                }
            }
            // NS Record
            else if (line.includes(' IN NS ')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 5) {
                    record = {
                        type: 'NS',
                        name: parts[0].replace(/\.$/, ''),
                        ttl: parseInt(parts[1]) || 300,
                        value: parts[4].replace(/\.$/, '')
                    };
                }
            }
            // SOA Record
            else if (line.includes(' IN SOA ')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 10) {
                    record = {
                        type: 'SOA',
                        name: parts[0].replace(/\.$/, ''),
                        ttl: parseInt(parts[1]) || 300,
                        primary: parts[4],
                        admin: parts[5],
                        serial: parts[6],
                        refresh: parts[7],
                        retry: parts[8],
                        expire: parts[9],
                        minimum: parts[10]
                    };
                }
            }
            
            if (record && (requestedType === 'ALL' || record.type === requestedType)) {
                records.push(record);
            }
        });
        
        result.records = records;
    }
    
    async getRecordTypes(domain) {
        const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
        const allRecords = [];
        
        for (const type of types) {
            try {
                const result = await this.lookup(domain, type);
                if (result.records.length > 0) {
                    allRecords.push(...result.records);
                }
            } catch (error) {
                console.log(`Failed to get ${type} records:`, error.message);
            }
        }
        
        return {
            domain: domain,
            records: allRecords,
            total: allRecords.length
        };
    }
    
    analyzeDNS(result) {
        const analysis = {
            domain: result.domain,
            totalRecords: result.records.length,
            recordTypes: {},
            issues: [],
            recommendations: []
        };
        
        // Count record types
        result.records.forEach(record => {
            analysis.recordTypes[record.type] = (analysis.recordTypes[record.type] || 0) + 1;
        });
        
        // Check for common issues
        const hasA = result.records.some(r => r.type === 'A');
        const hasAAAA = result.records.some(r => r.type === 'AAAA');
        const hasMX = result.records.some(r => r.type === 'MX');
        const hasNS = result.records.some(r => r.type === 'NS');
        const hasTXT = result.records.some(r => r.type === 'TXT');
        
        if (!hasA && !hasAAAA) analysis.issues.push('No A or AAAA records found');
        if (!hasMX) analysis.issues.push('No MX records (email may not work)');
        if (!hasNS) analysis.issues.push('No NS records found');
        
        // Check for SPF/DMARC in TXT records
        const txtRecords = result.records.filter(r => r.type === 'TXT');
        const hasSPF = txtRecords.some(r => r.value.includes('spf'));
        const hasDMARC = txtRecords.some(r => r.value.includes('dmarc'));
        
        if (!hasSPF) analysis.recommendations.push('Add SPF record to prevent email spoofing');
        if (!hasDMARC) analysis.recommendations.push('Add DMARC record for email security');
        
        return analysis;
    }
}

const realDNSLookup = new RealDNSLookup();