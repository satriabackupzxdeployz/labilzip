// ===== DOCUMENT FORGER - MAIN =====
class DocumentForger {
    constructor() {
        this.name = "Document Forger";
        this.version = "1.0";
        this.description = "Generate realistic looking documents for testing purposes";
        this.generatedDocuments = [];
        this.currentDocument = null;
        
        this.templates = {
            ktp: {
                name: "KTP (Indonesia)",
                fields: ['nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'alamat', 'rt_rw', 'kel_desa', 'kecamatan', 'agama', 'status_perkawinan', 'pekerjaan', 'kewarganegaraan', 'berlaku_hingga', 'foto'],
                required: ['nik', 'nama', 'tempat_lahir', 'tanggal_lahir']
            },
            sim: {
                name: "SIM (Driver License)",
                fields: ['nomor_sim', 'nama', 'tempat_lahir', 'tanggal_lahir', 'alamat', 'tinggi', 'berat', 'golongan_darah', 'jenis_sim', 'masa_berlaku', 'foto'],
                required: ['nomor_sim', 'nama', 'jenis_sim']
            },
            passport: {
                name: "Passport",
                fields: ['nomor_paspor', 'nama', 'kewarganegaraan', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'tanggal_terbit', 'tanggal_habis', 'kantor_penerbit', 'foto'],
                required: ['nomor_paspor', 'nama', 'kewarganegaraan']
            },
            diploma: {
                name: "Diploma / Certificate",
                fields: ['nomor_ijazah', 'nama', 'institusi', 'program_studi', 'tanggal_lulus', 'ipk', 'gelar', 'tanggal_terbit', 'foto'],
                required: ['nomor_ijazah', 'nama', 'institusi']
            },
            stnk: {
                name: "STNK (Vehicle Registration)",
                fields: ['nomor_registrasi', 'nama_pemilik', 'alamat', 'merk_kendaraan', 'tipe', 'tahun_pembuatan', 'warna', 'nomor_rangka', 'nomor_mesin', 'berlaku_hingga'],
                required: ['nomor_registrasi', 'nama_pemilik', 'merk_kendaraan']
            },
            bpkb: {
                name: "BPKB (Vehicle Ownership)",
                fields: ['nomor_bpkb', 'nama_pemilik', 'alamat', 'merk_kendaraan', 'tipe', 'tahun_pembuatan', 'warna', 'nomor_rangka', 'nomor_mesin', 'tanggal_terbit'],
                required: ['nomor_bpkb', 'nama_pemilik', 'merk_kendaraan']
            }
        };
        
        this.init();
    }
    
    init() {
        hoopsteamLogger.info(`Tool initialized: ${this.name} v${this.version}`);
        this.loadDocuments();
    }
    
    // Generate document
    generateDocument(type, data, options = {}) {
        const template = this.templates[type];
        if (!template) {
            throw new Error(`Template ${type} not found`);
        }
        
        // Validate required fields
        for (const field of template.required) {
            if (!data[field]) {
                throw new Error(`Required field missing: ${field}`);
            }
        }
        
        // Generate missing fields with realistic data
        const completeData = this.generateRealisticData(type, data);
        
        // Create document
        const document = {
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: type,
            template: template.name,
            data: completeData,
            timestamp: new Date().toISOString(),
            options: options,
            metadata: {
                generatedBy: 'HOOPSTEAM Document Forger',
                version: this.version,
                realism: options.realism || 'medium'
            }
        };
        
        // Generate preview HTML
        document.preview = this.generatePreview(type, completeData);
        
        // Generate download content
        document.download = this.generateDownloadContent(type, completeData, options.format || 'html');
        
        // Add to history
        this.generatedDocuments.unshift(document);
        this.currentDocument = document;
        
        // Save
        if (options.save !== false) {
            this.saveDocuments();
        }
        
        hoopsteamLogger.success(`Document generated: ${type}`, { id: document.id });
        
        hoopsteamEvents.emit('tool:complete', {
            tool: 'document-forger',
            action: 'generate',
            document: document
        });
        
        return document;
    }
    
    // Generate realistic data for missing fields
    generateRealisticData(type, inputData) {
        const data = { ...inputData };
        const template = this.templates[type];
        
        // Generate NIK if missing (for KTP)
        if (type === 'ktp' && !data.nik) {
            data.nik = this.generateNIK(data.tempat_lahir, data.tanggal_lahir);
        }
        
        // Generate document numbers
        if (!data.nomor_sim && type === 'sim') {
            data.nomor_sim = this.generateSIMNumber();
        }
        
        if (!data.nomor_paspor && type === 'passport') {
            data.nomor_paspor = this.generatePassportNumber();
        }
        
        // Generate dates if missing
        if (!data.tanggal_lahir && (type === 'ktp' || type === 'sim' || type === 'passport')) {
            data.tanggal_lahir = this.generateBirthDate();
        }
        
        if (!data.tempat_lahir) {
            data.tempat_lahir = this.generateBirthPlace();
        }
        
        // Generate names if missing
        if (!data.nama) {
            data.nama = this.generateName();
        }
        
        // Generate address if missing
        if (!data.alamat) {
            data.alamat = this.generateAddress();
        }
        
        // Fill other common fields
        if (!data.jenis_kelamin) {
            data.jenis_kelamin = Math.random() > 0.5 ? 'LAKI-LAKI' : 'PEREMPUAN';
        }
        
        if (!data.agama && type === 'ktp') {
            const religions = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KHONGHUCU'];
            data.agama = religions[Math.floor(Math.random() * religions.length)];
        }
        
        if (!data.status_perkawinan && type === 'ktp') {
            const status = ['BELUM KAWIN', 'KAWIN', 'CERAI HIDUP', 'CERAI MATI'];
            data.status_perkawinan = status[Math.floor(Math.random() * status.length)];
        }
        
        if (!data.pekerjaan && type === 'ktp') {
            const jobs = ['PELAJAR/MAHASISWA', 'PEGAWAI SWASTA', 'PEGAWAI NEGERI', 'WIRAUSAHA', 'BURUH', 'TIDAK BEKERJA'];
            data.pekerjaan = jobs[Math.floor(Math.random() * jobs.length)];
        }
        
        // Generate photo placeholder
        if (!data.foto) {
            data.foto = this.generatePhotoPlaceholder(data.nama, data.jenis_kelamin);
        }
        
        // Add validity dates
        if (!data.berlaku_hingga && (type === 'ktp' || type === 'sim' || type === 'passport')) {
            const issued = new Date();
            const expires = new Date(issued);
            expires.setFullYear(expires.getFullYear() + (type === 'passport' ? 5 : type === 'sim' ? 5 : 10));
            data.tanggal_terbit = issued.toISOString().split('T')[0];
            data.berlaku_hingga = expires.toISOString().split('T')[0];
        }
        
        return data;
    }
    
    // Generate NIK (Indonesian ID number)
    generateNIK(birthPlace, birthDate) {
        // Format: PPCCDDMMYYXXXX
        let nik = '';
        
        // Province code (random)
        const provinces = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '31', '32', '33', '34', '35', '36', '51', '52', '53', '61', '62', '63', '64', '65', '71', '72', '73', '74', '75', '76', '81', '82', '91', '92', '93', '94'];
        nik += provinces[Math.floor(Math.random() * provinces.length)];
        
        // City/regency code (random)
        nik += Math.floor(Math.random() * 90 + 10).toString();
        
        // Birth date: DDMMYY
        if (birthDate) {
            const date = new Date(birthDate);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(-2);
            nik += day + month + year;
        } else {
            // Random date
            const day = Math.floor(Math.random() * 28 + 1).toString().padStart(2, '0');
            const month = Math.floor(Math.random() * 12 + 1).toString().padStart(2, '0');
            const year = Math.floor(Math.random() * 40 + 60).toString(); // 1960-2000
            nik += day + month + year;
        }
        
        // Serial number (4 digits)
        nik += Math.floor(Math.random() * 9000 + 1000).toString();
        
        return nik;
    }
    
    // Generate SIM number
    generateSIMNumber() {
        // Format: XXXXXXXXXXXXXX
        return Array.from({length: 14}, () => Math.floor(Math.random() * 10)).join('');
    }
    
    // Generate Passport number
    generatePassportNumber() {
        // Format: XX123456
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const prefix = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)];
        const numbers = Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join('');
        return prefix + numbers;
    }
    
    // Generate birth date
    generateBirthDate() {
        const start = new Date(1960, 0, 1);
        const end = new Date(2005, 11, 31);
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString().split('T')[0];
    }
    
    // Generate birth place
    generateBirthPlace() {
        const cities = [
            'JAKARTA', 'SURABAYA', 'BANDUNG', 'MEDAN', 'SEMARANG', 'MAKASSAR', 
            'PALEMBANG', 'BALIKPAPAN', 'BANJARMASIN', 'YOGYAKARTA', 'MALANG',
            'DENPASAR', 'MATARAM', 'KUPANG', 'JAYAPURA', 'AMBON', 'TERNATE'
        ];
        return cities[Math.floor(Math.random() * cities.length)];
    }
    
    // Generate name
    generateName() {
        const firstNames = ['ADI', 'BUDI', 'CITRA', 'DWI', 'ERIK', 'FIRA', 'GITA', 'HADI', 'IRMA', 'JOKO', 'KARTIKA', 'LINA', 'MEGA', 'NINA', 'OPIK', 'PUTRI', 'RANI', 'SARI', 'TITO', 'UMI'];
        const lastNames = ['SANTOSO', 'WIBOWO', 'KUSUMA', 'PRATAMA', 'SARI', 'WIDODO', 'SUSANTO', 'HADI', 'NUGROHO', 'RAHARJO', 'PURNOMO', 'SETIAWAN', 'HIDAYAT', 'SAKTI', 'MAHARDIKA'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }
    
    // Generate address
    generateAddress() {
        const streets = ['JL. MERDEKA', 'JL. SUDIRMAN', 'JL. THAMRIN', 'JL. GAJAH MADA', 'JL. HAYAM WURUK', 'JL. PEMUDA', 'JL. AHMAD YANI', 'JL. DIPONEGORO'];
        const numbers = ['NO. 12', 'NO. 24', 'NO. 36', 'NO. 48', 'NO. 56', 'NO. 72'];
        const rts = ['001', '002', '003', '004', '005'];
        const rws = ['001', '002', '003'];
        
        const street = streets[Math.floor(Math.random() * streets.length)];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        const rt = rts[Math.floor(Math.random() * rts.length)];
        const rw = rws[Math.floor(Math.random() * rws.length)];
        
        return `${street} ${number}, RT ${rt}/RW ${rw}`;
    }
    
    // Generate photo placeholder (base64)
    generatePhotoPlaceholder(name, gender) {
        // Create a simple SVG placeholder
        const svg = `
            <svg width="200" height="250" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="250" fill="#f0f0f0"/>
                <circle cx="100" cy="80" r="50" fill="${gender === 'PEREMPUAN' ? '#ffb6c1' : '#87ceeb'}"/>
                <text x="100" y="160" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">${name.split(' ')[0]}</text>
                <text x="100" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">PHOTO</text>
                <rect x="50" y="190" width="100" height="40" rx="5" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
                <text x="100" y="215" text-anchor="middle" font-family="Arial" font-size="10" fill="white">HOOPSTEAM</text>
            </svg>
        `;
        
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }
    
    // Generate preview HTML
    generatePreview(type, data) {
        switch(type) {
            case 'ktp':
                return this.generateKTPPreview(data);
            case 'sim':
                return this.generateSIMPreview(data);
            case 'passport':
                return this.generatePassportPreview(data);
            case 'diploma':
                return this.generateDiplomaPreview(data);
            default:
                return this.generateGenericPreview(type, data);
        }
    }
    
    // Generate KTP preview
    generateKTPPreview(data) {
        return `
        <div class="ktp-preview" style="
            width: 330px;
            height: 210px;
            background: linear-gradient(135deg, #e6f2ff, #cce6ff);
            border: 2px solid #4d94ff;
            border-radius: 10px;
            padding: 15px;
            font-family: 'Arial', sans-serif;
            color: #333;
            position: relative;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div>
                    <div style="font-size: 12px; color: #666;">PROVINSI</div>
                    <div style="font-weight: bold; font-size: 14px;">JAWA BARAT</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #666;">KOTA</div>
                    <div style="font-weight: bold; font-size: 14px;">BANDUNG</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #666;">NIK</div>
                    <div style="font-weight: bold; font-size: 14px; letter-spacing: 1px;">${data.nik || ''}</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1;">
                    <div style="margin-bottom: 5px;">
                        <span style="font-size: 11px; color: #666;">Nama</span><br>
                        <span style="font-weight: bold; font-size: 14px;">${data.nama || ''}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <span style="font-size: 11px; color: #666;">Tempat/Tgl Lahir</span><br>
                        <span style="font-size: 13px;">${data.tempat_lahir || ''}, ${data.tanggal_lahir ? new Date(data.tanggal_lahir).toLocaleDateString('id-ID') : ''}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <span style="font-size: 11px; color: #666;">Jenis Kelamin</span><br>
                        <span style="font-size: 13px;">${data.jenis_kelamin || ''}</span>
                        <span style="margin-left: 20px; font-size: 11px; color: #666;">Gol. Darah</span>
                        <span style="font-size: 13px;">${data.golongan_darah || '-'}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <span style="font-size: 11px; color: #666;">Alamat</span><br>
                        <span style="font-size: 12px;">${data.alamat || ''}</span>
                    </div>
                </div>
                
                <div style="width: 80px;">
                    <img src="${data.foto || ''}" alt="Foto" style="width: 80px; height: 100px; border: 1px solid #ccc; background: #f0f0f0;" />
                    <div style="text-align: center; margin-top: 5px; font-size: 9px; color: #666;">FOTO</div>
                </div>
            </div>
            
            <div style="position: absolute; bottom: 10px; right: 15px; font-size: 10px; color: #666;">
                HOOPSTEAM GENERATED
            </div>
        </div>
        `;
    }
    
    // Generate download content
    generateDownloadContent(type, data, format = 'html') {
        const content = {
            type: type,
            data: data,
            generated: new Date().toISOString(),
            tool: 'HOOPSTEAM Document Forger v' + this.version
        };
        
        switch(format) {
            case 'json':
                return JSON.stringify(content, null, 2);
            case 'html':
                return this.generateDownloadHTML(type, data);
            case 'pdf':
                // In real implementation, this would generate PDF
                return this.generateDownloadHTML(type, data);
            case 'image':
                // In real implementation, this would generate image
                return this.generateDownloadHTML(type, data);
            default:
                return JSON.stringify(content, null, 2);
        }
    }
    
    // Generate download HTML
    generateDownloadHTML(type, data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${this.templates[type].name} - HOOPSTEAM Generated</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .document { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
                .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .data-table td { padding: 10px; border-bottom: 1px solid #eee; }
                .data-table tr:last-child td { border-bottom: none; }
                .label { color: #666; font-weight: bold; width: 30%; }
                .value { color: #333; }
                .footer { text-align: center; margin-top: 40px; color: #888; font-size: 12px; }
                .watermark { position: fixed; bottom: 20px; right: 20px; color: rgba(0,0,0,0.1); font-size: 24px; transform: rotate(-45deg); }
            </style>
        </head>
        <body>
            <div class="document">
                <div class="header">
                    <h1>${this.templates[type].name}</h1>
                    <p>Generated by HOOPSTEAM Document Forger</p>
                </div>
                
                <table class="data-table">
                    ${Object.entries(data).map(([key, value]) => `
                    <tr>
                        <td class="label">${key.replace(/_/g, ' ').toUpperCase()}</td>
                        <td class="value">${value}</td>
                    </tr>
                    `).join('')}
                </table>
                
                <div class="footer">
                    <p>This document was generated for testing and educational purposes only.</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
            
            <div class="watermark">HOOPSTEAM</div>
        </body>
        </html>
        `;
    }
    
    // Save documents
    saveDocuments() {
        hoopsteamStorage.set('document_forger_history', this.generatedDocuments);
    }
    
    // Load documents
    loadDocuments() {
        const saved = hoopsteamStorage.get('document_forger_history');
        if (saved && Array.isArray(saved)) {
            this.generatedDocuments = saved;
            hoopsteamLogger.info(`Loaded ${this.generatedDocuments.length} saved documents`);
        }
    }
    
    // Clear history
    clearHistory() {
        this.generatedDocuments = [];
        hoopsteamStorage.remove('document_forger_history');
