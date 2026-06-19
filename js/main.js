// ==================== إعدادت المؤسسة ====================
const CONFIG = {
    storeName: 'مؤسسة الشعب للمقاولات العامة',        
    storeType: 'building-materials',
    whatsapp: '967770569067',                 // رقم الواتساب الجديد الخاص بك
    googleMaps: 'https://maps.app.goo.gl/example',
    primaryColor: '#1a252f',                  // كحلي هندسي داكن
    secondaryColor: '#f39c12',                // ذهبي إنشائي
    logo: 'assets/images/logo.png',
    defaultShareImage: 'assets/images/logo.png',
    developerUrl: 'https://alshaab-contracting.com'
};

// ==================== API Proxy ====================
const API_BASE = '/api/proxy';  // يستخدم البروكسي على Vercel أو Netlify

// ==================== PWA Installation ====================
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBanner.style.display = 'none';
        }
    });
}

function closeInstallBanner() {
    if (installBanner) installBanner.style.display = 'none';
}

// ==================== Menu Toggle ====================
function toggleMenu() {
    const navUl = document.querySelector('.main-nav ul');
    if (navUl) navUl.classList.toggle('show');
}

// ==================== Toast ====================
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== جلب الخدمات من Google Sheets ====================
async function fetchServices(category = 'all') {
    try {
        const params = new URLSearchParams({ action: 'getServices' }); // استدعاء الخدمات
        const response = await fetch(`${API_BASE}?${params.toString()}`);
        const data = await response.json();
        if (data.error) { console.error(data.error); return []; }
        
        const rows = data.slice(1); // تجاهل الصف الأول من الرؤوس
        const services = rows.map(row => ({
            id: row[0],
            name: row[1],
            category: row[2],
            price: row[3],
            description: row[4],
            image_url: row[5],
            whatsapp: row[6] || CONFIG.whatsapp
        }));
        
        // فلترة حسب التصنيف (مباشرة من الحقل category)
        if (category !== 'all') {
            return services.filter(s => s.category === category);
        }
        return services;
    } catch (err) {
        console.error('فشل جلب الخدمات:', err);
        return [];
    }
}

// ==================== عرض الخدمات في الموقع ====================
function displayServices(services, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (services.length === 0) {
        container.innerHTML = '<p>لا توجد خدمات معروضة حالياً.</p>';
        return;
    }
    container.innerHTML = services.map(service => `
        <div class="product-card">
            <img src="${service.image_url}" alt="${service.name}" loading="lazy">
            <div class="product-info">
                <span class="category">${service.category}</span>
                <h3>${service.name}</h3>
                <p class="description">${service.description}</p>
                <p class="price">${service.price ? service.price : 'حسب الاتفاق والمواصفات'}</p>
                <div class="product-actions">
                    <a href="https://wa.me/${service.whatsapp}?text=مرحباً مؤسسة الشعب للمقاولات، أود الاستفسار عن خدمة: ${encodeURIComponent(service.name)}" target="_blank" class="btn-whatsapp-sm">طلب استشارة أو تسعيرة</a>
                    <button onclick="shareProduct('${service.name}', '${service.description}', '${service.image_url}', '${window.location.origin}/service.html?id=${service.id}')" class="share-btn">مشاركة</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== تحميل الخدمات المميزة (الصفحة الرئيسية) ====================
async function loadFeaturedServices() {
    const services = await fetchServices('all');
    displayServices(services, 'featuredServices');
}

// ==================== تحميل كل الخدمات مع فلترة (صفحة الخدمات) ====================
async function loadAllServices(category = 'all') {
    const services = await fetchServices(category);
    displayServices(services, 'allServices');
}

// ==================== جلب التصنيفات من Google Sheets (لصفحة الخدمات) ====================
async function fetchCategories() {
    try {
        const params = new URLSearchParams({ action: 'getCategories' });
        const response = await fetch(`${API_BASE}?${params}`);
        const data = await response.json();
        if (data.error || !Array.isArray(data)) return [];
        const rows = data.slice(1); // إزالة صف الرؤوس
        return rows.map(row => ({
            id: row[0],
            name: row[1],
            slug: row[2] || row[1].toLowerCase().replace(/\s/g, '-')
        }));
    } catch (err) {
        console.error('فشل جلب التصنيفات:', err);
        return [];
    }
}

// بناء أزرار التصنيفات في صفحة الخدمات
async function loadCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    let categories = await fetchCategories();
    if (categories.length === 0) {
        // تصنيفات افتراضية إذا كانت قاعدة البيانات فارغة
        categories = [
            { name: 'كهرباء' },
            { name: 'سباكة' },
            { name: 'دهانات' },
            { name: 'ترميم' },
            { name: 'ديكورات' },
            { name: 'عروض' }
        ];
    }

    container.innerHTML = categories.map((cat, i) =>
        `<button class="filter-btn ${i === 0 ? 'active' : ''}" data-category="${cat.name}">${cat.name}</button>`
    ).join('');

    // ربط الأحداث بالأزرار
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            loadAllServices(category === 'all' ? 'all' : category);
        });
    });
}

// ==================== مشاركة ====================
function shareProduct(title, description, imageUrl, productUrl) {
    if (navigator.share) {
        navigator.share({ title, text: description, url: productUrl }).catch(() => copyToClipboard(productUrl));
    } else {
        copyToClipboard(productUrl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('تم نسخ رابط الخدمة بنجاح'))
        .catch(() => prompt('انسخ الرابط:', text));
}

// ==================== Service Worker ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW failed', err));
    });
}

// ==================== تشغيل الصفحة المناسبة ====================
document.addEventListener('DOMContentLoaded', () => {
    // الصفحة الرئيسية: عرض خدمات مميزة
    if (document.getElementById('featuredServices')) {
        loadFeaturedServices();
    }
    // صفحة الخدمات: تحميل التصنيفات وعرض الخدمات
    if (document.getElementById('allServices')) {
        loadCategoryFilters().then(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const cat = urlParams.get('category') || 'all';
            loadAllServices(cat);
            // تفعيل الزر المناسب في حالة وجود فئة في الرابط
            if (cat !== 'all') {
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.category === cat) btn.classList.add('active');
                });
            }
        });
    }
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', (e) => {
        const nav = document.querySelector('.main-nav ul');
        if (nav && nav.classList.contains('show') && !e.target.closest('.main-nav')) {
            nav.classList.remove('show');
        }
    });
});