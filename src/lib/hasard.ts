/** Générateur pseudo-aléatoire reproductible : FNV-1a pour la graine, puis mulberry32. */
export function aleatoireSeme(graine: string): () => number {
  let etat = 2166136261;
  for (const caractere of graine) {
    etat = Math.imul(etat ^ caractere.codePointAt(0)!, 16777619);
  }
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function melanger<T>(valeurs: T[], aleatoire: () => number = Math.random): T[] {
  const resultat = [...valeurs];
  for (let index = resultat.length - 1; index > 0; index--) {
    const autre = Math.floor(aleatoire() * (index + 1));
    [resultat[index], resultat[autre]] = [resultat[autre]!, resultat[index]!];
  }
  return resultat;
}
