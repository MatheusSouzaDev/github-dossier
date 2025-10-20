// app/api/export/pdf/route.ts
import MarkdownIt from "markdown-it";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel: aumenta timeout da função (opcional)

export async function POST(req: Request) {
  try {
    const { markdown, title = "dossie" } = (await req.json()) as {
      markdown: string;
      title?: string;
    };
    if (!markdown) return new Response("markdown required", { status: 400 });

    const md = new MarkdownIt({ html: true, linkify: true });
    const body = md.render(markdown);

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  *,*::before,*::after { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial; color:#111; }
  h1,h2,h3 { color:#0f172a; margin: 18px 0 10px; }
  pre { background:#0b1220; color:#e5e7eb; padding:12px; border-radius:8px; white-space:pre-wrap; word-break:break-word; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
  a { color:#0369a1; text-decoration:none; } a:hover { text-decoration:underline; }
  blockquote { border-left:4px solid #e5e7eb; padding-left:10px; color:#374151; }
  hr { border:none; border-top:1px solid #e5e7eb; margin:24px 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
  th { background: #f8fafc; text-align: left; }
</style>
</head>
<body>${body}</body>
</html>`;

    // Caminho do Chromium compatível com Vercel
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true, 
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    const blob = new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizeFileName(title)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/export/pdf] ERROR:", msg);
    return new Response(`PDF error: ${msg}`, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));
}
function sanitizeFileName(s: string) {
  return s.replace(/[^a-z0-9_\-\.]+/gi, "_");
}
