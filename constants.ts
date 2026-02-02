
import { InterestRate, TaxCode } from './types';

// Historical Legal Interest Rates (Tasso Legale)
// Source: Italian Civil Code Art. 1284 updates
export const LEGAL_INTEREST_RATES: InterestRate[] = [
  { start: '2019-01-01', end: '2019-12-31', rate: 0.8 },
  { start: '2020-01-01', end: '2020-12-31', rate: 0.05 },
  { start: '2021-01-01', end: '2021-12-31', rate: 0.01 },
  { start: '2022-01-01', end: '2022-12-31', rate: 1.25 },
  { start: '2023-01-01', end: '2023-12-31', rate: 5.0 },
  { start: '2024-01-01', end: '2024-12-31', rate: 2.5 },
  { start: '2025-01-01', end: '2025-12-31', rate: 2.0 }, // Projected/Current
  { start: '2026-01-01', end: '2099-12-31', rate: 1.6 }, // Future projection from OCR
];

// Common F24EP Tax Codes
// Mapped to their respective Sanction Codes (Codes starting with 89xx usually)
export const TAX_CODES: TaxCode[] = [
  { code: '100E', description: 'IRPEF - Ritenute redditi lavoro dipendente', sanctionCode: '896E', section: 'ERARIO' },
  { code: '102E', description: 'IRPEF - Ritenute emolumenti arretrati', sanctionCode: '896E', section: 'ERARIO' },
  { code: '104E', description: 'IRPEF - Ritenute redditi lavoro autonomo', sanctionCode: '897E', section: 'ERARIO' },
  { 
    code: '380E', 
    description: 'IRAP - Versamento imposta', 
    sanctionCode: '892E', 
    section: 'REGIONI', 
    requiresLocationCode: true, 
    locationCodeLabel: 'Codice Regione (es. 09)',
    locationCodeMaxLength: 2
  },
  { 
    code: '381E', 
    description: 'Addizionale Regionale IRPEF', 
    sanctionCode: '893E', 
    section: 'REGIONI', 
    requiresLocationCode: true, 
    locationCodeLabel: 'Codice Regione (es. 09)',
    locationCodeMaxLength: 2 
  },
  { 
    code: '384E', 
    description: 'Addizionale Comunale IRPEF (Saldo)', 
    sanctionCode: '891E', 
    section: 'ENTI LOCALI', 
    requiresLocationCode: true, 
    locationCodeLabel: 'Codice Ente/Catastale (es. H501)',
    locationCodeMaxLength: 4
  },
  { 
    code: '385E', 
    description: 'Addizionale Comunale IRPEF (Acconto)', 
    sanctionCode: '891E', 
    section: 'ENTI LOCALI', 
    requiresLocationCode: true, 
    locationCodeLabel: 'Codice Ente/Catastale (es. H501)',
    locationCodeMaxLength: 4
  },
  { 
    code: '124E', 
    description: 'Interessi Pagamento Dilazionato Add. Reg.', 
    sanctionCode: '893E', 
    section: 'REGIONI', 
    requiresLocationCode: true, 
    locationCodeLabel: 'Codice Regione',
    locationCodeMaxLength: 2 
  }, 
  { 
    code: '125E', 
    description: 'Interessi Pagamento Dilazionato Add. Com.', 
    sanctionCode: '891E', 
    section: 'ENTI LOCALI', 
    requiresLocationCode: true, 
    locationCodeLabel: 'Codice Ente/Catastale',
    locationCodeMaxLength: 4
  },
];

export const SANCTION_CODES_DESC: Record<string, string> = {
  '896E': 'Sanzione Ritenute Erariali (Dipendenti)',
  '897E': 'Sanzione Ritenute Lavoro Autonomo',
  '892E': 'Sanzione IRAP',
  '893E': 'Sanzione Addizionale Regionale',
  '891E': 'Sanzione Addizionale Comunale (Lav. Dipendente/Assimilati)',
  '895E': 'Sanzione Addizionale Comunale (Generale)',
};

// Map Sanction Codes to Sections
export const SANCTION_SECTIONS: Record<string, string> = {
  '896E': 'ERARIO',
  '897E': 'ERARIO',
  '892E': 'REGIONI',
  '893E': 'REGIONI',
  '891E': 'ENTI LOCALI',
  '895E': 'ENTI LOCALI',
};

// Official Region Codes (Tabella T0 Agenzia Entrate)
export const REGION_CODES = [
  { code: '01', name: 'Abruzzo' },
  { code: '02', name: 'Basilicata' },
  { code: '03', name: 'Bolzano' },
  { code: '04', name: 'Calabria' },
  { code: '05', name: 'Campania' },
  { code: '06', name: 'Emilia Romagna' },
  { code: '07', name: 'Friuli Venezia Giulia' },
  { code: '08', name: 'Lazio' },
  { code: '09', name: 'Liguria' },
  { code: '10', name: 'Lombardia' },
  { code: '11', name: 'Marche' },
  { code: '12', name: 'Molise' },
  { code: '13', name: 'Piemonte' },
  { code: '14', name: 'Puglia' },
  { code: '15', name: 'Sardegna' },
  { code: '16', name: 'Sicilia' },
  { code: '17', name: 'Toscana' },
  { code: '18', name: 'Trento' },
  { code: '19', name: 'Umbria' },
  { code: '20', name: 'Valle d\'Aosta' },
  { code: '21', name: 'Veneto' },
];
