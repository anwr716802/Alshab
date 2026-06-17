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
const API_BASE = '/api/proxy';  // يستخدم البروكسي على Vercel

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

// ==================== جلب الخدمات والمشاريع من Google Sheets عبر البروكسي ====================
async function fetchProducts(category = 'all') {
    try {
        const params = new URLSearchParams({ action: 'getProducts' });
        const response = await fetch(`${API_BASE}?${params.toString()}`);
        const data = await response.json();
        if (data.error) { console.error(data.error); return []; }
        
        const rows = data.slice(1); // تجاهل الصف الأول من الرؤوس
        const products = rows.map(row => ({
            id: row[0],
            name: row[1],
            category: row[2],
            price: row[3],
            description: row[4],
            image_url: row[5],
            whatsapp: row[6] || CONFIG.whatsapp
        }));
        
        // تحويل الفلترة والتصنيفات برمجياً لتطابق مجالات المقاولات العامة
        if (category !== 'all') {
            const categoryMap = { 
                construction: 'مقاولات عامة وبناء', 
                finishing: 'التشطيبات والترميم', 
                engineering: 'إشراف وتجهيز هندسي', 
                materials: 'توريد مواد إنشائية' 
            };
            const targetCategory = categoryMap[category] || category;
            return products.filter(p => p.category === targetCategory);
        }
        return products;
    } catch (err) {
        console.error('فشل جلب خدمات المقاولات:', err);
        return [];
    }
}

// ==================== عرض الخدمات والمشاريع في الموقع ====================
function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<p>لا توجد مشاريع أو خدمات معروضة حالياً.</p>';
        return;
    }
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy">
            <div class="product-info">
                <span class="category">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="description">${product.description}</p>
                <p class="price">${product.price ? product.price : 'حسب الاتفاق والمواصفات'}</p>
                <div class="product-actions">
                    <a href="https://wa.me/${product.whatsapp}?text=مرحباً مؤسسة الشعب للمقاولات، أود الاستفسار عن خدمة: ${encodeURIComponent(product.name)}" target="_blank" class="btn-whatsapp-sm">طلب استشارة أو تسعيرة</a>
                    <button onclick="shareProduct('${product.name}', '${product.description}', '${product.image_url}', '${window.location.origin}/product.html?id=${product.id}')" class="share-btn">مشاركة</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== تحميل تلقائي في الصفحة الرئيسية ====================
async function loadFeaturedProducts() {
    const products = await fetchProducts('all');
    displayProducts(products, 'featuredProducts');
}

// ==================== فلترة المشاريع في صفحة الخدمات ====================
async function loadAllProducts(category = 'all') {
    const products = await fetchProducts(category);
    displayProducts(products, 'allProducts');
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
    if (document.getElementById('featuredProducts')) {
        loadFeaturedProducts();
    }
    if (document.getElementById('allProducts')) {
        loadAllProducts();
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                loadAllProducts(this.dataset.category);
            });
        });
    }
    document.addEventListener('click', (e) => {
        const nav = document.querySelector('.main-nav ul');
        if (nav && nav.classList.contains('show') && !e.target.closest('.main-nav')) {
            nav.classList.remove('show');
        }
    });
});
