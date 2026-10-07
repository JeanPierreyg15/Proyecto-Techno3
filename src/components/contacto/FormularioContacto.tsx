import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import TextTitulo from "./TextTitulo";
import type { ContactData } from "../../types/contacto.interface";
import { telefonosEnLinea } from "../../lib/api/contacto";

interface FormularioContactoProps {
  contact: ContactData;
}

const FormularioContacto: React.FC<FormularioContactoProps> = ({ contact }) => {
  const { phones, email, address, hours } = contact;

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    phones: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending message
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        fullName: "",
        company: "",
        email: "",
        phones: "",
        message: "",
      });
    }, 1500);
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-950 py-16 md:py-24 transition-colors duration-500">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <TextTitulo
            variant="caption"
            className="text-[#023B37] dark:text-teal-400 font-extrabold text-3xl sm:text-4xl tracking-tight uppercase mb-4"
          >
            CONTÁCTANOS
          </TextTitulo>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base font-medium tracking-wide">
            Solicita una cotización, asesoría personalizada o déjanos tus dudas. Nuestro equipo te responderá a la brevedad.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-150 dark:border-gray-800/50 overflow-hidden flex flex-col lg:flex-row items-stretch">
          {/* Form Side */}
          <div className="flex-1 p-8 md:p-12 lg:p-16">
            {isSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-950/30 text-[#0C998A] flex items-center justify-center mb-6 animate-pulse">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  ¡Mensaje Enviado con Éxito!
                </h3>
                <p className="text-gray-600 dark:text-gray-350 max-w-md mb-8">
                  Gracias por escribirnos. Un asesor de <strong>Tami Maquinarias</strong> se pondrá en contacto contigo muy pronto.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-8 py-3 bg-[#0C998A] hover:bg-[#046A63] text-white font-bold text-sm uppercase tracking-wider rounded-2xl transition-all duration-300 active:scale-95 shadow-md shadow-teal-500/10"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre Completo */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
                    >
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0C998A] focus:border-transparent transition-all text-gray-800 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {/* Empresa */}
                  <div>
                    <label
                      htmlFor="company"
                      className="block font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
                    >
                      Empresa / Negocio
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Nombre de su organización"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0C998A] focus:border-transparent transition-all text-gray-800 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
                    >
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0C998A] focus:border-transparent transition-all text-gray-800 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label
                      htmlFor="phones"
                      className="block font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
                    >
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="phones"
                      name="phones"
                      required
                      value={formData.phones}
                      onChange={handleChange}
                      placeholder="Ej: +51 999 999 999"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0C998A] focus:border-transparent transition-all text-gray-800 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Mensaje */}
                <div>
                  <label
                    htmlFor="message"
                    className="block font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
                  >
                    Mensaje o Requerimiento *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describa su requerimiento o la maquinaria de su interés..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0C998A] focus:border-transparent transition-all text-gray-800 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-4 bg-[#0C998A] hover:bg-[#046A63] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider rounded-2xl transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        Enviar Mensaje <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info Side (Sidebar) */}
          <div className="w-full lg:w-80 bg-gray-50 dark:bg-gray-900/60 p-8 md:p-12 lg:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800/50">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                  Canales Directos
                </h3>
              </div>

              {/* Canal 1: Teléfono */}
              {phones.length > 0 && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0C998A] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      Llámanos
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 text-sm font-semibold">
                      {telefonosEnLinea(phones)}
                    </p>
                  </div>
                </div>
              )}

              {/* Canal 2: Correo */}

              {email && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0C998A] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      Escríbenos
                    </h4>
                    <a
                      href={`mailto:${email}`}
                      className="text-gray-800 dark:text-gray-250 text-sm font-semibold hover:text-[#0C998A] transition-colors break-all"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {/* Canal 3: Dirección */}
              {address && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0C998A] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      Ubicación
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 text-sm font-semibold leading-relaxed">
                      {address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Horario footer */}
            <div className="mt-12 lg:mt-0 pt-6 border-t border-gray-100 dark:border-gray-800/80">
              <div className="flex gap-3 items-start">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium italic">
                  {hours.length > 0 ? (
                    hours.map((h) => <p key={h.label}>{h.label}: {h.text}</p>)
                  ) : (
                    <p>Consúltanos por WhatsApp</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormularioContacto;
