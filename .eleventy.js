// Eleventy config. Renders the static site from src/ into _site/.
// Content lives in src/_data/site.json (a custom editing backend will write to it).
const Image = require("@11ty/eleventy-img");
const path = require("path");

// Generate srcset variants for a local image path (e.g. "images/foo.webp").
// Returns <img> with srcset/sizes/width/height/alt and appropriate loading attrs.
async function respImg(src, alt, sizes, lazy = true, fetchpriority = null) {
  if (!src) return "";

  const fullSrc = path.join("src", src);

  let metadata;
  try {
    metadata = await Image(fullSrc, {
      widths: [480, 800, 1200, 1600],
      formats: ["webp"],
      outputDir: "./_site/images/",
      urlPath: "/images/",
      filenameFormat(id, srcPath, width, format) {
        const name = path.basename(srcPath, path.extname(srcPath));
        return `${name}-${width}w.${format}`;
      },
    });
  } catch {
    // Image not yet uploaded (e.g. placeholder path) — fall back to plain img.
    const loadAttr = lazy ? ' loading="lazy"' : "";
    const prioAttr = fetchpriority ? ` fetchpriority="${fetchpriority}"` : "";
    return `<img src="${src}" alt="${alt}"${loadAttr}${prioAttr} decoding="async" />`;
  }

  const imgs = metadata.webp;
  const largest = imgs[imgs.length - 1];
  const srcset = imgs.map((i) => i.srcset).join(", ");

  const parts = [
    `src="${largest.url}"`,
    `srcset="${srcset}"`,
    `sizes="${sizes}"`,
    `width="${largest.width}"`,
    `height="${largest.height}"`,
    `alt="${alt}"`,
    `decoding="async"`,
    lazy ? `loading="lazy"` : null,
    fetchpriority ? `fetchpriority="${fetchpriority}"` : null,
  ].filter(Boolean);

  return `<img ${parts.join(" ")} />`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addAsyncShortcode("respImg", respImg);

  // Expose srcset string for use in <link rel="preload imagesrcset=...>.
  eleventyConfig.addAsyncFilter("srcsetFor", async function (src) {
    if (!src) return "";
    const fullSrc = path.join("src", src);
    try {
      const metadata = await Image(fullSrc, {
        widths: [480, 800, 1200, 1600],
        formats: ["webp"],
        outputDir: "./_site/images/",
        urlPath: "/images/",
        filenameFormat(id, srcPath, width, format) {
          const name = path.basename(srcPath, path.extname(srcPath));
          return `${name}-${width}w.${format}`;
        },
      });
      return metadata.webp.map((i) => i.srcset).join(", ");
    } catch {
      return "";
    }
  });

  // Copy static assets through untouched, preserving their paths.
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/script.js");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/og.jpg");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");
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
