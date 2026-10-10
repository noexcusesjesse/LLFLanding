/**
 * Steps, miles, and kilometers. Miles are the stored unit.
 * Stride estimate: height in inches × 0.413 = stride in inches.
 */

export const DEFAULT_STEPS_PER_MILE = 2000;
export const KM_PER_MILE = 1.609344;
const INCHES_PER_MILE = 63360;

export function roundMiles(miles) {
  return Math.round(miles * 1000) / 1000;
}

export function stepsPerMileFromHeight(heightInches) {
  const strideInches = heightInches * 0.413;
  if (!(strideInches > 0)) return DEFAULT_STEPS_PER_MILE;
  return INCHES_PER_MILE / strideInches;
}

export function stepsPerMileFromCalibration(steps, miles) {
  if (!(steps > 0) || !(miles > 0)) return null;
  return steps / miles;
}

export function activeStepsPerMile(settings = {}) {
  if (settings.strideMode === 'height' && settings.heightInches > 0) {
    return stepsPerMileFromHeight(settings.heightInches);
  }
  if (settings.strideMode === 'calibrate' && settings.calibration) {
    const calibrated = stepsPerMileFromCalibration(settings.calibration.steps, settings.calibration.miles);
    if (calibrated) return calibrated;
  }
  return DEFAULT_STEPS_PER_MILE;
}

export function milesFromSteps(steps, stepsPerMile = DEFAULT_STEPS_PER_MILE) {
  if (!(stepsPerMile > 0)) return 0;
  return roundMiles(steps / stepsPerMile);
}

export function stepsFromMiles(miles, stepsPerMile = DEFAULT_STEPS_PER_MILE) {
  return Math.round(miles * stepsPerMile);
}

export function milesToKm(miles) {
  return miles * KM_PER_MILE;
}

export function kmToMiles(km) {
  return roundMiles(km / KM_PER_MILE);
}

export function formatNumber(value, digits = 0) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDistance(miles, units = 'mi', digits) {
  const amount = units === 'km' ? milesToKm(miles) : miles;
  const places = digits ?? (Math.abs(amount - Math.round(amount)) < 0.05 ? 0 : 1);
  const unit = units === 'km' ? 'km' : 'mi';
  return `${formatNumber(amount, places)} ${unit}`;
}

export function strideLabel(settings = {}) {
  const steps = activeStepsPerMile(settings);
  const rounded = formatNumber(Math.round(steps));
  if (settings.strideMode === 'height' && settings.heightInches > 0) {
    return `Height × 0.413, about ${rounded} steps per mile.`;
  }
  if (settings.strideMode === 'calibrate' && settings.calibration?.steps > 0) {
    return `Your measured stride, about ${rounded} steps per mile.`;
  }
  return `${formatNumber(DEFAULT_STEPS_PER_MILE)} steps per mile.`;
}
