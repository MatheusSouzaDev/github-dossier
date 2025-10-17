"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { buildDossierMarkdown } from "@/app/_lib/dossier/markdown";
import { analyzeCommits } from "@/app/_lib/dossier/commitAnalysis";
import { getErrorMessage } from "@/app/_ utils/errors";

type Node = { path: string; type: "file" | "dir"; size?: number };
type FileOut = { path: string; content: string };
type CommitLite = {
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

export default function RepoDetail() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega árvore flat
  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await fetch(`/api/repos/${owner}/${name}/tree`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        setNodes(await res.json());
      } catch (e: unknown) {
        const msg = getErrorMessage(e);
        setError(`Erro ao ...: ${msg}`);
        setNodes([]);
      }
    })();
  }, [owner, name]);

  const files = useMemo(() => nodes.filter((n) => n.type === "file"), [nodes]);
  const allSelected = useMemo(
    () => files.length > 0 && files.every((f) => selected[f.path]),
    [files, selected],
  );
  const selectedCount = useMemo(
    () => files.filter((f) => selected[f.path]).length,
    [files, selected],
  );

  function toggleAll() {
    const next: Record<string, boolean> = {};
    if (!allSelected) files.forEach((f) => (next[f.path] = true));
    setSelected(next);
  }

  // 🔥 Função única que gera MD/PDF/DOCX
  async function generateAndDownload(kind: "md" | "pdf" | "docx") {
    const paths = files.filter((f) => selected[f.path]).map((f) => f.path);
    if (paths.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      // 1) Arquivos selecionados
      const resFiles = await fetch(`/api/repos/${owner}/${name}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });
      if (!resFiles.ok) throw new Error(await resFiles.text());
      const fileData: FileOut[] = await resFiles.json();

      // 2) Últimos commits
      const resCommits = await fetch(
        `/api/repos/${owner}/${name}/commits?per_page=50`,
        { cache: "no-store" },
      );
      const commitLite: CommitLite[] = resCommits.ok
        ? await resCommits.json()
        : [];
      const { reviewed } = analyzeCommits(commitLite);

      // 3) Monta o markdown completo (com commits)
      const md = buildDossierMarkdown(
        { owner: owner as string, repo: name as string },
        fileData,
        reviewed,
      );

      // 4) Export de acordo com o tipo
      if (kind === "md") {
        const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
        triggerDownload(blob, `${name}-dossie.md`);
      } else if (kind === "pdf") {
        const pdfRes = await fetch("/api/export/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: md, title: `${name}-dossie` }),
        });
        if (!pdfRes.ok) throw new Error(await pdfRes.text());
        triggerDownload(await pdfRes.blob(), `${name}-dossie.pdf`);
      } else {
        const docxRes = await fetch("/api/export/docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: md, title: `${name}-dossie` }),
        });
        if (!docxRes.ok) throw new Error(await docxRes.text());
        triggerDownload(await docxRes.blob(), `${name}-dossie.docx`);
      }
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      setError(`Erro ao ...: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold">
          {owner}/{name}
        </h1>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <button
            onClick={toggleAll}
            className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
          >
            {allSelected ? "Desmarcar tudo" : "Selecionar tudo"}
          </button>

          <span className="text-sm text-slate-400">
            {selectedCount} arquivo(s) selecionado(s)
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => generateAndDownload("md")}
              disabled={loading || selectedCount === 0}
              className="rounded bg-sky-600 px-3 py-1 text-sm hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "Gerando..." : "Gerar .md"}
            </button>
            <button
              onClick={() => generateAndDownload("pdf")}
              disabled={loading || selectedCount === 0}
              className="rounded bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Gerando..." : "Gerar PDF"}
            </button>
            <button
              onClick={() => generateAndDownload("docx")}
              disabled={loading || selectedCount === 0}
              className="rounded bg-indigo-600 px-3 py-1 text-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Gerando..." : "Gerar DOCX"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-2 rounded bg-red-900/30 p-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="rounded border border-slate-700">
          <ul className="max-h-[70vh] divide-y divide-slate-700 overflow-auto">
            {nodes.map((n) => (
              <li
                key={n.path}
                className="flex items-center justify-between p-2"
              >
                <div className="truncate">
                  <span className="mr-2 text-xs uppercase text-slate-400">
                    {n.type}
                  </span>
                  <span className="font-mono">{n.path}</span>
                </div>
                {n.type === "file" && (
                  <input
                    type="checkbox"
                    checked={!!selected[n.path]}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        [n.path]: e.target.checked,
                      }))
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
