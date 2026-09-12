export const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatNum(n: number) {
  return Math.floor(n).toLocaleString("hr-HR");
}

export function formatHud(n: number) {
  const v = Math.floor(Math.abs(n));
  if (v < 1000) return String(v);
  if (v < 10_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (v < 1_000_000) return `${Math.round(v / 1000)}k`;
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}
