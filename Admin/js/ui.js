/* Shared UI helpers: escaping, toasts, confirm dialog, sidebar drawer, password helpers. */
(function () {
  var Admin = (window.Admin = window.Admin || {});

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toast(message, type) {
    var host = document.getElementById("toasts");
    if (!host) return;
    var el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.textContent = message;
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 4000);
  }

  // Promise-based confirm built on <dialog id="confirmDialog">. Resolves true / false.
  function confirmDialog(opts) {
    var dlg = document.getElementById("confirmDialog");
    dlg.querySelector("[data-confirm-title]").textContent = opts.title;
    dlg.querySelector("[data-confirm-text]").textContent = opts.text;
    var ok = dlg.querySelector("[data-confirm-ok]");
    ok.textContent = opts.okLabel || "Təsdiq et";
    return new Promise(function (resolve) {
      function finish(result) {
        ok.removeEventListener("click", onOk);
        dlg.removeEventListener("close", onClose);
        if (dlg.open) dlg.close();
        resolve(result);
      }
      function onOk() { finish(true); }
      function onClose() { finish(false); }
      ok.addEventListener("click", onOk);
      dlg.addEventListener("close", onClose);
      dlg.showModal();
    });
  }

  function formatDate(iso) {
    var p = String(iso || "").split("-");
    return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : "";
  }

  function initials(name) {
    return String(name || "A").trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
  }

  // 0-4 score: length, mixed case, digit, symbol.
  function passwordScore(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  function bindPasswordToggles(root) {
    (root || document).querySelectorAll("[data-toggle-password]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = document.getElementById(btn.getAttribute("data-toggle-password"));
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.setAttribute("aria-label", show ? "Şifrəni gizlət" : "Şifrəni göstər");
        btn.setAttribute("aria-pressed", String(show));
      });
    });
  }

  // Shared chrome for protected pages: user chip, logout, mobile drawer.
  function initShell() {
    var user = Admin.auth.user();
    document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = user.name; });
    document.querySelectorAll("[data-user-email]").forEach(function (el) { el.textContent = user.email; });
    document.querySelectorAll("[data-user-initials]").forEach(function (el) { el.textContent = initials(user.name); });
    document.querySelectorAll("[data-logout]").forEach(function (el) {
      el.addEventListener("click", function () { Admin.auth.logout(); });
    });

    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("overlay");
    var burger = document.getElementById("menuToggle");
    function setOpen(open) {
      sidebar.classList.toggle("open", open);
      overlay.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    }
    burger.addEventListener("click", function () { setOpen(!sidebar.classList.contains("open")); });
    overlay.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  Admin.ui = {
    esc: esc,
    toast: toast,
    confirm: confirmDialog,
    formatDate: formatDate,
    initials: initials,
    passwordScore: passwordScore,
    bindPasswordToggles: bindPasswordToggles,
    initShell: initShell
  };
})();
