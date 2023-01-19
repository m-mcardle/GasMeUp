import {
  createContext,
  useContext,
} from 'react';
import { Settings } from 'react-native';

export const GlobalContext = createContext<any>(null);

export const useGlobalState = () => useContext(GlobalContext);

export const TOGGLE_SETTINGS = [
  'Enable Requests',
];

export const NUMERIC_SETTINGS = [
  'Gas Mileage',
];

const intialSettings: any = {};
TOGGLE_SETTINGS.forEach((setting) => {
  intialSettings[setting] = !!Settings.get(setting);
});

NUMERIC_SETTINGS.forEach((setting) => {
  intialSettings[setting] = Settings.get(setting) || 0;
});

export const initialState = intialSettings;
