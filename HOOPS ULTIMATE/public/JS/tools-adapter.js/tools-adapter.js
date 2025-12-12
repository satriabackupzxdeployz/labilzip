// Adapter untuk tools yang sudah ada
class ToolsAdapter {
    static async execute(toolName, params) {
        switch(toolName) {
            case 'dns-lookup':
                return await serverAPI.dnsLookup(params.domain);
            
            case 'email-verifier':
                return await serverAPI.verifyEmail(params.email);
            
            case 'ip-geolocation':
                return await serverAPI.getIPInfo(params.ip);
            
            case 'reverse-ip':
                return await serverAPI.request(`/reverseip/${params.ip}`);
            
            default:
                // Untuk tools custom, run via server
                return await serverAPI.runTool(
                    `/tools/${toolName}.js`,
                    params.args
                );
        }
    }
}