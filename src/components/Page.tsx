// React imports
import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
} from 'react-native';

// External Components
import { LinearGradient } from 'expo-linear-gradient';

import {
  Provider, DarkTheme,
} from 'react-native-paper';

// Styles
import { colors, globalStyles } from '../styles/styles';

interface Props {
  children: ReactNode,
}

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...colors,
  },
};

export default function Page({ children }: Props) {
  return (
    <Provider theme={theme}>
      <LinearGradient
        colors={[colors.primary, colors.purple]}
        start={{ x: 0.2, y: 0.9 }}
        style={globalStyles.page}
      >
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={160}
          style={globalStyles.page}
        >
          {children}
        </KeyboardAvoidingView>
      </LinearGradient>
    </Provider>
  );
}
