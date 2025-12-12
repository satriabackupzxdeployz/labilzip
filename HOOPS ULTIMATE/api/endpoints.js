// Konfigurasi semua endpoint API
const API_ENDPOINTS = {
  // OSINT & Lookup APIs (Gratis)
  IP_GEOLOCATION: {
    url: 'https://ipapi.co/{ip}/json/',
    method: 'GET',
    free: true,
    rateLimit: 1000 // requests per day
  },
  
  WHOIS_LOOKUP: {
    url: 'https://www.whoisxmlapi.com/whoisserver/WhoisService',
    params: {
      apiKey: 'free_api_key', // Ganti dengan key gratis
      domainName: '{domain}',
      outputFormat: 'JSON'
    },
    free: true
  },
  
  EMAIL_VERIFICATION: {
    url: 'https://api.hunter.io/v2/email-verifier',
    params: {
      api_key: 'free_key', // Hunter.io free tier
      email: '{email}'
    },
    free: true,
    limit: 50 // requests per month
  },
  
  PHONE_LOOKUP: {
    url: 'https://numvalidate.com/api/validate',
    params: {
      number: '{phone}'
    },
    free: true
  },
  
  // Security APIs
  VIRUSTOTAL: {
    url: 'https://www.virustotal.com/api/v3/urls',
    headers: {
      'x-apikey': 'free_key' // Daftar di VT untuk free tier
    },
    free: true,
    limit: 500 // per day
  },
  
  SSL_CHECKER: {
    url: 'https://api.ssllabs.com/api/v3/analyze',
    params: {
      host: '{host}'
    },
    free: true
  },
  
  // Hashing APIs (Local)
  HASH_LOOKUP: {
    url: 'https://hashes.com/en/api', // API gratis
    method: 'POST',
    free: true
  },
  
  // Document Generation (Local)
  DOCUMENT_TEMPLATES: {
    ktp: '/templates/documents/ktp-template.html',
    sim: '/templates/documents/sim-template.html',
    passport: '/templates/documents/passport-template.html'
  },
  
  // Mock APIs untuk tools yang butuh simulasi
  MOCK_SCAN: {
    url: '/api/mock/scan',
    method: 'POST',
    mock: true
  },
  
  MOCK_EXPLOIT: {
    url: '/api/mock/exploit',
    method: 'POST',
    mock: true
  }
};

// Fungsi untuk mendapatkan endpoint berdasarkan tool
function getEndpoint(toolName, params = {}) {
  const endpoints = {
    // Mapping tool ke endpoint
    'whois-lookup': API_ENDPOINTS.WHOIS_LOOKUP,
    'email-checker': API_ENDPOINTS.EMAIL_VERIFICATION,
    'phone-lookup': API_ENDPOINTS.PHONE_LOOKUP,
    'ssl-checker': API_ENDPOINTS.SSL_CHECKER,
    'ip-geolocation': API_ENDPOINTS.IP_GEOLOCATION,
    'hash-cracker': API_ENDPOINTS.HASH_LOOKUP,
    'vt-scan': API_ENDPOINTS.VIRUSTOTAL,
    'document-generate': API_ENDPOINTS.DOCUMENT_TEMPLATES
  };
  
  const endpoint = endpoints[toolName];
  if (!endpoint) return null;
  
  // Replace URL parameters
  let url = endpoint.url;
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, encodeURIComponent(params[key]));
  });
  
  return { ...endpoint, url };
}

// API Caller dengan fallback ke mock data
async function callAPI(endpointConfig, userParams = {}) {
  try {
    const { url, method = 'GET', headers = {}, params = {}, mock = false } = endpointConfig;
    
    // Jika mock, kembalikan data simulasi
    if (mock) {
      return await getMockData(endpointConfig, userParams);
    }
    
    // Build query string untuk GET
    const queryParams = new URLSearchParams({
      ...params,
      ...userParams
    }).toString();
    
    const fullUrl = method === 'GET' ? `${url}?${queryParams}` : url;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (method === 'POST') {
      options.body = JSON.stringify(userParams);
    }
    
    const response = await fetch(fullUrl, options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.warn('API call failed, using mock data:', error.message);
    // Fallback ke mock data
    return await getMockData(endpointConfig, userParams);
  }
}

export { API_ENDPOINTS, getEndpoint, callAPI };