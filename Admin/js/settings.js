(function () {
  var Admin = window.Admin;
  var ui = Admin.ui;
  var $ = function (id) { return document.getElementById(id); };

  ui.initShell();
  ui.bindPasswordToggles();

  var user = Admin.auth.user();
  $("pName").value = user.name;
  $("pEmail").value = user.email;

  function setError(input, msg) {
    var field = input.closest(".field");
    field.classList.toggle("invalid", !!msg);
    field.querySelector(".error-text").textContent = msg || "";
    return !msg;
  }

  /* ---------- profile ---------- */

  $("profileForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("pName").value.trim();
    if (!setError($("pName"), name.length < 2 ? "Ad ən azı 2 simvol olmalıdır." : "")) return;
    Admin.auth.updateProfile(name).then(function () {
      document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = name; });
      document.querySelectorAll("[data-user-initials]").forEach(function (el) { el.textContent = ui.initials(name); });
      ui.toast("Profil yeniləndi.", "success");
    });
  });

  /* ---------- password ---------- */

  $("pwNew").addEventListener("input", function () {
    $("pwStrength").setAttribute("data-level", this.value ? ui.passwordScore(this.value) : 0);
  });

  function showAlert(type, msg) {
    var box = $("pwAlert");
    box.hidden = !msg;
    box.className = "alert alert-" + type;
    box.textContent = msg || "";
  }

  $("passwordForm").addEventListener("submit", function (e) {
    e.preventDefault();
    showAlert("", "");
    var cur = $("pwCurrent"), next = $("pwNew"), conf = $("pwConfirm");

    var ok = true;
    ok = setError(cur, cur.value ? "" : "Cari şifrəni daxil edin.") && ok;
    var weak = next.value.length < 8 || !/[a-z]/.test(next.value) || !/[A-Z]/.test(next.value) || !/\d/.test(next.value);
    ok = setError(next, weak ? "Şifrə ən azı 8 simvol, böyük/kiçik hərf və rəqəm ehtiva etməlidir." : next.value === cur.value ? "Yeni şifrə cari şifrədən fərqli olmalıdır." : "") && ok;
    ok = setError(conf, conf.value === next.value ? "" : "Şifrələr uyğun gəlmir.") && ok;
    if (!ok) return;

    var btn = $("pwBtn");
    btn.disabled = true;
    Admin.auth.changePassword(cur.value, next.value)
      .then(function () {
        this.reset();
        $("pwStrength").setAttribute("data-level", 0);
        showAlert("success", "Şifrə uğurla dəyişdirildi.");
        ui.toast("Şifrə dəyişdirildi.", "success");
      }.bind(this))
      .catch(function (err) {
        setError(cur, err.message);
        cur.focus();
      })
      .then(function () { btn.disabled = false; });
  });
})();
