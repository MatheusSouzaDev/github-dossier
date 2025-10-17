// lib/dossier/markdown.ts
import type { CommitReview } from "@/app/_lib/dossier/commitAnalysis";

export type DossierMeta = {
  owner: string;
  repo: string;
  description?: string | null;
  defaultBranch?: string | null;
  languages?: string[];            // ex.: ["TypeScript","SQL"]
  techStackExtra?: string[];       // ex.: ["Prisma","Shadcn","Stripe"]
};

export type FileOut = { path: string; content: string };

export function buildDossierMarkdown(
  meta: DossierMeta,
  files: FileOut[],
  commitsReviewed?: CommitReview[],
  allPathsFlat?: string[],         // lista “flat” de paths para a árvore
  packageJsonSummary?: {           // opcional: resumo do package.json
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
  envExampleContent?: string | null // opcional: conteúdo do .env.example
) {
  const now = new Date().toLocaleString();

  // 2. Estrutura de arquivos (árvore)
  const pathsForTree = (allPathsFlat ?? files.map(f => f.path)).sort();
  const treeText = buildAsciiTree(pathsForTree);

  // 3. Arquivos selecionados
  const filesSections = files.map((f, i) =>
    `### ${i + 1}. ${f.path}\n\n<a id="${slug(f.path)}"></a>\n\n\`\`\`\n${f.content}\n\`\`\`\n`
  ).join("\n");

  // 4. Commits (se existirem)
  const commitsSection = commitsReviewed && commitsReviewed.length
    ? renderCommits(commitsReviewed)
    : "_Nenhum commit incluído no recorte._";

  // 5. package.json (resumo)
  const pkgBlock = packageJsonSummary
    ? renderPackageSummary(packageJsonSummary)
    : "_Não localizado/selecionado._";

  // 6. .env.example
  const envBlock = envExampleContent
    ? `\n\`\`\`dotenv\n${envExampleContent}\n\`\`\`\n`
    : "_Não localizado/selecionado._";

  // 7. Tech stack base + extras
  const techStack = [
    ...(meta.languages ?? []),
    "Next.js 14",
    "TypeScript",
    "TailwindCSS",
    ...(meta.techStackExtra ?? []),
  ];

  // 8. Bloco “Dúvidas/Críticos/Melhorias” (fundido com o item 8 do Modelo_SaaS)
  const doubtsMerged = renderDoubtsMerged();

  return `# Dossiê do Projeto: ${meta.owner}/${meta.repo}

**Gerado em:** ${now}

> **Descrição:** ${meta.description ?? "—"}
>
> **Branch padrão:** ${meta.defaultBranch ?? "main"}
>
> **Linguagens/Tecnologias:** ${techStack.join(", ") || "—"}

---

## Sumário

- [1. Dados Gerais](#dados-gerais)
- [2. Estrutura de Pastas e Arquivos](#estrutura-de-pastas-e-arquivos)
- [3. Códigos Selecionados](#codigos-selecionados)
- [4. Histórico de Commits](#historico-de-commits)
- [5. Tecnologias Utilizadas](#tecnologias-utilizadas)
- [6. Variáveis de Ambiente (.env.example)](#variaveis-de-ambiente-envexample)
- [7. Dependências (package.json)](#dependencias-packagejson)
- [8. Dúvidas, Pontos Críticos ou Melhorias](#duvidas-pontos-criticos-ou-melhorias)

---

## 1. Dados Gerais  <a id="dados-gerais"></a>

- Repositório: **${meta.owner}/${meta.repo}**
- Descrição: ${meta.description ?? "—"}
- Branch padrão: ${meta.defaultBranch ?? "main"}

---

## 2. Estrutura de Pastas e Arquivos  <a id="estrutura-de-pastas-e-arquivos"></a>

\`\`\`
${treeText || "—"}
\`\`\`

---

## 3. Códigos Selecionados  <a id="codigos-selecionados"></a>

${filesSections || "_Nenhum arquivo selecionado._"}

---

## 4. Histórico de Commits  <a id="historico-de-commits"></a>

${commitsSection}

---

## 5. Tecnologias Utilizadas  <a id="tecnologias-utilizadas"></a>

- ${techStack.join("\n- ")}

---

## 6. Variáveis de Ambiente (.env.example)  <a id="variaveis-de-ambiente-envexample"></a>

${envBlock}

---

## 7. Dependências (package.json)  <a id="dependencias-packagejson"></a>

${pkgBlock}

---

## 8. Dúvidas, Pontos Críticos ou Melhorias  <a id="duvidas-pontos-criticos-ou-melhorias"></a>

${doubtsMerged}

`;
}

/* ---------- helpers ---------- */

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Estrutura tipada da árvore (sem any) */
type TreeNode = { children: Map<string, TreeNode> };

/** Constrói uma árvore ASCII a partir de paths “flat” */
export function buildAsciiTree(paths: string[]): string {
  if (!paths.length) return "";

  // raiz tipada
  const root: TreeNode = { children: new Map<string, TreeNode>() };

  // monta um trie
  for (const p of paths) {
    const parts = p.split("/").filter(Boolean);
    let cur = root;
    for (const part of parts) {
      if (!cur.children.has(part)) {
        cur.children.set(part, { children: new Map<string, TreeNode>() });
      }
      cur = cur.children.get(part)!;
    }
  }

  const lines: string[] = [];

  function print(node: TreeNode, prefix = "") {
    const entries = [...node.children.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );

    entries.forEach(([name, child], idx) => {
      const isLast = idx === entries.length - 1;
      const branch = isLast ? "┗" : "┣";
      lines.push(`${prefix}${branch} ${name}`);
      const nextPrefix = `${prefix}${isLast ? "  " : "┃ "} `;
      if (child.children.size > 0) {
        print(child, nextPrefix);
      }
    });
  }

  print(root, "");
  return lines.join("\n");
}


function renderCommits(commits: CommitReview[]) {
  const header = `| Data | SHA | Mensagem | +/- | Arquivos | Flags |
|---|---|---|---:|---:|---|
`;
  const rows = commits.map(c => {
    const short = c.sha.slice(0, 7);
    const flags = c.flags.join(", ") || "—";
    const delta = `+${c.additions}/-${c.deletions}`;
    const msg = c.message.replace(/\|/g, "\\|").split("\n")[0];
    return `| ${new Date(c.date).toLocaleString()} | [${short}](${c.url}) | ${msg} | ${delta} | ${c.filesChanged} | ${flags} |`;
  }).join("\n");

  return header + rows;
}

function renderPackageSummary(pkg?: {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}) {
  if (!pkg) return "";
  const deps = pkg.dependencies ? Object.entries(pkg.dependencies) : [];
  const dev = pkg.devDependencies ? Object.entries(pkg.devDependencies) : [];

  const mkTable = (title: string, entries: [string, string][]) =>
    entries.length
      ? `**${title}**\n\n| Pacote | Versão |\n|---|---|\n${entries
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `| ${k} | ${v} |`)
          .join("\n")}\n`
      : `**${title}**\n\n_—_\n`;

  return [
    `**Nome:** ${pkg.name ?? "—"}  \n**Versão:** ${pkg.version ?? "—"}`,
    mkTable("Dependencies", deps),
    mkTable("DevDependencies", dev),
  ].join("\n\n");
}

function renderDoubtsMerged() {
  // Baseado no item 8 do Modelo_SaaS + seu bloco de dúvidas
  const items = [
    "Melhorar organização dos arquivos e remover duplicações.",
    "Refatorar componentes críticos e padronizar padrões.",
    "Otimizações de performance (lazy, cache, memoização).",
    "Garantir responsividade total (mobile-first).",
    "Ajustar chart de transações (corte/overflow).",
    "Criar um 2º plano de assinatura e regras.",
    "Criar design secundário para assinatura específica.",
    "Exibir pop-ups/notificações de atualização.",
    "Trazer saldo do mês anterior no dashboard.",
    "Selecionar período para feedback de IA.",
    "Reforçar boas práticas: commits granulares e descritivos.",
  ];
  return items.map(i => `- ${i}`).join("\n");
}
