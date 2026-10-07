interface TimeSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    hasError?: boolean;
    minuteStep?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function TimeSelect({
    value,
    onChange,
    disabled = false,
    hasError = false,
    minuteStep = 5,
}: TimeSelectProps) {
    const [h24, min] = value ? value.split(":").map(Number) : [null, null];

    const hora12 = h24 !== null ? h24 % 12 || 12 : "";
    const periodo = h24 !== null && h24 >= 12 ? "pm" : "am";
    const minutos = min ?? "";

    const opcionesMin = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
    if (min !== null && !opcionesMin.includes(min)) opcionesMin.push(min);
    opcionesMin.sort((a, b) => a - b);

    const emitir = (h12: number, m: number, p: string) => {
        const h = (h12 % 12) + (p === "pm" ? 12 : 0);
        onChange(`${pad(h)}:${pad(m)}`);
    };

    const clase = `px-2 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-300 dark:disabled:text-gray-600 ${
        hasError ? "border-red-500" : "border-gray-300 dark:border-gray-700"
    }`;

    return (
        <div className="flex items-center gap-1">
            <select
                value={hora12}
                disabled={disabled}
                aria-label="Hora"
                className={clase}
                onChange={(e) => emitir(Number(e.target.value), min ?? 0, periodo)}
            >
                <option value="" disabled>--</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>

            <span className="text-gray-400 dark:text-gray-500">:</span>

            <select
                value={minutos}
                disabled={disabled}
                aria-label="Minutos"
                className={clase}
                onChange={(e) => emitir(Number(hora12 || 12), Number(e.target.value), periodo)}
            >
                <option value="" disabled>--</option>
                {opcionesMin.map((m) => (
                    <option key={m} value={m}>{pad(m)}</option>
                ))}
            </select>

            <select
                value={periodo}
                disabled={disabled}
                aria-label="am o pm"
                className={clase}
                onChange={(e) => emitir(Number(hora12 || 12), min ?? 0, e.target.value)}
            >
                <option value="am">am</option>
                <option value="pm">pm</option>
            </select>
        </div>
    );
}