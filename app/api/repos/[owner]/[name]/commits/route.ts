import { getOctokitForUser } from "@/app/_lib/server/github";

export type CommitLite = {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  date: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  url: string;
};

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { owner: string; name: string } },
) {
  try {
    const { owner, name } = params;
    const octokit = await getOctokitForUser();

    const url = new URL(req.url);
    const per_page = Number(url.searchParams.get("per_page") ?? 30);
    const since = url.searchParams.get("since") ?? undefined; // ISO
    const until = url.searchParams.get("until") ?? undefined; // ISO
    const sha = url.searchParams.get("sha") ?? undefined; // branch

    // 1) lista commits (leve)
    const list = await octokit.repos.listCommits({
      owner,
      repo: name,
      per_page,
      since,
      until,
      sha,
    });

    // 2) enriquece cada commit com stats (files/add/del)
    const out: CommitLite[] = [];
    for (const c of list.data) {
      const detail = await octokit.repos.getCommit({
        owner,
        repo: name,
        ref: c.sha,
      });
      out.push({
        sha: c.sha,
        message: c.commit.message,
        authorName: c.commit.author?.name ?? c.author?.login ?? "unknown",
        authorEmail: c.commit.author?.email ?? "",
        date:
          c.commit.author?.date ??
          c.commit.committer?.date ??
          new Date(0).toISOString(),
        additions: detail.data.stats?.additions ?? 0,
        deletions: detail.data.stats?.deletions ?? 0,
        filesChanged: detail.data.files?.length ?? 0,
        url:
          c.html_url ?? `https://github.com/${owner}/${name}/commit/${c.sha}`,
      });
    }

    return Response.json(out);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 502 });
  }
}
