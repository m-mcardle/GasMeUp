import {
  createContext,
  useContext,
} from 'react';
import { Settings } from 'react-native';

export const GlobalContext = createContext<any>(null);

export const useGlobalState = () => useContext(GlobalContext);

export const SETTINGS = [
  'Enable Requests',
  'Setting 1',
  'Setting 2',
  'Setting 3',
  'Setting 4',
  'Setting 5',
];

const intialSettings: any = {};
SETTINGS.forEach((setting) => {
  intialSettings[setting] = !!Settings.get(setting);
});

export const initialState = intialSettings;
