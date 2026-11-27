import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

// Les aperçus sociaux exigent des URL absolues : on les déduit de la requête en cours.
const origineSite = createIsomorphicFn()
  .server(() => getRequestUrl({ xForwardedHost: true }).origin)
  .client(() => window.location.origin);

type Apercu = { titre: string; description: string; chemin: string };

export function metaApercu({ titre, description, chemin }: Apercu) {
  const origine = origineSite();
  const image = `${origine}/og.png`;
  return [
    { property: "og:title", content: titre },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${origine}${chemin}` },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: image },
  ];
}
