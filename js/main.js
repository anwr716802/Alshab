// ==================== إعدادت المتجر ====================
const CONFIG = {
    storeName: 'متجر الأناقة للملابس',        
    storeType: 'clothing',
    whatsapp: '967777777777',                 // رقم واتساب الأساسي الخاص بك لتلقي الطلبات المجمعة
    googleMaps: 'https://maps.app.goo.gl/...',
    primaryColor: '#2c3e50',
    secondaryColor: '#c0392b',
    logo: 'assets/images/logo.png',
    defaultShareImage: 'assets/images/logo.png',
    developerUrl: 'https://alshaab-contracting.com'
};

// ==================== API Proxy ====================
const API_BASE = '/api/proxy';  

// ==================== نظام سلة المشتريات (Local Storage) ====================
let cart = JSON.parse(localStorage.getItem('elegance_store_cart')) || [];

// حفظ السلة وتحديث الواجهة
function saveCart() {
    localStorage.setItem('elegance_store_cart', JSON.stringify(cart));
    updateCartUI();
}

// إضافة منتج إلى السلة
function addToCart(id, name, price, imageUrl) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id, name, price: parseFloat(price) || 0, imageUrl, qty: 1 });
    }
    saveCart();
    showToast(`تم إضافة ${name} إلى السلة بنجاح`);
}

// تغيير الكمية
function changeQty(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
    }
}

// حذف عنصر تماماً
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
}

// تحديث مظهر وعناصر السلة في الصفحة
function updateCartUI() {
    // تحديث شارة العدد
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
        badge.textContent = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
    });

    // تحديث قائمة عناصر السلة داخل القائمة الجانبية
    const cartContainer = document.getElementById('cartItemsList');
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:30px;">السلة فارغة حالياً.</p>';
        document.getElementById('cartTotal').textContent = '0 ريال';
        return;
    }

    let totalPrice = 0;
    cartContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.qty;
        totalPrice += itemTotal;
        return `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.price} ريال</p>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
            </div>
        `;
    }).join('');

    document.getElementById('cartTotal').textContent = totalPrice + ' ريال';
}

// فتح وإغلاق السلة الجانبية
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

// إرسال الطلب المجمع عبر واتساب بطريقة احترافية
function checkoutCart() {
    if (cart.length === 0) {
        showToast('سلتك فارغة، يرجى إضافة منتجات أولاً');
        return;
    }

    let message = `*طلب شراء جديد من: ${CONFIG.storeName}*\n`;
    message += `------------------------------------\n\n`;
    
    let total = 0;
    cart.forEach((item, index) => {
        const itemSubtotal = item.price * item.qty;
        total += itemSubtotal;
        message += `*${index + 1}) ${item.name}*\n`;
        message += `   الكمية: ${item.qty}\n`;
        message += `   السعر: ${item.price} ريال\n`;
        message += `   المجموع: ${itemSubtotal} ريال\n\n`;
    });

    message += `------------------------------------\n`;
    message += `*المجموع الكلي للطلب:* ${total} ريال يمني\n\n`;
    message += `يرجى تأكيد الطلب وتجهيز المنتجات.`;

    const whatsappUrl = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
    
    // تفريغ السلة بعد إرسال الطلب بنجاح لعدم تكراره
    cart = [];
    saveCart();
    toggleCart();

    // فتح واتساب
    window.open(whatsappUrl, '_blank');
}

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
            await deferredPrompt.userChoice;
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

// ==================== جلب المنتجات من Google Sheets ====================
async function fetchProducts(category = 'all') {
    try {
        const params = new URLSearchParams({ action: 'getProducts' });
        const response = await fetch(`${API_BASE}?${params.toString()}`);
        const data = await response.json();
        if (data.error) { console.error(data.error); return []; }
        
        const rows = data.slice(1); 
        const products = rows.map(row => ({
            id: row[0],
            name: row[1],
            category: row[2],
            price: row[3],
            description: row[4],
            image_url: row[5],
            whatsapp: row[6] || CONFIG.whatsapp
        }));
        
        if (category !== 'all') {
            const categoryMap = { men: 'رجالي', women: 'نسائي', kids: 'أطفال', offers: 'عروض' };
            const targetCategory = categoryMap[category] || category;
            return products.filter(p => p.category === targetCategory);
        }
        return products;
    } catch (err) {
        console.error('فشل جلب المنتجات:', err);
        return [];
    }
}

// ==================== عرض المنتجات في الواجهة العالمية الجديدة ====================
function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:#666;">لا توجد منتجات حالياً في هذا القسم.</p>';
        return;
    }
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-card-image-wrapper">
                <img src="${product.image_url}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="category">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="description">${product.description}</p>
                <p class="price">${product.price ? product.price + ' ريال' : 'حسب الطلب'}</p>
                
                <button onclick="addToCart('${product.id}', '${product.name.replace(/'/g, "\\'")}', '${product.price}', '${product.image_url}')" class="btn-cart-add">
                    إضافة إلى السلة
                </button>
                
                <div class="product-actions" style="margin-top: 10px;">
                    <a href="https://wa.me/${product.whatsapp}?text=مرحباً، أستفسر عن منتج: ${encodeURIComponent(product.name)}" target="_blank" class="btn-whatsapp-sm">استفسار سريع</a>
                    <button onclick="shareProduct('${product.name.replace(/'/g, "\\'")}', '${product.description.replace(/'/g, "\\'")}', '${product.image_url}', '${window.location.origin}/products.html')" class="share-btn">مشاركة</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadFeaturedProducts() {
    const products = await fetchProducts('all');
    displayProducts(products.slice(0, 8), 'featuredProducts'); // عرض أول 8 منتجات مميزة
}

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
    navigator.clipboard.writeText(text).then(() => showToast('تم نسخ رابط المتجر للمشاركة'))
        .catch(() => prompt('انسخ الرابط:', text));
}

// ==================== تشغيل وتجهيز الواجهة والأزرار ====================
document.addEventListener('DOMContentLoaded', () => {
    // إنشاء وحقن أزرار وهيكل السلة تلقائياً في الصفحات دون الحاجة لتعديل يدوي في كل ملفات الـ HTML!
    if (!document.getElementById('cartSidebar')) {
        const cartHTML = `
            <div class="floating-cart-trigger" onclick="toggleCart()">
                <svg viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                <div class="cart-count-badge" style="display: none;">0</div>
            </div>
            
            <div class="cart-overlay" id="cartOverlay" onclick="toggleCart()"></div>
            
            <div class="cart-sidebar" id="cartSidebar">
                <div class="cart-header">
                    <h3>سلة المشتريات</h3>
                    <button class="cart-close-btn" onclick="toggleCart()">✕</button>
                </div>
                <div class="cart-items-list" id="cartItemsList">
                    </div>
                <div class="cart-footer">
                    <div class="cart-total-box">
                        <span>المجموع الكلي:</span>
                        <span id="cartTotal">0 ريال</span>
                    </div>
                    <button class="btn-checkout" onclick="checkoutCart()">
                        إرسال الطلب عبر واتساب 
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }

    // تحديث السلة عند تحميل أي صفحة
    updateCartUI();

    // تشغيل جلب المنتجات حسب الصفحة الحالية
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

    // إغلاق القائمة للهاتف عند النقر خارجها
    document.addEventListener('click', (e) => {
        const nav = document.querySelector('.main-nav ul');
        if (nav && nav.classList.contains('show') && !e.target.closest('.main-nav')) {
            nav.classList.remove('show');
        }
    });
});

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW failed', err));
    });
}
