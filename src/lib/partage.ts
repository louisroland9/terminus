export type IssuePartage = "partage" | "copie" | "annule" | "echec";

type Contenu = { titre: string; texte: string; url: string };

/** Feuille de partage native si elle existe, presse-papier sinon. */
export async function partager({ titre, texte, url }: Contenu): Promise<IssuePartage> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: titre, text: texte, url });
      return "partage";
    } catch (erreur) {
      if (erreur instanceof DOMException && erreur.name === "AbortError") return "annule";
    }
  }
  try {
    await navigator.clipboard.writeText(`${texte}\n${url}`);
    return "copie";
  } catch {
    return "echec";
  }
}
