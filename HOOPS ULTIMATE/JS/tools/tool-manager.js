/**
 * DOS Tools Manager
 * Manages all DOS attack tools
 */

class DOSToolsManager {
    constructor() {
        this.tools = {
            'http-flood': {
                name: 'HTTP Flood',
                description: 'Sends大量HTTP requests to overwhelm target',
                category: 'application-layer',
                riskLevel: 'high',
                requires: ['target-url'],
                class: null // Will be loaded dynamically
            },
            'slowloris': {
                name: 'Slowloris',
                description: 'Keeps many connections open using slow HTTP requests',
                category: 'application-layer',
                riskLevel: 'medium',
                requires: ['target-host', 'target-port'],
                class: null
            },
            'udp-flood': {
                name: 'UDP Flood',
                description: 'Floods target with UDP packets',
                category: 'transport-layer',
                riskLevel: 'high',
                requires: ['target-host', 'target-port'],
                class: null
            },
            'syn-flood': {
                name: 'SYN Flood',
                description: 'Floods target with TCP SYN packets',
                category: 'transport-layer',
                riskLevel: 'high',
                requires: ['target-host', 'target-port'],
                class: null
            }
        };
        
        this.activeAttacks = new Map();
        this.history = [];
        this.maxHistory = 100;
        
        // Load configuration
        this.config = this.loadConfig();
    }
    
    /**
     * Load tool configuration
     */
    loadConfig() {
        try {
            const saved = localStorage.getItem('dos-tools-config');
            return saved ? JSON.parse(saved) : {
                autoSave: true,
                maxConcurrentAttacks: 2,
                defaultDuration: 60,
                warningShown: false,
                legalNoticeAccepted: false
            };
        } catch (error) {
            console.error('Failed to load config:', error);
            return {};
        }
    }
    
    /**
     * Save tool configuration
     */
    saveConfig() {
        try {
            localStorage.setItem('dos-tools-config', JSON.stringify(this.config));
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }
    
    /**
     * Initialize a specific tool
     */
    async initTool(toolName) {
        try {
            const tool = this.tools[toolName];
            if (!tool) {
                throw new Error(`Tool ${toolName} not found`);
            }
            
            // Dynamically load tool class
            if (!tool.class) {
                switch (toolName) {
                    case 'http-flood':
                        const { HTTPFlood } = await import('./04-dos-tools/http-flood.js');
                        tool.class = HTTPFlood;
                        break;
                    case 'slowloris':
                        const { SlowlorisAttack } = await import('./04-dos-tools/slowloris.js');
                        tool.class = SlowlorisAttack;
                        break;
                    case 'udp-flood':
                        const { UDPFlood } = await import('./04-dos-tools/udp-flood.js');
                        tool.class = UDPFlood;
                        break;
                    case 'syn-flood':
                        const { SYNFlood } = await import('./04-dos-tools/syn-flood.js');
                        tool.class = SYNFlood;
                        break;
                    default:
                        throw new Error(`Tool class for ${toolName} not implemented`);
                }
            }
            
            return new tool.class();
        } catch (error) {
            console.error(`Failed to initialize tool ${toolName}:`, error);
            throw error;
        }
    }
    
    /**
     * Start an attack
     */
    async startAttack(toolName, options = {}) {
        try {
            // Check concurrent attacks limit
            if (this.activeAttacks.size >= this.config.maxConcurrentAttacks) {
                throw new Error(`Maximum concurrent attacks (${this.config.maxConcurrentAttacks}) reached`);
            }
            
            // Check legal notice
            if (!this.config.legalNoticeAccepted) {
                throw new Error('Legal notice must be accepted before using DOS tools');
            }
            
            // Initialize tool
            const toolInstance = await this.initTool(toolName);
            
            // Set default duration if not specified
            if (!options.attackDuration && !options.floodDuration) {
                options.attackDuration = this.config.defaultDuration;
            }
            
            // Start attack
            const result = await toolInstance.startAttack(options);
            
            // Store active attack
            const attackId = `${toolName}-${Date.now()}`;
            this.activeAttacks.set(attackId, {
                id: attackId,
                tool: toolName,
                instance: toolInstance,
                startTime: Date.now(),
                options: options,
                status: 'running'
            });
            
            // Add to history
            this.addToHistory({
                id: attackId,
                tool: toolName,
                action: 'start',
                timestamp: Date.now(),
                options: options,
                result: result
            });
            
            return {
                success: true,
                attackId: attackId,
                message: `Attack started with ID: ${attackId}`,
                tool: toolName,
                result: result
            };
            
        } catch (error) {
            this.addToHistory({
                tool: toolName,
                action: 'start',
                timestamp: Date.now(),
                options: options,
                error: error.message,
                success: false
            });
            
            throw error;
        }
    }
    
    /**
     * Stop an attack
     */
    async stopAttack(attackId) {
        try {
            const attack = this.activeAttacks.get(attackId);
            if (!attack) {
                throw new Error(`Attack ${attackId} not found`);
            }
            
            // Stop the attack
            const result = await attack.instance.stopAttack();
            
            // Update attack status
            attack.status = 'stopped';
            attack.endTime = Date.now();
            attack.duration = (attack.endTime - attack.startTime) / 1000;
            
            // Remove from active attacks
            this.activeAttacks.delete(attackId);
            
            // Add to history
            this.addToHistory({
                id: attackId,
                tool: attack.tool,
                action: 'stop',
                timestamp: Date.now(),
                duration: attack.duration,
                result: result,
                success: true
            });
            
            return {
                success: true,
                attackId: attackId,
                message: `Attack ${attackId} stopped`,
                duration: attack.duration,
                result: result
            };
            
        } catch (error) {
            this.addToHistory({
                attackId: attackId,
                action: 'stop',
                timestamp: Date.now(),
                error: error.message,
                success: false
            });
            
            throw error;
        }
    }
    
    /**
     * Stop all active attacks
     */
    async stopAllAttacks() {
        const results = [];
        
        for (const [attackId, attack] of this.activeAttacks.entries()) {
            try {
                const result = await this.stopAttack(attackId);
                results.push(result);
            } catch (error) {
                results.push({
                    attackId: attackId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            message: `Stopped ${results.length} attacks`,
            results: results
        };
    }
    
    /**
     * Get attack status
     */
    getAttackStatus(attackId) {
        const attack = this.activeAttacks.get(attackId);
        if (!attack) {
            throw new Error(`Attack ${attackId} not found`);
        }
        
        const toolStatus = attack.instance.getStatus ? 
            attack.instance.getStatus() : 
            { isAttacking: true };
        
        return {
            id: attackId,
            tool: attack.tool,
            status: attack.status,
            startTime: attack.startTime,
            duration: (Date.now() - attack.startTime) / 1000,
            options: attack.options,
            toolStatus: toolStatus
        };
    }
    
    /**
     * Get all active attacks
     */
    getActiveAttacks() {
        const attacks = [];
        
        for (const [attackId, attack] of this.activeAttacks.entries()) {
            attacks.push(this.getAttackStatus(attackId));
        }
        
        return attacks;
    }
    
    /**
     * Add entry to history
     */
    addToHistory(entry) {
        this.history.unshift(entry);
        
        // Trim history if too long
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }
        
        // Auto-save if enabled
        if (this.config.autoSave) {
            this.saveHistory();
        }
    }
    
    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem('dos-attacks-history', JSON.stringify({
                history: this.history,
                savedAt: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
    
    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('dos-attacks-history');
            if (saved) {
                const data = JSON.parse(saved);
                this.history = data.history || [];
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        localStorage.removeItem('dos-attacks-history');
    }
    
    /**
     * Get tool information
     */
    getToolInfo(toolName) {
        const tool = this.tools[toolName];
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }
        
        return {
            ...tool,
            isLoaded: !!tool.class
        };
    }
    
    /**
     * Get all tools
     */
    getAllTools() {
        return Object.keys(this.tools).map(key => ({
            id: key,
            ...this.tools[key]
        }));
    }
    
    /**
     * Accept legal notice
     */
    acceptLegalNotice() {
        this.config.legalNoticeAccepted = true;
        this.config.warningShown = true;
        this.saveConfig();
        
        return {
            success: true,
            message: 'Legal notice accepted',
            timestamp: Date.now()
        };
    }
    
    /**
     * Get statistics
     */
    getStatistics() {
        const totalAttacks = this.history.filter(h => h.action === 'start').length;
        const successfulAttacks = this.history.filter(h => h.success && h.action === 'start').length;
        const totalDuration = this.history
            .filter(h => h.duration)
            .reduce((sum, h) => sum + h.duration, 0);
        
        const toolsUsed = {};
        this.history.forEach(h => {
            if (h.tool) {
                toolsUsed[h.tool] = (toolsUsed[h.tool] || 0) + 1;
            }
        });
        
        return {
            totalAttacks: totalAttacks,
            successfulAttacks: successfulAttacks,
            successRate: totalAttacks > 0 ? (successfulAttacks / totalAttacks * 100).toFixed(1) + '%' : '0%',
            totalDuration: totalDuration.toFixed(2) + 's',
            averageDuration: totalAttacks > 0 ? (totalDuration / totalAttacks).toFixed(2) + 's' : '0s',
            toolsUsed: toolsUsed,
            activeAttacks: this.activeAttacks.size,
            historySize: this.history.length
        };
    }
    
    /**
     * Generate comprehensive report
     */
    generateReport(startDate = null, endDate = null) {
        const filteredHistory = this.history.filter(entry => {
            if (!startDate && !endDate) return true;
            
            const entryDate = new Date(entry.timestamp);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && entryDate < start) return false;
            if (end && entryDate > end) return false;
            
            return true;
        });
        
        const stats = this.getStatistics();
        
        return {
            reportId: `dos-report-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            period: {
                start: startDate || 'beginning',
                end: endDate || 'now'
            },
            statistics: stats,
            recentAttacks: filteredHistory.slice(0, 20),
            activeAttacks: this.getActiveAttacks(),
            configuration: this.config,
            tools: this.getAllTools(),
            recommendations: [
                'Use DOS tools responsibly and legally',
                'Only test systems you own or have permission to test',
                'Monitor attack impacts carefully',
                'Implement proper logging and reporting',
                'Consider ethical implications before each attack'
            ]
        };
    }
}

// Create global instance
const dosToolsManager = new DOSToolsManager();

// Initialize on load
dosToolsManager.loadHistory();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dosToolsManager;
}

// For browser usage
if (typeof window !== 'undefined') {
    window.dosToolsManager = dosToolsManager;
}