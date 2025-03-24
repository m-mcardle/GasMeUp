import {
  createContext,
  useContext,
} from 'react';
import { Settings, Platform } from 'react-native';

// These are the only types that can be stored in the Settings API
type SafeStoredValue = string | number;
type UndefinedSafeStoredValue = SafeStoredValue | undefined;

export const GlobalContext = createContext<any>(null);

export const useGlobalState = () => useContext(GlobalContext);

export const Locale = {
  CA: 'CA',
  US: 'US',
};

interface Option {
  label: string,
  default: any,
  options: Array<SafeStoredValue>,
}

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

export const PERSISTED_VALUES: Record<string, Record<string, UndefinedSafeStoredValue>> = {
  'Custom Gas Price': {
    price: 1,
    enabled: 'false',
  },
  Vehicle: {
    year: undefined,
    make: undefined,
    model: undefined,
    trimText: undefined,
    trimValue: undefined,
  },
};

let initialSettings: any = {};

if (Platform.OS === 'ios') {
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
    ...NUMERIC_SETTINGS,
  };

  Object.keys(OPTIONS_SETTINGS).forEach((setting) => {
    initialSettings[setting] = OPTIONS_SETTINGS[setting].default;
  });

  Object.keys(PERSISTED_VALUES).forEach((setting) => {
    initialSettings[setting] = PERSISTED_VALUES[setting];
  });
}

export const initialState = {
  ...initialSettings,
  region: 'Ontario',
  country: 'CA',
  userLocation: {
    lat: undefined,
    lng: undefined,
  },
  exchangeRate: 0.70,
  expoToken: '',
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
