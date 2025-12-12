// Simple CORS proxy untuk API yang tidak support CORS
const PROXY_CONFIG = {
  allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
  rateLimit: 100 // requests per IP per hour
};

async function proxyRequest(targetUrl, requestOptions) {
  // Validasi origin
  const origin = requestOptions.headers?.origin;
  if (!PROXY_CONFIG.allowedOrigins.includes(origin)) {
    throw new Error('Origin not allowed');
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: requestOptions.method || 'GET',
      headers: {
        ...requestOptions.headers,
        'User-Agent': 'HOOPSTEAM-ULTIMATE/1.0'
      },
      body: requestOptions.body
    });
    
    const data = await response.text();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: data
    };
    
  } catch (error) {
    console.error('Proxy error:', error);
    throw error;
  }
}

// Contoh endpoint proxy
/*
app.use('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter required' });
  }
  
  try {
    const result = await proxyRequest(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    
    res.status(result.status).set(result.headers).send(result.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

export { proxyRequest };