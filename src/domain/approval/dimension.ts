export const INDEPENDENT_STATION_LABEL = "独立站";
export const OTHER_DIMENSION_PRESETS = ["独立站=是", "独立站=否"] as const;

export function formatOtherDimension(label: string, value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.includes("=")) return raw.replace(/\s*=\s*/, "=").replace(/\s+/g, "");
  const yes = /^(是|yes|true|y|1)$/i.test(raw);
  const no = /^(否|no|false|n|0)$/i.test(raw);
  if (yes) return `${label}=是`;
  if (no) return `${label}=否`;
  return `${label}=${raw}`;
}

export function independentStationDimension(value: string): string {
  return formatOtherDimension(INDEPENDENT_STATION_LABEL, value);
}
