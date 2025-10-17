// lib/server/github.ts
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";

/**
 * Retorna um Octokit autenticado com o access_token GitHub do usuário logado.
 * Lança erro se não autenticado ou se não houver token armazenado no Clerk.
 */
export async function getOctokitForUser(): Promise<Octokit> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // Retorno é PaginatedResourceResponse
  const tokens = await clerkClient.users.getUserOauthAccessToken(
    userId,
    "oauth_github",
  );
  const githubToken = tokens?.data?.[0]?.token;
  if (!githubToken) throw new Error("No GitHub token");

  return new Octokit({ auth: githubToken });
}
