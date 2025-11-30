// Conversion factor: 1 kg = 2.20462 lbs
const KG_TO_LBS = 2.20462;

export const convertWeight = (weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number => {
  if (fromUnit === toUnit) return weight;

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * KG_TO_LBS;
  } else if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight / KG_TO_LBS;
  }

  return weight;
};

export const formatWeight = (weight: number, unit: 'kg' | 'lbs'): string => {
  return `${weight.toFixed(1)} ${unit}`;
};

export const roundWeight = (weight: number, unit: 'kg' | 'lbs'): number => {
  // Round to nearest 0.5 for kg, nearest 1 for lbs
  if (unit === 'kg') {
    return Math.round(weight * 2) / 2;
  } else {
    return Math.round(weight);
  }
};
