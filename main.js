
let allProducts = [];
let allCategories = [];
let currentView = 'landing';
let selectedCategories = [];
const wishlist = new Set(JSON.parse(localStorage.getItem('wishlist') || '[]'));

const landingView = document.getElementById('landing-view');
const shopView = document.getElementById('shop-view');
const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const categoryTagsContainer = document.getElementById('category-tags-container');
const loadingIndicator = document.getElementById('loading-indicator');
const noResults = document.getElementById('no-results');
const productModal = document.getElementById('product-modal');
const toast = document.getElementById('toast');
const shopNowBtns = document.querySelectorAll('#shop-now-btn, #shop-now-btn-2');
const navHome = document.getElementById('nav-home');
const navShop = document.getElementById('nav-shop');
const logoLink = document.getElementById('logo-link');
const searchBtn = document.getElementById('search-btn');

async function fetchProducts() {
    try {
        const res = await fetch('https://fakestoreapi.com/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        allProducts = Array.isArray(data) ? data : [];
        return allProducts;
    } catch (err) {
        console.error(err);
        showError('Failed to load products. Please try again later.');
        return [];
    }
}

async function fetchCategories() {
    try {
        const res = await fetch('https://fakestoreapi.com/products/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        allCategories = Array.isArray(data) ? data : [];
        populateCategoryTags();
        return allCategories;
    } catch (err) {
        console.error(err);
        allCategories = [];
        return [];
    }
}

function switchView(viewName) {
    if (viewName === 'landing') {
        landingView.classList.remove('hidden');
        shopView.classList.add('hidden');
        currentView = 'landing';
    } else {
        landingView.classList.add('hidden');
        shopView.classList.remove('hidden');
        currentView = 'shop';
        if (allProducts.length === 0) initializeShop();
    }
}

async function initializeShop() {
    loadingIndicator.classList.remove('hidden');
    productsGrid.classList.add('hidden');
    await Promise.all([fetchProducts(), fetchCategories()]);
    loadingIndicator.classList.add('hidden');
    productsGrid.classList.remove('hidden');
    displayProducts(allProducts);
}

function populateCategoryTags() {
    categoryTagsContainer.innerHTML = '';
    allCategories.forEach(category => {
        const tag = document.createElement('button');
        tag.className = 'px-4 py-1 rounded-full text-sm font-medium border border-gray-200 bg-gray-100';
        tag.dataset.category = category;
        tag.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        tag.addEventListener('click', () => toggleCategory(category, tag));
        categoryTagsContainer.appendChild(tag);
    });
    updateCategoryTagsUI();
}

function toggleCategory(category) {
    const idx = selectedCategories.indexOf(category);
    if (idx > -1) selectedCategories.splice(idx, 1);
    else selectedCategories.push(category);
    updateCategoryTagsUI();
    filterProducts();
}

function updateCategoryTagsUI() {
    const allTags = categoryTagsContainer.querySelectorAll('button');
    allTags.forEach(tag => {
        const category = tag.dataset.category;
        if (selectedCategories.includes(category)) {
            tag.classList.remove('bg-gray-100', 'border-gray-200');
            tag.classList.add('bg-dark', 'text-white', 'border-dark');
        } else {
            tag.classList.remove('bg-dark', 'text-white', 'border-dark');
            tag.classList.add('bg-gray-100', 'border-gray-200');
        }
    });
}

function displayProducts(products) {
    productsGrid.innerHTML = '';
    if (!Array.isArray(products) || products.length === 0) {
        noResults.classList.remove('hidden');
        productsGrid.classList.add('hidden');
        return;
    }
    noResults.classList.add('hidden');
    productsGrid.classList.remove('hidden');

    const fragment = document.createDocumentFragment();
    products.forEach(product => {
        const card = createProductCard(product);
        fragment.appendChild(card);
    });
    productsGrid.appendChild(fragment);
}

function createProductCard(product) {
    const id = product?.id ?? Math.random();
    const isWishlisted = wishlist.has(id);

    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-2xl p-4 relative hover:-translate-y-1 hover:shadow-lg transition';

    const wishBtn = document.createElement('button');
    wishBtn.className = 'absolute top-6 right-6 bg-white rounded-full w-10 h-10 flex items-center justify-center border border-gray-200';
    wishBtn.setAttribute('aria-label', 'toggle-wishlist');
    wishBtn.dataset.productId = id;
    wishBtn.innerHTML = isWishlisted
        ? '<img src="./assets/icons/Solid/heart-solid.svg" alt="Wishlisted" class="w-5 h-5" style="filter: invert(23%) sepia(84%) saturate(7489%) hue-rotate(359deg) brightness(98%) contrast(117%);">'
        : '<img src="./assets/icons/Outline/heart-outline.svg" alt="Not wishlisted" class="w-5 h-5" style="filter: invert(23%) sepia(84%) saturate(7489%) hue-rotate(359deg) brightness(98%) contrast(117%);">';
    wishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(id, wishBtn);
    });

    const imgWrap = document.createElement('div');
    imgWrap.className = 'w-full h-48 bg-white rounded-lg mb-4 flex items-center justify-center p-4 cursor-pointer';
    const img = document.createElement('img');
    img.src = product.image || '';
    img.alt = product.title || '';
    img.className = 'max-h-full max-w-full object-contain';
    imgWrap.appendChild(img);
    imgWrap.addEventListener('click', () => showProductModal(id));

    const title = document.createElement('h3');
    title.className = 'font-bold text-base mb-1 text-dark';
    title.textContent = truncateText(product.title || 'Untitled', 60);

    const desc = document.createElement('p');
    desc.className = 'text-gray-500 text-sm mb-2';
    desc.textContent = truncateText(product.description || '', 80);

    const ratingWrap = document.createElement('div');
    ratingWrap.className = 'flex items-center gap-1 mb-2';
    ratingWrap.innerHTML = generateStarRating((product.rating && product.rating.rate) || 0) +
        `<span class="text-xs text-gray-500 ml-1">(${product.rating ? product.rating.count : 0})</span>`;

    const price = document.createElement('p');
    price.className = 'text-2xl font-bold mb-3 text-dark';
    price.textContent = `$${(product.price ?? 0).toFixed(2)}`;

    const addBtn = document.createElement('button');
    addBtn.className = 'bg-primary text-dark border border-primary px-6 py-2.5 rounded-full font-semibold w-full hover:bg-dark hover:text-white transition';
    addBtn.textContent = 'Add to Cart';
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        quickAddToCart(id);
    });

    card.appendChild(wishBtn);
    card.appendChild(imgWrap);

    const info = document.createElement('div');
    info.className = 'mb-3';
    info.appendChild(title);
    info.appendChild(desc);
    info.appendChild(ratingWrap);
    info.appendChild(price);
    card.appendChild(info);
    card.appendChild(addBtn);

    // store product data on card for modal lookup (fast)
    card.dataset.productId = id;
    card._product = product;

    return card;
}

function toggleWishlist(productId, btnEl) {
    if (wishlist.has(productId)) wishlist.delete(productId);
    else wishlist.add(productId);
    localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist)));

    // update button appearance
    if (btnEl) {
        btnEl.innerHTML = wishlist.has(productId)
            ? '<img src="./assets/icons/Solid/heart-solid.svg" alt="Wishlisted" class="w-5 h-5" style="filter: invert(23%) sepia(84%) saturate(7489%) hue-rotate(359deg) brightness(98%) contrast(117%);">'
            : '<img src="./assets/icons/Outline/heart-outline.svg" alt="Not wishlisted" class="w-5 h-5" style="filter: invert(23%) sepia(84%) saturate(7489%) hue-rotate(359deg) brightness(98%) contrast(117%);">';
    }

    // optional: a gentle UI hint
    // filterProducts(); // avoid full re-render for performance
}

function generateStarRating(rating) {
    const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < r) html += '<img src="./assets/icons/Solid/star-solid.svg" class="w-4 h-4 inline-block" style="filter: invert(79%) sepia(72%) saturate(465%) hue-rotate(359deg) brightness(104%) contrast(104%);">';
        else html += '<img src="./assets/icons/Outline/star-outline.svg" class="w-4 h-4 inline-block">';
    }
    return html;
}

function filterProducts() {
    const searchTerm = (searchInput.value || '').toLowerCase().trim();
    let filtered = allProducts.slice();

    if (selectedCategories.length > 0) {
        filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.title || '').toLowerCase().includes(searchTerm) ||
            (p.description || '').toLowerCase().includes(searchTerm)
        );
    }

    displayProducts(filtered);
}

function showProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('modal-image').src = product.image || '';
    document.getElementById('modal-image').alt = product.title || '';
    document.getElementById('modal-title').textContent = product.title || 'Product';
    document.getElementById('modal-category').textContent = (product.category || '').toUpperCase();
    document.getElementById('modal-description').textContent = product.description || '';
    document.getElementById('modal-price').textContent = `$${(product.price ?? 0).toFixed(2)}`;

    // Set up add to cart button with correct product ID
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    // Remove any existing listener by cloning and replacing the node
    const newAddToCartBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);

    // Add fresh event listener with correct productId
    newAddToCartBtn.addEventListener('click', () => {
        quickAddToCart(productId);
        closeProductModal();
    });

    // lock body scroll
    document.body.style.overflow = 'hidden';
    productModal.showModal();
}

function closeProductModal() {
    try {
        productModal.close();
    } catch (e) {
        // ignore in unsupported browsers
    }
    document.body.style.overflow = '';
}

function quickAddToCart(productId) {
    showToast('Product added to cart!');
    console.log('Added to cart:', productId);
}

function showToast(msg = 'Product added to cart!') {
    toast.textContent = '✅ ' + msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showError(message) {
    productsGrid.innerHTML = `
    <div class="col-span-full text-center py-20">
      <p class="text-2xl font-semibold text-red-600">${message}</p>
    </div>
  `;
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
}


shopNowBtns.forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); switchView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));

navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('landing'); });
navShop.addEventListener('click', (e) => { e.preventDefault(); switchView('shop'); });
logoLink.addEventListener('click', (e) => { e.preventDefault(); switchView('landing'); });

searchInput && searchInput.addEventListener('input', () => {
    clearTimeout(searchInput._debounce);
    searchInput._debounce = setTimeout(filterProducts, 200);
});
searchBtn && searchBtn.addEventListener('click', (e) => { e.preventDefault(); filterProducts(); });

// Modal close controls
document.getElementById('modal-close')?.addEventListener('click', closeProductModal);

productModal.addEventListener('click', (e) => {
    const rect = productModal.getBoundingClientRect();
    const clickedInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!clickedInside) closeProductModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && productModal.open) closeProductModal();
});
console.log('Mini Product Finder (refactored) initialized');
switchView('landing');
