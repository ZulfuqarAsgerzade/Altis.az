/*
 * Mock data layer. Everything lives in localStorage so the front end can be built and
 * reviewed without a backend. Every method returns a Promise on purpose: when the real
 * API exists, only this file (and auth.js) needs to change.
 */
(function () {
  var Admin = (window.Admin = window.Admin || {});
  var KEYS = { blogs: "altis_admin_blogs", user: "altis_admin_user", categories: "altis_admin_categories", projects: "altis_admin_projects", projectCategories: "altis_admin_project_categories" };

    var CATEGORIES = ["Technology", "Technology Insights", "Cybersecurity", "IT Infrastructure", "Cloud Computing"];
  var IMG = "../assets/img/";

  function seed(id, title, category, status, date, image, excerpt) {
    return {
      id: "b" + id, title: title, category: category, status: status, date: date,
      image: IMG + image, excerpt: excerpt,
      content: "<p>" + excerpt + "</p><p>(Demo content - replace with the real article text.)</p>"
    };
  }

  var SEED_BLOGS = [
    seed(1, "5 Ways advanced materials are changing industries", "Cloud Computing", "published", "2024-05-22", "664d81d2925d4cb5a22ebb2d_blog-image-01-p-500.jpg", "How new composites and alloys are reshaping production lines."),
    seed(2, "Effective supply chain management strategies in 2024", "Cloud Computing", "published", "2024-05-18", "664d81e2b263bf87c3a88572_blog-image-02-p-500.jpg", "Practical steps to make a supply chain more resilient and transparent."),
    seed(3, "Maximizing efficiency with lean manufacturing techniques", "Technology", "published", "2024-05-12", "664d81ed116503b9d80edec6_blog-image-03-p-500.jpg", "Lean tools that reduce waste without slowing the line down."),
    seed(4, "Transforming workflow with lean manufacturing principles", "Technology", "published", "2024-05-03", "664d81f81002baa1be52b510_blog-image-04-p-500.jpg", "Rethinking the shop floor workflow from the first station to the last."),
    seed(5, "Cutting costs with lean manufacturing methods", "IT Infrastructure", "draft", "2024-04-27", "664d8201116503b9d80eefbb_blog-image-05-p-500.jpg", "Where the biggest savings hide in a typical production process."),
    seed(6, "Achieving peak efficiency with lean manufacturing", "Technology Insights", "published", "2024-04-19", "664d820e5d24eafae969e9e4_blog-image-06-p-500.jpg", "Measuring and sustaining efficiency gains over the long term."),
    seed(7, "Streamlining production with lean manufacturing", "Cybersecurity", "draft", "2024-04-08", "664d821796df5eaf7951fc1d_blog-image-07-p-500.jpg", "A step-by-step approach to simplifying complex production flows."),
    seed(8, "Lean manufacturing for optimal efficiency", "Cybersecurity", "published", "2024-03-29", "664d8220081e5982318964ce_blog-image-08-p-500.jpg", "The core principles every manufacturer should know.")
  ];

  // Projects: title, content (HTML), date, image, client, category, location.
  function seedProject(id, title, date, image, client, category, location, summary) {
    return {
      id: "p" + id, title: title, date: date, image: IMG + image,
      client: client, category: category, location: location,
      content: "<p>" + summary + "</p>"
    };
  }

  var SEED_PROJECTS = [
    seedProject(1, "Təmiz enerjinin gələcəyini formalaşdırırıq", "2024-06-29", "667ff2f687dbb7496c9d315e_project-image-01-p-500.jpg", "Tikinti", "Səhiyyə", "489 Depot Road Midland", "Qabaqcıl həllərimiz bərpa olunan resursların gücündən istifadə edərək daha yaşıl və daha səmərəli dünyaya yol açır."),
    seedProject(2, "Bərpa olunan enerjidə inqilab", "2024-06-29", "667ff2ff96ab0d941cdc8cf1_project-image-02-p-500.jpg", "Logistika", "Təhsil", "489 Depot Road Midland", "Müasir həllərimiz günəş, külək və digər bərpa olunan resurslardan istifadəni optimallaşdıraraq daha təmiz gələcəyə keçidi sürətləndirir."),
    seedProject(3, "Aerokosmik struktur həlləri", "2024-06-29", "667ff30839d419f849d35169_project-image-03-p-500.jpg", "Tikinti", "İnfrastruktur", "489 Depot Road Midland", "Biz innovativ aerokosmik struktur həllərində ixtisaslaşırıq; performansı, təhlükəsizliyi və səmərəliliyi artırmaq üçün qabaqcıl materiallar və müasir mühəndislik təklif edirik."),
    seedProject(4, "Bərpa olunan enerji həlləri", "2024-06-29", "667ff31000741aee88bc9a88_project-image-04-p-500.jpg", "Avtomobil sənayesi", "Energetika", "489 Depot Road Midland", "İnnovativ texnologiyalarımız və peşəkar xidmətlərimiz səmərəliliyi artırır, ətraf mühitə təsiri azaldır və daha yaşıl gələcəyi dəstəkləyir."),
    seedProject(5, "Sənaye avadanlıqlarının optimallaşdırılması", "2024-06-29", "667ff31896ab54609ec51fb5_project-image-05-p-500.jpg", "Sənaye avtomatlaşdırması", "Texnologiya", "489 Depot Road Midland", "Səmərəliliyi artırmaq və məhsuldarlığı maksimuma çatdırmaq üçün sənaye avadanlıqlarını optimallaşdırırıq. Qabaqcıl həllərimiz dayanma müddətini azaldır."),
    seedProject(6, "Dəniz yataqlarının optimallaşdırılması", "2024-06-29", "664ee642bf1957cdc29c9ee3_project-image-04-p-500.jpg", "Texnologiya", "Nəqliyyat", "489 Depot Road Midland", "İnteqrasiya olunmuş həllərimiz səmərəliliyi və davamlılığı artıraraq daha təmiz və daha yaşıl gələcəyə aparır."),
    seedProject(7, "Bərpa olunan enerji inqilabı", "2024-06-29", "667ff3285c73ea180b802ee7_project-image-07-p-500.jpg", "Tikinti", "Səhiyyə", "489 Depot Road Midland", "Daha təmiz və daha yaşıl gələcək üçün külək, günəş və digər davamlı enerji mənbələrindən istifadə edən innovativ həllər təqdim edirik."),
    seedProject(8, "Avtomobil komponentlərində innovasiya", "2024-06-29", "667ff330e86dbcc2ec18a2e0_project-image-08-p-500.jpg", "Logistika", "Təhsil", "489 Depot Road Midland", "Biz avtomobil komponentlərində innovasiyada liderik; nəqliyyat vasitələrinin performansını, təhlükəsizliyini və səmərəliliyini artıran müasir hissələr hazırlayırıq.")
  ];

  // MOCK ONLY: the credentials below exist so the login flow can be tried without a backend.
  // Remove them (and the demo hint on index.html) when the real auth API is connected.
  var SEED_USER = { name: "Admin", email: "admin@altis.az", password: "Admin123!" };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function blogs() {
    var list = read(KEYS.blogs, null);
    if (!list) {
      list = SEED_BLOGS.slice();
      write(KEYS.blogs, list);
    }
    return list;
  }

  function projects() {
    var list = read(KEYS.projects, null);
    if (!list) {
      list = SEED_PROJECTS.slice();
      write(KEYS.projects, list);
    }
    return list;
  }

  function uniqueCategories(list) {
    var seen = [];
    list.forEach(function (item) { if (item.category && seen.indexOf(item.category) === -1) seen.push(item.category); });
    return seen;
  }

  // Blogs and projects each keep their own category list (and their own count/rename/delete rules).
  var CAT_TYPES = {
    blog: {
      key: KEYS.categories, items: blogs, itemsKey: KEYS.blogs, label: "bloq",
      defaults: function () { return CATEGORIES.slice(); }
    },
    project: {
      key: KEYS.projectCategories, items: projects, itemsKey: KEYS.projects, label: "layihə",
      defaults: function () { return uniqueCategories(projects()); }
    }
  };

  function catType(type) {
    return CAT_TYPES[type] || CAT_TYPES.blog;
  }

  function categories(type) {
    var t = catType(type);
    var list = read(t.key, null);
    if (!list) {
      list = t.defaults();
      write(t.key, list);
    }
    return list;
  }

  function sameName(a, b) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  function newId() {
    return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  Admin.store = {
    KEYS: KEYS,
    CATEGORIES: CATEGORIES,
    read: read,
    write: write,
    seedUser: function () {
      var user = read(KEYS.user, null);
      if (!user) {
        user = SEED_USER;
        write(KEYS.user, user);
      }
      return user;
    },
    listBlogs: function () {
      return Promise.resolve(blogs());
    },
    saveBlog: function (blog) {
      var list = blogs();
      var index = list.findIndex(function (b) { return b.id === blog.id; });
      var saved = Object.assign({}, blog, { id: blog.id || newId() });
      if (index >= 0) list[index] = saved;
      else list.unshift(saved);
      return write(KEYS.blogs, list)
        ? Promise.resolve(saved)
        : Promise.reject(new Error("Yaddaş doludur. Daha kiçik şəkil seçin."));
    },
    deleteBlog: function (id) {
      var list = blogs().filter(function (b) { return b.id !== id; });
      write(KEYS.blogs, list);
      return Promise.resolve();
    },
    listProjects: function () {
      return Promise.resolve(projects());
    },
    saveProject: function (project) {
      var list = projects();
      var index = list.findIndex(function (p) { return p.id === project.id; });
      var saved = Object.assign({}, project, { id: project.id || "p" + newId().slice(1) });
      if (index >= 0) list[index] = saved;
      else list.unshift(saved);
      return write(KEYS.projects, list)
        ? Promise.resolve(saved)
        : Promise.reject(new Error("Yaddaş doludur. Daha kiçik şəkil seçin."));
    },
    deleteProject: function (id) {
      write(KEYS.projects, projects().filter(function (p) { return p.id !== id; }));
      return Promise.resolve();
    },
    // Categories (type: "blog" | "project", default "blog"). Renaming cascades to the items using the
    // category; deleting a category that is still in use is refused.
    listCategories: function (type) {
      var counts = {};
      catType(type).items().forEach(function (item) { counts[item.category] = (counts[item.category] || 0) + 1; });
      return Promise.resolve(categories(type).map(function (name) { return { name: name, count: counts[name] || 0 }; }));
    },
    saveCategory: function (name, oldName, type) {
      var t = catType(type);
      name = name.trim();
      var list = categories(type);
      var clash = list.some(function (c) { return sameName(c, name) && c !== oldName; });
      if (clash) return Promise.reject(new Error("Bu adda kateqoriya artıq var."));
      if (oldName) {
        list = list.map(function (c) { return c === oldName ? name : c; });
        write(t.itemsKey, t.items().map(function (item) { return item.category === oldName ? Object.assign({}, item, { category: name }) : item; }));
      } else {
        list.push(name);
      }
      write(t.key, list);
      return Promise.resolve(name);
    },
    deleteCategory: function (name, type) {
      var t = catType(type);
      var used = t.items().filter(function (item) { return item.category === name; }).length;
      if (used) return Promise.reject(new Error("Bu kateqoriyada " + used + " " + t.label + " var. Əvvəlcə onları başqa kateqoriyaya keçirin."));
      write(t.key, categories(type).filter(function (c) { return c !== name; }));
      return Promise.resolve();
    },
    resetBlogs: function () {
      write(KEYS.categories, CATEGORIES.slice());
      write(KEYS.blogs, SEED_BLOGS.slice());
      write(KEYS.projects, SEED_PROJECTS.slice());
      write(KEYS.projectCategories, uniqueCategories(SEED_PROJECTS));
      return Promise.resolve();
    }
  };
})();
