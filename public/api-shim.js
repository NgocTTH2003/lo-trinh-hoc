/**
 * Giả lập google.script.run của Apps Script bằng fetch tới /api/<tênHàm>.
 *   google.script.run.withSuccessHandler(ok).withFailureHandler(fail).tenHam(a, b)
 *   → POST /api/tenHam  body: [a, b]
 *
 * Quản trị:
 *   isAdmin()     → true nếu trình duyệt này đã đăng nhập quản trị
 *   loginAdmin()  → hỏi mật khẩu, kiểm tra với máy chủ
 *   logoutAdmin() → đăng xuất
 * Mỗi khi trạng thái đổi, phát sự kiện 'adminchange' trên window.
 */
(function () {
  var PW_KEY = 'lotrinh_admin_pw';

  function getPw() {
    try { return localStorage.getItem(PW_KEY) || ''; } catch (e) { return ''; }
  }
  function setPw(v) {
    try { v ? localStorage.setItem(PW_KEY, v) : localStorage.removeItem(PW_KEY); } catch (e) {}
    try { window.dispatchEvent(new Event('adminchange')); } catch (e) {}
  }

  function call(name, args, retried) {
    return fetch('/api/' + encodeURIComponent(name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': getPw() },
      body: JSON.stringify(args)
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (res.status === 401) {
          setPw('');
          if (!retried && name !== 'checkAdmin') {
            var pw = window.prompt('Nhập mật khẩu quản trị để lưu thay đổi:');
            if (pw) { setPw(pw); return call(name, args, true); }
            throw new Error('Cần mật khẩu để lưu thay đổi');
          }
        }
        if (!res.ok) throw new Error((data && data.error) || ('Lỗi máy chủ ' + res.status));
        return data;
      });
    });
  }

  function runner() {
    var onOk = function () {};
    var onFail = function (e) { console.error(e); };
    var proxy = new Proxy({}, {
      get: function (_, prop) {
        if (prop === 'withSuccessHandler') return function (f) { onOk = f; return proxy; };
        if (prop === 'withFailureHandler') return function (f) { onFail = f; return proxy; };
        if (prop === 'withUserObject') return function () { return proxy; };
        return function () {
          var args = Array.prototype.slice.call(arguments);
          call(String(prop), args).then(
            function (data) { onOk(data); },
            function (err) { onFail(err instanceof Error ? err : new Error(String(err))); }
          );
        };
      }
    });
    return proxy;
  }

  window.google = window.google || {};
  window.google.script = { get run() { return runner(); } };

  window.isAdmin = function () { return !!getPw(); };
  window.logoutAdmin = function () { setPw(''); };
  // Trả về Promise<boolean>: true nếu đăng nhập thành công
  window.loginAdmin = function () {
    var pw = window.prompt('Nhập mật khẩu quản trị:');
    if (!pw) return Promise.resolve(false);
    setPw(pw);
    return call('checkAdmin', [], true).then(
      function () { return true; },
      function () { setPw(''); window.alert('Sai mật khẩu'); return false; }
    );
  };
})();