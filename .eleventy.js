// Eleventy config. Renders the static site from src/ into _site/.
// Content lives in src/_data/content.json and is edited through /admin (Sveltia CMS).
module.exports = function (eleventyConfig) {
  // Copy static assets through untouched, preserving their paths.
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/script.js");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/og.jpg");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("src/images");
  // admin/index.html is rendered as a template; copy the CMS config alongside it.
  eleventyConfig.addPassthroughCopy("src/admin/config.yml");

  return {
    dir: {
      input: "src",
      output: "_site",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
