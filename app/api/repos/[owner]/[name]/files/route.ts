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

    return Response.json(files);
  } catch (e: unknown) {
    const msg = getErrorMessage(e);

    const code =
      msg === "Unauthorized" || msg === "No GitHub token" ? 401 : 502;
    return new Response(msg, { status: code });
  }
}
