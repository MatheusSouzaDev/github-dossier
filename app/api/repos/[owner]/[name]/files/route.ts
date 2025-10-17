// app/api/repos/[owner]/[name]/files/route.ts
import { getErrorMessage } from "@/app/_ utils/errors";
import { getOctokitForUser } from "@/app/_lib/server/github";

type FileOut = { path: string; content: string };

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { owner: string; name: string } },
) {
  try {
    const { paths } = (await req.json()) as { paths: string[] };
    if (!Array.isArray(paths) || paths.length === 0) {
      return new Response("No paths", { status: 400 });
    }

    const octokit = await getOctokitForUser();
    const files: FileOut[] = [];

    for (const p of paths) {
      const { data } = await octokit.repos.getContent({
        owner: params.owner,
        repo: params.name,
        path: p,
      });

      if (!Array.isArray(data) && data.type === "file" && data.content) {
        const decoded = Buffer.from(data.content, "base64").toString("utf-8");
        files.push({ path: p, content: decoded });
      }
    }

    // 2) README.md (automático, como descrição)
    // usa o endpoint específico que resolve README em qualquer pasta (root/docs etc.)
    let readme: string | null = null;
    try {
      const { data } = await octokit.repos.getReadme({
        owner: params.owner,
        repo: params.name,
      });
      // getReadme retorna base64
      const b64: string | undefined = data.content;
      if (b64) {
        readme = Buffer.from(b64, "base64").toString("utf-8");
      }
    } catch {
      // fallback: se já veio selecionado um README.md, usa aquele
      const selectedReadme =
        files.find(f => f.path.toLowerCase().endsWith("readme.md"))?.content ??
        null;
      readme = selectedReadme;
    }

    return Response.json({files, readme});
  } catch (e: unknown) {
    const msg = getErrorMessage(e);

    const code =
      msg === "Unauthorized" || msg === "No GitHub token" ? 401 : 502;
    return new Response(msg, { status: code });
  }
}
