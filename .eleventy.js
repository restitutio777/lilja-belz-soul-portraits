// Eleventy config. Renders the static site from src/ into _site/.
// Content lives in src/_data/site.json (a custom editing backend will write to it).
module.exports = function (eleventyConfig) {
  // Copy static assets through untouched, preserving their paths.
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/script.js");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/og.jpg");
  eleventyConfig.addPassthroughCopy("src/images");
  // robots.txt and sitemap.xml are rendered from templates (src/robots.njk,
  // src/sitemap.njk) so their URLs follow site.meta.site_url per deployment.

  // Custom admin UI: copied verbatim, not processed as templates.
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.ignores.add("src/admin/**");

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
