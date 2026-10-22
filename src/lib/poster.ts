import type { CommunityEvent } from "@/lib/domain";
import { formatWhen } from "@/lib/domain";

function esc(value: string): string {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function wrap(text: string, max: number, limit: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, limit);
}

export function posterSvg(event: CommunityEvent, shape: "story" | "wide"): string {
  const approved = event.approvals.visual === "approved";
  const title = wrap(event.title || "Community event", shape === "story" ? 16 : 28, shape === "story" ? 4 : 2);
  const when = formatWhen(event.date, event.start, event.end);
  const place = [event.venue || "Venue to confirm", event.area].filter(Boolean).join(" · ");
  const status = approved ? "Approved to export" : "Draft — not for posting";
  const theme = event.theme || "Community night";

  if (shape === "wide") {
    const titleSvg = title
      .map(
        (line, i) =>
          `<text x="72" y="${168 + i * 68}" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="#1c211c">${esc(line)}</text>`,
      )
      .join("");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(event.title)} poster">
  <rect width="1200" height="630" fill="#f3efe6"/>
  <rect width="28" height="630" fill="#0e4d4a"/>
  <rect x="28" y="0" width="1200" height="10" fill="#9a4512"/>
  <circle cx="1088" cy="92" r="46" fill="none" stroke="#0e4d4a" stroke-width="8"/>
  <rect x="1064" y="148" width="48" height="48" fill="#9a4512" transform="rotate(45 1088 172)"/>
  <text x="72" y="78" font-family="Source Sans 3, sans-serif" font-size="22" letter-spacing="3" fill="#0e4d4a">COMMUNITY EVENT</text>
  ${titleSvg}
  <text x="72" y="${188 + title.length * 68}" font-family="Source Sans 3, sans-serif" font-size="28" fill="#3e463c">${esc(when)}</text>
  <text x="72" y="${228 + title.length * 68}" font-family="Source Sans 3, sans-serif" font-size="28" fill="#3e463c">${esc(place)}</text>
  <text x="72" y="560" font-family="Source Sans 3, sans-serif" font-size="22" fill="#3e463c">${esc(theme)}</text>
  <text x="72" y="598" font-family="Source Sans 3, sans-serif" font-size="20" fill="#9a4512">${esc(status)}</text>
</svg>`;
  }

  const titleSvg = title
    .map(
      (line, i) =>
        `<text x="80" y="${280 + i * 86}" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#1c211c">${esc(line)}</text>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-label="${esc(event.title)} poster">
  <rect width="1080" height="1350" fill="#f3efe6"/>
  <rect width="1080" height="28" fill="#0e4d4a"/>
  <rect x="0" y="28" width="28" height="1322" fill="#9a4512"/>
  <circle cx="920" cy="150" r="64" fill="none" stroke="#0e4d4a" stroke-width="10"/>
  <rect x="888" y="250" width="64" height="64" fill="#9a4512" transform="rotate(45 920 282)"/>
  <text x="80" y="140" font-family="Source Sans 3, sans-serif" font-size="26" letter-spacing="4" fill="#0e4d4a">COMMUNITY EVENT</text>
  ${titleSvg}
  <line x1="80" y1="${340 + title.length * 86}" x2="520" y2="${340 + title.length * 86}" stroke="#1c211c" stroke-width="3"/>
  <text x="80" y="${400 + title.length * 86}" font-family="Source Sans 3, sans-serif" font-size="34" fill="#1c211c">${esc(when)}</text>
  <text x="80" y="${452 + title.length * 86}" font-family="Source Sans 3, sans-serif" font-size="34" fill="#3e463c">${esc(place)}</text>
  <text x="80" y="1180" font-family="Source Sans 3, sans-serif" font-size="30" fill="#3e463c">${esc(theme)}</text>
  <text x="80" y="1260" font-family="Source Sans 3, sans-serif" font-size="26" fill="#9a4512">${esc(status)} · template, not a generated image</text>
</svg>`;
}

export function downloadText(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
