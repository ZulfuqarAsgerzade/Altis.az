(function () {
  var Admin = window.Admin;
  var ui = Admin.ui;
  var esc = ui.esc;
  var $ = function (id) { return document.getElementById(id); };

  var PAGE_SIZE = 6;
  var NEW_CAT = "__new__";
  var state = { projects: [], categories: [], q: "", category: "", page: 1, editingId: null, image: "" };

  ui.initShell();

  function unique(list, key) {
    var seen = {};
    list.forEach(function (p) { if (p[key]) seen[p[key]] = true; });
    return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b, "az"); });
  }

  /* ---------- list ---------- */

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return state.projects
      .filter(function (p) {
        if (state.category && p.category !== state.category) return false;
        return !q || [p.title, p.client, p.location].join(" ").toLowerCase().indexOf(q) !== -1;
      })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  function renderFilters() {
    var sel = $("categoryFilter");
    var current = state.category;
    sel.innerHTML = '<option value="">Bütün kateqoriyalar</option>' +
      state.categories.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");
    if (state.categories.indexOf(current) === -1) state.category = current = "";
    sel.value = current;
  }

  function rowHtml(p) {
    var thumb = p.image
      ? '<img class="thumb" src="' + esc(p.image) + '" alt="" loading="lazy" />'
      : '<span class="thumb thumb-ph">' + esc(ui.initials(p.title)) + "</span>";
    return (
      "<tr>" +
      '<td><div class="cell-post">' + thumb + "<div>" +
      '<span class="post-title">' + esc(p.title) + "</span>" +
      '<span class="post-meta">' + esc([p.client, p.category].filter(Boolean).join(" · ")) + "</span></div></div></td>" +
      '<td class="col-hide-sm">' + esc(p.client) + "</td>" +
      '<td class="col-hide-sm col-hide-md"><span class="badge badge-cat">' + esc(p.category) + "</span></td>" +
      '<td class="col-hide-sm col-hide-md">' + esc(p.location) + "</td>" +
      '<td class="col-hide-sm col-date">' + esc(ui.formatDate(p.date)) + "</td>" +
      '<td class="col-actions">' +
      '<button class="btn-icon" type="button" data-edit="' + esc(p.id) + '" aria-label="Redaktə et: ' + esc(p.title) + '">' +
      '<svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></button>' +
      '<button class="btn-icon danger" type="button" data-delete="' + esc(p.id) + '" aria-label="Sil: ' + esc(p.title) + '">' +
      '<svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg></button>' +
      "</td></tr>"
    );
  }

  function render() {
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PAGE_SIZE;
    var slice = list.slice(start, start + PAGE_SIZE);

    $("statTotal").textContent = state.projects.length;
    $("statClients").textContent = unique(state.projects, "client").length;
    $("statCats").textContent = unique(state.projects, "category").length;
    $("projectRows").innerHTML = slice.map(rowHtml).join("");

    var empty = list.length === 0;
    $("projectTable").closest(".table-wrap").hidden = empty;
    $("emptyState").hidden = !empty;
    $("pager").hidden = empty;
    if (empty) {
      $("emptyText").textContent = state.projects.length === 0 ? "Hələ heç bir layihə əlavə edilməyib." : "Axtarışa uyğun nəticə yoxdur.";
    }

    $("pagerInfo").textContent = list.length ? start + 1 + "-" + (start + slice.length) + " / " + list.length : "";
    var btns = '<button type="button" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? " disabled" : "") + ' aria-label="Əvvəlki">&lsaquo;</button>';
    for (var n = 1; n <= pages; n++) {
      btns += '<button type="button" data-page="' + n + '"' + (n === state.page ? ' aria-current="page"' : "") + ">" + n + "</button>";
    }
    btns += '<button type="button" data-page="' + (state.page + 1) + '"' + (state.page === pages ? " disabled" : "") + ' aria-label="Növbəti">&rsaquo;</button>';
    $("pagerBtns").innerHTML = btns;
  }

  function load() {
    return Promise.all([Admin.store.listProjects(), Admin.store.listCategories("project")]).then(function (res) {
      state.projects = res[0];
      state.categories = res[1].map(function (c) { return c.name; }).sort(function (a, b) { return a.localeCompare(b, "az"); });
      renderFilters();
      render();
    });
  }

  /* ---------- form dialog ---------- */

  var dlg = $("projectDialog");
  var form = $("projectForm");

  function setCover(src) {
    state.image = src || "";
    $("coverPreview").hidden = !src;
    if (src) $("coverPreview").src = src;
    $("coverRemove").hidden = !src;
    $("coverErr").textContent = "";
  }

  function clearErrors() {
    form.querySelectorAll(".field").forEach(function (f) {
      f.classList.remove("invalid");
      var err = f.querySelector(".error-text");
      if (err) err.textContent = "";
    });
  }

  function fieldError(input, msg) {
    var field = input.closest(".field");
    field.classList.add("invalid");
    field.querySelector(".error-text").textContent = msg;
  }

  // Select of existing project categories plus an inline "new category" escape hatch.
  function fillCategorySelect(selected) {
    var sel = $("fCategory");
    var hasCategories = state.categories.length > 0;
    sel.innerHTML =
      (hasCategories ? "" : '<option value="">Kateqoriya yoxdur</option>') +
      state.categories.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("") +
      '<option value="' + NEW_CAT + '">+ Yeni kateqoriya əlavə et...</option>';
    sel.value = selected || (hasCategories ? state.categories[0] : NEW_CAT);
    toggleNewCategory();
  }

  function toggleNewCategory() {
    var isNew = $("fCategory").value === NEW_CAT;
    $("fCategoryNew").hidden = !isNew;
    if (isNew) $("fCategoryNew").focus();
    else $("fCategoryNew").value = "";
  }

  function openForm(id) {
    clearErrors();
    form.reset();
    state.editingId = id || null;
    var project = id && state.projects.filter(function (p) { return p.id === id; })[0];

    $("dlgTitle").textContent = project ? "Layihəni redaktə et" : "Yeni layihə";
    fillCategorySelect(project ? project.category : "");
    if (project) {
      $("fTitle").value = project.title;
      $("fClient").value = project.client || "";
      $("fLocation").value = project.location || "";
      $("fDate").value = project.date || "";
      Admin.editor.setHtml(project.content || "");
      setCover(project.image);
    } else {
      $("fDate").value = ui.today();
      setCover("");
      Admin.editor.setHtml("");
    }
    dlg.showModal();
    $("fTitle").focus();
  }

  function validate() {
    clearErrors();
    var ok = true;
    function need(input, msg, test) {
      var v = input.value.trim();
      if (!(test ? test(v) : v)) {
        fieldError(input, msg);
        ok = false;
      }
    }
    need($("fTitle"), "Ad ən azı 3 simvol olmalıdır.", function (v) { return v.length >= 3; });
    need($("fClient"), "Müştərini yazın.");
    if ($("fCategory").value === NEW_CAT) need($("fCategoryNew"), "Yeni kateqoriyanın adını yazın (ən azı 2 simvol).", function (v) { return v.length >= 2; });
    else need($("fCategory"), "Kateqoriya seçin.");
    need($("fLocation"), "Məkanı yazın.");
    need($("fDate"), "Tarixi seçin.");
    if (Admin.editor.isEmpty()) {
      fieldError($("fContent"), "Məzmun boş ola bilməz.");
      ok = false;
    }
    if (!ok) form.querySelector(".invalid input, .invalid select, .invalid [contenteditable]").focus();
    return ok;
  }

  /* ---------- events ---------- */

  $("addBtn").addEventListener("click", function () { openForm(); });
  $("emptyAdd").addEventListener("click", function () { openForm(); });

  dlg.addEventListener("click", function (e) {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
  });

  $("fCategory").addEventListener("change", toggleNewCategory);
  $("coverRemove").addEventListener("click", function () { setCover(""); $("fCover").value = ""; });
  $("fCover").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    ui.readImage(file, 800).then(setCover).catch(function (err) { $("coverErr").textContent = err.message; });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;
    var editing = !!state.editingId;
    var btn = $("saveBtn");
    btn.disabled = true;
    var creating = $("fCategory").value === NEW_CAT;
    var category = creating ? Admin.store.saveCategory($("fCategoryNew").value, null, "project") : Promise.resolve($("fCategory").value);
    category
      .then(function (categoryName) {
        return Admin.store.saveProject({
          id: state.editingId,
          title: $("fTitle").value.trim(),
          client: $("fClient").value.trim(),
          category: categoryName,
          location: $("fLocation").value.trim(),
          date: $("fDate").value,
          image: state.image,
          content: Admin.editor.getHtml()
        });
      })
      .then(function () {
        dlg.close();
        ui.toast(editing ? "Layihə yeniləndi." : "Layihə əlavə edildi.", "success");
        return load();
      })
      .catch(function (err) {
        if (creating && /artıq var/.test(err.message)) fieldError($("fCategoryNew"), err.message);
        else ui.toast(err.message, "error");
      })
      .then(function () { btn.disabled = false; });
  });

  $("projectRows").addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    var del = e.target.closest("[data-delete]");
    if (edit) return openForm(edit.getAttribute("data-edit"));
    if (!del) return;
    var id = del.getAttribute("data-delete");
    var project = state.projects.filter(function (p) { return p.id === id; })[0];
    ui.confirm({
      title: "Layihəni sil",
      text: "“" + project.title + "” layihəsi həmişəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz.",
      okLabel: "Sil"
    }).then(function (yes) {
      if (!yes) return;
      Admin.store.deleteProject(id).then(function () {
        ui.toast("Layihə silindi.", "success");
        return load();
      });
    });
  });

  $("pagerBtns").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    state.page = Number(btn.getAttribute("data-page"));
    render();
  });

  var searchTimer;
  $("searchInput").addEventListener("input", function () {
    var value = this.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { state.q = value; state.page = 1; render(); }, 200);
  });
  $("categoryFilter").addEventListener("change", function () { state.category = this.value; state.page = 1; render(); });

  load();
})();
