import { TonicNote, SwarDefinition, SwarBaseName, Saptak } from '@/types/music';

// Middle female/male base tonic frequencies (Madhya Sa)
export const TONIC_FREQUENCIES: Record<TonicNote, number> = {
  'C': 130.81/2,
  'C#': 138.59/2, // Kali Ek
  'D': 146.83/2,
  'D#': 155.56/2,
  'E': 164.81/2,
  'F': 174.61/2,
  'F#': 185.00/2,
  'G': 196.00/2,
  'G#': 207.65/2,
  'A': 220.00/2,
  'A#': 233.08/2,
  'B': 246.94/2,
};

// Base single-octave template
interface BaseSwarInfo {
  baseName: SwarBaseName;
  devanagariBase: string;
  name: string;
  offset: number; // 0 to 11
  isKomalOrTeevra: boolean;
}

// Ensure BASE_SWARAS has pure root letters:
const BASE_SWARAS: BaseSwarInfo[] = [
  { baseName: 'Sa',  devanagariBase: 'सा', name: 'Shadja',           offset: 0,  isKomalOrTeevra: false },
  { baseName: 're',  devanagariBase: 'रे',  name: 'Komal Rishabh',    offset: 1,  isKomalOrTeevra: true  },
  { baseName: 'Re',  devanagariBase: 'रे',  name: 'Shuddha Rishabh',  offset: 2,  isKomalOrTeevra: false },
  { baseName: 'ga',  devanagariBase: 'ग',  name: 'Komal Gandhar',    offset: 3,  isKomalOrTeevra: true  },
  { baseName: 'Ga',  devanagariBase: 'ग',  name: 'Shuddha Gandhar',  offset: 4,  isKomalOrTeevra: false },
  { baseName: 'ma',  devanagariBase: 'म',  name: 'Shuddha Madhyam',  offset: 5,  isKomalOrTeevra: false },
  { baseName: 'Ma',  devanagariBase: 'म',  name: 'Teevra Madhyam',   offset: 6,  isKomalOrTeevra: true  },
  { baseName: 'Pa',  devanagariBase: 'प',  name: 'Pancham',          offset: 7,  isKomalOrTeevra: false },
  { baseName: 'dha', devanagariBase: 'ध',  name: 'Komal Dhaivat',    offset: 8,  isKomalOrTeevra: true  },
  { baseName: 'Dha', devanagariBase: 'ध',  name: 'Shuddha Dhaivat',  offset: 9,  isKomalOrTeevra: false },
  { baseName: 'ni',  devanagariBase: 'नि', name: 'Komal Nishad',     offset: 10, isKomalOrTeevra: true  },
  { baseName: 'Ni',  devanagariBase: 'नि', name: 'Shuddha Nishad',   offset: 11, isKomalOrTeevra: false },
];

// Helper to construct the 36-note array across Mandra, Madhya, and Taar
function generateAllSwaras(): SwarDefinition[] {
  const result: SwarDefinition[] = [];
  const saptaks: { saptak: Saptak; saptakLabel: string; offsetAdd: number }[] = [
    { saptak: 'mandra', saptakLabel: 'Mandra', offsetAdd: -12 },
    { saptak: 'madhya', saptakLabel: 'Madhya', offsetAdd: 0 },
    { saptak: 'taar',   saptakLabel: 'Taar',   offsetAdd: 12 },
  ];

  saptaks.forEach(({ saptak, saptakLabel, offsetAdd }) => {
    BASE_SWARAS.forEach((base) => {
      // Latin Bhatkhande notation helper
      let latin: string = base.baseName;
      if (saptak === 'mandra') latin = `${base.baseName} (M)`;
      if (saptak === 'taar')   latin = `${base.baseName} (T)`;

      result.push({
        id: `${saptak}_${base.baseName}`,
        baseName: base.baseName,
        devanagari: base.devanagariBase, // Keep pure clean Devanagari here!
        latinNotation: latin,
        fullName: `${saptakLabel} ${base.name}`,
        saptak,
        semitoneOffset: base.offset + offsetAdd,
        isKomalOrTeevra: base.isKomalOrTeevra,
      });
    });
  });

  return result;
}
export const ALL_SWARAS = generateAllSwaras();

// Calculate exact Hz for any semitone offset (negative or positive)
export function getSwarFrequency(rootTonic: TonicNote, offset: number): number {
  const rootFreq = TONIC_FREQUENCIES[rootTonic];
  return rootFreq * Math.pow(2, offset / 12);
}