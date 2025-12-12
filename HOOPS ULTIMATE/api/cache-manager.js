// Cache manager untuk API responses
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 3600000; // 1 hour in milliseconds
  }
  
  set(key, data, ttl = this.ttl) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
    
    // Auto cleanup
    setTimeout(() => {
      if (this.cache.has(key) && this.cache.get(key).expiry <= Date.now()) {
        this.cache.delete(key);
      }
    }, ttl);
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expiry <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  // Cache untuk API calls
  async cachedApiCall(apiCall, key, ttl = 300000) { // 5 minutes default
    const cached = this.get(key);
    if (cached) {
      console.log(`Cache hit for: ${key}`);
      return cached;
    }
    
    console.log(`Cache miss for: ${key}`);
    const result = await apiCall();
    this.set(key, result, ttl);
    return result;
  }
}

// Instance global
const apiCache = new CacheManager();

export default apiCache;