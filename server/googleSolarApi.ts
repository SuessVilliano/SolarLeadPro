// Google Solar API integration
// Uses Google Geocoding API to convert addresses to lat/lng
// Uses Google Solar API buildingInsights endpoint for solar potential data

interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
}

interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: Array<{
    pitchDegrees: number;
    azimuthDegrees: number;
    panelsCount: number;
    yearlyEnergyDcKwh: number;
    segmentIndex: number;
  }>;
}

interface FinancialAnalysis {
  monthlyBill: { currencyCode: string; units: string };
  defaultBill: boolean;
  panelConfigIndex: number;
  financialDetails: {
    initialAcKwhPerYear: number;
    remainingLifetimeUtilityBill: { currencyCode: string; units: string };
    federalIncentive: { currencyCode: string; units: string };
    stateIncentive: { currencyCode: string; units: string };
    utilityIncentive: { currencyCode: string; units: string };
    costOfElectricityWithoutSolar: { currencyCode: string; units: string };
    netMeteringAllowed: boolean;
    solarPercentage: number;
    percentageExportedToGrid: number;
  };
  leasingSavings?: {
    leasesAllowed: boolean;
    leasesSupported: boolean;
    annualLeasingCost: { currencyCode: string; units: string };
    savings: {
      savingsYear1: { currencyCode: string; units: string };
      savingsYear20: { currencyCode: string; units: string };
      savingsLifetime: { currencyCode: string; units: string };
    };
  };
  cashPurchaseSavings?: {
    outOfPocketCost: { currencyCode: string; units: string };
    upfrontCost: { currencyCode: string; units: string };
    rebateValue: { currencyCode: string; units: string };
    paybackYears: number;
    savings: {
      savingsYear1: { currencyCode: string; units: string };
      savingsYear20: { currencyCode: string; units: string };
      savingsLifetime: { currencyCode: string; units: string };
    };
  };
  financedPurchaseSavings?: {
    annualLoanPayment: { currencyCode: string; units: string };
    loanInterestRate: number;
    savings: {
      savingsYear1: { currencyCode: string; units: string };
      savingsYear20: { currencyCode: string; units: string };
      savingsLifetime: { currencyCode: string; units: string };
    };
  };
}

export interface BuildingInsightsResponse {
  name: string;
  center: { latitude: number; longitude: number };
  boundingBox: { sw: { latitude: number; longitude: number }; ne: { latitude: number; longitude: number } };
  imageryDate: { year: number; month: number; day: number };
  postalCode: string;
  administrativeArea: string;
  regionCode: string;
  imageryQuality: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    wholeRoofStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    roofSegmentStats: Array<{
      pitchDegrees: number;
      azimuthDegrees: number;
      stats: { areaMeters2: number; sunshineQuantiles: number[] };
      center: { latitude: number; longitude: number };
      planeHeightAtCenterMeters: number;
    }>;
    solarPanelConfigs: SolarPanelConfig[];
    financialAnalyses: FinancialAnalysis[];
  };
}

export interface SolarInsightsSummary {
  address: string;
  latitude: number;
  longitude: number;
  imageryQuality: string;
  maxPanelCount: number;
  maxArrayAreaSqFt: number;
  maxSunshineHoursPerYear: number;
  panelCapacityWatts: number;
  carbonOffsetFactorKgPerMwh: number;
  roofSegments: number;
  recommendedSystemSizeKw: number;
  yearlyEnergyProductionKwh: number;
  financialAnalysis: {
    monthlyBillAmount: number;
    federalIncentive: number;
    stateIncentive: number;
    solarPercentage: number;
    netMeteringAllowed: boolean;
    cashPurchase?: {
      upfrontCost: number;
      paybackYears: number;
      savingsYear1: number;
      savingsYear20: number;
      savingsLifetime: number;
    };
    financing?: {
      annualLoanPayment: number;
      loanInterestRate: number;
      savingsYear1: number;
      savingsYear20: number;
      savingsLifetime: number;
    };
    leasing?: {
      annualLeasingCost: number;
      savingsYear1: number;
      savingsYear20: number;
      savingsLifetime: number;
    };
  } | null;
  sunroofUrl: string;
  raw?: BuildingInsightsResponse;
}

const GOOGLE_API_KEY = process.env.GOOGLE_SOLAR_API_KEY || process.env.GOOGLE_API_KEY;

function getApiKey(): string {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured. Set GOOGLE_SOLAR_API_KEY or GOOGLE_API_KEY environment variable.');
  }
  return GOOGLE_API_KEY;
}

/**
 * Geocode an address to lat/lng using Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const apiKey = getApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error(`Geocoding failed for address: ${address}. Status: ${data.status}`);
  }

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
  };
}

/**
 * Get building solar insights from Google Solar API
 */
export async function getBuildingInsights(lat: number, lng: number): Promise<BuildingInsightsResponse> {
  const apiKey = getApiKey();
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat.toFixed(6)}&location.longitude=${lng.toFixed(6)}&requiredQuality=HIGH&key=${apiKey}`;

  const response = await fetch(url);

  if (response.status === 404) {
    // Try with MEDIUM quality if HIGH not available
    const mediumUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat.toFixed(6)}&location.longitude=${lng.toFixed(6)}&requiredQuality=MEDIUM&key=${apiKey}`;
    const mediumResponse = await fetch(mediumUrl);

    if (!mediumResponse.ok) {
      throw new Error(`No solar data available for this location (lat: ${lat}, lng: ${lng})`);
    }
    return mediumResponse.json();
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Solar API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

function parseMoneyUnits(money: { currencyCode: string; units: string } | undefined): number {
  if (!money || !money.units) return 0;
  return parseInt(money.units, 10) || 0;
}

/**
 * Get a summarized solar insights report for an address
 */
export async function getSolarInsightsForAddress(address: string): Promise<SolarInsightsSummary> {
  const geo = await geocodeAddress(address);
  const building = await getBuildingInsights(geo.lat, geo.lng);

  const sp = building.solarPotential;

  // Find the best panel config (matching ~100% offset or the max config)
  const bestConfig = sp.solarPanelConfigs && sp.solarPanelConfigs.length > 0
    ? sp.solarPanelConfigs[sp.solarPanelConfigs.length - 1]
    : null;

  const recommendedSizeKw = bestConfig
    ? Math.round((bestConfig.panelsCount * sp.panelCapacityWatts / 1000) * 10) / 10
    : 0;

  const yearlyEnergyKwh = bestConfig
    ? Math.round(bestConfig.yearlyEnergyDcKwh)
    : 0;

  // Extract financial analysis for the default bill amount
  let financialSummary: SolarInsightsSummary['financialAnalysis'] = null;

  if (sp.financialAnalyses && sp.financialAnalyses.length > 0) {
    // Find the default bill analysis or use the first one
    const defaultAnalysis = sp.financialAnalyses.find(fa => fa.defaultBill) || sp.financialAnalyses[0];

    financialSummary = {
      monthlyBillAmount: parseMoneyUnits(defaultAnalysis.monthlyBill),
      federalIncentive: parseMoneyUnits(defaultAnalysis.financialDetails?.federalIncentive),
      stateIncentive: parseMoneyUnits(defaultAnalysis.financialDetails?.stateIncentive),
      solarPercentage: defaultAnalysis.financialDetails?.solarPercentage || 0,
      netMeteringAllowed: defaultAnalysis.financialDetails?.netMeteringAllowed || false,
      cashPurchase: defaultAnalysis.cashPurchaseSavings ? {
        upfrontCost: parseMoneyUnits(defaultAnalysis.cashPurchaseSavings.upfrontCost),
        paybackYears: defaultAnalysis.cashPurchaseSavings.paybackYears || 0,
        savingsYear1: parseMoneyUnits(defaultAnalysis.cashPurchaseSavings.savings?.savingsYear1),
        savingsYear20: parseMoneyUnits(defaultAnalysis.cashPurchaseSavings.savings?.savingsYear20),
        savingsLifetime: parseMoneyUnits(defaultAnalysis.cashPurchaseSavings.savings?.savingsLifetime),
      } : undefined,
      financing: defaultAnalysis.financedPurchaseSavings ? {
        annualLoanPayment: parseMoneyUnits(defaultAnalysis.financedPurchaseSavings.annualLoanPayment),
        loanInterestRate: defaultAnalysis.financedPurchaseSavings.loanInterestRate || 0,
        savingsYear1: parseMoneyUnits(defaultAnalysis.financedPurchaseSavings.savings?.savingsYear1),
        savingsYear20: parseMoneyUnits(defaultAnalysis.financedPurchaseSavings.savings?.savingsYear20),
        savingsLifetime: parseMoneyUnits(defaultAnalysis.financedPurchaseSavings.savings?.savingsLifetime),
      } : undefined,
      leasing: defaultAnalysis.leasingSavings ? {
        annualLeasingCost: parseMoneyUnits(defaultAnalysis.leasingSavings.annualLeasingCost),
        savingsYear1: parseMoneyUnits(defaultAnalysis.leasingSavings.savings?.savingsYear1),
        savingsYear20: parseMoneyUnits(defaultAnalysis.leasingSavings.savings?.savingsYear20),
        savingsLifetime: parseMoneyUnits(defaultAnalysis.leasingSavings.savings?.savingsLifetime),
      } : undefined,
    };
  }

  // Build a Google Sunroof deep link
  const sunroofUrl = `https://sunroof.withgoogle.com/building/${geo.lat}/${geo.lng}`;

  return {
    address: geo.formattedAddress,
    latitude: geo.lat,
    longitude: geo.lng,
    imageryQuality: building.imageryQuality,
    maxPanelCount: sp.maxArrayPanelsCount || 0,
    maxArrayAreaSqFt: Math.round((sp.maxArrayAreaMeters2 || 0) * 10.7639),
    maxSunshineHoursPerYear: Math.round(sp.maxSunshineHoursPerYear || 0),
    panelCapacityWatts: sp.panelCapacityWatts || 400,
    carbonOffsetFactorKgPerMwh: sp.carbonOffsetFactorKgPerMwh || 0,
    roofSegments: sp.roofSegmentStats?.length || 0,
    recommendedSystemSizeKw: recommendedSizeKw,
    yearlyEnergyProductionKwh: yearlyEnergyKwh,
    financialAnalysis: financialSummary,
    sunroofUrl,
  };
}

/**
 * Find the best panel configuration matching a target monthly bill
 */
export async function getSolarInsightsForBill(
  address: string,
  monthlyBill: number
): Promise<SolarInsightsSummary> {
  const geo = await geocodeAddress(address);
  const building = await getBuildingInsights(geo.lat, geo.lng);
  const sp = building.solarPotential;

  // Find financial analysis closest to the user's monthly bill
  let matchedAnalysis: FinancialAnalysis | null = null;
  if (sp.financialAnalyses && sp.financialAnalyses.length > 0) {
    let closestDiff = Infinity;
    for (const fa of sp.financialAnalyses) {
      const billAmount = parseMoneyUnits(fa.monthlyBill);
      const diff = Math.abs(billAmount - monthlyBill);
      if (diff < closestDiff) {
        closestDiff = diff;
        matchedAnalysis = fa;
      }
    }
  }

  // Get the panel config from the matched analysis
  let bestConfig: SolarPanelConfig | null = null;
  if (matchedAnalysis && sp.solarPanelConfigs) {
    bestConfig = sp.solarPanelConfigs[matchedAnalysis.panelConfigIndex] || sp.solarPanelConfigs[sp.solarPanelConfigs.length - 1];
  } else if (sp.solarPanelConfigs && sp.solarPanelConfigs.length > 0) {
    bestConfig = sp.solarPanelConfigs[sp.solarPanelConfigs.length - 1];
  }

  const recommendedSizeKw = bestConfig
    ? Math.round((bestConfig.panelsCount * sp.panelCapacityWatts / 1000) * 10) / 10
    : 0;

  const yearlyEnergyKwh = bestConfig
    ? Math.round(bestConfig.yearlyEnergyDcKwh)
    : 0;

  let financialSummary: SolarInsightsSummary['financialAnalysis'] = null;
  if (matchedAnalysis) {
    financialSummary = {
      monthlyBillAmount: parseMoneyUnits(matchedAnalysis.monthlyBill),
      federalIncentive: parseMoneyUnits(matchedAnalysis.financialDetails?.federalIncentive),
      stateIncentive: parseMoneyUnits(matchedAnalysis.financialDetails?.stateIncentive),
      solarPercentage: matchedAnalysis.financialDetails?.solarPercentage || 0,
      netMeteringAllowed: matchedAnalysis.financialDetails?.netMeteringAllowed || false,
      cashPurchase: matchedAnalysis.cashPurchaseSavings ? {
        upfrontCost: parseMoneyUnits(matchedAnalysis.cashPurchaseSavings.upfrontCost),
        paybackYears: matchedAnalysis.cashPurchaseSavings.paybackYears || 0,
        savingsYear1: parseMoneyUnits(matchedAnalysis.cashPurchaseSavings.savings?.savingsYear1),
        savingsYear20: parseMoneyUnits(matchedAnalysis.cashPurchaseSavings.savings?.savingsYear20),
        savingsLifetime: parseMoneyUnits(matchedAnalysis.cashPurchaseSavings.savings?.savingsLifetime),
      } : undefined,
      financing: matchedAnalysis.financedPurchaseSavings ? {
        annualLoanPayment: parseMoneyUnits(matchedAnalysis.financedPurchaseSavings.annualLoanPayment),
        loanInterestRate: matchedAnalysis.financedPurchaseSavings.loanInterestRate || 0,
        savingsYear1: parseMoneyUnits(matchedAnalysis.financedPurchaseSavings.savings?.savingsYear1),
        savingsYear20: parseMoneyUnits(matchedAnalysis.financedPurchaseSavings.savings?.savingsYear20),
        savingsLifetime: parseMoneyUnits(matchedAnalysis.financedPurchaseSavings.savings?.savingsLifetime),
      } : undefined,
      leasing: matchedAnalysis.leasingSavings ? {
        annualLeasingCost: parseMoneyUnits(matchedAnalysis.leasingSavings.annualLeasingCost),
        savingsYear1: parseMoneyUnits(matchedAnalysis.leasingSavings.savings?.savingsYear1),
        savingsYear20: parseMoneyUnits(matchedAnalysis.leasingSavings.savings?.savingsYear20),
        savingsLifetime: parseMoneyUnits(matchedAnalysis.leasingSavings.savings?.savingsLifetime),
      } : undefined,
    };
  }

  const sunroofUrl = `https://sunroof.withgoogle.com/building/${geo.lat}/${geo.lng}`;

  return {
    address: geo.formattedAddress,
    latitude: geo.lat,
    longitude: geo.lng,
    imageryQuality: building.imageryQuality,
    maxPanelCount: sp.maxArrayPanelsCount || 0,
    maxArrayAreaSqFt: Math.round((sp.maxArrayAreaMeters2 || 0) * 10.7639),
    maxSunshineHoursPerYear: Math.round(sp.maxSunshineHoursPerYear || 0),
    panelCapacityWatts: sp.panelCapacityWatts || 400,
    carbonOffsetFactorKgPerMwh: sp.carbonOffsetFactorKgPerMwh || 0,
    roofSegments: sp.roofSegmentStats?.length || 0,
    recommendedSystemSizeKw: recommendedSizeKw,
    yearlyEnergyProductionKwh: yearlyEnergyKwh,
    financialAnalysis: financialSummary,
    sunroofUrl,
  };
}

/**
 * Check if the Google Solar API is configured
 */
export function isGoogleSolarConfigured(): boolean {
  return !!(process.env.GOOGLE_SOLAR_API_KEY || process.env.GOOGLE_API_KEY);
}
