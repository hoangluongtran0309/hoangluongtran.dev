// Đọc bởi resources.PostCSS trong Hugo Pipes (layouts/_default/baseof.html).
// autoprefixer luôn chạy; cssnano chỉ minify khi build production (HUGO_ENVIRONMENT=production),
// tránh làm chậm hugo server lúc dev.
module.exports = {
  plugins: [
    require("autoprefixer"),
    process.env.HUGO_ENVIRONMENT === "production" ? require("cssnano") : null,
  ].filter(Boolean),
};
