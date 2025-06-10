// تنظیمات اولیه
document.addEventListener('DOMContentLoaded', function() {
    // انتخاب عناصر مورد نیاز
    const configTypeInputs = document.querySelectorAll('input[name="config-type"]');
    const warpPlusSection = document.getElementById('warp-plus-section');
    const generateConfigBtn = document.getElementById('generate-config');
    const loadingSection = document.getElementById('loading-section');
    const resultSection = document.getElementById('result-section');
    const configIp = document.getElementById('config-ip');
    const configSpeed = document.getElementById('config-speed');
    const configPing = document.getElementById('config-ping');
    const configText = document.getElementById('config-text');
    const copyConfig = document.getElementById('copy-config');
    const downloadConfigBtn = document.getElementById('download-config');
    const downloadCsvBtn = document.getElementById('download-csv');
    const generateAgainBtn = document.getElementById('generate-again');
    
    // مقادیر پیش‌فرض
    let configType = 'standard';
    let currentConfig = null;
    
    // نمایش یا عدم نمایش بخش WARP+ بر اساس انتخاب نوع کانفیگ
    configTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            configType = this.value;
            if (this.value === 'warp-plus') {
                warpPlusSection.classList.remove('hidden');
            } else {
                warpPlusSection.classList.add('hidden');
            }
        });
    });
    
    // دکمه دریافت کانفیگ
    generateConfigBtn.addEventListener('click', function() {
        // نمایش بخش لودینگ
        loadingSection.classList.remove('hidden');
        generateConfigBtn.disabled = true;
        resultSection.classList.add('hidden');
        
        // شبیه‌سازی زمان اسکن سرور
        setTimeout(() => {
            generateWireGuardConfig(configType)
                .then(config => {
                    currentConfig = config;
                    displayConfig(config);
                    loadingSection.classList.add('hidden');
                    resultSection.classList.remove('hidden');
                    generateConfigBtn.disabled = false;
                })
                .catch(error => {
                    alert('خطا در دریافت کانفیگ: ' + error.message);
                    loadingSection.classList.add('hidden');
                    generateConfigBtn.disabled = false;
                });
        }, 2500);
    });
    
    // دکمه کپی کردن کانفیگ
    copyConfig.addEventListener('click', function() {
        if (currentConfig && currentConfig.fullConfig) {
            navigator.clipboard.writeText(currentConfig.fullConfig)
                .then(() => {
                    showToast('کانفیگ کپی شد!', 'success');
                    
                    // تغییر آیکون برای نشان دادن موفقیت
                    const originalIcon = copyConfig.innerHTML;
                    copyConfig.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyConfig.innerHTML = originalIcon;
                    }, 1500);
                })
                .catch(err => {
                    showToast('خطا در کپی کردن کانفیگ', 'error');
                });
        }
    });
    
    // دکمه دانلود کانفیگ
    downloadConfigBtn.addEventListener('click', function() {
        if (currentConfig && currentConfig.fullConfig) {
            downloadFile('warp-config.conf', currentConfig.fullConfig);
            showToast('دانلود فایل کانفیگ شروع شد', 'success');
        }
    });
    
    // دکمه دانلود CSV
    downloadCsvBtn.addEventListener('click', function() {
        if (currentConfig) {
            const csvContent = generateCsvContent(currentConfig);
            downloadFile('warp-config.csv', csvContent);
            showToast('دانلود فایل CSV شروع شد', 'success');
        }
    });
    
    // دکمه دریافت کانفیگ جدید
    generateAgainBtn.addEventListener('click', function() {
        resultSection.classList.add('hidden');
        generateConfigBtn.click();
    });
});

/**
 * تولید کانفیگ وایرگارد
 * @param {string} type - نوع کانفیگ
 * @returns {Promise<Object>} - کانفیگ تولید شده
 */
async function generateWireGuardConfig(type) {
    // دریافت کلید WARP+ در صورت انتخاب
    let warpPlusKey = '';
    if (type === 'warp-plus') {
        warpPlusKey = document.getElementById('warp-plus-key').value;
    }
    
    // در یک برنامه واقعی، اینجا باید به API متصل شویم
    // اما برای نمونه، یک کانفیگ شبیه‌سازی شده برمی‌گردانیم
    return new Promise((resolve) => {
        // تولید آی‌پی تصادفی
        const ip = generateRandomIp();
        const privateKey = generateBase64Key();
        const publicKey = generateBase64Key();
        const endpoint = selectRandomEndpoint();
        
        // ساخت کانفیگ
        const config = {
            ip: ip,
            speed: Math.floor(Math.random() * 100) + 50 + ' Mbps', // سرعت تصادفی
            ping: Math.floor(Math.random() * 50) + 10 + ' ms', // پینگ تصادفی
            privateKey: privateKey,
            publicKey: publicKey,
            endpoint: endpoint,
            port: Math.floor(Math.random() * 1000) + 1000, // پورت تصادفی
            fullConfig: generateWireGuardConfigText(ip, privateKey, publicKey, endpoint, type, warpPlusKey)
        };
        
        resolve(config);
    });
}

/**
 * تولید متن کامل کانفیگ وایرگارد
 * @param {string} ip - آدرس IP
 * @param {string} privateKey - کلید خصوصی
 * @param {string} publicKey - کلید عمومی
 * @param {string} endpoint - آی‌پی سرور
 * @param {string} type - نوع کانفیگ
 * @param {string} warpPlusKey - کلید WARP+ (اختیاری)
 * @returns {string} - متن کامل کانفیگ
 */
function generateWireGuardConfigText(ip, privateKey, publicKey, endpoint, type, warpPlusKey = '') {
    let config = `[Interface]
PrivateKey = ${privateKey}
Address = 172.16.0.2/32
Address = 2606:4700:110:8a36:df92:102a:9602:fa18/128
DNS = 1.1.1.1, 8.8.8.8, 2606:4700:4700::1111
MTU = 1280

[Peer]
PublicKey = ${publicKey}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${endpoint}:2408`;

    // اضافه کردن PresharedKey برای WARP+
    if (type === 'warp-plus' && warpPlusKey) {
        config += `
PresharedKey = ${warpPlusKey}`;
    }
    
    return config;
}

/**
 * تولید آی‌پی تصادفی
 * @returns {string} - آدرس IP تصادفی
 */
function generateRandomIp() {
    return `162.159.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

/**
 * تولید کلید Base64 برای وایرگارد
 * @returns {string} - کلید Base64 تصادفی
 */
function generateBase64Key() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    
    for (let i = 0; i < 44; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result + '==';
}

/**
 * انتخاب تصادفی یک سرور از بین سرورهای موجود
 * @returns {string} - آدرس سرور
 */
function selectRandomEndpoint() {
    const endpoints = [
        '162.159.192.1',
        '162.159.193.10',
        '162.159.195.67',
        '162.159.204.135',
        '162.159.195.200',
        '162.159.192.200',
        '162.159.193.100',
    ];
    
    return endpoints[Math.floor(Math.random() * endpoints.length)];
}

/**
 * نمایش کانفیگ در صفحه
 * @param {Object} config - کانفیگ تولید شده
 */
function displayConfig(config) {
    document.getElementById('config-ip').textContent = config.ip;
    document.getElementById('config-speed').textContent = config.speed;
    document.getElementById('config-ping').textContent = config.ping;
    document.getElementById('config-text').textContent = config.fullConfig;
}

/**
 * تولید محتوای فایل CSV
 * @param {Object} config - کانفیگ تولید شده
 * @returns {string} - محتوای CSV
 */
function generateCsvContent(config) {
    return `IP,Endpoint,Port,Speed,Ping
${config.ip},${config.endpoint},${config.port},${config.speed},${config.ping}`;
}

/**
 * دانلود فایل
 * @param {string} filename - نام فایل
 * @param {string} content - محتوای فایل
 */
function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * نمایش پیام
 * @param {string} message - متن پیام
 * @param {string} type - نوع پیام (success/error/warning)
 */
function showToast(message, type = 'success') {
    // بررسی وجود توست قبلی و حذف آن
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // ایجاد توست جدید
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // اضافه کردن توست به صفحه
    document.body.appendChild(toast);
    
    // نمایش توست با انیمیشن
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // حذف توست بعد از چند ثانیه
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// اضافه کردن استایل برای توست به CSS
document.head.insertAdjacentHTML('beforeend', `
<style>
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.3s ease;
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast-content {
    display: flex;
    align-items: center;
}

.toast i {
    margin-left: 10px;
}

.toast-success {
    background-color: #43a047;
}

.toast-error {
    background-color: #e53935;
}

.toast-warning {
    background-color: #fb8c00;
}
</style>
`); 