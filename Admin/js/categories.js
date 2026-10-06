(function () {
  var Admin = window.Admin;
  var ui = Admin.ui;
  var esc = ui.esc;
  var $ = function (id) { return document.getElementById(id); };

  ui.initShell();

  var TYPES = {
    blog: {
      desc: "Bloqlarda seçilən kateqoriyaları idarə edin.",
      countHead: "Bloq sayı",
      emptyText: "İlk bloq kateqoriyasını əlavə edin.",
      deleteText: function (name) { return "“" + name + "” bloq kateqoriyası silinəcək."; }
    },
    project: {
      desc: "Layihələrdə seçilən kateqoriyaları idarə edin.",
      countHead: "Layihə sayı",
      emptyText: "İlk layihə kateqoriyasını əlavə edin.",
      deleteText: function (name) { return "“" + name + "” layihə kateqoriyası silinəcək."; }
    }
  };
  var type = "blog";
  try { if (localStorage.getItem("altis_admin_cat_tab") === "project") type = "project"; } catch (e) {}

  var items = [];
  var editing = null; // original name while renaming, null when adding
  var dlg = $("catDialog");

  function render() {
    $("catRows").closest(".table-wrap").hidden = !items.length;
    $("emptyState").hidden = items.length > 0;
    $("catRows").innerHTML = items.map(function (c) {
      return (
        "<tr>" +
        '<td><span class="post-title">' + esc(c.name) + "</span></td>" +
        "<td>" + c.count + "</td>" +
        '<td class="col-actions">' +
        '<button class="btn-icon" type="button" data-edit="' + esc(c.name) + '" aria-label="Adı dəyiş: ' + esc(c.name) + '">' +
        '<svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></button>' +
        '<button class="btn-icon danger" type="button" data-delete="' + esc(c.name) + '" aria-label="Sil: ' + esc(c.name) + '">' +
        '<svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg></button>' +
        "</td></tr>"
      );
    }).join("");
  }

  function load() {
    return Admin.store.listCategories(type).then(function (list) {
      items = list.sort(function (a, b) { return a.name.localeCompare(b.name, "az"); });
      render();
    });
  }

  function setError(msg) {
    var field = $("catName").closest(".field");
    field.classList.toggle("invalid", !!msg);
    field.querySelector(".error-text").textContent = msg || "";
  }

  function openForm(name) {
    editing = name || null;
    $("catDlgTitle").textContent = name ? "Kateqoriyanın adını dəyiş" : "Yeni kateqoriya";
    $("catName").value = name || "";
    setError("");
    dlg.showModal();
    $("catName").focus();
  }

  $("addBtn").addEventListener("click", function () { openForm(); });
  $("emptyAdd").addEventListener("click", function () { openForm(); });
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
  });

  $("catForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("catName").value.trim();
    if (name.length < 2) return setError("Ad ən azı 2 simvol olmalıdır.");
    var btn = $("catSave");
    btn.disabled = true;
    Admin.store.saveCategory(name, editing, type)
      .then(function () {
        dlg.close();
        ui.toast(editing ? "Kateqoriya yeniləndi." : "Kateqoriya əlavə edildi.", "success");
        return load();
      })
      .catch(function (err) { setError(err.message); })
      .then(function () { btn.disabled = false; });
  });

  $("catRows").addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    var del = e.target.closest("[data-delete]");
    if (edit) return openForm(edit.getAttribute("data-edit"));
    if (!del) return;
    var name = del.getAttribute("data-delete");
    ui.confirm({
      title: "Kateqoriyanı sil",
      text: TYPES[type].deleteText(name),
      okLabel: "Sil"
    }).then(function (yes) {
      if (!yes) return;
      Admin.store.deleteCategory(name, type)
        .then(function () { ui.toast("Kateqoriya silindi.", "success"); return load(); })
        .catch(function (err) { ui.toast(err.message, "error"); });
    });
  });

  function setType(next, focus) {
    type = next;
    try { localStorage.setItem("altis_admin_cat_tab", type); } catch (e) {}
    var cfg = TYPES[type];
    document.querySelectorAll(".tab").forEach(function (tab) {
      var on = tab.getAttribute("data-type") === type;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    $("pageDesc").textContent = cfg.desc;
    $("countHead").textContent = cfg.countHead;
    $("emptyState").querySelector("p").textContent = cfg.emptyText;
    return load();
  }

  document.querySelector(".tabs").addEventListener("click", function (e) {
    var tab = e.target.closest(".tab");
    if (tab) setType(tab.getAttribute("data-type"));
  });
  document.querySelector(".tabs").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setType(type === "blog" ? "project" : "blog", true);
  });

  setType(type);
})();
