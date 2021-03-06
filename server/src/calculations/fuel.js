const baseFuelEfficiency = 10.0;

// Fuel Efficiency is in L / 100km and Distance is in km, returned value is in L
function GasUsage(distance, fuelEfficiency = baseFuelEfficiency) {
  return (distance * fuelEfficiency) / 100;
}

// Gas Used is in L and Gas Price is in $ / L, return value is in $
function GasCost(gasUsed, gasPrice) {
  return gasUsed * gasPrice;
}

function GasCostForDistance(distance, gasPrice) {
  const gasUsed = GasUsage(distance);
  return GasCost(gasUsed, gasPrice);
}

module.exports = { GasUsage, GasCost, GasCostForDistance };
