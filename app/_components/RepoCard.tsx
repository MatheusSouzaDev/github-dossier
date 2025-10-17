"use client";

import Link from "next/link";

type Repo = {
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

const languageColor: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  PHP: "#4F5D95",
  Ruby: "#701516",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
};

function LangDot({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const color = languageColor[lang] ?? "#9CA3AF"; // slate-400 fallback
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {lang}
    </span>
  );
}

export default function RepoCard({ repo }: { repo: Repo }) {
  const visibility = repo.private ? "Privado" : "Público";
  return (
    <div className="group rounded-lg border border-slate-700/60 bg-slate-800/60 p-4 text-slate-100 shadow-sm transition-colors hover:border-slate-600 hover:bg-slate-800">
      <div className="flex items-start justify-between">
        <Link
          href={`/repos/${repo.owner.login}/${repo.name}`} 
          className="font-semibold text-sky-300 hover:underline"
        >
          {repo.name}
        </Link>

        <span className="rounded-full border border-slate-600 bg-slate-700/60 px-2 py-0.5 text-xs text-slate-200">
          {visibility}
        </span>
      </div>

      {repo.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-300/90">
          {repo.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
        <LangDot lang={repo.language} />

        <span className="inline-flex items-center gap-1">
          {/* star */}
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.401 8.162L12 18.897l-7.335 3.863 1.401-8.162L.132 9.21l8.2-1.192L12 .587z" />
          </svg>
          {repo.stargazers_count}
        </span>

        <span className="inline-flex items-center gap-1">
          {/* fork */}
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6 3a3 3 0 102.25 5.001A5.002 5.002 0 0011 13v2.17a3.001 3.001 0 10 2 0V13a5.002 5.002 0 002.75-4.999A3 3 0 1021 5a3 3 0 10-5.25 1.75A3 3 0 0013 10H11a3 3 0 00-2.75-3.25A3 3 0 006 3z" />
          </svg>
          {repo.forks_count}
        </span>

        <span className="ml-auto text-xs text-slate-400">
          Atualizado {new Date(repo.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
