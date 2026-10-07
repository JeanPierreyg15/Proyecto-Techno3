import React from "react";
import MapaEmbed from "./MapaEmbed";
import TextTitulo from './TextTitulo';
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import type { ContactData } from "../../types/contacto.interface";
import { telefonosEnLinea } from "../../lib/api/contacto";

const UbicacionContacto: React.FC<{ contact: ContactData }> = ({ contact }) => {

  const { address, phones, whatsapp, email, hours, mapUrl } = contact;

  return (
    <section className="bg-white dark:bg-gray-950 py-16 md:py-24">
      {/* Banner de ubicación con colores de la marca Tami */}
      <div className="w-full bg-gradient-to-r from-[#023B37] via-[#046A63] to-[#0C998A] py-6 px-6 md:px-12 text-center shadow-lg transition-all duration-500">
        <TextTitulo
          variant="caption"
          className="text-white font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight uppercase mb-2">
          CADA VEZ MÁS CERCA DE TI
        </TextTitulo>
        <p className="max-w-3xl mx-auto text-teal-50 text-xs md:text-sm lg:text-base font-medium opacity-90 tracking-wide text-center">
          Visítanos o ubícanos fácilmente para recibir atención cercana y personalizada.
        </p>
      </div>

      <div className="container mx-auto px-4 mt-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 lg:gap-12 items-stretch">
          {/* Tarjetas de Información de Contacto */}
          <div className="flex flex-col gap-6 justify-between">
            {/* Card 1: Dirección */}
            {address && (
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-teal-100 dark:hover:border-teal-900/30 transition-all duration-300 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0C998A] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">Nuestra Tienda</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0C998A] hover:text-[#046A63] font-bold mt-2 inline-block transition-colors"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              </div>
            )}

            {/* Card 2: WhatsApp / Teléfono */}
            {phones.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-teal-100 dark:hover:border-teal-900/30 transition-all duration-300 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0C998A] flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">Teléfonos y WhatsApp</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{telefonosEnLinea(phones)}</p>
                  <div className="flex gap-4 mt-2">
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0C998A] hover:text-[#046A63] font-bold transition-colors"
                    >
                      Escribir por WhatsApp →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Card 3: Correo */}
            {email && (
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-teal-100 dark:hover:border-teal-900/30 transition-all duration-300 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0C998A] flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">Correo Electrónico</h3>
                  <a
                    href={`mailto:${email}`}
                    className="text-gray-600 dark:text-gray-300 text-sm hover:text-[#0C998A] transition-colors break-all"
                  >
                    {email}
                  </a>
                </div>
              </div>
            )}

            {/* Card 4: Horario */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-teal-100 dark:hover:border-teal-900/30 transition-all duration-300 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0C998A] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">Horario de Atención</h3>
                <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {hours.length > 0 ? (
                    hours.map((h: any) => (
                      <p key={h.label}>
                        <span className="font-medium">{h.label}:</span> {h.text}
                      </p>
                    ))
                  ) : (
                    <p>Consúltanos por WhatsApp</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mapa de Google */}
          <div className="overflow-hidden rounded-[2.5rem] shadow-xl border-4 border-[#E2F6F6] dark:border-gray-800 h-[350px] lg:h-auto min-h-[400px] flex items-stretch">
            <MapaEmbed
              src={mapUrl}
              height="100%"
              title="Ubicación de Tami Maquinarias"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UbicacionContacto;
