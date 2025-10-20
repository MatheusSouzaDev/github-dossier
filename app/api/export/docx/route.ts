// app/api/export/docx/route.ts
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { markdown, title = "dossie" } = (await req.json()) as {
      markdown: string
      title?: string
    }
    if (!markdown) return new Response("markdown required", { status: 400 })

    // Divide o markdown em seções básicas
    const sections = markdown.split(/^#{1,3}\s/m).filter(Boolean)

    const doc = new Document({
      creator: "GitHub Dossier",
      title,
      description: "Dossiê de projeto gerado automaticamente",
      sections: [
        {
          children: sections.map(
            (block) =>
              new Paragraph({
                children: [new TextRun(block.trim())],
              }),
          ),
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${sanitize(title)}.docx"`,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("DOCX error:", msg)
    return new Response(`DOCX error: ${msg}`, { status: 500 })
  }
}

function sanitize(name: string) {
  return name.replace(/[^a-z0-9_\-\.]+/gi, "_")
}
