(function () {
  var Admin = window.Admin;
  var ui = Admin.ui;
  var esc = ui.esc;
  var $ = function (id) { return document.getElementById(id); };

  var PAGE_SIZE = 6;
  var NEW_CAT = "__new__";
  var state = { blogs: [], categories: [], q: "", status: "", category: "", page: 1, editingId: null, image: "" };

  ui.initShell();

  /* ---------- list ---------- */

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return state.blogs
      .filter(function (b) {
        if (state.status && b.status !== state.status) return false;
        if (state.category && b.category !== state.category) return false;
        return !q || b.title.toLowerCase().indexOf(q) !== -1;
      })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  function renderStats() {
    var published = state.blogs.filter(function (b) { return b.status === "published"; }).length;
    var used = {};
    state.blogs.forEach(function (b) { used[b.category] = true; });
    $("statTotal").textContent = state.blogs.length;
    $("statPublished").textContent = published;
    $("statDraft").textContent = state.blogs.length - published;
    $("statCats").textContent = Object.keys(used).length;
  }

  function renderFilters() {
    var sel = $("categoryFilter");
    var current = state.category;
    sel.innerHTML = '<option value="">Bütün kateqoriyalar</option>' +
      state.categories.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");
    sel.value = current;
  }

  function rowHtml(b) {
    var thumb = b.image
      ? '<img class="thumb" src="' + esc(b.image) + '" alt="" loading="lazy" />'
      : '<span class="thumb thumb-ph">' + esc(ui.initials(b.title)) + "</span>";
    var published = b.status === "published";
    return (
      "<tr>" +
      '<td><div class="cell-post">' + thumb + "<div>" +
      '<span class="post-title">' + esc(b.title) + "</span>" +
      '<span class="post-meta">' + esc(b.category) + "</span></div></div></td>" +
      '<td class="col-hide-sm col-hide-md"><span class="badge badge-cat">' + esc(b.category) + "</span></td>" +
      '<td><span class="badge ' + (published ? "badge-published" : "badge-draft") + '">' + (published ? "Dərc olunub" : "Qaralama") + "</span></td>" +
      '<td class="col-hide-sm col-date">' + esc(ui.formatDate(b.date)) + "</td>" +
      '<td class="col-actions">' +
      '<button class="btn-icon" type="button" data-edit="' + esc(b.id) + '" aria-label="Redaktə et: ' + esc(b.title) + '">' +
      '<svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></button>' +
      '<button class="btn-icon danger" type="button" data-delete="' + esc(b.id) + '" aria-label="Sil: ' + esc(b.title) + '">' +
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

    renderStats();
    $("blogRows").innerHTML = slice.map(rowHtml).join("");

    var empty = list.length === 0;
    $("blogTable").closest(".table-wrap").hidden = empty;
    $("emptyState").hidden = !empty;
    $("pager").hidden = empty;
    if (empty) {
      var noData = state.blogs.length === 0;
      $("emptyText").textContent = noData ? "Hələ heç bir bloq əlavə edilməyib." : "Axtarışa uyğun nəticə yoxdur.";
    }

    $("pagerInfo").textContent = list.length ? start + 1 + "-" + (start + slice.length) + " / " + list.length : "";
    var btns = '<button type="button" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? " disabled" : "") + ' aria-label="Əvvəlki">&lsaquo;</button>';
    for (var p = 1; p <= pages; p++) {
      btns += '<button type="button" data-page="' + p + '"' + (p === state.page ? ' aria-current="page"' : "") + ">" + p + "</button>";
    }
    btns += '<button type="button" data-page="' + (state.page + 1) + '"' + (state.page === pages ? " disabled" : "") + ' aria-label="Növbəti">&rsaquo;</button>';
    $("pagerBtns").innerHTML = btns;
  }

  function load() {
    return Promise.all([Admin.store.listBlogs(), Admin.store.listCategories()]).then(function (res) {
      state.blogs = res[0];
      state.categories = res[1].map(function (c) { return c.name; }).sort(function (a, b) { return a.localeCompare(b, "az"); });
      renderFilters();
      render();
    });
  }

  /* ---------- form dialog ---------- */

  var dlg = $("blogDialog");
  var form = $("blogForm");

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

  function updateCount() {
    $("excerptCount").textContent = $("fExcerpt").value.length + " / 200";
  }

  // Select of existing categories plus an inline "new category" escape hatch.
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
    var blog = id && state.blogs.filter(function (b) { return b.id === id; })[0];

    $("dlgTitle").textContent = blog ? "Bloqu redaktə et" : "Yeni bloq";
    fillCategorySelect(blog ? blog.category : "");

    if (blog) {
      $("fTitle").value = blog.title;
      $("fStatus").value = blog.status;
      $("fExcerpt").value = blog.excerpt || "";
      Admin.editor.setHtml(blog.content || "");
      setCover(blog.image);
    } else {
      setCover("");
      Admin.editor.setHtml("");
    }
    updateCount();
    dlg.showModal();
    $("fTitle").focus();
  }

  function validate() {
    clearErrors();
    var ok = true;
    function need(input, msg, test) {
      if (!(test ? test(input.value.trim()) : input.value.trim())) {
        fieldError(input, msg);
        ok = false;
      }
    }
    need($("fTitle"), "Başlıq ən azı 3 simvol olmalıdır.", function (v) { return v.length >= 3; });
    if ($("fCategory").value === NEW_CAT) need($("fCategoryNew"), "Yeni kateqoriyanın adını yazın (ən azı 2 simvol).", function (v) { return v.length >= 2; });
    else need($("fCategory"), "Kateqoriya seçin.");
    if (Admin.editor.isEmpty()) {
      fieldError($("fContent"), "Məzmun boş ola bilməz.");
      ok = false;
    }
    if (!ok) form.querySelector(".invalid input, .invalid select, .invalid textarea, .invalid [contenteditable]").focus();
    return ok;
  }

  /* ---------- events ---------- */

  $("addBtn").addEventListener("click", function () { openForm(); });
  $("emptyAdd").addEventListener("click", function () { openForm(); });

  dlg.addEventListener("click", function (e) {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
  });

  $("fExcerpt").addEventListener("input", updateCount);
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
    var existing = state.blogs.filter(function (b) { return b.id === state.editingId; })[0];
    var btn = $("saveBtn");
    btn.disabled = true;
    var creating = $("fCategory").value === NEW_CAT;
    var category = creating ? Admin.store.saveCategory($("fCategoryNew").value) : Promise.resolve($("fCategory").value);
    category
      .then(function (categoryName) { return saveWith(categoryName); })
      .then(function () {
        dlg.close();
        ui.toast(editing ? "Bloq yeniləndi." : "Bloq əlavə edildi.", "success");
        return load();
      })
      .catch(function (err) {
        if (creating && /artıq var/.test(err.message)) fieldError($("fCategoryNew"), err.message);
        else ui.toast(err.message, "error");
      })
      .then(function () { btn.disabled = false; });

    function saveWith(categoryName) {
      return Admin.store.saveBlog({
        id: state.editingId,
        title: $("fTitle").value.trim(),
        category: categoryName,
        status: $("fStatus").value,
        date: existing ? existing.date : ui.today(),
        image: state.image,
        excerpt: $("fExcerpt").value.trim(),
        content: Admin.editor.getHtml()
      });
    }
  });

  $("blogRows").addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    var del = e.target.closest("[data-delete]");
    if (edit) return openForm(edit.getAttribute("data-edit"));
    if (!del) return;
    var id = del.getAttribute("data-delete");
    var blog = state.blogs.filter(function (b) { return b.id === id; })[0];
    ui.confirm({
      title: "Bloqu sil",
      text: "“" + blog.title + "” bloqu həmişəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz.",
      okLabel: "Sil"
    }).then(function (yes) {
      if (!yes) return;
      Admin.store.deleteBlog(id).then(function () {
        ui.toast("Bloq silindi.", "success");
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
  $("statusFilter").addEventListener("change", function () { state.status = this.value; state.page = 1; render(); });
  $("categoryFilter").addEventListener("change", function () { state.category = this.value; state.page = 1; render(); });

  load();
})();
