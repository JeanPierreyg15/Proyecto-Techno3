import test from "node:test";
import assert from "node:assert/strict";
import { toCsv, type CsvColumn } from "./csv.ts";

const columnas: CsvColumn[] = [
  { key: "nombre", header: "Nombre" },
  { key: "telefono", header: "Teléfono" },
];

test("empieza con BOM UTF-8 y sin salto final cuando no hay filas", () => {
  assert.equal(toCsv([], columnas), "\uFEFFNombre,Teléfono");
});

test("encabezados, CRLF y sin salto final", () => {
  assert.equal(
    toCsv([{ nombre: "Ana", telefono: "987654321" }], columnas),
    "\uFEFFNombre,Teléfono\r\nAna,987654321",
  );
});

test("respeta el orden de columnas e ignora claves extra", () => {
  assert.equal(
    toCsv([{ telefono: "1", nombre: "Ana", edad: 30 }], columnas),
    "\uFEFFNombre,Teléfono\r\nAna,1",
  );
});

test("null y undefined quedan vacíos", () => {
  assert.equal(
    toCsv([{ nombre: null, telefono: undefined }], columnas),
    "\uFEFFNombre,Teléfono\r\n,",
  );
});

test("números y booleanos no se neutralizan", () => {
  const cols: CsvColumn[] = [
    { key: "n", header: "N" },
    { key: "b", header: "B" },
  ];
  assert.equal(toCsv([{ n: -12.5, b: true }], cols), "\uFEFFN,B\r\n-12.5,true");
});

test("fechas en ISO 8601", () => {
  const cols: CsvColumn[] = [{ key: "f", header: "Fecha" }];
  assert.equal(
    toCsv([{ f: new Date("2026-10-22T15:30:00.000Z") }], cols),
    "\uFEFFFecha\r\n2026-10-22T15:30:00.000Z",
  );
});

test("entrecomilla comas", () => {
  assert.equal(
    toCsv([{ nombre: "Perez, Ana", telefono: "1" }], columnas),
    '\uFEFFNombre,Teléfono\r\n"Perez, Ana",1',
  );
});

test("duplica comillas internas", () => {
  assert.equal(
    toCsv([{ nombre: 'Ana "la jefa"', telefono: "1" }], columnas),
    '\uFEFFNombre,Teléfono\r\n"Ana ""la jefa""",1',
  );
});

test("entrecomilla saltos de línea", () => {
  assert.equal(
    toCsv([{ nombre: "Linea 1\nLinea 2", telefono: "1" }], columnas),
    '\uFEFFNombre,Teléfono\r\n"Linea 1\nLinea 2",1',
  );
});

test("neutraliza fórmulas al inicio de un texto", () => {
  const cols: CsvColumn[] = [{ key: "v", header: "V" }];

  for (const payload of ["=1+1", "+SUM(A1)", "-2+3", "@SUM(A1)"]) {
    assert.equal(toCsv([{ v: payload }], cols), `\uFEFFV\r\n'${payload}`);
  }

  // El tab no obliga a entrecomillar, pero sí a neutralizar.
  assert.equal(toCsv([{ v: "\t=1+1" }], cols), "\uFEFFV\r\n'\t=1+1");

  // El CR neutraliza y además obliga a entrecomillar.
  assert.equal(toCsv([{ v: "\r=1+1" }], cols), "\uFEFFV\r\n\"'\r=1+1\"");
});

test("neutraliza el payload clásico de CSV injection", () => {
  assert.equal(
    toCsv([{ v: "=cmd|' /C calc'!A0" }], [{ key: "v", header: "V" }]),
    "\uFEFFV\r\n'=cmd|' /C calc'!A0",
  );
});
