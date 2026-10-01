import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const demandeTrajetSchema = z.object({
  gareDepartId: z.number().int().min(0).max(3000),
  departLe: z.string().datetime({ offset: true }),
  retourAvant: z.string().datetime({ offset: true }),
});

export const proposerTrajetAvecHorairesReels = createServerFn({ method: "POST" })
  .validator(demandeTrajetSchema)
  .handler(async ({ data }) => {
    const { genererTrajetAvecHorairesReels } = await import("./horaires.server");
    return genererTrajetAvecHorairesReels(data);
  });
