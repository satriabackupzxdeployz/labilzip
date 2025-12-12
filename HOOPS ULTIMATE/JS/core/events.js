// ===== EVENT SYSTEM =====
class EventSystem {
    constructor() {
        this.events = new Map();
    }
    
    // Subscribe to event
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
        
        hoopsteamLogger.debug(`Event: Subscribed to ${eventName}`);
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }
    
    // Unsubscribe from event
    off(eventName, callback) {
        if (!this.events.has(eventName)) return;
        
        const callbacks = this.events.get(eventName);
        const index = callbacks.indexOf(callback);
        
        if (index > -1) {
            callbacks.splice(index, 1);
            hoopsteamLogger.debug(`Event: Unsubscribed from ${eventName}`);
        }
    }
    
    // Emit event
    emit(eventName, data = {}) {
        if (!this.events.has(eventName)) return;
        
        const callbacks = this.events.get(eventName);
        const event = {
            name: eventName,
            timestamp: Date.now(),
            data: data
        };
        
        hoopsteamLogger.debug(`Event: Emitting ${eventName}`, data);
        
        // Call all callbacks
        callbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                hoopsteamLogger.error(`Event: Callback error for ${eventName}`, error);
            }
        });
    }
    
    // One-time event listener
    once(eventName, callback) {
        const onceCallback = (event) => {
            callback(event);
            this.off(eventName, onceCallback);
        };
        this.on(eventName, onceCallback);
    }
    
    // Remove all listeners for event
    removeAll(eventName) {
        this.events.delete(eventName);
        hoopsteamLogger.debug(`Event: Removed all listeners for ${eventName}`);
    }
    
    // Get listener count
    listenerCount(eventName) {
        return this.events.has(eventName) ? this.events.get(eventName).length : 0;
    }
    
    // List all events
    listEvents() {
        return Array.from(this.events.keys());
    }
}

// Global event system
const hoopsteamEvents = new EventSystem();

// Pre-defined events
const HOOPSTEAM_EVENTS = {
    AUTH: {
        LOGIN: 'auth:login',
        LOGOUT: 'auth:logout',
        REGISTER: 'auth:register'
    },
    TOOLS: {
        START: 'tool:start',
        COMPLETE: 'tool:complete',
        ERROR: 'tool:error',
        PROGRESS: 'tool:progress'
    },
    UI: {
        NOTIFICATION: 'ui:notification',
        MODAL: 'ui:modal',
        LOADING: 'ui:loading'
    },
    SYSTEM: {
        ERROR: 'system:error',
        WARNING: 'system:warning',
        INFO: 'system:info'
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hoopsteamEvents, HOOPSTEAM_EVENTS };
}