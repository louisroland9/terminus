import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { initAnalytics } from "@/lib/analytics";
import appCss from "../styles.css?url";

function PageSimple({
  titre,
  texte,
  children,
}: {
  titre: string;
  texte: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl brut-lg bg-card p-8 text-center">
        <h1 className="font-display text-4xl leading-tight">{titre}</h1>
        <p className="mt-4 font-medium">{texte}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">{children}</div>
      </div>
    </div>
  );
}

const BOUTON = "press rounded-2xl brut px-5 py-3 font-display text-sm uppercase";

function NotFoundComponent() {
  return (
    <PageSimple titre="404 🚧" texte="Cette voie ne mène nulle part. Même nos TER n'y vont pas.">
      <Link to="/" className={`${BOUTON} bg-primary text-primary-foreground`}>
        Retour en gare
      </Link>
    </PageSimple>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <PageSimple
      titre="Panne en voie"
      texte="La page n'a pas pu se charger. Réessaie ou reviens en gare."
    >
      <button
        onClick={() => {
          void router.invalidate();
          reset();
        }}
        className={`${BOUTON} bg-primary text-primary-foreground`}
      >
        Réessayer
      </button>
      <a href="/" className={`${BOUTON} bg-accent`}>
        Retour en gare
      </a>
    </PageSimple>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Terminus" },
      {
        name: "description",
        content: "Des trajets TER aléatoires pour redécouvrir les lignes régionales.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rubik+Mono+One&family=Space+Grotesk:wght@400;500;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => initAnalytics(), []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}
