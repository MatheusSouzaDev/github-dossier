import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";

export const runtime = "nodejs"; // importante

export async function POST(req: Request) {
  const { markdown, title = "dossie" } = (await req.json()) as {
    markdown: string;
    title?: string;
  };
  if (!markdown) return new Response("markdown required", { status: 400 });

  // 1) MD -> HTML
  const md = new MarkdownIt({ html: true, linkify: true });
  const body = md.render(markdown);

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; color:#111; }
  h1,h2,h3 { color:#0f172a; }
  pre { background:#0b1220; color:#e5e7eb; padding:12px; border-radius:8px; overflow-wrap:anywhere; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;}
  a { color:#0369a1; text-decoration:none; }
  a:hover { text-decoration:underline; }
  blockquote { border-left:4px solid #e5e7eb; padding-left:10px; color:#374151;}
  hr { border:none; border-top:1px solid #e5e7eb; margin:24px 0;}
</style>
</head>
<body>${body}</body>
</html>`;

  // 2) HTML -> PDF (Puppeteer)
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ printBackground: true, format: "A4" });
  await browser.close();
  // Converte para Uint8Array e embrulha em Blob (tipado como BodyInit)
  const u8 = new Uint8Array(pdfBuffer);
  const blob = new Blob([u8], { type: "application/pdf" });

  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitizeFileName(title)}.pdf"`,
    },
  });
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
function sanitizeFileName(s: string) {
  return s.replace(/[^a-z0-9_\-\.]+/gi, "_");
}
