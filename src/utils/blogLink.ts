// Utilidades de enlaces de blog sin dependencias del DOM.
export function normalizeLink(rawLink?: string | null): string {
  if (!rawLink) return "";

  let value = String(rawLink).trim();
  if (!value) return "";

  // Quita query string y hash.
  value = value.split(/[?#]/)[0];

  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname;
    } catch {
      value = value.replace(/^https?:\/\/[^/]+/i, "");
    }
  }

  value = value.replace(/^\/+|\/+$/g, "");
  value = value.replace(/^(blog|catalogo-maquinarias)\//i, "");

  if (/^[^/]+\.[^/]+\//.test(value)) {
    value = value.replace(/^[^/]+\//, "");
  }

  value = value.split("/").filter(Boolean).pop() ?? "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const getBlogSlug = (rawLink?: string | null): string =>
  normalizeLink(rawLink);

// URL pública de un blog.
export function getBlogHref(rawLink?: string | null): string {
  const slug = getBlogSlug(rawLink);
  return slug ? `/blog/${encodeURI(slug)}/` : "/blog/";
}
