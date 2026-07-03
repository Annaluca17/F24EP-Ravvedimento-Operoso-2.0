
export interface InterestRate {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  rate: number;  // Percentage
}

export interface TaxCode {
  code: string;
  description: string;
  sanctionCode: string; // The associated sanction code (e.g., 100E -> 896E)
  section: string; // "ERARIO", "REGIONI", "ENTI LOCALI"
  requiresLocationCode?: boolean; // True if needs region/municipality code
  locationCodeLabel?: string; // "Codice Regione", "Codice Catastale", etc.
  locationCodeMaxLength?: number;
  isSanction?: boolean; // True if this code is already a sanction (no ravvedimento applied)
}

export type RowKind = 'TRIBUTO' | 'SANZIONE';

export interface F24Row {
  id: string;
  kind: RowKind; // SANZIONE = importo fisso già ridotto, nessun ravvedimento da applicare
  taxCode: string;
  description: string;
  originalAmount: number;
  referenceMonth: string; // MM (vuoto per le sanzioni annuali)
  referenceYear: string;  // YYYY
  section: string;
  locationCode?: string;
}

export interface InterestPeriod {
  startDate: string;
  endDate: string;
  rate: number;
  days: number;
  amount: number;
}

export interface CalculationResult {
  rowId: string;
  daysLate: number;
  legalInterest: number;
  interestDetails: InterestPeriod[]; // Detailed breakdown
  interestWarning?: string; // Periodi non coperti dalla tabella tassi
  sanctionAmount: number;
  sanctionPercentage: number;
  sanctionFormula: string;      // Description of the formula used
  totalTaxWithInterest: number; // For F24EP Tax Code column
  totalSanction: number;        // For F24EP Sanction Code column
  ravvedimentoType: string;
}

export enum RavvedimentoType {
  SPRINT = "Sprint (fino a 14 gg)",
  BREVE = "Breve (15-30 gg)",
  INTERMEDIO = "Intermedio (31-90 gg)",
  LUNGO = "Lungo (entro termine dichiarazione)",
  LUNGHISSIMO = "Lunghissimo (entro dich. anno succ.)", // solo pre-riforma
  OLTRE = "Oltre 2 anni",                               // solo pre-riforma
  OLTRE_POST_RIFORMA = "Oltre termine dichiarazione"    // post-riforma: 1/7 fisso
}
