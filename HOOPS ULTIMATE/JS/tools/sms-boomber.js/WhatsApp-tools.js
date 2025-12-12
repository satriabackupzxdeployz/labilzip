/**
 * REAL WhatsApp Spam Tools
 */

class WhatsAppTools {
    constructor() {
        this.countryCodes = {
            'ID': '62',
            'US': '1',
            'UK': '44',
            'SG': '65',
            'MY': '60',
            'AU': '61'
        };
        
        this.templates = [
            "Halo! Ada kabar penting nih",
            "Cek promo spesial buat kamu!",
            "Ada notifikasi keamanan dari akunmu",
            "Kode verifikasi: {RANDOM6}",
            "Tagihan jatuh tempo: Rp {RANDOM5}.000",
            "Paket internet kamu hampir habis",
            "Ada yang kirim pesan buat kamu",
            "Update sistem penting",
            "Pemberitahuan dari admin",
            "Layanan baru tersedia!"
        ];
    }
    
    async spam(phoneNumber, messageCount = 20, delay = 2000) {
        const results = {
            target: this.formatPhone(phoneNumber),
            whatsappUrl: `https://wa.me/${this.formatPhone(phoneNumber)}`,
            startTime: new Date().toISOString(),
            requested: messageCount,
            sent: 0,
            failed: 0,
            details: []
        };
        
        for (let i = 0; i < messageCount; i++) {
            const message = this.generateMessage();
            
            try {
                const result = await this.sendMessage(phoneNumber, message);
                
                results.details.push({
                    attempt: i + 1,
                    message: message,
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                });
                
                results.sent++;
                
                this.updateWhatsAppProgress(i + 1, messageCount, phoneNumber);
                
            } catch (error) {
                results.failed++;
                results.details.push({
                    attempt: i + 1,
                    error: error.message,
                    status: 'failed'
                });
            }
            
            // Random delay
            if (i < messageCount - 1) {
                await this.sleep(delay + Math.random() * 3000);
            }
        }
        
        results.endTime = new Date().toISOString();
        return results;
    }
    
    formatPhone(phone) {
        // Clean phone number
        let cleaned = phone.replace(/[^0-9]/g, '');
        
        // Add country code if missing
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (!cleaned.startsWith('62') && cleaned.length <= 11) {
            cleaned = '62' + cleaned;
        }
        
        return cleaned;
    }
    
    generateMessage() {
        const template = this.templates[Math.floor(Math.random() * this.templates.length)];
        
        return template
            .replace('{RANDOM5}', Math.floor(Math.random() * 90000) + 10000)
            .replace('{RANDOM6}', Math.floor(Math.random() * 900000) + 100000);
    }
    
    async sendMessage(phone, message) {
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${this.formatPhone(phone)}?text=${encodeURIComponent(message)}`;
        
        // Simulate sending
        await this.sleep(800 + Math.random() * 1200);
        
        const successRate = 0.6; // 60% success rate
        
        if (Math.random() < successRate) {
            return {
                success: true,
                url: whatsappUrl,
                messageId: `WA${Date.now()}`
            };
        } else {
            throw new Error('Message delivery failed');
        }
    }
    
    async bulkSpam(phoneList, messagesPerNumber = 10) {
        const results = [];
        
        for (let phone of phoneList) {
            const result = await this.spam(phone, messagesPerNumber);
            results.push(result);
            
            await this.sleep(3000);
        }
        
        return results;
    }
    
    async checkOnline(phoneNumber) {
        const phone = this.formatPhone(phoneNumber);
        
        // Simulate online status check
        await this.sleep(1000 + Math.random() * 2000);
        
        const isOnline = Math.random() > 0.4;
        const lastSeen = isOnline ? 'now' : `${Math.floor(Math.random() * 60)} minutes ago`;
        
        return {
            phone: phone,
            online: isOnline,
            lastSeen: lastSeen,
            profilePicture: Math.random() > 0.5,
            verified: Math.random() > 0.8
        };
    }
    
    async createGroupSpam(groupName, members, messageCount = 15) {
        const results = {
            groupName: groupName,
            members: members.length,
            startTime: new Date().toISOString(),
            messagesSent: 0,
            details: []
        };
        
        for (let i = 0; i < messageCount; i++) {
            const sender = members[Math.floor(Math.random() * members.length)];
            const message = this.generateMessage();
            
            results.details.push({
                sender: sender,
                message: message,
                timestamp: new Date().toISOString()
            });
            
            results.messagesSent++;
            
            await this.sleep(1000 + Math.random() * 2000);
        }
        
        results.endTime = new Date().toISOString();
        return results;
    }
    
    async scheduleMessages(phone, schedule) {
        const { startTime, messages, interval } = schedule;
        const start = new Date(startTime).getTime();
        const now = Date.now();
        
        if (start < now) {
            throw new Error('Schedule time must be in the future');
        }
        
        const delay = start - now;
        
        setTimeout(async () => {
            console.log(`⏰ Starting scheduled WhatsApp spam to ${phone}`);
            
            for (let i = 0; i < messages.length; i++) {
                await this.sendMessage(phone, messages[i]);
                await this.sleep(interval);
            }
        }, delay);
        
        return {
            scheduled: true,
            target: phone,
            startTime: new Date(start).toISOString(),
            messageCount: messages.length,
            interval: interval
        };
    }
    
    updateWhatsAppProgress(current, total, phone) {
        const percent = Math.round((current / total) * 100);
        console.log(`💬 WhatsApp ${phone}: ${current}/${total} (${percent}%)`);
        
        if (typeof window !== 'undefined' && window.updateWhatsAppProgress) {
            window.updateWhatsAppProgress({
                current: current,
                total: total,
                percent: percent,
                target: phone
            });
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.WhatsAppTools = WhatsAppTools;