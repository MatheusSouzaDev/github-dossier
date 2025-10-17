import { getErrorMessage } from "@/app/_ utils/errors";
import { getOctokitForUser } from "@/app/_lib/server/github";

export type Repo = {
  id: number;
  name: string;
  owner: { login: string };
  html_url: string;
  private: boolean;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
};

export const runtime = "nodejs"; // garante Node runtime

export async function GET() {
  try {
    const octokit = await getOctokitForUser();
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "updated",
    });

    const payload: Repo[] = data.map((r) => ({
      id: r.id,
      name: r.name,
      owner: { login: r.owner.login },
      html_url: r.html_url,
      private: r.private,
      description: r.description ?? null,
      language: r.language ?? null,
      stargazers_count: r.stargazers_count ?? 0,
      forks_count: r.forks_count ?? 0,
      updated_at: r.updated_at ?? new Date(0).toISOString(),
    }));

    return Response.json(payload);
  } catch (e: unknown) {
    const msg = getErrorMessage(e);
  setError(`Erro ao ...: ${msg}`);
    const code =
      msg === "Unauthorized" || msg === "No GitHub token" ? 401 : 502;
    return new Response(msg, { status: code });
  }
}


