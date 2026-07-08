// Atlas Rule Engine v1

export const atlasRules = {
  minimumProfit: 40,

  highDemandThreshold: 80,

  confidenceBuy: 90,

  confidenceWatch: 70,

  reprintWatch: true,

  competitionAffectsScore: false,

  opportunityTypes: {
    hype: true,
    investment: true,
    arbitrage: true,
    seasonal: true,
  },
};

export function getAtlasRules() {
  return atlasRules;
}