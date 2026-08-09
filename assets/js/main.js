// Vanilla JS tối giản — site phải hoạt động đầy đủ kể cả khi tắt JS (CLAUDE.md §4 invariant 1).
// Nav luôn render sẵn trong HTML (partials/header.html); phần dưới chỉ progressive-enhance
// bằng nút chuyển dark/light. Nếu JS tắt, nút không phản hồi nhưng nav và nội dung vẫn dùng
// được bình thường, theme mặc định theo prefers-color-scheme (assets/scss/main.scss).

// Reading progress bar (blog single — layouts/blog/single.html: #progress).
// Progressive enhancement thuần: không có JS thì div vẫn render nhưng
// width luôn 0, không ảnh hưởng gì tới việc đọc bài (invariant #1).
(function () {
  var bar = document.getElementById("progress");
  if (!bar) return;

  function update() {
    var h = document.documentElement;
    var scrollable = h.scrollHeight - h.clientHeight;
    var pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
    bar.style.width = pct + "%";
  }

  addEventListener("scroll", update, { passive: true });
  update();
})();

(function () {
  var STORAGE_KEY = "theme";
  var root = document.documentElement;
  var toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  function storedTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved === "light" || saved === "dark" ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function currentTheme() {
    return storedTheme() || systemTheme();
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    // Nhãn dịch sẵn qua i18n/*.toml, truyền xuống bằng data-attr trên nút
    // (partials/header.html) vì JS thuần không gọi được Hugo template func.
    toggle.setAttribute("aria-label", theme === "dark" ? toggle.dataset.labelLight : toggle.dataset.labelDark);
  }

  // Đồng bộ trạng thái nút với data-theme mà inline script trong <head>
  // (layouts/_default/baseof.html) đã set sớm để tránh flash.
  applyTheme(currentTheme());

  toggle.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    applyTheme(next);
  });
})();

// Search (homepage only) — ô luôn hiển thị, gõ tới đâu gọi thẳng Pagefind
// low-level API (layouts/index.html: .search-box) tới đó, kết quả thế chỗ
// list "Bài viết gần đây" ngay tại section bên dưới (swap #post-list <->
// #search-results), không phải dropdown riêng. Mọi label hiển thị đọc từ
// data-* do i18n render sẵn trong template (CLAUDE.md §4 invariant #9) —
// không hardcode string ngôn ngữ nào ở đây. Nếu JS tắt, input vẫn hiện
// nhưng không phản hồi — search vốn chỉ progressive-enhance (invariant #1).
(function () {
  var input = document.getElementById("search-input");
  if (!input) return;

  var heading = document.getElementById("post-list-heading");
  var countEl = document.getElementById("post-count");
  var serverList = document.getElementById("post-list");
  var resultsList = document.getElementById("search-results");
  var noResults = document.getElementById("search-no-results");
  var footer = document.getElementById("post-list-footer");

  var pagefind = null;
  var pagefindFailed = false;
  var debounceTimer;

  function loadPagefind() {
    if (pagefind || pagefindFailed) return Promise.resolve();
    return import("/pagefind/pagefind.js")
      .then(function (mod) {
        pagefind = mod;
        return pagefind.options({ language: input.dataset.lang });
      })
      .catch(function () {
        pagefindFailed = true;
      });
  }

  function setSearching(on) {
    // "searching" trên <body>: CSS (main.scss) ẩn banner/featured-project +
    // projects-grid lúc đang tìm, để kết quả nằm sát ngay dưới ô search
    // (giống cách reference collapse .feature/.books-strip lúc searching).
    document.body.classList.toggle("searching", on);
    serverList.hidden = on;
    resultsList.hidden = !on;
    footer.hidden = on;
    if (heading) {
      heading.textContent = on ? heading.dataset.searchHeading : heading.dataset.defaultHeading;
    }
    if (!on) {
      noResults.hidden = true;
      if (countEl) countEl.textContent = countEl.dataset.defaultCount;
    }
  }

  function runSearch(query) {
    if (!pagefind) return Promise.resolve();
    return pagefind.search(query).then(function (search) {
      return Promise.all(search.results.slice(0, 20).map(function (r) { return r.data(); }));
    }).then(function (data) {
      resultsList.innerHTML = "";
      if (countEl) {
        countEl.textContent = countEl.dataset.searchCountTemplate.replace("{query}", query);
      }
      if (data.length === 0) {
        noResults.hidden = false;
        noResults.textContent = noResults.dataset.template.replace("{query}", query);
        return;
      }
      noResults.hidden = true;
      data.forEach(function (r) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = r.url;
        var title = document.createElement("span");
        title.textContent = r.meta && r.meta.title ? r.meta.title : r.url;
        var summary = document.createElement("p");
        summary.className = "post-list__summary";
        summary.innerHTML = r.excerpt;
        a.appendChild(title);
        a.appendChild(summary);
        li.appendChild(a);
        resultsList.appendChild(li);
      });
    });
  }

  input.addEventListener("focus", loadPagefind, { once: true });

  input.addEventListener("input", function () {
    var query = input.value.trim();
    setSearching(query.length > 0);
    if (!query) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      loadPagefind().then(function () { return runSearch(query); });
    }, 150);
  });

  document.addEventListener("keydown", function (e) {
    var active = document.activeElement;
    var editing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
    if (e.key === "/" && !editing) {
      e.preventDefault();
      input.focus();
    } else if (e.key === "Escape" && active === input) {
      input.value = "";
      input.dispatchEvent(new Event("input"));
      input.blur();
    }
  });
})();
