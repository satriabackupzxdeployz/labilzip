// ==============================================
// FILE: tools-engine.js
// LOKASI: 📁 PS-ULTIMATE-APP/src/tools-engine.js
// ==============================================

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runTool(toolName, params) {
    // Cari tool di berbagai lokasi:
    const searchPaths = [
        path.join(__dirname, '..', 'public', 'JS', toolName),           // ← 1. public/JS/
        path.join(__dirname, '..', 'public', 'JS', `${toolName}.js`),   // ← 2. public/JS/ dengan .js
        path.join(__dirname, '..', 'public', 'tools', toolName),        // ← 3. public/tools/
        path.join(__dirname, '..', 'public', 'tools', `${toolName}.js`) // ← 4. public/tools/ dengan .js
    ];
    
    // Kode execution...
}

module.exports = { runTool };