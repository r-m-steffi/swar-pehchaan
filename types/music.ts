export type TonicNote = 
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' 
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type Saptak = 'mandra' | 'madhya' | 'taar';

export type SwarBaseName = 
  | 'Sa' 
  | 're' | 'Re' 
  | 'ga' | 'Ga' 
  | 'ma' | 'Ma' 
  | 'Pa' 
  | 'dha' | 'Dha' 
  | 'ni' | 'Ni';

export interface SwarDefinition {
  id: string;              // Unique key e.g. "mandra_Pa", "madhya_Sa", "taar_Re"
  baseName: SwarBaseName;  // Base swar (Sa, Re, Ga, etc.)
  devanagari: string;      // सा, नि̣, सा̇
  latinNotation: string;   // Sa, Ni', Sȧ
  fullName: string;        // Mandra Pancham, Madhya Shadja, etc.
  saptak: Saptak;          // 'mandra' | 'madhya' | 'taar'
  semitoneOffset: number;  // Relative to Madhya Sa (0). Mandra is -12 to -1, Madhya is 0 to 11, Taar is 12 to 23
  isKomalOrTeevra: boolean;
}

export type TanpuraFirstString = 'Pa' | 'ma' | 'Ni';
export type GameMode = 'single' | 'phrase' | 'free_riyaz';

export const SCALE_OPTIONS: { note: TonicNote; label: string }[] = [
  { note: 'C',  label: 'C (Safed 1 / सफ़ेद १)' },
  { note: 'C#', label: 'C# (Kaali 1 / काली १)' },
  { note: 'D',  label: 'D (Safed 2 / सफ़ेद २)' },
  { note: 'D#', label: 'D# (Kaali 2 / काली २)' },
  { note: 'E',  label: 'E (Safed 3 / सफ़ेद ३)' },
  { note: 'F',  label: 'F (Safed 4 / सफ़ेद ४)' },
  { note: 'F#', label: 'F# (Kaali 3 / काली ३)' },
  { note: 'G',  label: 'G (Safed 5 / सफ़ेद ५)' },
  { note: 'G#', label: 'G# (Kaali 4 / काली ४)' },
  { note: 'A',  label: 'A (Safed 6 / सफ़ेद ६)' },
  { note: 'A#', label: 'A# (Kaali 5 / काली ५)' },
  { note: 'B',  label: 'B (Safed 7 / सफ़ेद ७)' },
];