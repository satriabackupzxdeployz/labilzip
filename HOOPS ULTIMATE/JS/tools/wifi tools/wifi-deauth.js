/**
 * WiFi Deauthentication Attack Tool
 * Professional-grade deauth attacks
 */

class WiFiDeauth {
    constructor() {
        this.attackModes = {
            'BROADCAST': {
                name: 'Broadcast Deauth',
                description: 'Deauthenticate all clients from target AP',
                target: 'BROADCAST',
                successRate: 0.8
            },
            'CLIENT_SPECIFIC': {
                name: 'Client Specific',
                description: 'Target specific client MAC addresses',
                target: 'CLIENT',
                successRate: 0.9
            },
            'DISASSOCIATION': {
                name: 'Disassociation',
                description: 'Send disassociation frames instead of deauth',
                target: 'BROADCAST',
                successRate: 0.7
            },
            'BEACON_FLOOD': {
                name: 'Beacon Flood',
                description: 'Flood area with fake APs to confuse clients',
                target: 'AREA',
                successRate: 0.6
            },
            'AUTH_FLOOD': {
                name: 'Authentication Flood',
                description: 'Flood AP with authentication requests',
                target: 'AP',
                successRate: 0.5
            },
            'PROBE_FLOOD': {
                name: 'Probe Request Flood',
                description: 'Flood with probe requests',
                target: 'CLIENT',
                successRate: 0.4
            }
        };
        
        this.packetRates = {
            'LOW': { pps: 10, stealth: 'HIGH' },
            'MEDIUM': { pps: 50, stealth: 'MEDIUM' },
            'HIGH': { pps: 100, stealth: 'LOW' },
            'FLOOD': { pps: 500, stealth: 'NONE' }
        };
        
        this.reasonCodes = {
            1: 'Unspecified reason',
            2: 'Previous authentication no longer valid',
            3: 'Deauthenticated because sending station is leaving',
            4: 'Disassociated due to inactivity',
            5: 'Disassociated because AP is unable to handle all currently associated stations',
            6: 'Class 2 frame received from nonauthenticated station',
            7: 'Class 3 frame received from nonassociated station',
            8: 'Disassociated because sending station is leaving',
            9: 'Station requesting association is not authenticated'
        };
    }
    
    async attack(target, options = {}) {
        const config = {
            mode: options.mode || 'BROADCAST',
            rate: options.rate || 'MEDIUM',
            duration: options.duration || 30000,
            clients: options.clients || [],
            reasonCode: options.reasonCode || 7,
            interface: options.interface || 'wlan0',
            channel: options.channel || target.channel || 1
        };
        
        const attackMode = this.attackModes[config.mode];
        
        const results = {
            target: {
                bssid: target.bssid,
                ssid: target.ssid || 'Unknown',
                channel: config.channel
            },
            config: config,
            mode: attackMode.name,
            startTime: new Date().toISOString(),
            packets: {
                total: 0,
                successful: 0,
                failed: 0
            },
            estimatedImpact: {
                disconnectedClients: 0,
                successRate: '0%'
            },
            status: 'INITIALIZING',
            log: [],
            duration: 0
        };
        
        console.log(`⚡ Starting ${attackMode.name} Attack:`);
        console.log(`   Target: ${target.ssid || target.bssid}`);
        console.log(`   BSSID: ${target.bssid}`);
        console.log(`   Channel: ${config.channel}`);
        console.log(`   Mode: ${config.mode}`);
        console.log(`   Duration: ${config.duration}ms`);
        console.log(`   Rate: ${config.rate} (${this.packetRates[config.rate].pps} pps)`);
        
        // Initialize attack
        results.status = 'RUNNING';
        
        const packetsPerSecond = this.packetRates[config.rate].pps;
        const totalPackets = Math.floor((config.duration / 1000) * packetsPerSecond);
        const packetInterval = 1000 / packetsPerSecond;
        
        const startTime = Date.now();
        const endTime = startTime + config.duration;
        
        let packetCount = 0;
        let successCount = 0;
        
        while (Date.now() < endTime && results.status === 'RUNNING') {
            try {
                // Generate and send packet
                const packet = this.generatePacket(target, config, packetCount);
                const success = await this.sendPacket(packet, config);
                
                results.packets.total++;
                packetCount++;
                
                if (success) {
                    results.packets.successful++;
                    successCount++;
                } else {
                    results.packets.failed++;
                }
                
                // Log every 10th packet
                if (packetCount % 10 === 0) {
                    results.log.push({
                        packet: packetCount,
                        type: packet.type,
                        target: packet.target,
                        success: success,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Update progress
                    const progress = (packetCount / totalPackets) * 100;
                    this.updateAttackProgress(progress, packetCount, totalPackets, successCount);
                }
                
                // Wait for next packet
                await this.sleep(packetInterval);
                
            } catch (error) {
                results.log.push({
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                results.packets.failed++;
                
                await this.sleep(100);
            }
        }
        
        // Calculate results
        results.status = 'COMPLETED';
        results.duration = Date.now() - startTime;
        results.endTime = new Date().toISOString();
        
        // Estimate impact
        const successRate = (results.packets.successful / results.packets.total) * 100;
        const estimatedDisconnects = Math.floor(results.packets.successful * attackMode.successRate);
        
        results.estimatedImpact = {
            disconnectedClients: estimatedDisconnects,
            successRate: `${successRate.toFixed(1)}%`,
            attackEffectiveness: successRate > 70 ? 'HIGH' : successRate > 40 ? 'MEDIUM' : 'LOW'
        };
        
        console.log(`✅ Attack Completed:`);
        console.log(`   Packets Sent: ${results.packets.total}`);
        console.log(`   Successful: ${results.packets.successful}`);
        console.log(`   Estimated Disconnects: ${estimatedDisconnects}`);
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        
        return results;
    }
    
    generatePacket(target, config, sequence) {
        const packetTypes = {
            'BROADCAST': this.generateDeauthPacket,
            'CLIENT_SPECIFIC': this.generateClientDeauthPacket,
            'DISASSOCIATION': this.generateDisassocPacket,
            'BEACON_FLOOD': this.generateBeaconPacket,
            'AUTH_FLOOD': this.generateAuthPacket,
            'PROBE_FLOOD': this.generateProbePacket
        };
        
        const generator = packetTypes[config.mode] || this.generateDeauthPacket;
        return generator.call(this, target, config, sequence);
    }
    
    generateDeauthPacket(target, config, sequence) {
        return {
            sequence: sequence + 1,
            type: 'DEAUTHENTICATION',
            destination: 'FF:FF:FF:FF:FF:FF', // Broadcast
            source: target.bssid,
            bssid: target.bssid,
            reason: config.reasonCode,
            reasonText: this.reasonCodes[config.reasonCode] || 'Unknown',
            channel: config.channel,
            size: 64 + Math.floor(Math.random() * 32),
            timestamp: new Date().toISOString(),
            flags: {
                toDS: 0,
                fromDS: 0,
                retry: 0,
                protected: 0
            }
        };
    }
    
    generateClientDeauthPacket(target, config, sequence) {
        const client = config.clients.length > 0 
            ? config.clients[Math.floor(Math.random() * config.clients.length)]
            : this.generateRandomMAC();
        
        return {
            sequence: sequence + 1,
            type: 'DEAUTHENTICATION',
            destination: client,
            source: target.bssid,
            bssid: target.bssid,
            reason: config.reasonCode,
            reasonText: this.reasonCodes[config.reasonCode] || 'Unknown',
            channel: config.channel,
            size: 64 + Math.floor(Math.random() * 32),
            timestamp: new Date().toISOString(),
            flags: {
                toDS: 1,
                fromDS: 0,
                retry: 0,
                protected: 0
            }
        };
    }
    
    generateDisassocPacket(target, config, sequence) {
        return {
            sequence: sequence + 1,
            type: 'DISASSOCIATION',
            destination: 'FF:FF:FF:FF:FF:FF',
            source: target.bssid,
            bssid: target.bssid,
            reason: 8, // Leaving
            reasonText: 'Disassociated because sending station is leaving',
            channel: config.channel,
            size: 60 + Math.floor(Math.random() * 28),
            timestamp: new Date().toISOString(),
            flags: {
                toDS: 0,
                fromDS: 0,
                retry: 0,
                protected: 0
            }
        };
    }
    
    generateBeaconPacket(target, config, sequence) {
        const fakeSSID = `Free_WiFi_${Math.floor(Math.random() * 1000)}`;
        const fakeBSSID = this.generateRandomMAC();
        
        return {
            sequence: sequence + 1,
            type: 'BEACON',
            destination: 'FF:FF:FF:FF:FF:FF',
            source: fakeBSSID,
            bssid: fakeBSSID,
            ssid: fakeSSID,
            channel: config.channel,
            size: 80 + Math.floor(Math.random() * 40),
            timestamp: new Date().toISOString(),
            interval: 100 + Math.floor(Math.random() * 50),
            capabilities: {
                privacy: Math.random() > 0.5,
                shortPreamble: Math.random() > 0.5,
                pbcc: 0,
                channelAgility: 0,
                spectrumMgmt: 0,
                qos: Math.random() > 0.5,
                shortSlotTime: Math.random() > 0.5,
                apsd: 0,
                radioMeasurement: 0,
                dsssOfdm: 0,
                delayedBlockAck: 0,
                immediateBlockAck: 0
            }
        };
    }
    
    generateAuthPacket(target, config, sequence) {
        const randomClient = this.generateRandomMAC();
        
        return {
            sequence: sequence + 1,
            type: 'AUTHENTICATION',
            destination: target.bssid,
            source: randomClient,
            bssid: target.bssid,
            algorithm: 0, // Open System
            sequence: 1,
            status: 0,
            channel: config.channel,
            size: 56 + Math.floor(Math.random() * 24),
            timestamp: new Date().toISOString()
        };
    }
    
    generateProbePacket(target, config, sequence) {
        const ssids = ['AndroidAP', 'iPhone', 'DIRECT-', 'HP-Print', 'MyDevice'];
        const randomSSID = ssids[Math.floor(Math.random() * ssids.length)];
        const randomClient = this.generateRandomMAC();
        
        return {
            sequence: sequence + 1,
            type: 'PROBE_REQUEST',
            destination: 'FF:FF:FF:FF:FF:FF',
            source: randomClient,
            bssid: 'FF:FF:FF:FF:FF:FF',
            ssid: randomSSID,
            channel: config.channel,
            size: 48 + Math.floor(Math.random() * 20),
            timestamp: new Date().toISOString(),
            rates: [1, 2, 5.5, 11, 6, 9, 12, 18, 24, 36, 48, 54]
        };
    }
    
    generateRandomMAC() {
        const hex = '0123456789ABCDEF';
        let mac = '';
        
        for (let i = 0; i < 6; i++) {
            if (i > 0) mac += ':';
            for (let j = 0; j < 2; j++) {
                mac += hex[Math.floor(Math.random() * 16)];
            }
        }
        
        return mac;
    }
    
    async sendPacket(packet, config) {
        // Simulate packet transmission with success probability
        const baseSuccessRate = this.attackModes[config.mode].successRate;
        const rateModifier = this.packetRates[config.rate].stealth === 'HIGH' ? 0.9 : 0.7;
        const successRate = baseSuccessRate * rateModifier;
        
        await this.sleep(Math.random() * 10); // Simulate processing time
        
        return Math.random() < successRate;
    }
    
    async continuousAttack(target, options = {}) {
        const config = {
            ...options,
            mode: options.mode || 'BROADCAST',
            rate: options.rate || 'MEDIUM',
            cycleDuration: options.cycleDuration || 30000,
            pauseDuration: options.pauseDuration || 10000
        };
        
        const results = {
            target: target,
            mode: 'CONTINUOUS',
            config: config,
            startTime: new Date().toISOString(),
            cycles: [],
            isRunning: true,
            totalPackets: 0,
            totalDisconnects: 0
        };
        
        console.log(`🌊 Starting Continuous Attack:`);
        console.log(`   Target: ${target.ssid || target.bssid}`);
        console.log(`   Cycle: ${config.cycleDuration}ms attack, ${config.pauseDuration}ms pause`);
        
        let cycleCount = 1;
        
        while (results.isRunning && cycleCount <= (options.maxCycles || 5)) {
            console.log(`\n🔄 Cycle ${cycleCount}:`);
            
            // Attack phase
            const attackResults = await this.attack(target, {
                ...config,
                duration: config.cycleDuration
            });
            
            results.cycles.push({
                cycle: cycleCount,
                ...attackResults
            });
            
            results.totalPackets += attackResults.packets.total;
            results.totalDisconnects += attackResults.estimatedImpact.disconnectedClients;
            
            // Pause phase (if not last cycle)
            if (cycleCount < (options.maxCycles || 5) && results.isRunning) {
                console.log(`⏸️ Pausing for ${config.pauseDuration}ms...`);
                await this.sleep(config.pauseDuration);
            }
            
            cycleCount++;
        }
        
        results.isRunning = false;
        results.endTime = new Date().toISOString();
        
        console.log(`\n✅ Continuous Attack Complete:`);
        console.log(`   Total Cycles: ${results.cycles.length}`);
        console.log(`   Total Packets: ${results.totalPackets}`);
        console.log(`   Estimated Total Disconnects: ${results.totalDisconnects}`);
        
        return results;
    }
    
    async channelHopAttack(target, channels = [1, 6, 11], hopInterval = 10000) {
        const results = {
            target: target,
            mode: 'CHANNEL_HOP',
            channels: channels,
            startTime: new Date().toISOString(),
            hops: [],
            isRunning: true
        };
        
        console.log(`📡 Starting Channel Hop Attack:`);
        console.log(`   Target: ${target.ssid || target.bssid}`);
        console.log(`   Channels: ${channels.join(', ')}`);
        console.log(`   Hop Interval: ${hopInterval}ms`);
        
        let hopCount = 1;
        
        while (results.isRunning && hopCount <= channels.length * 2) {
            const channel = channels[(hopCount - 1) % channels.length];
            
            console.log(`\n🔄 Hop ${hopCount} (Channel ${channel}):`);
            
            const attackResults = await this.attack(target, {
                mode: 'BROADCAST',
                rate: 'MEDIUM',
                duration: hopInterval,
                channel: channel
            });
            
            results.hops.push({
                hop: hopCount,
                channel: channel,
                ...attackResults
            });
            
            hopCount++;
        }
        
        results.isRunning = false;
        results.endTime = new Date().toISOString();
        
        // Calculate summary
        results.summary = {
            totalHops: results.hops.length,
            totalPackets: results.hops.reduce((sum, hop) => sum + hop.packets.total, 0),
            totalDisconnects: results.hops.reduce((sum, hop) => sum + hop.estimatedImpact.disconnectedClients, 0),
            mostEffectiveChannel: this.findMostEffectiveChannel(results.hops)
        };
        
        console.log(`\n✅ Channel Hop Complete:`);
        console.log(`   Total Hops: ${results.summary.totalHops}`);
        console.log(`   Most Effective Channel: ${results.summary.mostEffectiveChannel}`);
        
        return results;
    }
    
    findMostEffectiveChannel(hops) {
        if (hops.length === 0) return null;
        
        const channelEffectiveness = {};
        
        hops.forEach(hop => {
            const channel = hop.channel;
            const effectiveness = hop.estimatedImpact.disconnectedClients;
            
            if (!channelEffectiveness[channel]) {
                channelEffectiveness[channel] = {
                    total: 0,
                    count: 0
                };
            }
            
            channelEffectiveness[channel].total += effectiveness;
            channelEffectiveness[channel].count++;
        });
        
        // Find channel with highest average effectiveness
        let bestChannel = null;
        let bestAverage = -1;
        
        Object.entries(channelEffectiveness).forEach(([channel, data]) => {
            const average = data.total / data.count;
            if (average > bestAverage) {
                bestAverage = average;
                bestChannel = channel;
            }
        });
        
        return bestChannel;
    }
    
    stopAttack() {
        console.log('🛑 Stopping WiFi attack');
        return {
            stopped: true,
            timestamp: new Date().toISOString(),
            message: 'Attack sequence terminated'
        };
    }
    
    updateAttackProgress(progress, current, total, successes) {
        const successRate = total > 0 ? (successes / current * 100).toFixed(1) : 0;
        
        console.log(`⚡ Attack Progress: ${progress.toFixed(1)}% | Packets: ${current}/${total} | Success: ${successRate}%`);
        
        if (typeof window !== 'undefined' && window.updateDeauthProgress) {
            window.updateDeauthProgress({
                progress: progress,
                current: current,
                total: total,
                successes: successes,
                successRate: successRate
            });
        }
    }
    
    generateAttackReport(results) {
        const report = {
            generated: new Date().toISOString(),
            summary: {
                attackType: results.mode,
                target: results.target.ssid || results.target.bssid,
                duration: results.duration,
                totalPackets: results.packets.total,
                successRate: results.estimatedImpact.successRate,
                estimatedDisconnects: results.estimatedImpact.disconnectedClients,
                effectiveness: results.estimatedImpact.attackEffectiv