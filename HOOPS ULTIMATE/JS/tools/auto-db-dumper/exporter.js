// ===== DB DUMPER - EXPORTER MODULE =====
class DbExporter {
    constructor() {
        this.formats = ['json', 'csv', 'html', 'txt', 'sql'];
    }
    
    // Export data in multiple formats
    exportData(data, format = 'json', options = {}) {
        switch(format.toLowerCase()) {
            case 'json':
                return this.toJSON(data, options);
            case 'csv':
                return this.toCSV(data, options);
            case 'html':
                return this.toHTML(data, options);
            case 'txt':
                return this.toTXT(data, options);
            case 'sql':
                return this.toSQL(data, options);
            default:
                return this.toJSON(data, options);
        }
    }
    
    // Export as JSON
    toJSON(data, options = {}) {
        const exportData = {
            metadata: {
                tool: "HOOPSTEAM DB Dumper",
                version: "1.0",
                export_date: new Date().toISOString(),
                format: "json"
            },
            data: data
        };
        
        if (options.pretty) {
            return JSON.stringify(exportData, null, 2);
        }
        return JSON.stringify(exportData);
    }
    
    // Export as CSV
    toCSV(data, options = {}) {
        if (!Array.isArray(data)) {
            data = [data];
        }
        
        if (data.length === 0) {
            return "No data to export";
        }
        
        // Extract headers from first object
        const headers = Object.keys(data[0]);
        
        // Create CSV rows
        const rows = [
            headers.join(','),
            ...data.map(item => 
                headers.map(header => {
                    const value = item[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ];
        
        return rows.join('\n');
    }
    
    // Export as HTML
    toHTML(data, options = {}) {
        const title = options.title || "DB Dumper Export";
        const timestamp = new Date().toLocaleString();
        
        let content = '';
        
        if (Array.isArray(data)) {
            if (data.length === 0) {
                content = '<p>No data to display</p>';
            } else {
                // Create table
                const headers = Object.keys(data[0]);
                
                content = `
                <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                        <tr>
                            ${headers.map(header => {
                                const value = item[header];
                                let display = value;
                                
                                if (value === null || value === undefined) {
                                    display = '-';
                                } else if (typeof value === 'object') {
                                    display = `<pre>${JSON.stringify(value, null, 2)}</pre>`;
                                }
                                
                                return `<td>${display}</td>`;
                            }).join('')}
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                `;
            }
        } else if (typeof data === 'object') {
            // Display as definition list
            content = '<dl>';
            for (const [key, value] of Object.entries(data)) {
                let display = value;
                
                if (typeof value === 'object') {
                    display = `<pre>${JSON.stringify(value, null, 2)}</pre>`;
                }
                
                content += `
                <dt><strong>${key}:</strong></dt>
                <dd>${display}</dd>
                `;
            }
            content += '</dl>';
        } else {
            content = `<pre>${data}</pre>`;
        }
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .header {
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th {
                    background-color: #4CAF50;
                    color: white;
                    text-align: left;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                pre {
                    background-color: #f8f8f8;
                    padding: 10px;
                    border-radius: 3px;
                    overflow: auto;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                    <p>Generated by HOOPSTEAM DB Dumper on ${timestamp}</p>
                </div>
                ${content}
            </div>
        </body>
        </html>
        `;
    }
    
    // Export as plain text
    toTXT(data, options = {}) {
        let output = [];
        output.push("=".repeat(60));
        output.push("HOOPSTEAM DB DUMPER EXPORT");
        output.push(`Generated: ${new Date().toLocaleString()}`);
        output.push("=".repeat(60));
        output.push("");
        
        if (Array.isArray(data)) {
            if (data.length === 0) {
                output.push("No data available");
            } else {
                data.forEach((item, index) => {
                    output.push(`[ENTRY ${index + 1}]`);
                    output.push("-".repeat(40));
                    
                    for (const [key, value] of Object.entries(item)) {
                        if (typeof value === 'object') {
                            output.push(`${key}:`);
                            output.push(JSON.stringify(value, null, 2));
                        } else {
                            output.push(`${key}: ${value}`);
                        }
                    }
                    
                    output.push("");
                });
            }
        } else if (typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'object') {
                    output.push(`${key}:`);
                    output.push(JSON.stringify(value, null, 2));
                } else {
                    output.push(`${key}: ${value}`);
                }
                output.push("");
            }
        } else {
            output.push(data);
        }
        
        return output.join('\n');
    }
    
    // Export as SQL
    toSQL(data, options = {}) {
        const tableName = options.tableName || 'hoopsteam_scan_results';
        
        let sql = [];
        
        // Create table statement
        sql.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`);
        sql.push('  id INT AUTO_INCREMENT PRIMARY KEY,');
        sql.push('  target VARCHAR(255),');
        sql.push('  status VARCHAR(50),');
        sql.push('  vulnerable BOOLEAN,');
        sql.push('  exploitable BOOLEAN,');
        sql.push('  risk_level VARCHAR(20),');
        sql.push('  db_type VARCHAR(50),');
        sql.push('  vulnerabilities TEXT,');
        sql.push('  scan_date TIMESTAMP');
        sql.push(');');
        sql.push('');
        
        // Insert statements
        if (Array.isArray(data)) {
            data.forEach(item => {
                const values = [
                    this.escapeSQL(item.target || ''),
                    this.escapeSQL(item.status || ''),
                    item.vulnerable ? 1 : 0,
                    item.exploitable ? 1 : 0,
                    this.escapeSQL(item.risk || ''),
                    this.escapeSQL(item.dbType || ''),
                    this.escapeSQL(JSON.stringify(item.vulnerabilities || [])),
                    'NOW()'
                ];
                
                sql.push(`INSERT INTO ${tableName} (target, status, vulnerable, exploitable, risk_level, db_type, vulnerabilities, scan_date) VALUES (${values.join(', ')});`);
            });
        }
        
        return sql.join('\n');
    }
    
    // Escape SQL values
    escapeSQL(value) {
        if (value === null || value === undefined) return 'NULL';
        
        const str = String(value);
        return "'" + str.replace(/'/g, "''") + "'";
    }
    
    // Download file
    download(filename, content, type = 'text/plain') {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        hoopsteamLogger.info(`File downloaded: ${filename}`);
    }
    
    // Generate filename
    generateFilename(format, prefix = 'dbdump') {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, 19);
        
        return `${prefix}_${timestamp}.${format}`;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DbExporter;
}