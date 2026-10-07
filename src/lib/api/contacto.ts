import { config, getApiUrl } from "../../../config";
import type { ContactData, HorarioData, ContactInfo } from "../../types/contacto.interface";

const hhmm = (h?: string | null) => (h ?? "").slice(0, 5);

function tieneHorario(d: any): boolean {
  const ini = hhmm(d.hora_inicio);
  const fin = hhmm(d.hora_fin);
  if (!d.abierto || !ini || !fin) return false;
  return !(ini === "00:00" && fin === "00:00");
}

export async function fetchJson<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(getApiUrl(endpoint));
    if (!res.ok) {
      console.error("FETCH FALLÓ:", endpoint, res.status);
      return null;
    }
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch (e) {
    console.error("FETCH ERROR:", endpoint, e);
    return null;
  }
}

function formatHora(h?: string | null): string {
  if (!h) return "";
  const [hh, mm] = h.split(":").map(Number);
  if (Number.isNaN(hh)) return h;
  return `${hh % 12 || 12}:${String(mm || 0).padStart(2, "0")} ${hh >= 12 ? "pm" : "am"}`;
}

function formatearTelefono(raw?: string | null): string {
  const digitos = (raw ?? "").replace(/\D/g, "");
  const n = digitos.length === 11 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
  if (n.length !== 9) return (raw ?? "").trim(); // si no encaja, lo deja como viene
  return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

export function telefonosEnLinea(phones: string[]): string {
  return phones.map((p) => p.replace(/ /g, "\u00A0")).join(" / ");
}

function toWhatsapp(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  return digits.length === 9 ? `51${digits}` : digits;
}

export async function getContactData(): Promise<ContactData | null> {
  const [info, horario] = await Promise.all([
    fetchJson<ContactInfo>(config.endpoints.configuracion.contacto),
    fetchJson<HorarioData>(config.endpoints.configuracion.horario),
  ]);

  if (!info) return null;

  const direccion = info.direccion ?? "";

  return {
    email: info.correo ?? "",
    phones: [info.telefono, info.telefono_opcional].map(formatearTelefono).filter(Boolean),
    whatsapp: info.telefono ? toWhatsapp(info.telefono) : "",
    address: direccion,
    mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`,
    hours: (horario?.dias ?? []).filter(tieneHorario).map((d: any) => ({
      label: d.dia,
      text: `${formatHora(d.hora_inicio)} a ${formatHora(d.hora_fin)}`,
    })),
  };
}