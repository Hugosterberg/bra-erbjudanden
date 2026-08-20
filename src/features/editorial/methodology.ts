import type { Database } from "@/shared/types/database";

export type MethodologyType = Database["public"]["Enums"]["methodology_type"];

export const METHODOLOGY_LABELS: Record<MethodologyType, string> = {
  tested_by_us: "Testad av oss",
  editorial_evaluation: "Redaktionellt utvärderad",
  compared_from_sources: "Jämförd utifrån specifikationer, expertkällor och användaromdömen",
};

export const METHODOLOGY_EXPLANATIONS: Record<MethodologyType, string> = {
  tested_by_us:
    "Produkten har testats av braerbjudanden.se. Betyget är vår redaktionella bedömning efter praktisk användning.",
  editorial_evaluation:
    "Rankingen är braerbjudandens redaktionella bedömning. Vi har inte nödvändigtvis testat produkten fysiskt.",
  compared_from_sources:
    "Jämförelsen bygger på specifikationer, expertkällor och offentliga användaromdömen – inte på att vi själva har laboratorietestat produkterna.",
};

export function formatMethodologyLabel(methodology: MethodologyType) {
  return METHODOLOGY_LABELS[methodology];
}
