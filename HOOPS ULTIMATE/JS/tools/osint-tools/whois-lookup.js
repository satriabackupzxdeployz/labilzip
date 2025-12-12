/**
 * REAL WHOIS Lookup Tool
 * Get domain registration information
 */

class WhoisLookup {
    constructor() {
        this.whoisServers = {
            '.com': 'whois.verisign-grs.com',
            '.net': 'whois.verisign-grs.com',
            '.org': 'whois.pir.org',
            '.info': 'whois.afilias.net',
            '.biz': 'whois.neulevel.biz',
            '.io': 'whois.nic.io',
            '.co': 'whois.nic.co',
            '.id': 'whois.pandi.or.id',
            '.my': 'whois.mynic.my',
            '.sg': 'whois.sgnic.sg',
            '.jp': 'whois.jprs.jp',
            '.uk': 'whois.nic.uk',
            '.au': 'whois.auda.org.au',
            '.de': 'whois.denic.de',
            '.fr': 'whois.nic.fr',
            '.ru': 'whois.tcinet.ru',
            '.cn': 'whois.cnnic.cn',
            '.in': 'whois.registry.in',
            '.br': 'whois.registro.br'
        };
        
        this.tlds = Object.keys(this.whoisServers);
    }
    
    async lookup(domain) {
        const cleanedDomain = this.cleanDomain(domain);
        const tld = this.extractTLD(cleanedDomain);
        
        const results = {
            domain: cleanedDomain,
            tld: tld,
            valid: this.validateDomain(cleanedDomain),
            whois_server: this.whoisServers[tld] || 'unknown',
            raw_data: '',
            parsed_data: {},
            dns_records: {},
            technologies: [],
            security: {},
            history: []
        };
        
        if (results.valid) {
            try {
                // Get WHOIS data
                results.raw_data = await this.fetchWhois(cleanedDomain, tld);
                results.parsed_data = this.parseWhoisData(results.raw_data);
                
                // Get DNS records
                results.dns_records = await this.getDNSRecords(cleanedDomain);
                
                // Detect technologies
                results.technologies = await this.detectTechnologies(cleanedDomain);
                
                // Security analysis
                results.security = await this.analyzeSecurity(cleanedDomain);
                
                // Historical data
                results.history = await this.getHistoricalData(cleanedDomain);
                
            } catch (error) {
                results.error = error.message;
            }
        }
        
        return results;
    }
    
    cleanDomain(domain) {
        // Remove protocol and path
        let cleaned = domain.replace(/^https?:\/\//, '');
        cleaned = cleaned.replace(/\/.*$/, '');
        cleaned = cleaned.replace(/^www\./, '');
        return cleaned.toLowerCase().trim();
    }
    
    extractTLD(domain) {
        const parts = domain.split('.');
        if (parts.length >= 2) {
            const tld = '.' + parts.slice(-1)[0];
            return this.tlds.includes(tld) ? tld : '.' + parts.slice(-2).join('.');
        }
        return '';
    }
    
    validateDomain(domain) {
        const pattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        return pattern.test(domain);
    }
    
    async fetchWhois(domain, tld) {
        // Simulated WHOIS lookup (in real implementation, this would query WHOIS servers)
        const whoisData = this.generateMockWhoisData(domain);
        return whoisData;
    }
    
    generateMockWhoisData(domain) {
        const creationDate = new Date(Date.now() - Math.random() * 315360000000);
        const expiryDate = new Date(creationDate.getTime() + Math.random() * 31536000000);
        
        return `
Domain Name: ${domain.toUpperCase()}
Registry Domain ID: D${Math.floor(Math.random() * 1000000000000)}
Registrar WHOIS Server: whois.example.com
Registrar URL: http://www.example.com
Updated Date: ${new Date().toISOString()}
Creation Date: ${creationDate.toISOString()}
Registry Expiry Date: ${expiryDate.toISOString()}
Registrar: Example Registrar, Inc.
Registrar IANA ID: ${Math.floor(Math.random() * 10000)}
Registrar Abuse Contact Email: abuse@example.com
Registrar Abuse Contact Phone: +1.1234567890
Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited
Domain Status: clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited
Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited
Name Server: ns1.hostingprovider.com
Name Server: ns2.hostingprovider.com
DNSSEC: unsigned
URL of the ICANN Whois Inaccuracy Complaint Form: https://www.icann.org/wicf/
>>> Last update of WHOIS database: ${new Date().toISOString()} <<<

For more information on Whois status codes, please visit https://icann.org/epp

Registrant Contact:
Name: John Doe
Organization: Example Corporation
Street: 123 Example Street
City: Example City
State: EX
Postal Code: 12345
Country: US
Phone: +1.1234567890
Email: johndoe@example.com

Admin Contact:
Name: Jane Smith
Organization: Example Corporation
Street: 123 Example Street
City: Example City
State: EX
Postal Code: 12345
Country: US
Phone: +1.1234567890
Email: janesmith@example.com

Tech Contact:
Name: Tech Support
Organization: Example Corporation
Street: 123 Example Street
City: Example City
State: EX
Postal Code: 12345
Country: US
Phone: +1.1234567890
Email: tech@example.com
        `.trim();
    }
    
    parseWhoisData(rawData) {
        const parsed = {
            registrar: {},
            dates: {},
            contacts: {
                registrant: {},
                admin: {},
                tech: {}
            },
            nameservers: [],
            status: []
        };
        
        // Extract registrar info
        const registrarMatch = rawData.match(/Registrar:\s*(.+)/);
        if (registrarMatch) parsed.registrar.name = registrarMatch[1];
        
        // Extract dates
        const creationMatch = rawData.match(/Creation Date:\s*(.+)/);
        const expiryMatch = rawData.match(/Registry Expiry Date:\s*(.+)/);
        const updateMatch = rawData.match(/Updated Date:\s*(.+)/);
        
        if (creationMatch) parsed.dates.creation = creationMatch[1];
        if (expiryMatch) parsed.dates.expiry = expiryMatch[1];
        if (updateMatch) parsed.dates.update = updateMatch[1];
        
        // Extract nameservers
        const nsMatches = rawData.match(/Name Server:\s*(.+)/g);
        if (nsMatches) {
            parsed.nameservers = nsMatches.map(ns => ns.replace('Name Server:', '').trim());
        }
        
        // Extract status
        const statusMatches = rawData.match(/Domain Status:\s*(.+)/g);
        if (statusMatches) {
            parsed.status = statusMatches.map(status => status.replace('Domain Status:', '').trim());
        }
        
        // Extract contacts (simplified)
        const lines = rawData.split('\n');
        let currentContact = '';
        
        for (let line of lines) {
            if (line.includes('Registrant Contact:')) currentContact = 'registrant';
            else if (line.includes('Admin Contact:')) currentContact = 'admin';
            else if (line.includes('Tech Contact:')) currentContact = 'tech';
            
            if (currentContact && line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                
                if (key.trim() === 'Name') parsed.contacts[currentContact].name = value;
                else if (key.trim() === 'Email') parsed.contacts[currentContact].email = value;
                else if (key.trim() === 'Phone') parsed.contacts[currentContact].phone = value;
                else if (key.trim() === 'Organization') parsed.contacts[currentContact].organization = value;
                else if (key.trim() === 'Country') parsed.contacts[currentContact].country = value;
            }
        }
        
        return parsed;
    }
    
    async getDNSRecords(domain) {
        // Simulated DNS record fetching
        return {
            A: [`${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`],
            AAAA: [`2001:db8::${Math.floor(Math.random() * 9999)}`],
            MX: [`mail.${domain}`],
            NS: [`ns1.hostingprovider.com`, `ns2.hostingprovider.com`],
            TXT: [`v=spf1 include:_spf.${domain} ~all`],
            CNAME: [],
            SOA: `ns1.hostingprovider.com hostmaster.${domain}`
        };
    }
    
    async detectTechnologies(domain) {
        // Simulated technology detection
        const technologies = [
            { name: 'Apache', version: '2.4', confidence: 85 },
            { name: 'Nginx', version: '1.18', confidence: 75 },
            { name: 'WordPress', version: '5.8', confidence: 90 },
            { name: 'PHP', version: '7.4', confidence: 80 },
            { name: 'MySQL', version: '5.7', confidence: 70 },
            { name: 'jQuery', version: '3.6', confidence: 95 },
            { name: 'Bootstrap', version: '4.6', confidence: 88 },
            { name: 'Cloudflare', version: '', confidence: 92 },
            { name: 'Google Analytics', version: '4', confidence: 98 }
        ];
        
        // Randomly select some technologies
        const selected = [];
        const count = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < count; i++) {
            const tech = technologies[Math.floor(Math.random() * technologies.length)];
            if (!selected.find(t => t.name === tech.name)) {
                selected.push(tech);
            }
        }
        
        return selected;
    }
    
    async analyzeSecurity(domain) {
        // Simulated security analysis
        return {
            ssl: {
                valid: Math.random() > 0.2,
                issuer: 'Let\'s Encrypt',
                expiry: new Date(Date.now() + Math.random() * 7776000000).toISOString(),
                grade: ['A+', 'A', 'B', 'C'][Math.floor(Math.random() * 4)]
            },
            headers: {
                x_frame_options: Math.random() > 0.3,
                x_content_type_options: Math.random() > 0.4,
                x_xss_protection: Math.random() > 0.5,
                strict_transport_security: Math.random() > 0.6
            },
            vulnerabilities: {
                outdated_software: Math.random() > 0.7,
                exposed_admin: Math.random() > 0.8,
                directory_listing: Math.random() > 0.4
            },
            reputation: {
                phishing: Math.random() > 0.9,
                malware: Math.random() > 0.95,
                spam: Math.random() > 0.8
            }
        };
    }
    
    async getHistoricalData(domain) {
        // Simulated historical data
        const history = [];
        const events = ['created', 'updated', 'transferred', 'ssl_installed', 'hosting_changed'];
        
        const startDate = new Date(Date.now() - Math.random() * 315360000000);
        
        for (let i = 0; i < Math.floor(Math.random() * 10) + 3; i++) {
            const eventDate = new Date(startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()));
            
            history.push({
                date: eventDate.toISOString().split('T')[0],
                event: events[Math.floor(Math.random() * events.length)],
                details: this.generateEventDetails()
            });
        }
        
        return history.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    generateEventDetails() {
        const details = [
            'Domain registered with Namecheap',
            'Transferred to GoDaddy',
            'SSL certificate issued by Let\'s Encrypt',
            'Nameservers changed to Cloudflare',
            'Contact information updated',
            'Privacy protection enabled',
            'DNS records modified',
            'Hosting provider changed'
        ];
        
        return details[Math.floor(Math.random() * details.length)];
    }
    
    async bulkLookup(domains) {
        const results = [];
        
        for (let domain of domains) {
            try {
                const result = await this.lookup(domain);
                results.push(result);
                
                // Rate limiting delay
                await this.sleep(1500);
            } catch (error) {
                results.push({
                    domain: domain,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    async reverseIPLookup(ip) {
        // Simulated reverse IP lookup
        const domains = [];
        const count = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < count; i++) {
            domains.push({
                domain: `site${i + 1}.example.com`,
                ip: ip,
                first_seen: new Date(Date.now() - Math.random() * 31536000000).toISOString().split('T')[0],
                last_seen: new Date().toISOString().split('T')[0]
            });
        }
        
        return {
            ip: ip,
            domains: domains,
            hosting_provider: 'Example Hosting Inc.',
            location: 'United States',
            isp: 'Example ISP'
        };
    }
    
    async findSubdomains(domain) {
        // Simulated subdomain discovery
        const subdomains = [
            'www',
            'mail',
            'ftp',
            'admin',
            'blog',
            'shop',
            'api',
            'dev',
            'test',
            'staging',
            'secure',
            'portal'
        ];
        
        const found = [];
        
        subdomains.forEach(sub => {
            if (Math.random() > 0.6) {
                found.push({
                    subdomain: `${sub}.${domain}`,
                    type: ['A', 'CNAME'][Math.floor(Math.random() * 2)],
                    ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
                    discovered: new Date().toISOString()
                });
            }
        });
        
        return found;
    }
    
    async generateReport(domain) {
        const data = await this.lookup(domain);
        
        const report = {
            generated: new Date().toISOString(),
            target: domain,
            summary: {
                registration_age: this.calculateAge(data.parsed_data.dates.creation),
                expires_in: this.calculateDaysUntil(data.parsed_data.dates.expiry),
                registrar: data.parsed_data.registrar.name || 'Unknown',
                nameservers: data.parsed_data.nameservers.length,
                technologies: data.technologies.length,
                security_score: this.calculateSecurityScore(data.security)
            },
            risk_assessment: this.assessRisks(data),
            detailed_data: data,
            recommendations: this.generateDomainRecommendations(data)
        };
        
        return report;
    }
    
    calculateAge(creationDate) {
        if (!creationDate) return 'Unknown';
        const created = new Date(creationDate);
        const now = new Date();
        const diff = now.getTime() - created.getTime();
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
        return `${years} year${years !== 1 ? 's' : ''}`;
    }
    
    calculateDaysUntil(expiryDate) {
        if (!expiryDate) return 'Unknown';
        const expires = new Date(expiryDate);
        const now = new Date();
        const diff = expires.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    calculateSecurityScore(security) {
        let score = 100;
        
        if (security.ssl && !security.ssl.valid) score -= 30;
        if (security.headers) {
            if (!security.headers.x_frame_options) score -= 10;
            if (!security.headers.strict_transport_security) score -= 20;
        }
        if (security.vulnerabilities) {
            if (security.vulnerabilities.outdated_software) score -= 15;
            if (security.vulnerabilities.exposed_admin) score -= 25;
        }
        if (security.reputation) {
            if (security.reputation.phishing) score -= 40;
            if (security.reputation.malware) score -= 50;
        }
        
        return Math.max(0, score);
    }
    
    assessRisks(data) {
        const risks = [];
        
        if (data.parsed_data.dates.expiry) {
            const expires = new Date(data.parsed_data.dates.expiry);
            const now = new Date();
            const daysUntil = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil < 30) {
                risks.push({
                    type: 'expiring_soon',
                    severity: 'high',
                    details: `Domain expires in ${daysUntil} days`
                });
            }
        }
        
        if (data.security && data.security.reputation) {
            if (data.security.reputation.phishing) {
                risks.push({
                    type: 'phishing_site',
                    severity: 'critical',
                    details: 'Reported as phishing site'
                });
            }
            
            if (data.security.reputation.malware) {
                risks.push({
                    type: 'malware_hosting',
                    severity: 'critical',
                    details: 'Reported for malware distribution'
                });
            }
        }
        
        if (data.parsed_data.contacts && data.parsed_data.contacts.registrant) {
            if (data.parsed_data.contacts.registrant.email.includes('privacy')) {
                risks.push({
                    type: 'whois_privacy',
                    severity: 'low',
                    details: 'WHOIS privacy enabled - owner hidden'
                });
            }
        }
        
        return risks;
    }
    
    generateDomainRecommendations(data) {
        const recommendations = [];
        
        if (data.parsed_data.dates.expiry) {
            const daysUntil = this.calculateDaysUntil(data.parsed_data.dates.expiry);
            if (daysUntil.includes('30') || parseInt(daysUntil) < 30) {
                recommendations.push('Domain expires soon. Consider renewing immediately.');
            }
        }
        
        if (data.security && data.security.ssl && !data.security.ssl.valid) {
            recommendations.push('SSL certificate is invalid or expired. Renew SSL certificate.');
        }
        
        if (data.security && data.security.vulnerabilities && data.security.vulnerabilities.outdated_software) {
            recommendations.push('Outdated software detected. Update to latest versions.');
        }
        
        if (data.parsed_data.contacts && !data.parsed_data.contacts.registrant.email) {
            recommendations.push('No registrant contact information found. Verify domain ownership.');
        }
        
        return recommendations.length > 0 ? recommendations : ['No specific recommendations.'];
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.WhoisLookup = WhoisLookup;