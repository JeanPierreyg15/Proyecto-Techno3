export type CsvCell = string | number | boolean | null | undefined | Date;

export interface CsvColumn {
  key: string;
  header: string;
}

// Caracteres de Excek para interpretar una fórmula
const FORMULA_START = /^[=+\-@\t\r]/;

// Caracteres que obligan a entrecomillar el campo
const NEEDS_QUOTES = /[",\r\n]/;

function formatCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  let text = value;

  if (FORMULA_START.test(text)) {
    text = "'" + text;
  }

  if (NEEDS_QUOTES.test(text)) {
    text = '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}

// Convierte filas a un CSV seguro para abrir en Excel / Google Sheets.
export function toCsv(
  rows: Array<Record<string, CsvCell>>,
  columns: CsvColumn[],
): string {
  const header = columns.map((col) => formatCell(col.header)).join(",");
  const body = rows.map((row) =>
    columns.map((col) => formatCell(row[col.key])).join(","),
  );

  return "\uFEFF" + [header, ...body].join("\r\n");
}
