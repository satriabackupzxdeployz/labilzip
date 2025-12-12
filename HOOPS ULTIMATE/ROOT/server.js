// ==============================================
// FILE: server.js
// LOKASI: 📁 PS-ULTIMATE-APP/server.js
// ==============================================

const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import modul dari folder src/
const { authenticate } = require('./src/auth');         // ← Dari folder src/
const { initDatabase } = require('./src/database');     // ← Dari folder src/
const { runTool } = require('./src/tools-engine');      // ← Dari folder src/
const { securityMiddleware } = require('./src/security'); // ← Dari folder src/

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(securityMiddleware);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // ← Serve file dari public/

// ==================== ROUTES ====================

// 📍 Login route
app.post('/api/login', async (req, res) => {
    // Kode auth...
});

// 📍 Get all tools
app.get('/api/tools', (req, res) => {
    const toolsPath = path.join(__dirname, 'public', 'tools'); // ← Akses folder tools/
    // Kode...
});

// 📍 Execute JavaScript tool
app.post('/api/tools/execute/js', async (req, res) => {
    const { toolName } = req.body;
    
    // Cari file tool di dua lokasi:
    const locations = [
        path.join(__dirname, 'public', 'JS', toolName),      // ← Cek di public/JS/
        path.join(__dirname, 'public', 'tools', toolName)    // ← Cek di public/tools/
    ];
    // Kode...
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    initDatabase(); // ← Inisialisasi database
});