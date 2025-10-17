import type { CommitLite } from "@/app/api/repos/[owner]/[name]/commits/route";

export type CommitFlag =
  | "WIP"
  | "NO_PREFIX"
  | "BIG_DIFF"
  | "MANY_FILES"
  | "EMPTY_MSG";

export type CommitReview = CommitLite & { flags: CommitFlag[] };

const CC_REGEX = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\(.+\))?:\s.+/;

export function analyzeCommits(commits: CommitLite[]): {
  reviewed: CommitReview[];
  summary: {
    total: number; additions: number; deletions: number;
    bigCommits: number; manyFiles: number; wip: number; emptyMsg: number; noPrefix: number;
  };
} {
  let additions = 0, deletions = 0;
  let bigCommits = 0, manyFiles = 0, wip = 0, emptyMsg = 0, noPrefix = 0;

  const reviewed = commits.map(c => {
    const flags: CommitFlag[] = [];
    additions += c.additions; deletions += c.deletions;

    const msg = (c.message || "").trim();

    if (!msg) { flags.push("EMPTY_MSG"); emptyMsg++; }
    if (/^\s*wip\b/i.test(msg)) { flags.push("WIP"); wip++; }
    if (!CC_REGEX.test(msg)) { flags.push("NO_PREFIX"); noPrefix++; }
    if (c.additions + c.deletions > 500) { flags.push("BIG_DIFF"); bigCommits++; }
    if (c.filesChanged > 25) { flags.push("MANY_FILES"); manyFiles++; }

    return { ...c, flags };
  });

  return {
    reviewed,
    summary: {
      total: commits.length,
      additions, deletions,
      bigCommits, manyFiles, wip, emptyMsg, noPrefix
    }
  };
}
