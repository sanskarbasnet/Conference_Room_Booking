/**
 * Calculate adjusted price based on temperature deviation
 * Formula: adjustedPrice = basePrice * (1 + (deviation * factor))
 */
const calculateAdjustedPrice = (basePrice, temperature, comfortableTemp = 21, factor = 0.05) => {
  const deviation = Math.abs(temperature - comfortableTemp);
  const adjustedPrice = basePrice * (1 + (deviation * factor));
  
  return {
    deviation,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
  };
};

/**
 * Format price for display
 */
const formatPrice = (price) => {
  return `$${price.toFixed(2)}`;
};

/**
 * Calculate price adjustment percentage
 */
const calculateAdjustmentPercentage = (basePrice, adjustedPrice) => {
  const percentage = ((adjustedPrice - basePrice) / basePrice) * 100;
  return Math.round(percentage * 100) / 100;
};

module.exports = {
  calculateAdjustedPrice,
  formatPrice,
  calculateAdjustmentPercentage
};

