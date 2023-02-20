import {
  createContext,
  useContext,
} from 'react';
import { Settings, Platform } from 'react-native';

export const GlobalContext = createContext<any>(null);

export const useGlobalState = () => useContext(GlobalContext);

export const DEV_TOGGLE_SETTINGS: Record<string, boolean> = {
  'Enable Requests': true,
};

export const Locale = {
  CA: 'CA',
  US: 'US',
};

interface Option {
  label: string,
  default: any,
  options: Array<any>,
}

export const PERSISTED_VALUES: Record<string, string> = {
  splitwiseToken: '',
};

export const OPTIONS_SETTINGS: Record<string, Option> = {
  Locale: {
    label: 'Units (Metric/Imperial)',
    default: Locale.CA,
    options: [Locale.CA, Locale.US],
  },
};

export const NUMERIC_SETTINGS: Record<string, number> = {
  'Gas Mileage': 10,
};

let initialSettings: any = {};

if (Platform.OS === 'ios') {
  // The settings are stored as numbers and so to convert them to booleans we must use `!!`
  Object.keys(DEV_TOGGLE_SETTINGS).forEach((setting) => {
    initialSettings[setting] = Settings.get(setting) !== undefined
      ? !!Settings.get(setting)
      : DEV_TOGGLE_SETTINGS[setting];
  });

  Object.keys(OPTIONS_SETTINGS).forEach((setting) => {
    initialSettings[setting] = Settings.get(setting) !== undefined
      ? Settings.get(setting)
      : OPTIONS_SETTINGS[setting].default;
  });

  Object.keys(NUMERIC_SETTINGS).forEach((setting) => {
    initialSettings[setting] = Settings.get(setting) !== undefined
      ? Settings.get(setting)
      : NUMERIC_SETTINGS[setting];
  });

  Object.keys(PERSISTED_VALUES).forEach((setting) => {
    initialSettings[setting] = Settings.get(setting) !== undefined
      ? Settings.get(setting)
      : PERSISTED_VALUES[setting];
  });
} else {
  initialSettings = {
    ...DEV_TOGGLE_SETTINGS,
    ...NUMERIC_SETTINGS,
  };
}

// Force enable requests in production
if (process.env.NODE_ENV !== 'development') {
  initialSettings['Enable Requests'] = true;
}

export const initialState = {
  ...initialSettings,
  region: 'ON',
  country: 'CA',
  userLocation: {
    lat: undefined,
    lng: undefined,
  },
  exchangeRate: 1,
};

export function changeSetting(
  setting: string,
  value: any,
  updateGlobalState: (k: string, v: any) => void,
) {
  const newSetting: any = {};
  newSetting[setting] = value;

  if (Platform.OS === 'ios') { Settings.set(newSetting); }
  updateGlobalState(setting, value);
}
