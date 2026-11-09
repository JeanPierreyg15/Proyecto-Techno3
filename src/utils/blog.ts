import type Blog from "src/models/Blog";
import { config } from "../../config";
import DOMPurify from "dompurify";

export { normalizeLink, getBlogSlug, getBlogHref } from "./blogLink";

export function getBlogImageUrl(miniatura?: string | null): string {
  if (!miniatura) return "/images/default-blog.webp";
  if (/^(https?:)?\/\//i.test(miniatura)) return miniatura;

  const base = String(config.apiUrl ?? "").replace(/\/+$/, "");
  const path = miniatura.startsWith("/") ? miniatura : `/${miniatura}`;
  return `${base}${path}`;
}

export function matchesBlogSearch(blog: Blog, term: string): boolean {
  const search = (term ?? "").toLowerCase();
  return !!(
    blog.titulo?.toLowerCase().includes(search) ||
    blog.nombre_producto?.toLowerCase().includes(search) ||
    blog.subtitulo1?.toLowerCase().includes(search)
  );
}

export function sanitizaHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "strong", "em", "u", "a", "ul", "ol", "li", "br", "span", "div"],
    ALLOWED_ATTR: ["href", "target", "rel", "title"],
  });
}
