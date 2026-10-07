import type { ImageMetadata } from "astro";

// Interface´s para Contacto Cliente

export interface HorarioDia {
  dia: string;
  abierto: boolean;
  hora_inicio: string;
  hora_fin: string;
}

export interface HorarioData {
  dias: HorarioDia[];
}

export interface ContactData {
  email: string;
  phones: string[];
  whatsapp: string;
  address: string;
  mapUrl: string;
  hours: { label: string; text: string }[];
}

export interface ContactInfo {
  correo: string;
  telefono: string;
  telefono_opcional: string | null;
  direccion: string;
}

export interface RedExtra {
  id: string;
  tipo: String;
  nombre: string;
  url: string;
}

export interface RedesSociales {
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  otras: RedExtra[];
}


// GET /configuracion/redes
export interface RedApi {
  id: number;
  tipo: string;
  nombre: string;
  url: string;
  orden: number;
}

// Para socialMedia.data
export interface SocialLink {
  url: string;
  socialMediaName: string;
  image: ImageMetadata;
  imageTitle: string;
  linkTitle: string;
}