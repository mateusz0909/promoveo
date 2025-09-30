export function lightenColor(hex: string | null | undefined, percent: number): string {
  if (!hex || typeof hex !== "string") {
    hex = "#000000";
  }

  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const clampPercent = Math.max(0, Math.min(100, percent));
  const factor = clampPercent / 100;

  // Match backend: apply transformation first, then round
  const newR = Math.min(255, r + (255 - r) * factor);
  const newG = Math.min(255, g + (255 - g) * factor);
  const newB = Math.min(255, b + (255 - b) * factor);

  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
