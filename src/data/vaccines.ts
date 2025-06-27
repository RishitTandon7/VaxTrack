export interface Vaccine {
  name: string;
  description: string;
  ageGroup: string;
  doses: number;
  interval?: string;
}

export const commonVaccines: Vaccine[] = [
  {
    name: 'BCG',
    description: 'Bacillus Calmette-Guérin (Tuberculosis)',
    ageGroup: 'Birth',
    doses: 1
  },
  {
    name: 'Hepatitis B',
    description: 'Hepatitis B Vaccine',
    ageGroup: 'Birth, 1-2 months, 6-18 months',
    doses: 3,
    interval: '1-2 months'
  },
  {
    name: 'DPT',
    description: 'Diphtheria, Pertussis, Tetanus',
    ageGroup: '2, 4, 6 months',
    doses: 3,
    interval: '2 months'
  },
  {
    name: 'Polio',
    description: 'Poliomyelitis Vaccine',
    ageGroup: '2, 4, 6-18 months',
    doses: 3,
    interval: '2 months'
  },
  {
    name: 'MMR',
    description: 'Measles, Mumps, Rubella',
    ageGroup: '12-15 months, 4-6 years',
    doses: 2,
    interval: '4 years'
  },
  {
    name: 'Varicella',
    description: 'Chickenpox Vaccine',
    ageGroup: '12-15 months, 4-6 years',
    doses: 2,
    interval: '3 months'
  },
  {
    name: 'Pneumococcal',
    description: 'Pneumococcal Conjugate Vaccine',
    ageGroup: '2, 4, 6, 12-15 months',
    doses: 4,
    interval: '2 months'
  },
  {
    name: 'Rotavirus',
    description: 'Rotavirus Vaccine',
    ageGroup: '2, 4, 6 months',
    doses: 3,
    interval: '2 months'
  }
];