// Eleventy config. Renders the static site from src/ into _site/.
// Content lives in src/_data/site.json (a custom editing backend will write to it).
const path = require("path");
const Image = require("@11ty/eleventy-img");

// Responsive images (engine-level, no admin changes): every gallery/raum/hero
// image is re-encoded at 480/800/1200/1600px (capped to the source's native
// width, never upscaled) so phones stop downloading the full ~2400px upload.
// The originals stay in src/images/ untouched (admin previews and og:image
// still reference the stored path directly); this only affects what's linked
// from the page.
const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600];
const RASTER_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function imageMetadata(imagePath) {
  // SVG/GIF are uploaded untouched by the admin (vectors/animation would be
  // rasterised or flattened by re-encoding) — skip responsive processing for
  // them and fall back to the original file.
  if (!RASTER_EXT.has(path.extname(imagePath).toLowerCase())) return null;
  return Image(path.join("src", imagePath), {
    widths: RESPONSIVE_WIDTHS, // eleventy-img clamps/drops widths above the source's native size
    formats: ["webp"],
    outputDir: "_site/images/",
    urlPath: "/images/",
    filenameFormat: (id, srcPath, width) => {
      const base = path.basename(srcPath, path.extname(srcPath));
      return `${base}-${width}w.webp`;
    },
  });
}

// Builds a plain <img srcset sizes ...>, no <picture> wrapper — keeps the
// markup shape (and the CSS selectors that target `.foo img`) unchanged.
async function respimgTag(imagePath, alt, opts = {}) {
  let metadata;
  try {
    metadata = await imageMetadata(imagePath);
  } catch (err) {
    metadata = null; // corrupt/missing source: fail soft, still buildable
  }
  const attrs = {
    alt: alt || "",
    width: opts.width,
    height: opts.height,
    sizes: opts.sizes || "100vw",
    decoding: "async",
  };
  if (opts.loading !== false) attrs.loading = opts.loading || "lazy";
  if (opts.fetchpriority) attrs.fetchpriority = opts.fetchpriority;
  if (opts.class) attrs.class = opts.class;

  if (metadata && metadata.webp && metadata.webp.length) {
    const entries = metadata.webp; // ascending by width
    attrs.src = entries[entries.length - 1].url;
    attrs.srcset = entries.map((e) => `${e.url} ${e.width}w`).join(", ");
  } else {
    attrs.src = "/" + imagePath;
  }
  return "<img " + Object.entries(attrs)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`)
    .join(" ") + " />";
}

// Builds a <link rel="preload" as="image" imagesrcset imagesizes> matching
// the same variants as respimgTag, so the hero's LCP preload actually fetches
// the size the browser will pick — not the full-resolution original.
async function respimgPreloadTag(imagePath, opts = {}) {
  let metadata;
  try {
    metadata = await imageMetadata(imagePath);
  } catch (err) {
    metadata = null;
  }
  if (!metadata || !metadata.webp || !metadata.webp.length) {
    return `<link rel="preload" as="image" href="/${imagePath}" fetchpriority="high" />`;
  }
  const entries = metadata.webp;
  const href = entries[entries.length - 1].url;
  const srcset = entries.map((e) => `${e.url} ${e.width}w`).join(", ");
  const sizes = opts.sizes || "100vw";
  return `<link rel="preload" as="image" href="${href}" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high" />`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksAsyncShortcode("respimg", respimgTag);
  eleventyConfig.addNunjucksAsyncShortcode("respimgPreload", respimgPreloadTag);

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
