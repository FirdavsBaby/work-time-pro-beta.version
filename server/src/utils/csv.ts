/**
 * Экранирование значения для CSV с защитой от CSV-инъекций.
 * Если значение начинается с =, +, -, @ или табуляции/CR — добавляем апостроф в начало.
 */
function sanitizeCsvValue(value: string): string {
  if (value === '') return '';
  const firstChar = value.charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
    return "'" + value;
  }
  return value;
}

/**
 * Оборачиваем поле в кавычки и экранируем внутренние кавычки по RFC 4180.
 */
function escapeField(raw: string): string {
  const value = sanitizeCsvValue(String(raw ?? ''));
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function toCsvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map((f) => escapeField(f === null || f === undefined ? '' : String(f))).join(',');
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  // BOM для корректной кириллицы в Excel
  const lines: string[] = ['﻿' + headers.join(',')];
  for (const row of rows) {
    lines.push(toCsvRow(row));
  }
  return lines.join('\r\n');
}
