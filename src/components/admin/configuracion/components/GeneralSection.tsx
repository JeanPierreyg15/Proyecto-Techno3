import { useState, useEffect } from "react";
import MapaEmbed from "../utils/MapaEmbed";
import { Mail, Phone, MapPin, Plus, Minus, AlertCircle } from "lucide-react";
import { fireSwal } from "../utils/swal";
import { useDebounce } from "../utils/useDebounce";
import type { ContactInfo, ContactApi } from "../../configuracion/types/types";
import { getConfiguracion, saveConfiguracion } from "../utils/ConfiguracionApi";

interface FormErrors {
    correo?: string;
    telefono?: string;
    telefonoOpcional?: string;
    direccion?: string;
}

const initialData: ContactInfo = {
    correo: "",
    telefono: "",
    telefonoOpcional: null,
    direccion: "",
};

const formatTelefono = (value: string): string => {
    const d = value.replace(/\D/g, "");

    return d.length === 9
        ? `+51 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
        : `+51 ${d}`;
};

export default function GeneralSection() {
    const [data, setData] = useState<ContactInfo>(initialData);
    const [mostrarOpcional, setMostrarOpcional] = useState(false);
    const [loadingInicial, setLoadingInicial] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    const aplicarRespuesta = (saved: ContactApi) => {
        const opcional = saved.telefono_opcional ?? null;

        setData({
            correo: saved.correo ?? "",
            telefono: saved.telefono ?? "",
            telefonoOpcional: opcional,
            direccion: saved.direccion ?? "",
        });

        setMostrarOpcional(Boolean(opcional));
    };

    useEffect(() => {
        getConfiguracion<ContactInfo>("contacto")
            .then((res) => aplicarRespuesta(res ?? {}))
            .catch((error) => {
                console.error("Error al cargar los datos:", error);
                setLoadError("No se pudo cargar la información guardada.");
            })
            .finally(() => { setLoadingInicial(false); });
    }, []);

    const direccionDebounced = useDebounce(data.direccion);

    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
        direccionDebounced.trim() || "Lima, Perú"
    )}&output=embed`;

    const validarCorreo = (correo: string): string | undefined => {
        const value = correo.trim();

        if (!value) {
            return "El correo electrónico es obligatorio.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(value)) {
            return "Ingresa un correo electrónico válido.";
        }

        return undefined;
    };

    const validarTelefono = (telefono: string): string | undefined => {
        const value = telefono.trim();

        if (!value) {
            return "El teléfono es obligatorio.";
        }

        if (!/^\d+$/.test(value)) {
            return "El teléfono solo debe contener números.";
        }

        if (value.length !== 9) {
            return "El teléfono debe tener exactamente 9 dígitos.";
        }

        if (!value.startsWith("9")) {
            return "El teléfono debe comenzar con 9.";
        }

        return undefined;
    };

    const validarTelefonoOpcional = (
        telefonoOpcional: string | null
    ): string | undefined => {
        const value = telefonoOpcional?.trim() ?? "";

        // vacio opcional
        if (!value) {
            return undefined;
        }

        if (!/^\d+$/.test(value)) {
            return "El teléfono solo debe contener números.";
        }

        if (value.length !== 9) {
            return "El teléfono debe tener exactamente 9 dígitos.";
        }

        if (!value.startsWith("9")) {
            return "El teléfono debe comenzar con 9.";
        }

        if (value === data.telefono.trim()) {
            return "El teléfono opcional debe ser diferente al principal.";
        }

        return undefined;
    };

    const validarDireccion = (direccion: string): string | undefined => {
        const value = direccion.trim();

        if (!value) {
            return "La dirección es obligatoria.";
        }

        if (value.length < 5) {
            return "La dirección debe tener al menos 5 caracteres.";
        }

        return undefined;
    };

    const validarFormulario = (): boolean => {
        const nuevosErrores: FormErrors = {
            correo: validarCorreo(data.correo),
            telefono: validarTelefono(data.telefono),
            telefonoOpcional: mostrarOpcional
                ? validarTelefonoOpcional(data.telefonoOpcional)
                : undefined,
            direccion: validarDireccion(data.direccion),
        };

        Object.keys(nuevosErrores).forEach((key) => {
            const typedKey = key as keyof FormErrors;

            if (!nuevosErrores[typedKey]) {
                delete nuevosErrores[typedKey];
            }
        });

        setErrors(nuevosErrores);

        return Object.keys(nuevosErrores).length === 0;
    };

    const actualizarCampo = (
        campo: keyof ContactInfo,
        valor: string | null
    ) => {
        setData((prev) => ({
            ...prev,
            [campo]: valor,
        }));

        setErrors((prev) => ({
            ...prev,
            [campo]: undefined,
        }));
    };

    const handleGuardar = async () => {
        if (!validarFormulario()) {
            await fireSwal({
                icon: "warning",
                title: "Revisa los campos",
                text: "Corrige los errores antes de guardar la información.",
            });

            return;
        }

        setLoading(true);

        try {
            const dataToSave: ContactInfo = {
                correo: data.correo.trim(),
                telefono: data.telefono.trim(),
                telefonoOpcional:
                    mostrarOpcional && data.telefonoOpcional?.trim()
                        ? data.telefonoOpcional.trim() : null,
                direccion: data.direccion.trim(),
            };

            const guardado = await saveConfiguracion<ContactApi>("contacto", dataToSave);
            aplicarRespuesta(guardado ?? {});

            setData(dataToSave);

            await fireSwal({
                icon: "success",
                title: "Guardado",
                text: "La información de contacto se guardó correctamente.",
            });
        } catch (error) {
            console.error("Error al guardar:", error);

            await fireSwal({
                icon: "error",
                title: "Error al guardar",
                text: "No se pudo guardar la información. Intenta nuevamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    const agregarOpcional = () => {
        setMostrarOpcional(true);

        setData((prev) => ({
            ...prev,
            telefonoOpcional: "",
        }));
    };

    const quitarOpcional = () => {
        setMostrarOpcional(false);

        setData((prev) => ({
            ...prev,
            telefonoOpcional: null,
        }));

        setErrors((prev) => ({
            ...prev,
            telefonoOpcional: undefined,
        }));
    };

    const telefonosPreview = [
        data.telefono,
        mostrarOpcional ? data.telefonoOpcional : null,
    ]
        .filter((t): t is string => Boolean(t?.trim()))
        .map(formatTelefono)
        .join(" / ");

    const hayDatos = Boolean(
        telefonosPreview || data.correo.trim() || data.direccion.trim()
    );

    if (loadingInicial) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            <div className="space-y-6">

                {loadError && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm rounded-lg px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>{loadError}</p>
                    </div>
                )}

                <div>
                    <label
                        htmlFor="correo"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                        Correo electrónico
                    </label>

                    <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />

                        <input
                            id="correo"
                            type="email"
                            value={data.correo}
                            onChange={(e) =>
                                actualizarCampo("correo", e.target.value)
                            }
                            className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${errors.correo
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                }`}
                            placeholder="Ej: correo@ejemplo.com"
                            maxLength={100}
                        />
                    </div>

                    {errors.correo ? (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.correo}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Este correo se mostrará como contacto personal
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="telefono"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                        Teléfono / WhatsApp
                    </label>

                    <div className="flex gap-2 mt-1">
                        <span className="flex items-center px-3 border rounded-lg text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 select-none">
                            +51
                        </span>

                        <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />

                            <input
                                id="telefono"
                                type="tel"
                                inputMode="numeric"
                                value={data.telefono}
                                onChange={(e) =>
                                    actualizarCampo(
                                        "telefono",
                                        e.target.value.replace(/\D/g, "")
                                    )
                                }
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${errors.telefono
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-700"
                                    }`}
                                placeholder="987654321"
                                maxLength={9}
                            />
                        </div>

                        {!mostrarOpcional && (
                            <button
                                type="button"
                                onClick={agregarOpcional}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shrink-0"
                                aria-label="Agregar otro teléfono"
                                title="Agregar otro teléfono"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {errors.telefono && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.telefono}
                        </p>
                    )}
                </div>

                {mostrarOpcional && (
                    <div>
                        <label
                            htmlFor="telefonoOpcional"
                            className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                        >
                            Teléfono / Opcional
                        </label>

                        <div className="flex gap-2 mt-1">
                            <span className="flex items-center px-3 border rounded-lg text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 select-none">
                                +51
                            </span>

                            <div className="relative flex-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />

                                <input
                                    id="telefonoOpcional"
                                    type="tel"
                                    inputMode="numeric"
                                    value={data.telefonoOpcional || ""}
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "telefonoOpcional",
                                            e.target.value.replace(/\D/g, "")
                                        )
                                    }
                                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${errors.telefonoOpcional
                                        ? "border-red-500"
                                        : "border-gray-300 dark:border-gray-700"
                                        }`}
                                    placeholder="987654321"
                                    maxLength={9}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={quitarOpcional}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shrink-0"
                                aria-label="Quitar teléfono opcional"
                                title="Quitar teléfono opcional"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                        </div>

                        {errors.telefonoOpcional && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.telefonoOpcional}
                            </p>
                        )}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="direccion"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                        Dirección
                    </label>

                    <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />

                        <input
                            id="direccion"
                            type="text"
                            value={data.direccion}
                            onChange={(e) =>
                                actualizarCampo("direccion", e.target.value)
                            }
                            className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${errors.direccion
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                }`}
                            placeholder="Av. Techno 3 Jr. Uno Cll. Tres"
                            maxLength={200}
                        />
                    </div>

                    {errors.direccion ? (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.direccion}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Dirección de tu tienda o empresa
                        </p>
                    )}
                </div>

                <div className="overflow-hidden rounded-[2.5rem] shadow-xl border-4 border-[#E2F6F6] dark:border-gray-800 h-[350px] lg:h-[450px] flex items-stretch">
                    <MapaEmbed
                        src={mapUrl}
                        height="100%"
                        title="Ubicación"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleGuardar}
                        disabled={loading}
                        className="px-6 py-3 bg-teal-600 dark:bg-teal-500 text-white rounded-md shadow-sm hover:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Guardando..." : "Guardar Contacto"}
                    </button>
                </div>
            </div>

            <aside className="sticky top-6 h-fit max-h-[calc(100vh-3rem)] space-y-4 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Vista previa
                </h3>

                <div className="rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 p-5 text-white dark:from-teal-800 dark:to-teal-950">
                    <h4 className="mb-4 font-bold">Canales Directos</h4>

                    {!hayDatos ? (
                        <p className="text-sm text-teal-200">
                            Completa los campos para ver cómo se mostrarán.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {telefonosPreview && (
                                <div className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-teal-200">
                                            Llámanos
                                        </p>
                                        <p className="text-sm">{telefonosPreview}</p>
                                    </div>
                                </div>
                            )}

                            {data.correo.trim() && (
                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-teal-200">
                                            Escríbenos
                                        </p>
                                        <p className="break-all text-sm">{data.correo.trim()}</p>
                                    </div>
                                </div>
                            )}

                            {data.direccion.trim() && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-teal-200">
                                            Ubicación
                                        </p>
                                        <p className="text-sm">{data.direccion.trim()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
