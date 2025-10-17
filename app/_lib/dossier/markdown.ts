// lib/dossier/markdown.ts
import type { CommitReview } from "./commitAnalysis";

type FileOut = { path: string; content: string };
type DossierMeta = {
  owner: string;
  repo: string;
  description?: string | null;
  defaultBranch?: string;
  languages?: string[];
};

export function buildDossierMarkdown(meta: DossierMeta, files: FileOut[],
  commits: CommitReview[]) {
  const now = new Date().toLocaleString();

  const toc = files
    .map((f, i) => `- [${i + 1}. ${f.path}](#${slug(f.path)})`)
    .join("\n");

  const filesSections = files
    .map(
      (f, i) =>
        `### ${i + 1}. ${f.path}\n\n` +
        `<a id="${slug(f.path)}"></a>\n\n` +
        "```" +
        `\n${f.content}\n` +
        "```\n`"
    )
    .join("\n");

      const commitsSection = commits && commits.length
    ? renderCommits(commits)
    : "_Nenhum commit incluído no recorte._";

  return (
`# Dossiê do Projeto: ${meta.owner}/${meta.repo}

**Gerado em:** ${now}

> **Descrição:** ${meta.description ?? "—"}
>
> **Branch padrão:** ${meta.defaultBranch ?? "main"}
>
> **Linguagens:** ${meta.languages?.join(", ") || "—"}

---

## Sumário

- [1. Visão Geral](#visao-geral)
- [2. Estrutura de Arquivos](#estrutura-de-arquivos)
- [3. Código-Fonte Selecionado](#codigo-fonte-selecionado)
- [4. Histórico de Commits](#historico-de-commits)
- [5. Anotações & Avaliação](#anotacoes-avaliacao)

---

## 1. Visão Geral  <a id="visao-geral"></a>

- Repositório: **${meta.owner}/${meta.repo}**
- Descrição: ${meta.description ?? "—"}
- Linguagens: ${meta.languages?.join(", ") || "—"}

---

## 2. Estrutura de Arquivos  <a id="estrutura-de-arquivos"></a>

Arquivos incluídos neste dossiê:
${toc || "—"}

---

## 3. Código-Fonte Selecionado  <a id="codigo-fonte-selecionado"></a>

${filesSections || "_Nenhum arquivo selecionado._"}

---

## 4. Histórico de Commits  <a id="historico-de-commits"></a>

${commitsSection}

---

## 5. Anotações & Avaliação  <a id="anotacoes-avaliacao"></a>

** Dúvidas, Pontos Críticos ou Melhorias **

- Quero melhorar a organização dos arquivos e refatorar códigos repetitivos.
- Otimização de performance.
- Sugestões para escalar.
- Responsividade para todos os dispositivos.
- Correção do layout do transaction pie chart (está cortando).
- Criar um 2º plano de assinatura.
- Criar design secundário para assinatura específica.
- Pop-ups de atualizações/informações.
- Pegar saldo do mês anterior.
- Poder selecionar o período do feedback de IA.
- Atenção a boas práticas iniciais: commits, foco, dinâmica de construção.

 ` );
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

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

