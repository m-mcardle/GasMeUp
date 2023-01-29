import {
  createContext,
  useContext,
} from 'react';
import { Settings } from 'react-native';

export const GlobalContext = createContext<any>(null);

export const useGlobalState = () => useContext(GlobalContext);

export const DEV_TOGGLE_SETTINGS: Record<string, boolean> = {
  'Enable Requests': true,
};

export const NUMERIC_SETTINGS: Record<string, number> = {
  'Gas Mileage': 10,
};

const initialSettings: any = {};

// The settings are stored as numbers and so to convert them to booleans we must use `!!`
Object.keys(DEV_TOGGLE_SETTINGS).forEach((setting) => {
  initialSettings[setting] = Settings.get(setting) !== undefined
    ? !!Settings.get(setting)
    : DEV_TOGGLE_SETTINGS[setting];
});

Object.keys(NUMERIC_SETTINGS).forEach((setting) => {
  initialSettings[setting] = Settings.get(setting) !== undefined
    ? Settings.get(setting)
    : NUMERIC_SETTINGS[setting];
});

// Force enable requests in production
if (process.env.NODE_ENV !== 'development') {
  initialSettings['Enable Requests'] = true;
}

export const initialState = initialSettings;
