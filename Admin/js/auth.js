/*
 * Mock auth. A session is a small record in sessionStorage ("remember me" -> localStorage).
 * This is a front-end placeholder only - real auth must be enforced by the backend.
 */
(function () {
  var Admin = window.Admin;
  var SESSION_KEY = "altis_admin_session";

  function readSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function delay(ms, value) {
    return new Promise(function (resolve) { setTimeout(function () { resolve(value); }, ms); });
  }

  Admin.auth = {
    isAuthed: function () { return !!readSession(); },

    // Call at the top of every protected page, before it renders.
    require: function () {
      if (!readSession()) location.replace("index.html");
    },

    // Call on the login page so an already signed-in admin goes straight to the dashboard.
    redirectIfAuthed: function () {
      if (readSession()) location.replace("dashboard.html");
    },

    user: function () {
      var session = readSession();
      var user = Admin.store.seedUser();
      return { name: user.name, email: session ? session.email : user.email };
    },

    login: function (email, password, remember) {
      var user = Admin.store.seedUser();
      var ok = email.trim().toLowerCase() === user.email && password === user.password;
      return delay(600).then(function () {
        if (!ok) throw new Error("E-poçt və ya şifrə yanlışdır.");
        var session = JSON.stringify({ email: user.email, at: Date.now() });
        clearSession();
        try {
          (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, session);
        } catch (e) {
          throw new Error("Brauzer yaddaşı əlçatan deyil.");
        }
      });
    },

    logout: function () {
      clearSession();
      location.replace("index.html");
    },

    requestPasswordReset: function (email) {
      // Always resolves the same way so the form never reveals which e-mails exist.
      return delay(600, { email: email });
    },

    updateProfile: function (name) {
      var user = Admin.store.seedUser();
      user.name = name;
      Admin.store.write(Admin.store.KEYS.user, user);
      return Promise.resolve(user);
    },

    changePassword: function (current, next) {
      var user = Admin.store.seedUser();
      return delay(500).then(function () {
        if (current !== user.password) throw new Error("Cari şifrə yanlışdır.");
        user.password = next;
        Admin.store.write(Admin.store.KEYS.user, user);
      });
    }
  };
})();
