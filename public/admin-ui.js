/**
 * Chế độ Xem / Quản trị.
 * - Chưa đăng nhập: chỉ xem. Ẩn nút Thêm mới, Sửa, Xóa, đổi trạng thái; khóa ô ngày.
 * - Đã đăng nhập quản trị: dùng đầy đủ như cũ.
 * File này phải được nạp SAU đoạn <script> chính của index.html.
 */
(function () {
  // 1. CSS ẩn các phần chỉnh sửa khi không phải quản trị
  var css = document.createElement('style');
  css.textContent =
    'body:not(.is-admin) #btnAddNew,' +
    'body:not(.is-admin) .card-actions,' +
    'body:not(.is-admin) .add-lesson-btn,' +
    'body:not(.is-admin) .del-lesson,' +
    'body:not(.is-admin) #btnSave{display:none!important}' +
    'body:not(.is-admin) .lp-date-in{pointer-events:none;border-color:transparent!important;background:transparent!important}' +
    'body:not(.is-admin) .act-item{cursor:default}' +
    'body:not(.is-admin) .card{padding-right:18px}' +
    '.topbar-actions{display:flex;align-items:center;gap:8px}' +
    '.mode-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:var(--surface-2);color:var(--text-3);border:1px solid var(--border)}' +
    'body.is-admin .mode-badge{background:var(--green-50);color:var(--green);border-color:var(--green-100)}';
  document.head.appendChild(css);

  // 2. Chặn các hàm chỉnh sửa khi không phải quản trị
  ['openModal', 'editItem', 'quickStatus', 'onLessonDate', 'confirmDelete', 'saveItem',
   'addLessonRow', 'removeLessonRow'].forEach(function (name) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      if (!window.isAdmin()) return;
      return orig.apply(this, arguments);
    };
  });

  // 3. Nút Đăng nhập / Đăng xuất trên thanh tiêu đề
  var addBtn = document.getElementById('btnAddNew');
  var wrap = document.createElement('div');
  wrap.className = 'topbar-actions';
  var badge = document.createElement('span');
  badge.className = 'mode-badge';
  var loginBtn = document.createElement('button');
  loginBtn.className = 'btn btn-ghost';
  loginBtn.type = 'button';
  if (addBtn && addBtn.parentNode) {
    addBtn.parentNode.insertBefore(wrap, addBtn);
    wrap.appendChild(badge);
    wrap.appendChild(loginBtn);
    wrap.appendChild(addBtn);
  }

  loginBtn.addEventListener('click', function () {
    if (window.isAdmin()) {
      if (window.confirm('Đăng xuất quản trị trên trình duyệt này?')) window.logoutAdmin();
    } else {
      window.loginAdmin();
    }
  });

  function apply() {
    var admin = window.isAdmin();
    document.body.classList.toggle('is-admin', admin);
    badge.textContent = admin ? 'Quản trị' : 'Chế độ xem';
    loginBtn.textContent = admin ? 'Đăng xuất' : 'Đăng nhập';
    if (!admin && typeof window.closeModal === 'function') window.closeModal();
  }
  window.addEventListener('adminchange', apply);
  apply();
})();