/**
 * Utility functions for masks, data formatting and file downloads.
 */

// Formats CPF to 000.000.000-00
export function formatCPF(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

// Cleans non-digits for sending to API
export function cleanDigits(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

// Formats Phone to (00) 00000-0000 or (00) 0000-0000
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Formats ISO/SQL date to DD/MM/YYYY
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(d.getTime())) return String(dateString);
    // Handle timezone shift if date only (YYYY-MM-DD)
    if (typeof dateString === 'string' && dateString.length === 10 && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return String(dateString);
  }
}

// Formats date to input type="date" value (YYYY-MM-DD)
export function toInputDateFormat(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  try {
    if (typeof dateString === 'string') {
      if (dateString.length === 10) return dateString;
      return dateString.slice(0, 10);
    }
    return dateString.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

// Downloads a blob payload as a file in the browser
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
