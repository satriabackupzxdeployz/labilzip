// ===== KTP GENERATOR =====
class KTPGenerator {
    constructor() {
        this.provinces = {
            '11': 'ACEH',
            '12': 'SUMATERA UTARA',
            '13': 'SUMATERA BARAT',
            '14': 'RIAU',
            '15': 'JAMBI',
            '16': 'SUMATERA SELATAN',
            '17': 'BENGKULU',
            '18': 'LAMPUNG',
            '19': 'KEPULAUAN BANGKA BELITUNG',
            '21': 'KEPULAUAN RIAU',
            '31': 'DKI JAKARTA',
            '32': 'JAWA BARAT',
            '33': 'JAWA TENGAH',
            '34': 'DAERAH ISTIMEWA YOGYAKARTA',
            '35': 'JAWA TIMUR',
            '36': 'BANTEN',
            '51': 'BALI',
            '52': 'NUSA TENGGARA BARAT',
            '53': 'NUSA TENGGARA TIMUR',
            '61': 'KALIMANTAN BARAT',
            '62': 'KALIMANTAN TENGAH',
            '63': 'KALIMANTAN SELATAN',
            '64': 'KALIMANTAN TIMUR',
            '65': 'KALIMANTAN UTARA',
            '71': 'SULAWESI UTARA',
            '72': 'SULAWESI TENGAH',
            '73': 'SULAWESI SELATAN',
            '74': 'SULAWESI TENGGARA',
            '75': 'GORONTALO',
            '76': 'SULAWESI BARAT',
            '81': 'MALUKU',
            '82': 'MALUKU UTARA',
            '91': 'PAPUA',
            '92': 'PAPUA BARAT',
            '93': 'PAPUA SELATAN',
            '94': 'PAPUA TENGAH'
        };
        
        this.cities = {
            '11': ['1101', '1102', '1103', '1104', '1105', '1106', '1107', '1108', '1109', '1110', '1111', '1112', '1113', '1114', '1115', '1116', '1117', '1118'],
            '31': ['3171', '3172', '3173', '3174', '3175'],
            '32': ['3201', '3202', '3203', '3204', '3205', '3206', '3207', '3208', '3209', '3210', '3211', '3212', '3213', '3214', '3215', '3216', '3217', '3218', '3271', '3272', '3273', '3274', '3275', '3276', '3277', '3278', '3279'],
            '35': ['3501', '3502', '3503', '3504', '3505', '3506', '3507', '3508', '3509', '3510', '3511', '3512', '3513', '3514', '3515', '3516', '3517', '3518', '3519', '3520', '3521', '3522', '3523', '3524', '3525', '3526', '3527', '3528', '3529', '3571', '3572', '3573', '3574', '3575', '3576', '3577', '3578', '3579']
        };
        
        this.religions = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KHONGHUCU'];
        this.maritalStatus = ['BELUM KAWIN', 'KAWIN', 'CERAI HIDUP', 'CERAI MATI'];
        this.jobs = ['PELAJAR/MAHASISWA', 'PEGAWAI SWASTA', 'PEGAWAI NEGERI', 'WIRAUSAHA', 'BURUH', 'TUKANG', 'PETANI', 'NELAYAN', 'PENSIUNAN', 'TIDAK BEKERJA'];
        this.bloodTypes = ['A', 'B', 'AB', 'O'];
    }
    
    // Generate complete KTP data
    generateCompleteKTP(options = {}) {
        const gender = options.gender || (Math.random() > 0.5 ? 'LAKI-LAKI' : 'PEREMPUAN');
        const birthDate = options.birthDate || this.generateBirthDate();
        const provinceCode = this.getRandomProvinceCode();
        const cityCode = this.getRandomCityCode(provinceCode);
        
        const ktpData = {
            nik: this.generateNIKFromComponents(provinceCode, cityCode, birthDate, gender),
            nama: options.nama || this.generateName(gender),
            tempat_lahir: options.tempat_lahir || this.generateCityName(provinceCode),
            tanggal_lahir: birthDate,
            jenis_kelamin: gender,
            golongan_darah: this.bloodTypes[Math.floor(Math.random() * this.bloodTypes.length)],
            alamat: options.alamat || this.generateAddress(),
            rt_rw: `${this.padNumber(Math.floor(Math.random() * 20) + 1, 3)}/${this.padNumber(Math.floor(Math.random() * 10) + 1, 3)}`,
            kel_desa: this.generateVillageName(),
            kecamatan: this.generateDistrictName(),
            agama: this.religions[Math.floor(Math.random() * this.religions.length)],
            status_perkawinan: this.maritalStatus[Math.floor(Math.random() * this.maritalStatus.length)],
            pekerjaan: this.jobs[Math.floor(Math.random() * this.jobs.length)],
            kewarganegaraan: 'WNI',
            berlaku_hingga: this.generateExpiryDate(),
            provinsi: this.provinces[provinceCode],
            kota_kabupaten: this.getCityName(cityCode),
            foto: this.generateKTPPhoto(gender, options.nama)
        };
        
        return ktpData;
    }
    
    // Generate NIK from components
    generateNIKFromComponents(provinceCode, cityCode, birthDate, gender) {
        const date = new Date(birthDate);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear() % 100;
        
        // For females, add 40 to day
        const birthDay = gender === 'PEREMPUAN' ? day + 40 : day;
        
        const nik = provinceCode + 
                   cityCode + 
                   this.padNumber(birthDay, 2) + 
                   this.padNumber(month, 2) + 
                   this.padNumber(year, 2) + 
                   this.padNumber(Math.floor(Math.random() * 9000) + 1000, 4);
        
        return nik;
    }
    
    // Generate KTP photo
    generateKTPPhoto(gender, name) {
        const bgColor = gender === 'PEREMPUAN' ? '#ffb6c1' : '#87ceeb';
        const textColor = gender === 'PEREMPUAN' ? '#8b0000' : '#000080';
        const firstName = name ? name.split(' ')[0] : 'FOTO';
        
        const svg = `
            <svg width="150" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="150" height="200" fill="${bgColor}" opacity="0.3"/>
                <rect x="10" y="10" width="130" height="180" fill="white" stroke="#ccc" stroke-width="1"/>
                <circle cx="75" cy="70" r="40" fill="${bgColor}"/>
                <text x="75" y="70" text-anchor="middle" dy="5" font-family="Arial" font-size="14" fill="${textColor}">${firstName.charAt(0)}</text>
                <rect x="40" y="120" width="70" height="20" rx="3" fill="#4CAF50"/>
                <text x="75" y="135" text-anchor="middle" font-family="Arial" font-size="10" fill="white">KTP</text>
                <text x="75" y="170" text-anchor="middle" font-family="Arial" font-size="9" fill="#666">IDENTITAS</text>
                <text x="75" y="185" text-anchor="middle" font-family="Arial" font-size="8" fill="#999">HOOPSTEAM</text>
            </svg>
        `;
        
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }
    
    // Generate birth date (18-60 years ago)
    generateBirthDate() {
        const now = new Date();
        const yearsAgo = Math.floor(Math.random() * 42) + 18; // 18-60 years old
        const birthYear = now.getFullYear() - yearsAgo;
        const birthMonth = Math.floor(Math.random() * 12);
        const birthDay = Math.floor(Math.random() * 28) + 1;
        
        const date = new Date(birthYear, birthMonth, birthDay);
        return date.toISOString().split('T')[0];
    }
    
    // Generate expiry date (10 years from random date)
    generateExpiryDate() {
        const now = new Date();
        const yearsAhead = 10;
        const future = new Date(now.getFullYear() + yearsAhead, now.getMonth(), now.getDate());
        return future.toISOString().split('T')[0];
    }
    
    // Get random province code
    getRandomProvinceCode() {
        const codes = Object.keys(this.provinces);
        return codes[Math.floor(Math.random() * codes.length)];
    }
    
    // Get random city code for province
    getRandomCityCode(provinceCode) {
        const cities = this.cities[provinceCode];
        if (cities && cities.length > 0) {
            return cities[Math.floor(Math.random() * cities.length)];
        }
        // Fallback: generate random 4-digit code
        return this.padNumber(Math.floor(Math.random() * 100), 2) + this.padNumber(Math.floor(Math.random() * 100), 2);
    }
    
    // Generate city name
    generateCityName(provinceCode) {
        const provinceCities = {
            '31': ['JAKARTA PUSAT', 'JAKARTA SELATAN', 'JAKARTA BARAT', 'JAKARTA TIMUR', 'JAKARTA UTARA'],
            '32': ['BANDUNG', 'BEKASI', 'BOGOR', 'DEPOK', 'TASIKMALAYA', 'CIREBON', 'SUKABUMI'],
            '35': ['SURABAYA', 'MALANG', 'SIDOARJO', 'MOJOKERTO', 'JEMBER', 'BANYUWANGI', 'MADIUN']
        };
        
        if (provinceCities[provinceCode]) {
            return provinceCities[provinceCode][Math.floor(Math.random() * provinceCities[provinceCode].length)];
        }
        
        return this.generateBirthPlace();
    }
    
    // Generate village name
    generateVillageName() {
        const prefixes = ['DESA', 'KELURAHAN'];
        const names = ['MEKAR JAYA', 'SARI HARAPAN', 'MULYA SARI', 'CEMPAKA INDAH', 'BUMI ASRI', 'TIRTA WANGI', 'PANCA WARGI'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
    }
    
    // Generate district name
    generateDistrictName() {
        const prefixes = ['KEC.', 'KECAMATAN'];
        const names = ['CILILIN', 'PADALARANG', 'CIMAHI', 'LEMBANG', 'CIPATAT', 'NGAMPRAH', 'BATUJAJAR'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
    }
    
    // Generate address
    generateAddress() {
        const streets = ['JL. MERDEKA NO.', 'JL. SUDIRMAN NO.', 'JL. GAJAH MADA NO.', 'JL. HAYAM WURUK NO.', 'JL. PEMUDA NO.'];
        const street = streets[Math.floor(Math.random() * streets.length)];
        const number = Math.floor(Math.random() * 100) + 1;
        return `${street} ${number}`;
    }
    
    // Generate name based on gender
    generateName(gender) {
        const maleNames = ['ADI SANTOSO', 'BUDI WIBOWO', 'JOKO SUSANTO', 'HADI NUGROHO', 'AGUS PRATAMA', 'RUDI SETIAWAN', 'DWI KURNIAWAN'];
        const femaleNames = ['SARI DEWI', 'RINI WULANDARI', 'MEGA KUSUMA', 'CITRA ANGGRAINI', 'PUTRI MAHARANI', 'ANITA SARI', 'LINDA WIDYA'];
        
        if (gender === 'LAKI-LAKI') {
            return maleNames[Math.floor(Math.random() * maleNames.length)];
        } else {
            return femaleNames[Math.floor(Math.random() * femaleNames.length)];
        }
    }
    
    // Generate birth place
    generateBirthPlace() {
        const places = ['JAKARTA', 'BANDUNG', 'SURABAYA', 'MEDAN', 'SEMARANG', 'MAKASSAR', 'PALEMBANG', 'BALIKPAPAN'];
        return places[Math.floor(Math.random() * places.length)];
    }
    
    // Get city name from code
    getCityName(cityCode) {
        const cityNames = {
            '3171': 'JAKARTA PUSAT',
            '3172': 'JAKARTA SELATAN',
            '3173': 'JAKARTA BARAT',
            '3174': 'JAKARTA TIMUR',
            '3175': 'JAKARTA UTARA',
            '3273': 'BANDUNG',
            '3275': 'BEKASI',
            '3578': 'SURABAYA',
            '3573': 'MALANG'
        };
        
        return cityNames[cityCode] || 'KOTA/KABUPATEN';
    }
    
    // Pad number with leading zeros
    padNumber(num, length) {
        return num.toString().padStart(length, '0');
    }
    
    // Validate NIK
    validateNIK(nik) {
        if (!nik || nik.length !== 16) return false;
        
        // Check if all characters are digits
        if (!/^\d{16}$/.test(nik)) return false;
        
        // Extract components
        const provinceCode = nik.substring(0, 2);
        const cityCode = nik.substring(2, 4);
        const birthDay = parseInt(nik.substring(6, 8));
        const birthMonth = parseInt(nik.substring(8, 10));
        const birthYear = parseInt(nik.substring(10, 12));
        
        // Check province code exists
        if (!this.provinces[provinceCode]) return false;
        
        // Check date validity
        if (birthMonth < 1 || birthMonth > 12) return false;
        if (birthDay < 1 || birthDay > 31) return false;
        
        // For females, birthDay should be 41-71
        if (birthDay > 40 && birthDay < 72) {
            // Female - day should be original day + 40
            const originalDay = birthDay - 40;
            if (originalDay < 1 || originalDay > 31) return false;
        }
        
        return true;
    }
    
    // Parse NIK to get information
    parseNIK(nik) {
        if (!this.validateNIK(nik)) {
            throw new Error('Invalid NIK');
        }
        
        const provinceCode = nik.substring(0, 2);
        const cityCode = nik.substring(2, 4);
        const birthDay = parseInt(nik.substring(6, 8));
        const birthMonth = parseInt(nik.substring(8, 10));
        const birthYear = parseInt(nik.substring(10, 12));
        const serial = nik.substring(12, 16);
        
        // Determine gender and actual birth day
        let gender = 'LAKI-LAKI';
        let actualBirthDay = birthDay;
        
        if (birthDay > 40) {
            gender = 'PEREMPUAN';
            actualBirthDay = birthDay - 40;
        }
        
        // Calculate birth year (assume 1900s for 00-21, 2000s for 22-99)
        const currentYear = new Date().getFullYear() % 100;
        const century = birthYear <= currentYear + 1 ? 2000 : 1900;
        const fullBirthYear = century + birthYear;
        
        return {
            nik: nik,
            provinceCode: provinceCode,
            province: this.provinces[provinceCode],
            cityCode: cityCode,
            gender: gender,
            birthDate: `${this.padNumber(actualBirthDay, 2)}/${this.padNumber(birthMonth, 2)}/${fullBirthYear}`,
            serialNumber: serial,
            age: new Date().getFullYear() - fullBirthYear
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KTPGenerator;
}