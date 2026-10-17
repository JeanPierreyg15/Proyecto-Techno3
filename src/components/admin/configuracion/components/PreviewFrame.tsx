import { useState, type ReactNode } from "react";
import { Monitor, Smartphone } from "lucide-react";

export type DeviceMode = "desktop" | "mobile";

interface PreviewFrameProps {
    title?: string;
    children: (mode: DeviceMode) => ReactNode;
}

export default function PreviewFrame(
    { title = "Vista Previa", children }: PreviewFrameProps) {

    const [mode, setMode] = useState<DeviceMode>("desktop");
    const isMobile = mode === "mobile";


    return (
        <section className="sticky top-6 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </h3>

                <div
                    className="inline-flex items-center gap-1 rounded-xl border
            border-gray-200 bg-gray-100 p-1 dark:border-gray-700
            dark:bg-gray-800"
                    role="group"
                    aria-label="Tamaño de la vista previa"
                >
                    <button
                        type="button"
                        onClick={() => setMode("desktop")}
                        aria-pressed={!isMobile}
                        aria-label="Vista de escritorio"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2
              text-xs font-medium transition-colors duration-200
              ${!isMobile
                                ? "bg-white text-teal-700 shadow-sm dark:bg-gray-700 dark:text-teal-300"
                                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        <Monitor size={16} />
                        <span>Desktop</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("mobile")}
                        aria-pressed={isMobile}
                        aria-label="Vista de celular"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2
              text-xs font-medium transition-colors duration-200
              ${isMobile
                                ? "bg-white text-teal-700 shadow-sm dark:bg-gray-700 dark:text-teal-300"
                                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        <Smartphone size={16} />
                        <span>Mobile</span>
                    </button>
                </div>
            </div>

            <div
                className="flex min-h-[360px] items-start justify-center overflow-hidden
          rounded-2xl border border-gray-200 bg-gray-50 p-4
          transition-colors duration-200 sm:p-6
          dark:border-gray-700 dark:bg-gray-900"
            >
                <div
                    className={`w-full transition-[max-width] duration-300 ease-in-out ${isMobile ? "max-w-[375px]" : "max-w-2xl"
                        }`}
                >
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
                        <div className="min-h-[320px]">{children(mode)}</div>
                    </div>
                </div>
            </div>
        </section>
    );
}