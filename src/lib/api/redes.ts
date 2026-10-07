import type { ImageMetadata } from "astro";
import tiktokIcon from "@icons/smi_tiktok.svg";
import instagramIcon from "@icons/smi_instagram.svg";
import twitterIcon from "@icons/smi_twitter.svg";
import facebookIcon from "@icons/smi_facebook.svg";
import whatsappIcon from "@icons/smi_whatsapp.svg";
import youtubeIcon from "@icons/smi_youtube.svg";
import { config } from "../../../config";
import { fetchJson } from "./contacto";
import type { RedApi, SocialLink } from "../../types/contacto.interface";

const PLANTILLAS: Record<string, { icon: ImageMetadata; linkTitle: string }> = {
  tiktok: { icon: tiktokIcon, linkTitle: "Visita nuestro perfil de TikTok" },
  instagram: { icon: instagramIcon, linkTitle: "Síguenos en Instagram" },
  facebook: { icon: facebookIcon, linkTitle: "Visita nuestra página de Facebook" },
  twitter: { icon: twitterIcon, linkTitle: "Síguenos en Twitter" },
  youtube: { icon: youtubeIcon, linkTitle: "Síguenos en YouTube" },
};

export async function getSocialLinks(whatsapp?: string): Promise<SocialLink[]> {
  const redes = await fetchJson<RedApi[]>(config.endpoints.configuracion.redes);
  const lista: SocialLink[] = [];

  if (whatsapp) {
    lista.push({
      url: `https://api.whatsapp.com/send?phone=${whatsapp}&text=Hola%20Tami%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20servicios.`,
      socialMediaName: "Whatsapp",
      image: whatsappIcon,
      imageTitle: "Whatsapp de Tami Maquinarias",
      linkTitle: "Contáctanos por WhatsApp",
    });
  }

  if (!Array.isArray(redes)) return lista;

  for (const red of [...redes].sort((a, b) => a.orden - b.orden)) {
    const plantilla = PLANTILLAS[red.tipo.toLowerCase()];
    if (!plantilla) {
      console.warn("Red sin plantilla de ícono:", red.tipo);
      continue;
    }
    lista.push({
      url: red.url,
      socialMediaName: red.nombre,
      image: plantilla.icon,
      imageTitle: `${red.nombre} de Tami Maquinarias`,
      linkTitle: plantilla.linkTitle,
    });
  }

  return lista;
}