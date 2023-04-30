import { Platform } from 'react-native';
import {
  requestForegroundPermissionsAsync,
  requestBackgroundPermissionsAsync,
  reverseGeocodeAsync,
  watchPositionAsync,
  startLocationUpdatesAsync,
  stopLocationUpdatesAsync,
  Accuracy,
  ActivityType,
  LocationObject,
  LocationObjectCoords as Coords,
} from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import Alert from '../components/Alert';

export const provinceCodeLookup: Record<string, string> = {
  ON: 'Ontario',
  QC: 'Quebec',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  PE: 'Prince Edward Island',
  BC: 'British Columbia',
  AB: 'Alberta',
  SK: 'Saskatchewan',
  MB: 'Manitoba',
  // Territories are not supported
  // YT: 'Yukon',
  // NT: 'Northwest Territories',
  // NU: 'Nunavut',
};

export const stateCodeLookup: Record<string, string> = {
  AK: 'Alaska',
  AL: 'Alabama',
  AR: 'Arkansas',
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VA: 'Virginia',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WV: 'West Virginia',
  WY: 'Wyoming',
};

export const provinces = Object.values(provinceCodeLookup);
export const provinceCodes = Object.keys(provinceCodeLookup);
export const states = Object.values(stateCodeLookup);
export const stateCodes = Object.keys(stateCodeLookup);

export const lookupProvince = (code: string) => provinceCodeLookup[code] ?? 'Ontario';
export const lookupState = (code: string) => stateCodeLookup[code] ?? 'New York';

export const lookupStateCode = (state: string) => {
  const code = Object.keys(stateCodeLookup).find((key) => stateCodeLookup[key] === state);
  return code ?? 'NY';
};

export async function getFullLocationPermissions() {
  try {
    const { status: foregroundStatus } = await requestForegroundPermissionsAsync();
    if (foregroundStatus === 'granted') {
      const { status: backgroundStatus } = await requestBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        return true;
      }
    }
  } catch (ex) {
    console.warn('Error getting location permissions', ex);
    return false;
  }

  return false;
}

async function setUserRegion(userLocation: Coords, updateGlobalState: Function) {
  const readableLocation = (await reverseGeocodeAsync(userLocation))[0];

  const userCountry = readableLocation.country ?? 'Canada';
  const userRegion = readableLocation.region ?? 'Ontario';
  if (userCountry === 'Canada') {
    const regionCode = Platform.OS === 'ios' ? lookupProvince(userRegion) : userRegion;
    updateGlobalState('region', regionCode);
    updateGlobalState('country', 'CA');
  } else if (userCountry === 'United States') {
    const regionCode = Platform.OS === 'ios' ? userRegion : lookupStateCode(userRegion);
    updateGlobalState('region', regionCode);
    updateGlobalState('country', 'US');
  } else {
    updateGlobalState('region', 'Ontario');
    updateGlobalState('country', 'CA');
  }
}

export async function updateUserLocation(location: LocationObject, updateGlobalState: Function) {
  updateGlobalState('userLocation', {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  });
  await setUserRegion(location.coords, updateGlobalState);
}

export async function getUserLocationSubscription(updateGlobalState: Function) {
  const { status } = await requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission to access location was denied');
    return undefined;
  }

  const subscription = await watchPositionAsync(
    {
      accuracy: Accuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 100,
    },
    (location) => {
      console.log('(Subscription) Updating user location: ', location.coords);
      updateUserLocation(location, updateGlobalState);
    },
  );

  return subscription;
}

const taskName = 'background-location';
export function createBackgroundLocationTask(updateRoute: Function) {
  TaskManager.defineTask(taskName, ({ data: { locations }, error }: any) => {
    if (error) {
      console.warn('Error getting background location', error);
      return;
    }

    console.log(`Received ${locations.length} new locations`);
    locations.forEach((location: LocationObject) => {
      const { latitude, longitude } = location.coords;
      const point = {
        latitude,
        longitude,
      };

      console.log('(Background) Updating user location: ', point);
      updateRoute({ lat: latitude, lng: longitude });
    });
  });
}

export async function startBackgroundLocationUpdates() {
  const granted = await getFullLocationPermissions();

  if (!granted) {
    // This will occur on Expo Go because they do not set the plist value for background permissions
    console.log('Permission to access location was denied');
    Alert('Unable to start trip', 'Permission to access location was denied. Please enable location services and try again.');
    return false;
  }

  try {
    await startLocationUpdatesAsync(taskName, {
      accuracy: Accuracy.Balanced,
      activityType: ActivityType.AutomotiveNavigation,
      timeInterval: 5000,
      distanceInterval: 15,
      foregroundService: {
        notificationTitle: 'Background location tracking',
        notificationBody: 'We are tracking your location in the background',
      },
      showsBackgroundLocationIndicator: true,
    });
  } catch (ex) {
    console.log('Error starting background location updates', ex);
    Alert('Unable to start trip', 'There was an error starting the trip. Please try again.');
    return false;
  }

  return true;
}

export async function stopBackgroundLocationUpdates() {
  await stopLocationUpdatesAsync(taskName);
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLngInKm(pos1: LatLng, pos2: LatLng) {
  const { lat: lat1, lng: lng1 } = pos1;
  const { lat: lat2, lng: lng2 } = pos2;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export function calculatePathLength(path: Array<LatLng>) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const pos1 = path[i];
    const pos2 = path[i + 1];
    total += getDistanceFromLatLngInKm(pos1, pos2);
  }
  return total;
}

export const convertLatLngToLocation = (latLng: LatLng) => ({
  latitude: latLng.lat,
  longitude: latLng.lng,
});

// Waypoints are required to be in latitude/longitude format
// whereas the API returns them in lat/lng format
// --- This can be used to convert back to lat/lng ---
export const convertLocationToLatLng = (location: Location) => ({
  lat: location.latitude,
  lng: location.longitude,
});

export default {
  provinceCodeLookup,
  lookupProvince,
  provinces,
};
