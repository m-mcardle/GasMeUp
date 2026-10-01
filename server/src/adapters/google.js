// Pure mappers from Google's "new" APIs (Places API (New), Routes API) to the
// legacy response shapes the shipped mobile app parses. No I/O here.
//
// The /distance route returns the raw Directions payload as `data`, and the app
// walks data.routes[0].legs[0].steps[].start_location, so new-mode responses are
// rebuilt into the full legacy Directions structure (same keys at every level).

const toLatLng = (loc) => ({ lat: loc?.latLng?.latitude, lng: loc?.latLng?.longitude });

// protobuf Duration JSON, e.g. "19582s" or "1.5s"
const toSeconds = (duration) => Math.round(parseFloat(duration ?? '0') || 0);

const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;

// Fallbacks matching the legacy metric text format ("0.2 km", "12.9 km", "541 km",
// "1 min", "5 hours 26 mins"), used only when Routes omits localizedValues.
function formatDistance(meters) {
  if (meters < 100) return `${meters} m`;
  const km = meters / 1000;
  return km >= 100 ? `${Math.round(km)} km` : `${Math.round(km * 10) / 10} km`;
}

function formatDuration(seconds) {
  const totalMins = Math.max(1, Math.round(seconds / 60));
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days) return [plural(days, 'day'), hours && plural(hours, 'hour')].filter(Boolean).join(' ');
  if (hours) return [plural(hours, 'hour'), mins && plural(mins, 'min')].filter(Boolean).join(' ');
  return plural(mins, 'min');
}

// Routes Maneuver enum -> legacy Directions maneuver string ("RAMP_LEFT" -> "ramp-left").
// Legacy omits the field for departures / plain continuations.
const NO_MANEUVER = new Set(['MANEUVER_UNSPECIFIED', 'DEPART', 'NAME_CHANGE']);
function toLegacyManeuver(maneuver) {
  if (!maneuver || NO_MANEUVER.has(maneuver)) return undefined;
  return maneuver.toLowerCase().replace(/_/g, '-');
}

function toLegacyStep(step) {
  const meters = step.distanceMeters ?? 0;
  const seconds = toSeconds(step.staticDuration);
  const legacy = {
    distance: { text: step.localizedValues?.distance?.text ?? formatDistance(meters), value: meters },
    duration: { text: step.localizedValues?.staticDuration?.text ?? formatDuration(seconds), value: seconds },
    end_location: toLatLng(step.endLocation),
    html_instructions: step.navigationInstruction?.instructions ?? '',
    polyline: { points: step.polyline?.encodedPolyline ?? '' },
    start_location: toLatLng(step.startLocation),
    travel_mode: 'DRIVING',
  };
  const maneuver = toLegacyManeuver(step.navigationInstruction?.maneuver);
  if (maneuver) legacy.maneuver = maneuver;
  return legacy;
}

function toLegacyLeg(leg, origin, destination) {
  const meters = leg.distanceMeters ?? 0;
  const seconds = toSeconds(leg.duration);
  return {
    distance: { text: leg.localizedValues?.distance?.text ?? formatDistance(meters), value: meters },
    duration: { text: leg.localizedValues?.duration?.text ?? formatDuration(seconds), value: seconds },
    end_address: destination.address,
    end_location: toLatLng(leg.endLocation),
    start_address: origin.address,
    start_location: toLatLng(leg.startLocation),
    steps: (leg.steps ?? []).map(toLegacyStep),
    traffic_speed_entry: [],
    via_waypoint: [],
  };
}

const toLegacyGeocodedWaypoint = (wp) => ({ geocoder_status: 'OK', place_id: wp.placeId, types: wp.types ?? [] });

/**
 * computeRoutes response -> legacy Directions JSON ({ geocoded_waypoints, routes, status }).
 * `origin` / `destination` are the geocoded endpoints: { address, placeId, types }.
 */
function toLegacyDirections(routesData, origin, destination) {
  const routes = (routesData?.routes ?? []).map((route) => ({
    bounds: {
      northeast: { lat: route.viewport?.high?.latitude, lng: route.viewport?.high?.longitude },
      southwest: { lat: route.viewport?.low?.latitude, lng: route.viewport?.low?.longitude },
    },
    copyrights: 'Powered by Google',
    legs: (route.legs ?? []).map((leg) => toLegacyLeg(leg, origin, destination)),
    overview_polyline: { points: route.polyline?.encodedPolyline ?? '' },
    summary: route.description ?? '',
    warnings: route.warnings ?? [],
    waypoint_order: [],
  }));

  return {
    geocoded_waypoints: [origin, destination].map(toLegacyGeocodedWaypoint),
    routes,
    status: routes.length ? 'OK' : 'ZERO_RESULTS',
  };
}

// places:autocomplete response -> legacy prediction descriptions.
function toLegacySuggestions(autocompleteData) {
  return (autocompleteData?.suggestions ?? [])
    .map((s) => s.placePrediction?.text?.text)
    .filter((text) => typeof text === 'string' && text.length > 0);
}

module.exports = {
  toLegacyDirections,
  toLegacySuggestions,
  formatDistance,
  formatDuration,
  toLegacyManeuver,
};
