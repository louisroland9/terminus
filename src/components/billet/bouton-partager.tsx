import { toast } from "sonner";
import { suivreEvenement } from "@/lib/analytics";
import { encoderBillet, gareDuBillet, type Billet } from "@/lib/billet";
import { partager } from "@/lib/partage";

export function BoutonPartager({ billet }: { billet: Billet }) {
  const partagerBillet = async () => {
    suivreEvenement("Share Clicked");
    const url = `${window.location.origin}/t/${encoderBillet(billet)}`;
    const issue = await partager({
      titre: "Terminus — mon billet",
      texte: `Le hasard m'envoie de ${gareDuBillet(billet.origineId).nom} à ${gareDuBillet(billet.destinationId).nom} en TER 🚂`,
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
