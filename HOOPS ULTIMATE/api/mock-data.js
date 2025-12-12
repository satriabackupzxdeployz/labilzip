// Data simulasi untuk semua tools
const MOCK_DATABASES = {
  MYSQL: {
    host: 'localhost',
    port: 3306,
    databases: [
      { name: 'wordpress_db', tables: 15, size: '45MB' },
      { name: 'user_management', tables: 8, size: '12MB' },
      { name: 'ecommerce_data', tables: 22, size: '120MB' }
    ]
  },
  POSTGRESQL: {
    host: 'localhost',
    port: 5432,
    databases: [
      { name: 'analytics_db', tables: 30, size: '250MB' }
    ]
  }
};

const MOCK_DOCUMENTS = {
  KTP: {
    nik: '3273010101010001',
    nama: 'JOHN DOE',
    ttl: 'JAKARTA, 01-01-1990',
    alamat: 'JL. MERDEKA NO. 123'
  },
  SIM: {
    no_sim: '123456789012',
    nama: 'JANE SMITH',
    berlaku: '2020-2025'
  }
};

const MOCK_SCAN_RESULTS = {
  PORTS: [
    { port: 22, service: 'ssh', status: 'open' },
    { port: 80, service: 'http', status: 'open' },
    { port: 443, service: 'https', status: 'open' },
    { port: 3306, service: 'mysql', status: 'open' }
  ],
  VULNERABILITIES: [
    { id: 'CVE-2021-1234', severity: 'high', description: 'SQL Injection' },
    { id: 'CVE-2020-5678', severity: 'medium', description: 'XSS' }
  ]
};

// Generator data acak
function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateRandomDomain() {
  const domains = ['example.com', 'test.org', 'demo.net', 'sample.co.id'];
  return domains[Math.floor(Math.random() * domains.length)];
}

// Fungsi untuk mendapatkan mock data berdasarkan endpoint
async function getMockData(endpointConfig, params) {
  const { url } = endpointConfig;
  
  // Simulasi delay network
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // WHOIS Lookup
  if (url.includes('whois')) {
    return {
      WhoisRecord: {
        domainName: params.domainName || generateRandomDomain(),
        createdDate: '2010-01-01T00:00:00Z',
        updatedDate: '2023-12-01T00:00:00Z',
        expiresDate: '2030-01-01T00:00:00Z',
        registrarName: 'Example Registrar',
        contactEmail: 'admin@example.com'
      }
    };
  }
  
  // Email Verification
  if (url.includes('email-verifier')) {
    return {
      data: {
        result: 'deliverable',
        score: 85,
        regexp: true,
        gibberish: false,
        disposable: false,
        webmail: params.email.includes('gmail') || params.email.includes('yahoo')
      }
    };
  }
  
  // Phone Lookup
  if (url.includes('validate')) {
    return {
      valid: Math.random() > 0.3,
      country: 'Indonesia',
      location: 'Jakarta',
      carrier: 'Telkomsel',
      line_type: 'mobile'
    };
  }
  
  // VirusTotal
  if (url.includes('virustotal')) {
    return {
      data: {
        attributes: {
          last_analysis_stats: {
            malicious: Math.floor(Math.random() * 5),
            suspicious: 0,
            undetected: 65 - Math.floor(Math.random() * 5),
            harmless: 60
          }
        }
      }
    };
  }
  
  // Default response
  return {
    success: true,
    message: 'Mock data generated',
    timestamp: new Date().toISOString(),
    params: params
  };
}

export { MOCK_DATABASES, MOCK_DOCUMENTS, MOCK_SCAN_RESULTS, getMockData };