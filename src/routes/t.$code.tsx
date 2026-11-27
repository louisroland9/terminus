import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ResultatBillet } from "@/components/billet/resultat-billet";
import { Habillage } from "@/components/habillage";
import { suivreEvenement } from "@/lib/analytics";
import { decoderBillet, gareDuBillet, type Billet } from "@/lib/billet";
import { proposerTrajetAvecHorairesReels } from "@/lib/horaires";
import { metaApercu } from "@/lib/seo";

export const Route = createFileRoute("/t/$code")({
  head: ({ params }) => {
    const billet = decoderBillet(params.code);
    const titre = billet
      ? `${gareDuBillet(billet.origineId).nom} → ${gareDuBillet(billet.destinationId).nom} en TER, au pif`
      : "Billet introuvable — Terminus";
    const description = "Le hasard a choisi ce trajet. Et toi, où il t'envoie ?";
    return {
      meta: [
        { title: titre },
        { name: "description", content: description },
        ...metaApercu({ titre, description, chemin: `/t/${params.code}` }),
      ],
    };
  },
  component: PageBillet,
});

const BOUTON = "press inline-block rounded-2xl brut bg-accent px-6 py-4 font-display uppercase";

function PageBillet() {
  const { code } = Route.useParams();
  const billet = decoderBillet(code);

  useEffect(() => {
    suivreEvenement("Shared Link Opened");
  }, [code]);

  return (
    <Habillage>
      <main className="mx-auto min-h-[60vh] max-w-6xl px-5 pb-24 pt-12">
        {billet ? (
          <BilletPartage code={code} billet={billet} />
        ) : (
          <Message titre="Billet illisible 🎫">
            <Link to="/" className={BOUTON}>
              Tire le tien 🎰
            </Link>
          </Message>
        )}
      </main>
    </Habillage>
  );
}

function BilletPartage({ code, billet }: { code: string; billet: Billet }) {
  const origine = gareDuBillet(billet.origineId);
  const destination = gareDuBillet(billet.destinationId);
  // Le calcul se fait côté client pour que les robots d'aperçu n'attendent pas le GTFS.
  const requete = useQuery({
    queryKey: ["billet", code],
    queryFn: async () => {
      if (billet.retourAvant <= new Date()) return null;
      return proposerTrajetAvecHorairesReels({
        data: {
          gareDepartId: billet.origineId,
          destinationId: billet.destinationId,
          departLe: billet.departLe.toISOString(),
          retourAvant: billet.retourAvant.toISOString(),
        },
      });
    },
    staleTime: Infinity,
    retry: false,
  });
  const tirerLeSien = (
    <Link to="/" search={{ gare: billet.origineId }} className={`${BOUTON} text-center`}>
      Tire le tien 🎰
    </Link>
  );

  if (requete.isPending) {
    return (
      <Message titre={`${origine.nom} → ${destination.nom}`}>
        <p role="status" className="animate-chug font-mono text-sm font-bold">
          🚂 Recherche des horaires SNCF réels…
        </p>
      </Message>
    );
  }

  if (requete.isError) {
    return (
      <Message titre="Horaires indisponibles">
        <button onClick={() => void requete.refetch()} className={BOUTON}>
          Réessayer 🔄
        </button>
      </Message>
    );
  }

  if (!requete.data) {
    return (
      <Message titre="Ce train est parti 🚂💨">
        <p className="mb-6 font-medium">Tire le tien depuis {origine.nom}.</p>
        {tirerLeSien}
      </Message>
    );
  }

  return (
    <>
      <h1 className="mb-10 text-center font-display text-2xl leading-tight sm:text-4xl">
        {origine.nom} → {destination.nom}
      </h1>
      <ResultatBillet trajet={requete.data} billet={billet} action={tirerLeSien} />
    </>
  );
}

function Message({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl brut-lg bg-card p-8 text-center">
      <h1 className="mb-6 font-display text-2xl leading-tight">{titre}</h1>
      {children}
    </div>
  );
}
