export const TIME_PERIODS = [
  "Mesolithic", "Neolithic", "Bronze Age", "Iron Age",
  "Protohistoric", "Early Historic", "Medieval", "Unknown",
];

export const PRESERVATION_STATES = [
  "Excellent", "Good", "Fair", "Poor", "Fragmentary",
];

export const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];

export const PROVINCES = [
  "Western", "Central", "Southern", "Northern", "Eastern",
  "North Western", "North Central", "Uva", "Sabaragamuwa",
];

export const DATING_METHODS = [
  "Radiocarbon (C14)", "AMS Radiocarbon", "Thermoluminescence",
  "Optically Stimulated Luminescence", "Dendrochronology",
  "Stratigraphy", "Typology", "Other",
];

export function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function validateExcavationAndDating(excavation, labDating) {
  const errors = {};
  const depth = optionalNumber(excavation.depth_found);
  const rangeMin = optionalNumber(labDating.date_range_min);
  const rangeMax = optionalNumber(labDating.date_range_max);

  if (excavation.depth_found !== "" && (depth === null || depth < 0)) errors.depth_found = "Depth Found must be a valid non-negative number.";
  if (labDating.date_range_min !== "" && (rangeMin === null || rangeMin < 0)) errors.date_range_min = "Date Range Min must be a valid non-negative number.";
  if (labDating.date_range_max !== "" && (rangeMax === null || rangeMax < 0)) errors.date_range_max = "Date Range Max must be a valid non-negative number.";
  if (rangeMin !== null && rangeMax !== null && rangeMin > rangeMax) errors.date_range = "Date Range Min cannot be greater than Date Range Max.";
  if (labDating.dating_method && !DATING_METHODS.includes(labDating.dating_method)) errors.dating_method = "Select a valid dating method.";

  return errors;
}

export function hasMetadataValue(record) {
  return Object.values(record).some((value) => value !== "" && value !== null && value !== undefined);
}
