// ==============================================
// FILE: api.js
// LOKASI: 📁 PS-ULTIMATE-APP/public/JS/api.js
// ==============================================

// API Client untuk dashboard
const API_BASE = 'http://localhost:3000/api'; // ← Sesuaikan dengan PORT di server.js

async function callAPI(endpoint, method = 'GET', data = null) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token') // ← Token dari login
            },
            body: data ? JSON.stringify(data) : null
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// Contoh fungsi untuk tools:
async function runDNSTool(domain) {
    return await callAPI(`/tools/execute/dns?domain=${domain}`);
}

async function runIPTool(ip) {
    return await callAPI(`/tools/execute/ip?address=${ip}`);
}