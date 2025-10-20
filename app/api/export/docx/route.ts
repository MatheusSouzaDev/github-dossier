// app/api/export/docx/route.ts
import { Document, Packer, Paragraph, TextRun } from "docx";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { markdown, title = "dossie" } = (await req.json()) as {
      markdown: string;
      title?: string;
    };
    if (!markdown) return new Response("markdown required", { status: 400 });

    // ---- 1) Monta o documento (simples, mas seguro) -------------------------
    const blocks = splitMarkdown(markdown);
    const doc = new Document({
      creator: "GitHub Dossier",
      title,
      description: "Dossiê gerado automaticamente",
      sections: [
        {
          children: blocks.map((b) =>
            b.code
              ? new Paragraph({
                  children: [new TextRun({ text: b.text, font: "Courier New" })],
                })
              : new Paragraph(b.text),
          ),
        },
      ],
    });

    // ---- 2) Gera o Buffer binário do DOCX -----------------------------------
    const docBuffer = await Packer.toBuffer(doc); // <- Packer usado, doc usado

    // Converte em Uint8Array seguro para BodyInit (cria cópia para garantir ArrayBuffer padrão)
    const u8 = Uint8Array.from(docBuffer);

    // Usa Blob (sempre BodyInit válido)
    const blob = new Blob([u8], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // ---- 3) Resposta binária correta ----------------------------------------
    return new Response(blob, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${sanitize(title)}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/export/docx] ERROR:", msg);
    return new Response(`DOCX error: ${msg}`, { status: 500 });
  }
}

/* ------------------------ helpers ------------------------ */

function splitMarkdown(md: string): Array<{ text: string; code: boolean }> {
  // separa em blocos de texto e blocos de código delimitados por ```
  const parts = md.split(/```/g);
  const out: Array<{ text: string; code: boolean }> = [];
  parts.forEach((chunk, i) => {
    if (i % 2 === 1) {
      // bloco de código
      out.push({ text: chunk.trim(), code: true });
    } else {
      // parágrafos normais
      chunk
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => out.push({ text: p, code: false }));
    }
  });
  return out;
}

function sanitize(name: string) {
  return name.replace(/[^a-z0-9_\-\.]+/gi, "_");
}
