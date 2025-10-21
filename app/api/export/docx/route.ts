// app/api/export/docx/route.ts
import { Document, Packer, Paragraph, TextRun } from "docx";

export const runtime = "nodejs";
export const maxDuration = 30;

// helper: Buffer | Uint8Array -> ArrayBuffer
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  // copia os bytes válidos para um ArrayBuffer normal (não SharedArrayBuffer)
  return new Uint8Array(u8).buffer;
}

export async function POST(req: Request) {
  try {
    const { markdown, title = "dossie" } = (await req.json()) as {
      markdown: string;
      title?: string;
    };
    if (!markdown) return new Response("markdown required", { status: 400 });

    // 1) MD -> parágrafos simples
    const blocks = markdown.split(/\n{2,}/);
    const doc = new Document({
      creator: "GitHub Dossier",
      title,
      description: "Dossiê gerado automaticamente",
      sections: [
        {
          children: blocks.map(
            (b) =>
              new Paragraph({
                children: [new TextRun(b.trim())],
              }),
          ),
        },
      ],
    });

    // 2) Gera binário (em Node vem como Buffer, que é Uint8Array)
    const nodeBuf = await Packer.toBuffer(doc); // Buffer (subclasse de Uint8Array)

    // 3) Converte para ArrayBuffer para satisfazer BlobPart
    const ab = toArrayBuffer(nodeBuf as unknown as Uint8Array);

    // 4) Retorna como Blob (BodyInit 100% compatível)
    const blob = new Blob([ab], {
      type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

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

function sanitize(s: string) {
  return s.replace(/[^a-z0-9_\-\.]+/gi, "_");
}
