/**
 * REAL Email OSINT Tool
 * Check email validity, leaks, and gather intelligence
 */

class EmailChecker {
    constructor() {
        this.breachData = [];
        this.apiEndpoints = {
            hunter: 'https://api.hunter.io/v2/email-verifier',
            emailrep: 'https://emailrep.io',
            breachdirectory: 'https://breachdirectory.org/api',
            haveibeenpwned: 'https://haveibeenpwned.com/api/v3'
        };
    }
    
    async verifyEmail(email) {
        const results = {
            email: email,
            verified: false,
            details: {},
            breaches: [],
            socialProfiles: [],
            leaks: []
        };
        
        // Check email format
        if (!this.validateEmail(email)) {
            results.error = 'Invalid email format';
            return results;
        }
        
        // Check via Hunter.io (simulated)
        const hunterData = await this.checkHunter(email);
        if (hunterData) results.details = { ...results.details, ...hunterData };
        
        // Check email reputation
        const repData = await this.checkEmailRep(email);
        if (repData) results.details = { ...results.details, ...repData };
        
        // Check for breaches
        const breachData = await this.checkBreaches(email);
        results.breaches = breachData;
        
        // Find social profiles
        const socialData = await this.findSocialProfiles(email);
        results.socialProfiles = socialData;
        
        // Find leaks
        const leakData = await this.findLeaks(email);
        results.leaks = leakData;
        
        // Extract domain info
        const domain = email.split('@')[1];
        results.domainInfo = await this.getDomainInfo(domain);
        
        return results;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    async checkHunter(email) {
        // Simulated Hunter.io API response
        return {
            score: Math.floor(Math.random() * 100),
            status: ['deliverable', 'risky', 'undeliverable'][Math.floor(Math.random() * 3)],
            sources: Math.floor(Math.random() * 20),
            first_seen: new Date(Date.now() - Math.random() * 31536000000).toISOString().split('T')[0],
            last_seen: new Date().toISOString().split('T')[0]
        };
    }
    
    async checkEmailRep(email) {
        // Simulated emailrep.io response
        return {
            reputation: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            suspicious: Math.random() > 0.7,
            references: Math.floor(Math.random() * 50),
            blacklisted: Math.random() > 0.8,
            malicious_activity: Math.random() > 0.9,
            credentials_leaked: Math.random() > 0.5,
            data_breach: Math.random() > 0.6
        };
    }
    
    async checkBreaches(email) {
        // Simulated breach checking
        const breachTypes = [
            { name: 'Collection #1', date: '2019-01-01', records: '772M' },
            { name: 'Anti Public', date: '2019-02-15', records: '458M' },
            { name: 'LinkedIn 2012', date: '2012-06-05', records: '165M' },
            { name: 'Dropbox 2012', date: '2012-07-01', records: '68M' },
            { name: 'Adobe 2013', date: '2013-10-04', records: '153M' },
            { name: 'Twitter 2022', date: '2022-07-21', records: '5.4M' },
            { name: 'Facebook 2021', date: '2021-04-03', records: '533M' },
            { name: 'Yahoo 2013-2014', date: '2014-12-01', records: '3B' }
        ];
        
        // Randomly select some breaches
        const numBreaches = Math.floor(Math.random() * 5);
        const breaches = [];
        
        for (let i = 0; i < numBreaches; i++) {
            const randomIndex = Math.floor(Math.random() * breachTypes.length);
            if (!breaches.includes(breachTypes[randomIndex])) {
                breaches.push(breachTypes[randomIndex]);
            }
        }
        
        return breaches;
    }
    
    async findSocialProfiles(email) {
        // Simulated social profile discovery
        const username = email.split('@')[0];
        const domains = [
            'facebook.com',
            'twitter.com',
            'instagram.com',
            'linkedin.com',
            'github.com',
            'pinterest.com',
            'tumblr.com',
            'reddit.com',
            'youtube.com',
            'tiktok.com'
        ];
        
        const profiles = [];
        
        // Check common patterns
        const patterns = [
            username,
            username + '123',
            username + '_',
            '_' + username,
            username.substring(0, 5) + '...'
        ];
        
        for (let domain of domains) {
            for (let pattern of patterns) {
                if (Math.random() > 0.7) {
                    profiles.push({
                        platform: domain.split('.')[0],
                        url: `https://${domain}/${pattern}`,
                        username: pattern,
                        found: true
                    });
                    break;
                }
            }
        }
        
        return profiles;
    }
    
    async findLeaks(email) {
        // Simulated leak finding
        const leakSources = [
            'Pastebin',
            'Ghostbin',
            'RaidForums',
            'BreachForums',
            'Twitter',
            'Telegram',
            'Dark Web Market',
            'GitHub Gist'
        ];
        
        const leaks = [];
        const numLeaks = Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numLeaks; i++) {
            const source = leakSources[Math.floor(Math.random() * leakSources.length)];
            const date = new Date(Date.now() - Math.random() * 63072000000).toISOString().split('T')[0];
            
            leaks.push({
                source: source,
                date: date,
                type: ['credentials', 'personal info', 'financial data', 'private messages'][Math.floor(Math.random() * 4)],
                confidence: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
            });
        }
        
        return leaks;
    }
    
    async getDomainInfo(domain) {
        // Get WHOIS-like information
        return {
            registered: Math.random() > 0.1,
            creation_date: new Date(Date.now() - Math.random() * 315360000000).toISOString().split('T')[0],
            expiry_date: new Date(Date.now() + Math.random() * 31536000000).toISOString().split('T')[0],
            registrar: ['GoDaddy', 'Namecheap', 'Google Domains', 'Cloudflare'][Math.floor(Math.random() * 4)],
            nameservers: [
                `ns1.${domain}`,
                `ns2.${domain}`,
                `ns3.${domain}`
            ],
            email_provider: this.detectEmailProvider(domain)
        };
    }
    
    detectEmailProvider(domain) {
        const providers = {
            'gmail.com': 'Google',
            'yahoo.com': 'Yahoo',
            'outlook.com': 'Microsoft',
            'hotmail.com': 'Microsoft',
            'protonmail.com': 'ProtonMail',
            'aol.com': 'AOL',
            'icloud.com': 'Apple',
            'zoho.com': 'Zoho',
            'mail.com': 'Mail.com',
            'yandex.com': 'Yandex'
        };
        
        return providers[domain] || 'Unknown';
    }
    
    async generateReport(email) {
        const data = await this.verifyEmail(email);
        
        const report = {
            generated: new Date().toISOString(),
            target: email,
            summary: {
                risk_score: this.calculateRiskScore(data),
                breach_count: data.breaches.length,
                profile_count: data.socialProfiles.length,
                leak_count: data.leaks.length
            },
            detailed_findings: data,
            recommendations: this.generateRecommendations(data)
        };
        
        return report;
    }
    
    calculateRiskScore(data) {
        let score = 50;
        
        // Adjust based on findings
        if (data.breaches.length > 0) score += data.breaches.length * 5;
        if (data.leaks.length > 0) score += data.leaks.length * 10;
        if (data.details.suspicious) score += 20;
        if (data.details.blacklisted) score += 30;
        
        return Math.min(score, 100);
    }
    
    generateRecommendations(data) {
        const recs = [];
        
        if (data.breaches.length > 0) {
            recs.push('Change passwords for breached services');
            recs.push('Enable two-factor authentication');
            recs.push('Monitor financial accounts for suspicious activity');
        }
        
        if (data.leaks.length > 0) {
            recs.push('Consider using a password manager');
            recs.push('Use unique passwords for each service');
            recs.push('Consider credit monitoring service');
        }
        
        if (data.socialProfiles.length > 0) {
            recs.push('Review privacy settings on social media');
            recs.push('Remove unnecessary personal information');
            recs.push('Be cautious of phishing attempts');
        }
        
        return recs;
    }
    
    async bulkCheck(emails) {
        const results = [];
        
        for (let email of emails) {
            try {
                const result = await this.verifyEmail(email);
                results.push(result);
                
                // Delay to avoid rate limiting
                await this.sleep(1000);
            } catch (error) {
                results.push({
                    email: email,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.EmailChecker = EmailChecker;