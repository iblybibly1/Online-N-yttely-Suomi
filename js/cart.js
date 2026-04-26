/* ============================================================
   Cart — localStorage-backed shopping cart
   Key: nattely_cart
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'nattely_cart';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getItems() {
    return load();
  }

  function addItem(item) {
    var items = load();
    var cartId = String(Date.now()) + String(Math.random()).slice(2, 8);
    var newItem = Object.assign({}, item, { cartId: cartId, priceEur: item.priceEur || 5 });
    items.push(newItem);
    save(items);
    updateBadge();
    renderDrawer();
    return cartId;
  }

  function removeItem(cartId) {
    var items = load().filter(function (i) { return i.cartId !== cartId; });
    save(items);
    updateBadge();
    renderDrawer();
  }

  function clearCart() {
    save([]);
    updateBadge();
    renderDrawer();
  }

  function getTotal() {
    return load().reduce(function (sum, i) { return sum + (i.priceEur || 0); }, 0);
  }

  function getCount() {
    return load().length;
  }

  function updateBadge() {
    var count = getCount();
    var badge = document.getElementById('cartCount');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function openDrawer() {
    var drawer = document.getElementById('cartDrawer');
    var overlay = document.getElementById('drawerOverlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.style.display = 'block';
    renderDrawer();
  }

  function closeDrawer() {
    var drawer = document.getElementById('cartDrawer');
    var overlay = document.getElementById('drawerOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderDrawer() {
    var itemsEl = document.getElementById('drawerItems');
    var footerEl = document.getElementById('drawerFooter');
    if (!itemsEl) return;

    var items = load();

    if (items.length === 0) {
      itemsEl.innerHTML =
        '<div class="drawer-empty">' +
          '<div style="font-size:48px;margin-bottom:16px;opacity:0.4">🛒</div>' +
          '<p style="font-size:14px">Your cart is empty</p>' +
          '<a href="competitions.html" class="btn btn-primary btn-sm" style="margin-top:16px" onclick="Cart.closeDrawer()">Browse shows</a>' +
        '</div>';
      if (footerEl) footerEl.innerHTML = '';
      return;
    }

    itemsEl.innerHTML = items.map(function (item) {
      var thumbHtml = item.photoData
        ? '<img class="cart-item-thumb" src="' + item.photoData + '" alt="Entry photo" onerror="this.style.background=\'var(--bg-muted)\';this.src=\'\'">'
        : '<div class="cart-item-thumb" style="background:var(--bg-muted);display:flex;align-items:center;justify-content:center;font-size:24px">🐴</div>';

      return (
        '<div class="cart-item">' +
          thumbHtml +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + esc(item.className || 'Class entry') + '</div>' +
            '<div class="cart-item-sub">' + esc(item.competitionName || '') + '</div>' +
            '<div class="cart-item-sub">🐴 ' + esc(item.horseName || '') + ' &middot; ' + esc(item.riderName || '') + '</div>' +
            '<div class="cart-item-price">€' + (Number(item.priceEur) || 5).toFixed(2) + '</div>' +
          '</div>' +
          '<button onclick="Cart.removeItem(\'' + esc(item.cartId) + '\')" ' +
            'style="background:none;border:none;cursor:pointer;color:var(--text-subtle);font-size:18px;padding:4px;flex-shrink:0" ' +
            'title="Remove">✕</button>' +
        '</div>'
      );
    }).join('');

    if (footerEl) {
      var total = getTotal();
      footerEl.innerHTML =
        '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;margin-bottom:16px">' +
          '<span>Total</span><span>€' + total.toFixed(2) + '</span>' +
        '</div>' +
        '<a href="cart.html" class="btn btn-primary btn-full" onclick="Cart.closeDrawer()">View cart &amp; checkout</a>';
    }
  }

  window.Cart = {
    getItems: getItems,
    addItem: addItem,
    removeItem: removeItem,
    clearCart: clearCart,
    getTotal: getTotal,
    getCount: getCount,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    renderDrawer: renderDrawer,
    updateBadge: updateBadge
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateBadge();
  });
})();
