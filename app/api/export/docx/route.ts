import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { markdown, title = "dossie" } = (await req.json()) as {
    markdown: string;
    title?: string;
  };
  if (!markdown) return new Response("markdown required", { status: 400 });

  // Conversão simples: quebra por títulos ### como seções
  const sections = splitByH3(markdown);

  const doc = new Document({
    creator: "GitHub Dossier",
    title,
    description: "Dossiê gerado automaticamente",
    sections: sections.map((sec) => ({
      children: [
        new Paragraph({ text: sec.title, heading: HeadingLevel.HEADING_2 }),
        ...toParagraphs(sec.content),
      ],
    })),
  });

  const buffer = await Packer.toBuffer(doc);
  const u8 = new Uint8Array(buffer);
  const blob = new Blob([u8], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return new Response(blob, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${sanitize(title)}.docx"`,
    },
  });
}

function splitByH3(md: string) {
  const lines = md.split(/\r?\n/);
  const out: { title: string; content: string }[] = [];
  let cur = { title: "Dossiê", content: "" };
  for (const l of lines) {
    const m = /^###\s+(.*)/.exec(l);
    if (m) {
      out.push(cur);
      cur = { title: m[1], content: "" };
    } else {
      cur.content += l + "\n";
    }
  }
  out.push(cur);
  return out;
}

function toParagraphs(text: string) {
  // simplificado: converte código e texto em parágrafos
  const blocks = text.split(/```/);
  const paras: Paragraph[] = [];
  blocks.forEach((block, i) => {
    if (i % 2 === 1) {
      // bloco de código
      paras.push(
        new Paragraph({
          children: [new TextRun({ text: block.trim(), font: "Courier New" })],
        }),
      );
    } else {
      block
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => paras.push(new Paragraph(p)));
    }
  });
  return paras;
}

function sanitize(s: string) {
  return s.replace(/[^a-z0-9_\-\.]+/gi, "_");
}
