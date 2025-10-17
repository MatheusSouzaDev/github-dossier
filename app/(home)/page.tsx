"use client";

import { useUser, UserButton, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { Repo } from "@/app/api/repos/route";
import RepoCard from "../_components/RepoCard";

const HomePage = () => {
  const { isSignedIn, user } = useUser();
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      const res = await fetch("/api/repos", { cache: "no-store" });
      if (res.ok) setRepos(await res.json());
    })();
  }, [isSignedIn]);

  if (!isSignedIn) return <RedirectToSignIn redirectUrl="/login" />;

  return (
    <div className="min-h-screen bg-[#0d1117] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Olá, {user?.firstName}</h1>
          <UserButton afterSignOutUrl="/login" />
        </div>

        <h2 className="mb-4 text-xl font-semibold">Seus Repositórios:</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
