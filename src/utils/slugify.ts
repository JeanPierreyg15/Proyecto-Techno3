// Equivalente a Str::slug() de Laravel: mismo resultado que el backend para que
// los links generados en el frontend coincidan con los guardados en la BD.
// Reemplaza caracteres inválidos (":", ",", "/", etc.) por "-" en vez de
// eliminarlos: evita rutas ilegales en Windows al generar el sitio estático.
export function slugify(text: string): string {
    return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "-")
        .replace(/\-\-+/g, "-")
        .replace(/^-+|-+$/g, "");
}