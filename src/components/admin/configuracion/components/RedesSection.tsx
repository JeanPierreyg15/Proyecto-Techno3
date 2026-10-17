import { useState, useEffect, useRef } from "react";
import { Instagram, Facebook, Twitter, Youtube, Link2, Trash2, Plus, AlertCircle, } from "lucide-react";
import { fireSwal } from "../utils/swal";
import type { RedesSociales, RedExtra, RedApi } from "../../configuracion/types/types";
import { getConfiguracion, saveConfiguracion } from "../utils/ConfiguracionApi";
import SocialProfilePreview, { type SocialPlatform } from "./SocialProfilePreview";

interface FormErrors {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    otras: {
        [id: string]: {
            nombre?: string;
            url?: string;
        };
    };
}

const initialData: RedesSociales = {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    otras: [],
};

const initialErrors: FormErrors = {
    otras: {},
};

const MAX_NOMBRE = 100;

const REDES_FIJAS: {
    key: keyof Omit<RedesSociales, "otras">;
    label: string;
    Icon: typeof Instagram;
    placeholder: string;
}[] = [
        {
            key: "instagram",
            label: "Instagram",
            Icon: Instagram,
            placeholder: "instagram.com/tu_usuario",
        },
        {
            key: "facebook",
            label: "Facebook",
            Icon: Facebook,
            placeholder: "facebook.com/tu_pagina",
        },
        {
            key: "twitter",
            label: "Twitter",
            Icon: Twitter,
            placeholder: "twitter.com/tu_usuario",
        },
        {
            key: "youtube",
            label: "Youtube",
            Icon: Youtube,
            placeholder: "youtube.com/tu_canal",
        },
    ];

const MAX_REDES_EXTRA = 10;
const idBD = (id: string) => /^\d+$/.test(id);

const normalizarUrl = (url: string): string => {
    const value = url.trim();

    if (!value) {
        return "";
    }

    if (!/^https?:\/\//i.test(value)) {
        return `https://${value}`;
    }

    return value;
};

const validarUrl = (url: string): string | undefined => {
    const value = url.trim();

    if (!value) {
        return undefined;
    }

    try {
        const urlNormalizada = normalizarUrl(value);
        const parsedUrl = new URL(urlNormalizada);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return "La URL debe comenzar con http:// o https://.";
        }

        if (!parsedUrl.hostname.includes(".")) {
            return "Ingresa una URL válida.";
        }

        return undefined;
    } catch {
        return "Ingresa una URL válida.";
    }
};

export default function RedesSection() {
    const [data, setData] = useState<RedesSociales>(initialData);
    const [loadingInicial, setLoadingInicial] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>(initialErrors);

    const fijasIds = useRef<Partial<Record<keyof Omit<RedesSociales, "otras">, number>>>({});

    const aplicarRespuesta = (lista: RedApi[]) => {
        const fijas: Record<string, string> = { instagram: "", facebook: "", twitter: "", youtube: "" };
        const otras: RedExtra[] = [];
        fijasIds.current = {};

        for (const red of lista) {
            if (red.tipo in fijas) {
                fijas[red.tipo] = red.url;
                fijasIds.current[red.tipo as keyof typeof fijasIds.current] = red.id;
            } else {
                otras.push({ id: String(red.id), tipo: red.tipo, nombre: red.nombre, url: red.url });
            }
        }

        setData({ ...(fijas as Omit<RedesSociales, "otras">), otras });
    };

    function normalizePlatform(value: string): SocialPlatform {
        const platform = value.toLowerCase();

        if (platform.includes("instagram")) return "instagram";
        if (platform.includes("facebook")) return "facebook";
        if (platform.includes("tiktok") || platform.includes("tik tok")) return "tiktok";
        if (platform.includes("youtube")) return "youtube";
        if (platform.includes("twitter") || platform === "x") return "twitter";

        return "other";
    }

    useEffect(() => {
        getConfiguracion<RedApi[]>("redes")
            .then((res) => aplicarRespuesta(Array.isArray(res) ? res : []))
            .catch((error) => {
                console.error("Error al cargar las redes sociales:", error);
                setLoadError("No se pudo cargar la información guardada.");
            })
            .finally(() => setLoadingInicial(false));
    }, []);

    const actualizarRedFija = (
        key: keyof Omit<RedesSociales, "otras">,
        valor: string
    ) => {
        setData((prev) => ({
            ...prev,
            [key]: valor,
        }));

        setErrors((prev) => ({
            ...prev,
            [key]: undefined,
        }));
    };

    const agregarOtra = async () => {
        if (data.otras.length >= MAX_REDES_EXTRA) {
            await fireSwal({
                icon: "warning",
                title: "Límite alcanzado",
                text: `Puedes agregar como máximo ${MAX_REDES_EXTRA} redes sociales adicionales.`,
            });

            return;
        }

        const nuevaRed: RedExtra = {
            id: crypto.randomUUID(),
            tipo: "",
            nombre: "",
            url: "",
        };

        setData((prev) => ({
            ...prev,
            otras: [...prev.otras, nuevaRed],
        }));
    };

    const quitarOtra = (id: string) => {
        setData((prev) => ({
            ...prev,
            otras: prev.otras.filter((red) => red.id !== id),
        }));

        setErrors((prev) => {
            const nuevosErrores = { ...prev.otras };

            delete nuevosErrores[id];

            return {
                ...prev,
                otras: nuevosErrores,
            };
        });
    };

    const actualizarOtra = (
        id: string,
        campo: "nombre" | "url",
        valor: string
    ) => {
        setData((prev) => ({
            ...prev,
            otras: prev.otras.map((red) =>
                red.id === id
                    ? {
                        ...red,
                        [campo]: valor,
                    }
                    : red
            ),
        }));

        setErrors((prev) => ({
            ...prev,
            otras: {
                ...prev.otras,
                [id]: {
                    ...prev.otras[id],
                    [campo]: undefined,
                },
            },
        }));
    };

    const validarRedesFijas = (): Partial<
        Record<keyof Omit<RedesSociales, "otras">, string>
    > => {
        const errores: Partial<
            Record<keyof Omit<RedesSociales, "otras">, string>
        > = {};

        for (const red of REDES_FIJAS) {
            const error = validarUrl(data[red.key]);

            if (error) {
                errores[red.key] = error;
            }
        }

        return errores;
    };

    const validarRedesExtras = (): FormErrors["otras"] => {
        const errores: FormErrors["otras"] = {};

        for (const red of data.otras) {
            const nombre = red.nombre.trim();
            const url = red.url.trim();

            // Si ambos estan vacios, no se considera error
            if (!nombre && !url) {
                continue;
            }

            const erroresRed: {
                nombre?: string;
                url?: string;
            } = {};

            if (!nombre) {
                erroresRed.nombre =
                    "Ingresa el nombre de la red social.";
            }

            if (!url) {
                erroresRed.url =
                    "Ingresa el enlace de la red social.";
            } else {
                const errorUrl = validarUrl(url);

                if (errorUrl) {
                    erroresRed.url = errorUrl;
                }
            }

            if (Object.keys(erroresRed).length > 0) {
                errores[red.id] = erroresRed;
            }
        }

        return errores;
    };

    const validarDuplicados = (): FormErrors["otras"] => {
        const errores: FormErrors["otras"] = {};

        const urls: {
            url: string;
            id: string;
        }[] = [];

        REDES_FIJAS.forEach((red) => {
            const url = data[red.key].trim();

            if (url) {
                urls.push({
                    url: normalizarUrl(url).toLowerCase(),
                    id: red.key,
                });
            }
        });

        data.otras.forEach((red) => {
            const url = red.url.trim();

            if (!url) {
                return;
            }

            const normalized = normalizarUrl(url).toLowerCase();

            const existente = urls.find(
                (item) => item.url === normalized
            );

            if (existente) {
                errores[red.id] = {
                    ...errores[red.id],
                    url: "Esta URL ya está registrada.",
                };
            } else {
                urls.push({
                    url: normalized,
                    id: red.id,
                });
            }
        });

        return errores;
    };

    const validarFormulario = (): boolean => {
        const erroresFijas = validarRedesFijas();
        const erroresExtras = validarRedesExtras();
        const erroresDuplicados = validarDuplicados();

        const erroresExtrasFinales: FormErrors["otras"] = {
            ...erroresExtras,
        };

        Object.entries(erroresDuplicados).forEach(
            ([id, error]) => {
                erroresExtrasFinales[id] = {
                    ...erroresExtrasFinales[id],
                    ...error,
                };
            }
        );

        const nuevosErrores: FormErrors = {
            ...erroresFijas,
            otras: erroresExtrasFinales,
        };

        setErrors(nuevosErrores);

        const hayErroresFijas =
            Object.keys(erroresFijas).length > 0;

        const hayErroresExtras =
            Object.keys(erroresExtrasFinales).length > 0;

        return !hayErroresFijas && !hayErroresExtras;
    };

    const handleGuardar = async () => {
        if (!validarFormulario()) {
            await fireSwal({
                icon: "warning",
                title: "Revisa los campos",
                text: "Corrige los errores antes de guardar.",
            });
            return;
        }

        setLoading(true);

        try {
            let orden = 1;

            const redes = [
                ...REDES_FIJAS.filter((r) => data[r.key].trim()).map((r) => ({
                    id: fijasIds.current[r.key],
                    tipo: r.key,
                    nombre: r.label,
                    url: normalizarUrl(data[r.key]),
                    orden: orden++,
                })),
                ...data.otras
                    .filter((r) => r.nombre.trim() || r.url.trim())
                    .map((r) => ({
                        id: idBD(r.id) ? Number(r.id) : undefined,
                        tipo: "otra",
                        nombre: r.nombre.trim(),
                        url: normalizarUrl(r.url),
                        orden: orden++,
                    })),
            ];

            const res = await saveConfiguracion<RedApi[], { redes: typeof redes }>("redes", { redes });
            if (Array.isArray(res)) aplicarRespuesta(res);

            await fireSwal({
                icon: "success",
                title: "Guardado",
                text: "Tus redes sociales se guardaron correctamente.",
            });
        } catch (error) {
            console.error("Error al guardar:", error);

            await fireSwal({
                icon: "error",
                title: "Error al guardar",
                text: "No se pudieron guardar las redes sociales. Intenta nuevamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingInicial) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            </div>
        );
    }

    const redesPreview = [
        ...REDES_FIJAS.filter((red) => data[red.key].trim()).map((red) => ({
            id: red.key as string,
            platform: red.key as SocialPlatform,
            nombre: red.label,
            url: normalizarUrl(data[red.key]),
        })),
        ...data.otras
            .filter((red) => red.url.trim())
            .map((red) => ({
                id: red.id,
                platform: normalizePlatform(red.nombre),
                nombre: red.nombre.trim() || "Otra red",
                url: normalizarUrl(red.url),
            })),
    ];

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
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Redes Sociales
                    </h3>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Configura los enlaces a tus redes sociales
                    </p>
                </div>

                {REDES_FIJAS.map(
                    ({
                        key,
                        label,
                        Icon,
                        placeholder,
                    }) => (
                        <div key={key}>
                            <label
                                htmlFor={`red-${key}`}
                                className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200"
                            >
                                <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />

                                {label}
                            </label>

                            <div className="flex gap-2 mt-1">
                                <input
                                    id={`red-${key}`}
                                    type="url"
                                    value={data[key]}
                                    onChange={(e) =>
                                        actualizarRedFija(
                                            key,
                                            e.target.value
                                        )
                                    }
                                    className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${errors[key]
                                        ? "border-red-500"
                                        : "border-gray-300 dark:border-gray-700"
                                        }`}
                                    placeholder={placeholder}
                                    maxLength={MAX_NOMBRE}
                                />

                                {data[key] && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            actualizarRedFija(
                                                key,
                                                ""
                                            )
                                        }
                                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                        title="Quitar enlace"
                                        aria-label={`Quitar enlace de ${label}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {errors[key] ? (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors[key]}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {data[key]
                                        ? "Enlace configurado"
                                        : "No se ha insertado el link"}
                                </p>
                            )}
                        </div>
                    )
                )}

                {data.otras.map((red) => {
                    const redErrors =
                        errors.otras[red.id];

                    return (
                        <div
                            key={red.id}
                            className="flex gap-2 items-end"
                        >
                            <div className="w-32">
                                <label
                                    htmlFor={`nombre-${red.id}`}
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    Nombre
                                </label>

                                <input
                                    id={`nombre-${red.id}`}
                                    type="text"
                                    value={red.nombre}
                                    onChange={(e) =>
                                        actualizarOtra(
                                            red.id,
                                            "nombre",
                                            e.target.value
                                        )
                                    }
                                    className={`w-full mt-1 px-2 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-500 ${redErrors?.nombre
                                        ? "border-red-500"
                                        : "border-gray-300 dark:border-gray-700"
                                        }`}
                                    placeholder="TikTok"
                                    maxLength={MAX_NOMBRE}
                                />

                                {redErrors?.nombre && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {redErrors.nombre}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1">
                                <label
                                    htmlFor={`url-${red.id}`}
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    URL
                                </label>

                                <input
                                    id={`url-${red.id}`}
                                    type="url"
                                    value={red.url}
                                    onChange={(e) =>
                                        actualizarOtra(
                                            red.id,
                                            "url",
                                            e.target.value
                                        )
                                    }
                                    className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-500 ${redErrors?.url
                                        ? "border-red-500"
                                        : "border-gray-300 dark:border-gray-700"
                                        }`}
                                    placeholder="tiktok.com/@tu_usuario"
                                    maxLength={MAX_NOMBRE}
                                />

                                {redErrors?.url && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {redErrors.url}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    quitarOtra(red.id)
                                }
                                className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                title="Eliminar red social"
                                aria-label="Eliminar esta red social"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={agregarOtra}
                    className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300"
                >
                    <Plus className="w-4 h-4" />

                    Agregar otra red social
                </button>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                    Puedes agregar hasta {MAX_REDES_EXTRA} redes
                    sociales adicionales.
                </p>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleGuardar}
                        disabled={loading}
                        className="px-6 py-3 bg-teal-600 dark:bg-teal-500 text-white rounded-md shadow-sm hover:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading
                            ? "Guardando..."
                            : "Guardar Redes Sociales"}
                    </button>
                </div>
            </div>

            <aside className="sticky top-6 h-fit max-h-[calc(100vh-3rem)] space-y-4 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Vista previa
                </h3>

                {redesPreview.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Agrega un enlace para ver la vista previa.
                    </p>
                ) : (
                    redesPreview.map((red) => (
                        <SocialProfilePreview
                            key={red.id}
                            platform={red.platform}
                            accountName={red.nombre}
                            url={red.url}
                        />
                    ))
                )}
            </aside>
        </div>
    );
}