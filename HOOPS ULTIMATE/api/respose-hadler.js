// Handler untuk memproses respons API
class APIResponseHandler {
  static success(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
  
  static error(error, message = 'Error occurred') {
    return {
      success: false,
      message,
      error: error.message || error,
      timestamp: new Date().toISOString()
    };
  }
  
  // Handler khusus untuk tools
  static handleToolResponse(toolName, rawResponse) {
    const handlers = {
      'whois-lookup': this.handleWhoisResponse,
      'email-checker': this.handleEmailResponse,
      'port-scanner': this.handlePortScanResponse,
      'hash-cracker': this.handleHashResponse,
      'document-generator': this.handleDocumentResponse
    };
    
    const handler = handlers[toolName] || this.defaultHandler;
    return handler(rawResponse);
  }
  
  static handleWhoisResponse(data) {
    if (data.WhoisRecord) {
      return this.success({
        domain: data.WhoisRecord.domainName,
        created: data.WhoisRecord.createdDate,
        expires: data.WhoisRecord.expiresDate,
        registrar: data.WhoisRecord.registrarName,
        raw: data
      }, 'WHOIS lookup completed');
    }
    return this.error('Invalid WHOIS response');
  }
  
  static handleEmailResponse(data) {
    return this.success({
      valid: data.data?.result === 'deliverable',
      score: data.data?.score || 0,
      details: data.data,
      raw: data
    }, 'Email verification completed');
  }
  
  static handlePortScanResponse(data) {
    return this.success({
      ports: data.ports || [],
      host: data.host,
      totalOpen: data.ports?.filter(p => p.status === 'open').length || 0,
      raw: data
    }, 'Port scan completed');
  }
  
  static defaultHandler(data) {
    return this.success(data, 'Operation completed');
  }
}

export default APIResponseHandler;