import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)", // login é público
  "/sign-in(.*)", // se quiser manter também
  "/sign-up(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // Se for rota pública, deixa passar
  if (isPublicRoute(req)) {
    // opcional: limpar params do clerk na URL de login
    const url = req.nextUrl.clone();
    if (
      url.searchParams.has("__clerk_db_jwt") ||
      url.searchParams.has("__clerk_handshake")
    ) {
      url.searchParams.delete("__clerk_db_jwt");
      url.searchParams.delete("__clerk_handshake");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Constrói URL ABSOLUTA para login
  const loginUrl = new URL("/login", req.url).href;

  // Se usuário não está autenticado, redireciona para /login ou /login
  auth().protect({
    unauthenticatedUrl: loginUrl,
    unauthorizedUrl: loginUrl,
  });

  // Se já estiver logado, continua
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
