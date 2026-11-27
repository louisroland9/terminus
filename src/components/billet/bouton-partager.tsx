import { toast } from "sonner";
import { suivreEvenement } from "@/lib/analytics";
import { encoderBillet, type Billet } from "@/lib/billet";
import { partager } from "@/lib/partage";
import { recapBillet } from "@/lib/recap";
import type { TrajetAllerRetour } from "@/lib/trajet";

type Props = {
  billet: Billet;
  trajet: TrajetAllerRetour;
  numero?: number | undefined;
  departementsCarnet?: number | undefined;
};

export function BoutonPartager({ billet, trajet, numero, departementsCarnet }: Props) {
  const partagerBillet = async () => {
    suivreEvenement("Share Clicked");
    const url = `${window.location.origin}/t/${encoderBillet(billet)}`;
    const issue = await partager({
      titre: "Terminus — mon billet",
      texte: recapBillet(trajet, { numero, departementsCarnet }),
      url,
    });
    if (issue === "copie") toast.success("Billet copié, colle-le où tu veux !");
    if (issue === "echec")
      toast.error("Impossible de copier. Voici ton lien :", { description: url });
  };

  return (
    <button
      onClick={() => void partagerBillet()}
      className="press rounded-2xl brut bg-pop py-4 font-display uppercase"
    >
      Partager mon billet 📤
    </button>
  );
}
