// ==============================================
// FILE: database.js
// LOKASI: 📁 PS-ULTIMATE-APP/src/database.js
// ==============================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database akan dibuat di:
const DB_PATH = path.join(__dirname, '..', 'database', 'ps-ultimate.db'); // ← 📁 database/

function initDatabase() {
    // Buat folder database jika belum ada
    const dbDir = path.join(__dirname, '..', 'database');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const db = new sqlite3.Database(DB_PATH);
    
    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS users (...)`);
    db.run(`CREATE TABLE IF NOT EXISTS tool_logs (...)`);
    
    return db;
}

module.exports = { initDatabase };