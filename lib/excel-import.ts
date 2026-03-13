/**
 * Excel import utilities: parse file to rows and download template.
 * Uses SheetJS (xlsx) - same as services/reports.ts for export.
 */
import * as XLSX from "xlsx";

/**
 * Parse an Excel file (first sheet) into an array of row objects.
 * First row is used as keys; empty rows are skipped.
 */
export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const ws = wb.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return data;
}

/**
 * Download an Excel template with given headers (and optional example row).
 * Triggers browser download.
 */
export function downloadTemplate(
  headers: string[],
  sheetName: string,
  filename: string,
  exampleRow?: Record<string, unknown>
): void {
  const data = [Object.fromEntries(headers.map((h) => [h, ""])), ...(exampleRow ? [exampleRow] : [])];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
