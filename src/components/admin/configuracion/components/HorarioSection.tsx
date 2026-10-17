import { useState, useEffect } from "react";
import { Info, AlertCircle } from "lucide-react";
import { fireSwal } from "../utils/swal";
import PreviewFrame from "./PreviewFrame";
import type { HorarioDia, HorarioData } from "../../configuracion/types/types";
import { getConfiguracion, saveConfiguracion } from "../utils/ConfiguracionApi";
import TimeSelect from "./TimeSelect";
import { formatHora12 } from "../utils/FormatHoras";

interface FormErrors {
    [index: number]: string;
}

const initialData: HorarioData = {
    dias: [
        {
            dia_grupo: "Lunes - Viernes",
            abierto: false,
            hora_inicio: "",
            hora_fin: "",
        },
        {
            dia_grupo: "Sábado",
            abierto: false,
            hora_inicio: "",
            hora_fin: "",
        },
        {
            dia_grupo: "Domingo",
            abierto: false,
            hora_inicio: "",
            hora_fin: "",
        },
    ],
};

export default function HorarioSection() {
    const [data, setData] = useState<HorarioData>(initialData);
    const [loadingInicial, setLoadingInicial] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        getConfiguracion<HorarioData>("horario")
            .then((res) => {
                if (!Array.isArray(res?.dias)) return;
                setData({
                    dias: initialData.dias.map((diaInicial, index) => {
                        const saved = res.dias[index];
                        return {
                            ...diaInicial,
                            ...(saved ?? {}),
                            abierto: Boolean(saved?.abierto),
                            hora_inicio: (saved?.hora_inicio ?? "").slice(0, 5),
                            hora_fin: (saved?.hora_fin ?? "").slice(0, 5),
                        };
                    }),
                });
            })
            .catch((error) => {
                console.error("Error al cargar horarios:", error);
                setLoadError("No se pudo cargar la información.");
            })
            .finally(() => setLoadingInicial(false));
    }, []);

    const actualizarDia = (
        index: number,
        cambios: Partial<HorarioDia>
    ) => {
        setData((prev) => ({
            ...prev,
            dias: prev.dias.map((dia_grupo, i) =>
                i === index ? { ...dia_grupo, ...cambios } : dia_grupo
            ),
        }));

        setErrors((prev) => ({
            ...prev,
            [index]: undefined as unknown as string,
        }));
    };

    const validarHorarios = (): boolean => {
        const nuevosErrores: FormErrors = {};

        data.dias.forEach((dia_grupo, index) => {
            if (!dia_grupo.abierto) {
                return;
            }

            if (!dia_grupo.hora_inicio || !dia_grupo.hora_fin) {
                nuevosErrores[index] =
                    "Debes ingresar la hora de inicio y la hora de cierre.";
                return;
            }

            if (dia_grupo.hora_inicio === dia_grupo.hora_fin) {
                nuevosErrores[index] =
                    "La hora de inicio y cierre no pueden ser iguales.";
                return;
            }

            if (dia_grupo.hora_fin <= dia_grupo.hora_inicio) {
                nuevosErrores[index] =
                    "La hora de cierre debe ser posterior a la hora de inicio.";
            }
        });

        setErrors(nuevosErrores);

        return Object.keys(nuevosErrores).length === 0;
    };


    const aplicarATodosLosDias = () => {
        const base = data.dias[0];

        setData((prev) => ({
            ...prev,
            dias: prev.dias.map((dia) => ({
                ...dia,
                abierto: base.abierto,
                hora_inicio: base.hora_inicio,
                hora_fin: base.hora_fin,
            })),
        }));

        setErrors({});
    };

    const handleGuardar = async () => {
        if (!validarHorarios()) {
            await fireSwal({
                icon: "warning",
                title: "Revisa los horarios",
                text: "Corrige los horarios marcados antes de guardar.",
            });

            return;
        }

        setLoading(true);

        try {
            const dataToSave: HorarioData = {
                dias: data.dias.map((dia_grupo) => ({
                    ...dia_grupo,
                    hora_inicio: dia_grupo.abierto ? dia_grupo.hora_inicio : "",
                    hora_fin: dia_grupo.abierto ? dia_grupo.hora_fin : "",
                })),
            };

            await saveConfiguracion("horario", dataToSave);

            setData(dataToSave);

            await fireSwal({
                icon: "success",
                title: "Guardado",
                text: "El horario de atención se guardó correctamente.",
            });
        } catch (error) {
            console.error("Error al guardar horarios:", error);

            await fireSwal({
                icon: "error",
                title: "Error al guardar",
                text: "No se pudo guardar el horario. Intenta nuevamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingInicial) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            </div>
        );
    }

    const diasAbiertos = data.dias.filter(
        (dia) =>
            dia.abierto &&
            dia.hora_inicio &&
            dia.hora_fin
    );

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
                        Horario de atención
                    </h3>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Gestiona tus horarios disponibles
                    </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
                    {data.dias.map((d, i) => (
                        <div
                            key={d.dia_grupo}
                            className="flex items-center gap-4 p-4 flex-wrap"
                        >
                            <span className="w-32 text-sm font-medium text-gray-700 dark:text-gray-200 shrink-0">
                                {d.dia_grupo}
                            </span>

                            <TimeSelect
                                value={d.hora_inicio}
                                disabled={!d.abierto}
                                hasError={Boolean(errors[i])}
                                onChange={(v) => actualizarDia(i, { hora_inicio: v })}
                            />

                            <span className="text-gray-400 dark:text-gray-500 text-sm">a</span>

                            <TimeSelect
                                value={d.hora_fin}
                                disabled={!d.abierto}
                                hasError={Boolean(errors[i])}
                                onChange={(v) => actualizarDia(i, { hora_fin: v })}
                            />

                            <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {d.abierto ? "Abierto" : "Cerrado"}
                                </span>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={d.abierto}
                                    onClick={() =>
                                        actualizarDia(i, {
                                            abierto: !d.abierto,
                                            ...(d.abierto
                                                ? {
                                                    hora_inicio: "",
                                                    hora_fin: "",
                                                }
                                                : {}),
                                        })
                                    }
                                    className={`w-10 h-6 rounded-full transition-colors relative ${d.abierto
                                        ? "bg-teal-600 dark:bg-teal-500"
                                        : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${d.abierto
                                            ? "translate-x-4"
                                            : ""
                                            }`}
                                    />
                                </button>
                            </label>

                            {errors[i] && (
                                <p className="basis-full text-xs text-red-500 ml-36">
                                    {errors[i]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-sm rounded-lg px-4 py-3">
                    <Info className="w-4 h-4 shrink-0" />

                    <span className="flex-1">
                        Puedes aplicar el mismo horario a todos los días.
                    </span>

                    <button
                        type="button"
                        onClick={aplicarATodosLosDias}
                        className="px-3 py-1.5 bg-teal-600 dark:bg-teal-500 text-white text-xs font-medium rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shrink-0"
                    >
                        Aplicar a todos los días
                    </button>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleGuardar}
                        disabled={loading}
                        className="px-6 py-3 bg-teal-600 dark:bg-teal-500 text-white rounded-md shadow-sm hover:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading
                            ? "Guardando..."
                            : "Guardar Horario"}
                    </button>
                </div>
            </div>

            <PreviewFrame title="Vista previa">
                {(mode) => (
                    <div className="bg-white p-4 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
                        <div className="rounded-xl bg-gradient-to-r from-teal-700 to-teal-500 p-4 text-white">
                            <h3 className="text-lg font-bold">
                                Horario de atención
                            </h3>
                            <p className="mt-1 text-xs text-teal-50">
                                Estamos disponibles para atenderte.
                            </p>
                        </div>

                        <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                            {data.dias.map((dia) => (
                                <div
                                    key={dia.dia_grupo}
                                    className={`flex gap-2 py-3 ${mode === "mobile"
                                            ? "flex-col items-start"
                                            : "flex-row items-center justify-between"
                                        }`}
                                >
                                    <span className="text-sm font-medium">
                                        {dia.dia_grupo}
                                    </span>

                                    <span className={`text-sm ${dia.abierto && dia.hora_inicio && dia.hora_fin
                                            ? "text-gray-600 dark:text-gray-300"
                                            : "text-gray-400"
                                        }`}>
                                        {dia.abierto && dia.hora_inicio && dia.hora_fin
                                            ? `${formatHora12(dia.hora_inicio)} – ${formatHora12(dia.hora_fin)}`
                                            : "Cerrado"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </PreviewFrame>
        </div>
    );
}