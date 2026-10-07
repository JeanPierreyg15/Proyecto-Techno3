
// Pasa de 21:30 -> 9:30 pm 
export const formatHora12 = (h?: string | null): string => {
    const [hh, mm] = (h ?? "").slice(0, 5).split(":").map(Number);
    if (Number.isNaN(hh)) return "";
    return `${hh % 12 || 12}:${String(mm || 0).padStart(2, "0")} ${hh >= 12 ? "pm" : "am"}`;
};