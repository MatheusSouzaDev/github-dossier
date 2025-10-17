// app/api/repos/[owner]/[name]/tree/route.ts
import { getErrorMessage } from "@/app/_ utils/errors";
import { getOctokitForUser } from "@/app/_lib/server/github";

type Node = { path: string; type: "file" | "dir"; size?: number };

export const runtime = "nodejs";

async function walk(owner: string, repo: string, path = ""): Promise<Node[]> {
  const octokit = await getOctokitForUser();
  const { data } = await octokit.repos.getContent({ owner, repo, path });
  const entries = Array.isArray(data) ? data : [data];

  const out: Node[] = [];
  for (const e of entries) {
    if (e.type === "dir") {
      out.push({ path: e.path, type: "dir" });
      out.push(...(await walk(owner, repo, e.path)));
    } else if (e.type === "file") {
      out.push({ path: e.path, type: "file", size: e.size });
    }
  }
  return out;
}

export async function GET(
  req: Request,
  { params }: { params: { owner: string; name: string } },
) {
  try {
    const nodes = await walk(params.owner, params.name, "");
    return Response.json(nodes);
  } catch (e: unknown) {
    const msg = getErrorMessage(e);
    const code =
      msg === "Unauthorized" || msg === "No GitHub token" ? 401 : 502;
    return new Response(msg, { status: code });
  }
}
