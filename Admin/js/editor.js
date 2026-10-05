/*
 * Small rich-text editor on top of contenteditable (no external library).
 * Every HTML string that goes in (paste, saved content) or comes out (getHtml) is run through
 * sanitize(), which keeps only a whitelist of tags/attributes. The backend must sanitize again
 * before storing or rendering this HTML - never trust the client.
 */
(function () {
  var Admin = window.Admin;
  var ui = Admin.ui;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- sanitizer ---------- */

  var ALLOWED = { p: 1, br: 1, strong: 1, em: 1, u: 1, s: 1, h2: 1, h3: 1, ul: 1, ol: 1, li: 1, a: 1, img: 1, iframe: 1, blockquote: 1, hr: 1 };
  var ALIAS = { B: "strong", I: "em", STRIKE: "s", DEL: "s", H1: "h2", H4: "h3", H5: "h3", H6: "h3", DIV: "p" };
  var DROP = { SCRIPT: 1, STYLE: 1, OBJECT: 1, EMBED: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, FORM: 1, INPUT: 1, TEXTAREA: 1, BUTTON: 1, SELECT: 1, LINK: 1, META: 1, HEAD: 1 };

  function safeUrl(url, forImage) {
    url = String(url || "").trim();
    if (!url) return "";
    if (/^(https?:|mailto:|tel:)/i.test(url)) return forImage && !/^https?:/i.test(url) ? "" : url;
    if (forImage && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(url)) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return ""; // any other scheme (javascript:, data:, ...)
    return url; // relative path or #anchor
  }

  // Only YouTube embeds are allowed as iframes, and only in this exact normalized form.
  var EMBED_RE = /^https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})$/;

  function youtubeId(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url;
    var u;
    try { u = new URL(url); } catch (e) { return ""; }
    if (!/^https?:$/.test(u.protocol)) return "";
    var host = u.hostname.replace(/^(www|m|music)\./, "");
    var id = "";
    if (host === "youtu.be") id = u.pathname.split("/")[1];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      var parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "watch") id = u.searchParams.get("v");
      else if (/^(embed|shorts|live|v)$/.test(parts[0])) id = parts[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : "";
  }

  function videoHtml(id) {
    var f = document.createElement("iframe");
    f.setAttribute("src", "https://www.youtube-nocookie.com/embed/" + id);
    f.setAttribute("title", "YouTube video");
    f.setAttribute("loading", "lazy");
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    f.setAttribute("allow", "accelerometer; encrypted-media; gyroscope; picture-in-picture");
    return f;
  }

  function walk(src, dest) {
    src.childNodes.forEach(function (n) {
      if (n.nodeType === 3) return dest.appendChild(document.createTextNode(n.nodeValue));
      if (n.nodeType !== 1 || DROP[n.tagName]) return;
      var name = ALIAS[n.tagName] || n.tagName.toLowerCase();
      if (!ALLOWED[name]) return walk(n, dest); // unknown tag: keep its text, drop the wrapper
      var el = document.createElement(name);
      if (name === "a") {
        var href = safeUrl(n.getAttribute("href"));
        if (!href) return walk(n, dest);
        el.setAttribute("href", href);
        el.setAttribute("rel", "noopener noreferrer");
        if (n.getAttribute("target") === "_blank") el.setAttribute("target", "_blank");
      } else if (name === "img") {
        var src2 = safeUrl(n.getAttribute("src"), true);
        if (!src2) return;
        el.setAttribute("src", src2);
        el.setAttribute("alt", n.getAttribute("alt") || "");
        return dest.appendChild(el);
      } else if (name === "iframe") {
        var m = EMBED_RE.exec(n.getAttribute("src") || "");
        if (m) dest.appendChild(videoHtml(m[1]));
        return;
      } else if (name === "br" || name === "hr") {
        return dest.appendChild(el);
      }
      walk(n, el);
      if (name === "p" && !el.firstChild) return; // e.g. <p></p> left behind when a list is created inside a paragraph
      dest.appendChild(el);
    });
  }

  function sanitize(html) {
    var doc = new DOMParser().parseFromString(String(html || ""), "text/html"); // inert: nothing runs or loads
    var box = document.createElement("div");
    walk(doc.body, box);
    return box.innerHTML;
  }

  // Older saved content may be plain text: turn blank-line separated blocks into paragraphs.
  function toHtml(content) {
    content = String(content || "");
    if (/<[a-z][\s\S]*>/i.test(content)) return sanitize(content);
    return content.split(/\n{2,}/).filter(function (t) { return t.trim(); }).map(function (t) {
      return "<p>" + ui.esc(t.trim()).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  /* ---------- editor ---------- */

  var area = $("fContent");
  var toolbar = $("rteToolbar");
  var savedRange = null;

  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) {}

  function isEmpty() {
    return !area.textContent.trim() && !area.querySelector("img, hr, iframe");
  }

  function sync() {
    area.classList.toggle("is-empty", isEmpty());
    updateState();
  }

  function inEditor(node) { return node && area.contains(node); }

  function saveRange() {
    var sel = getSelection();
    if (sel.rangeCount && inEditor(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
  }

  function restoreRange() {
    area.focus();
    if (!savedRange) return;
    var sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  function currentBlock() {
    var sel = getSelection();
    var node = sel.anchorNode;
    while (node && node !== area) {
      if (node.nodeType === 1 && /^(H2|H3|BLOCKQUOTE|P|LI)$/.test(node.tagName)) return node.tagName.toLowerCase();
      node = node.parentNode;
    }
    return "";
  }

  function currentAnchor() {
    var sel = getSelection();
    var node = sel.anchorNode;
    while (node && node !== area) {
      if (node.nodeType === 1 && node.tagName === "A") return node;
      node = node.parentNode;
    }
    return null;
  }

  function updateState() {
    var sel = getSelection();
    if (!sel.rangeCount || !inEditor(sel.anchorNode)) return;
    var block = currentBlock();
    toolbar.querySelectorAll("[data-state]").forEach(function (b) {
      var on = false;
      try { on = document.queryCommandState(b.getAttribute("data-cmd")); } catch (e) {}
      b.setAttribute("aria-pressed", String(on));
    });
    toolbar.querySelectorAll("[data-block]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(block === b.getAttribute("data-block")));
    });
  }

  function run(cmd, value) {
    restoreRange();
    document.execCommand(cmd, false, value || null);
    saveRange();
    sync();
  }

  function toggleBlock(tag) {
    restoreRange();
    document.execCommand("formatBlock", false, currentBlock() === tag ? "p" : tag);
    saveRange();
    sync();
  }

  /* ---------- link ---------- */

  var linkDlg = $("linkDialog");

  function openLink() {
    saveRange();
    var a = currentAnchor();
    $("linkUrl").value = a ? a.getAttribute("href") : "";
    $("linkNewTab").checked = a ? a.getAttribute("target") === "_blank" : false;
    $("linkRemove").hidden = !a;
    linkDlg.querySelector(".field").classList.remove("invalid");
    linkDlg.querySelector(".error-text").textContent = "";
    linkDlg.showModal();
    $("linkUrl").focus();
  }

  function normalizeUrl(v) {
    v = v.trim();
    // "altis.az" -> "https://altis.az"
    if (v && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(v) && /^[^\s/]+\.[^\s/]+/.test(v)) v = "https://" + v;
    return safeUrl(v);
  }

  function styleAnchor(a, newTab) {
    a.setAttribute("rel", "noopener noreferrer");
    if (newTab) a.setAttribute("target", "_blank");
    else a.removeAttribute("target");
  }

  $("linkForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var url = normalizeUrl($("linkUrl").value);
    var field = $("linkUrl").closest(".field");
    field.classList.toggle("invalid", !url);
    field.querySelector(".error-text").textContent = url ? "" : "Düzgün link yazın (məs: https://altis.az).";
    if (!url) return;
    var newTab = $("linkNewTab").checked;
    linkDlg.close();
    restoreRange();

    var existing = currentAnchor();
    if (existing) {
      existing.setAttribute("href", url);
      styleAnchor(existing, newTab);
    } else if (getSelection().isCollapsed) {
      var tmp = document.createElement("a");
      tmp.setAttribute("href", url);
      tmp.textContent = url;
      styleAnchor(tmp, newTab);
      document.execCommand("insertHTML", false, tmp.outerHTML);
    } else {
      document.execCommand("createLink", false, url);
      area.querySelectorAll("a:not([rel])").forEach(function (a) { styleAnchor(a, newTab); });
    }
    saveRange();
    sync();
  });

  $("linkRemove").addEventListener("click", function () {
    var a = currentAnchor();
    linkDlg.close();
    restoreRange();
    if (a) {
      var range = document.createRange();
      range.selectNodeContents(a);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
    document.execCommand("unlink");
    saveRange();
    sync();
  });

  /* ---------- image ---------- */

  var imgDlg = $("imageDialog");

  function openImage() {
    saveRange();
    $("imageForm").reset();
    var field = $("imageAlt").closest(".field");
    field.classList.remove("invalid");
    field.querySelector(".error-text").textContent = "";
    imgDlg.showModal();
  }

  function insertImage(src, alt) {
    restoreRange();
    var img = document.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", alt);
    document.execCommand("insertHTML", false, img.outerHTML);
    saveRange();
    sync();
  }

  $("imageForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var file = $("imageFile").files[0];
    var url = safeUrl($("imageUrl").value, true);
    var field = $("imageAlt").closest(".field");
    var err = field.querySelector(".error-text");
    function fail(msg) { field.classList.add("invalid"); err.textContent = msg; }
    if (!file && !url) return fail("Şəkil seçin və ya düzgün http(s) link yazın.");
    var alt = $("imageAlt").value.trim();
    var btn = $("imageSubmit");
    btn.disabled = true;
    (file ? ui.readImage(file, 1000) : Promise.resolve(url))
      .then(function (src) { imgDlg.close(); insertImage(src, alt); })
      .catch(function (error) { fail(error.message); })
      .then(function () { btn.disabled = false; });
  });

  [linkDlg, imgDlg, $("videoDialog")].forEach(function (dlg) {
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    });
  });

  /* ---------- video ---------- */

  var videoDlg = $("videoDialog");

  function openVideo() {
    saveRange();
    $("videoForm").reset();
    var field = $("videoUrl").closest(".field");
    field.classList.remove("invalid");
    field.querySelector(".error-text").textContent = "";
    videoDlg.showModal();
    $("videoUrl").focus();
  }

  $("videoForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = youtubeId($("videoUrl").value);
    var field = $("videoUrl").closest(".field");
    field.classList.toggle("invalid", !id);
    field.querySelector(".error-text").textContent = id ? "" : "Düzgün YouTube linki yazın (məs: https://www.youtube.com/watch?v=...).";
    if (!id) return;
    videoDlg.close();
    restoreRange();
    document.execCommand("insertHTML", false, videoHtml(id).outerHTML);
    saveRange();
    sync();
  });

  /* ---------- wiring ---------- */

  // Keep the text selection when a toolbar button is pressed.
  toolbar.addEventListener("mousedown", function (e) { if (e.target.closest(".rte-btn")) e.preventDefault(); });
  toolbar.addEventListener("click", function (e) {
    var btn = e.target.closest(".rte-btn");
    if (!btn) return;
    var cmd = btn.getAttribute("data-cmd");
    if (cmd === "h2" || cmd === "h3") toggleBlock(cmd);
    else if (cmd === "quote") toggleBlock("blockquote");
    else if (cmd === "link") openLink();
    else if (cmd === "image") openImage();
    else if (cmd === "video") openVideo();
    else run(cmd);
  });

  area.addEventListener("input", sync);
  area.addEventListener("keyup", function () { saveRange(); updateState(); });
  area.addEventListener("mouseup", function () { saveRange(); updateState(); });
  area.addEventListener("blur", saveRange);
  area.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openLink();
    }
  });
  area.addEventListener("paste", function (e) {
    e.preventDefault();
    var data = e.clipboardData;
    var html = data.getData("text/html");
    if (html) document.execCommand("insertHTML", false, sanitize(html));
    else document.execCommand("insertText", false, data.getData("text/plain"));
    sync();
  });
  area.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files.length) e.preventDefault(); });

  Admin.editor = {
    sanitize: sanitize,
    youtubeId: youtubeId,
    isEmpty: isEmpty,
    setHtml: function (content) {
      area.innerHTML = toHtml(content);
      savedRange = null;
      sync();
    },
    getHtml: function () {
      return isEmpty() ? "" : sanitize(area.innerHTML);
    },
    focus: function () { area.focus(); }
  };
})();
