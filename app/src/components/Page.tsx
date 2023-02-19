// React imports
import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView, Platform,
} from 'react-native';

// External Components
import { LinearGradient } from 'expo-linear-gradient';

import {
  Provider, MD3DarkTheme,
} from 'react-native-paper';

// Styles
import { colors, globalStyles } from '../styles/styles';

interface Props {
  children: ReactNode,
  keyboardAvoiding?: boolean,
}

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...colors,
  },
};

export default function Page({
  children,
  keyboardAvoiding = true,
}: Props) {
  return (
    <Provider theme={theme}>
      <LinearGradient
        colors={[colors.primary, colors.purple]}
        start={{ x: 0.2, y: 0.9 }}
        style={globalStyles.page}
      >
        {keyboardAvoiding
          ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={120}
              style={globalStyles.page}
            >
              {children}
            </KeyboardAvoidingView>
          )
          : children}
      </LinearGradient>
    </Provider>
  );
}

Page.defaultProps = {
  keyboardAvoiding: true,
};
