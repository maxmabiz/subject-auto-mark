export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatMoney(amount: number, currency: string): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${currency} ${formatted}`;
}

export function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function dash(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "—";
  return String(value);
}

export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return formatDate(value);
}
