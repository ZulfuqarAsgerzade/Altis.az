(function () {
  var Admin = window.Admin;
  var $ = function (id) { return document.getElementById(id); };

  Admin.ui.bindPasswordToggles();

  function show(view) {
    $("loginView").hidden = view !== "login";
    $("forgotView").hidden = view !== "forgot";
    $(view === "login" ? "email" : "forgotEmail").focus();
  }
  $("showForgot").addEventListener("click", function () { show("forgot"); });
  $("showLogin").addEventListener("click", function () { show("login"); });

  function setError(msg) {
    var box = $("loginError");
    box.hidden = !msg;
    box.textContent = msg || "";
  }

  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("email").value;
    var password = $("password").value;
    if (!email.trim() || !password) {
      setError("E-poçt və şifrəni daxil edin.");
      return;
    }
    setError("");
    var btn = $("loginBtn");
    btn.disabled = true;
    btn.textContent = "Daxil olunur...";
    Admin.auth
      .login(email, password, $("remember").checked)
      .then(function () { location.replace("dashboard.html"); })
      .catch(function (err) {
        setError(err.message);
        btn.disabled = false;
        btn.textContent = "Daxil ol";
        $("password").select();
      });
  });

  $("forgotForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("forgotEmail");
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    input.closest(".field").classList.toggle("invalid", !valid);
    $("forgotErr").textContent = valid ? "" : "Düzgün e-poçt ünvanı daxil edin.";
    if (!valid) return;
    var btn = $("forgotBtn");
    btn.disabled = true;
    Admin.auth.requestPasswordReset(input.value.trim()).then(function () {
      $("forgotMsg").hidden = false;
      btn.disabled = false;
    });
  });
})();
