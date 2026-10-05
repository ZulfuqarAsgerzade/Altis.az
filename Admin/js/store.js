/*
 * Mock data layer. Everything lives in localStorage so the front end can be built and
 * reviewed without a backend. Every method returns a Promise on purpose: when the real
 * API exists, only this file (and auth.js) needs to change.
 */
(function () {
  var Admin = (window.Admin = window.Admin || {});
  var KEYS = { blogs: "altis_admin_blogs", user: "altis_admin_user", categories: "altis_admin_categories" };

    var CATEGORIES = ["Technology", "Technology Insights", "Cybersecurity", "IT Infrastructure", "Cloud Computing"];
  var IMG = "../assets/img/";

  function seed(id, title, category, status, date, image, excerpt) {
    return {
      id: "b" + id, title: title, category: category, status: status, date: date,
      image: IMG + image, excerpt: excerpt,
      content: excerpt + "\n\n(Demo content - replace with the real article text.)"
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

  function categories() {
    var list = read(KEYS.categories, null);
    if (!list) {
      list = CATEGORIES.slice();
      write(KEYS.categories, list);
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
    // Categories. Renaming cascades to blogs; deleting a category that is still in use is refused.
    listCategories: function () {
      var counts = {};
      blogs().forEach(function (b) { counts[b.category] = (counts[b.category] || 0) + 1; });
      return Promise.resolve(categories().map(function (name) { return { name: name, count: counts[name] || 0 }; }));
    },
    saveCategory: function (name, oldName) {
      name = name.trim();
      var list = categories();
      var clash = list.some(function (c) { return sameName(c, name) && c !== oldName; });
      if (clash) return Promise.reject(new Error("Bu adda kateqoriya artıq var."));
      if (oldName) {
        list = list.map(function (c) { return c === oldName ? name : c; });
        write(KEYS.blogs, blogs().map(function (b) { return b.category === oldName ? Object.assign({}, b, { category: name }) : b; }));
      } else {
        list.push(name);
      }
      write(KEYS.categories, list);
      return Promise.resolve(name);
    },
    deleteCategory: function (name) {
      var used = blogs().filter(function (b) { return b.category === name; }).length;
      if (used) return Promise.reject(new Error("Bu kateqoriyada " + used + " bloq var. Əvvəlcə onları başqa kateqoriyaya keçirin."));
      write(KEYS.categories, categories().filter(function (c) { return c !== name; }));
      return Promise.resolve();
    },
    resetBlogs: function () {
      write(KEYS.categories, CATEGORIES.slice());
      write(KEYS.blogs, SEED_BLOGS.slice());
      return Promise.resolve();
    }
  };
})();
