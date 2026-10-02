// React imports
import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

// External Components
import { LinearGradient } from 'expo-linear-gradient';

// Styles
import {
  color, gradient, size, space,
} from '../styles/theme';

interface Props {
  children: ReactNode,
  // Scroll the content (keyboard insets are handled automatically on iOS).
  scroll?: boolean,
  keyboardAvoiding?: boolean,
  // Horizontal screen gutter.
  padded?: boolean,
  // Screens under a stack header must not add the top safe-area inset again.
  safeTop?: boolean,
  // Pinned below the content, above the tab bar (primary actions).
  footer?: ReactNode,
  contentStyle?: StyleProp<ViewStyle>,
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: size.screenGutter,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: space.xxxl,
  },
  footer: {
    paddingHorizontal: size.screenGutter,
    paddingTop: space.md,
    paddingBottom: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    backgroundColor: color.bg,
  },
});

export default function Page({
  children,
  scroll = false,
  keyboardAvoiding = true,
  padded = true,
  safeTop = true,
  footer,
  contentStyle,
}: Props) {
  const edges: Edge[] = safeTop ? ['top', 'left', 'right'] : ['left', 'right'];
  const gutter = padded ? styles.padded : null;

  const body = scroll
    ? (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, gutter, contentStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    )
    : <View style={[styles.flex, gutter, contentStyle]}>{children}</View>;

  return (
    <View style={styles.root}>
      {safeTop && <LinearGradient colors={gradient.screen} style={styles.glow} pointerEvents="none" />}
      <SafeAreaView edges={edges} style={styles.flex}>
        {keyboardAvoiding && !scroll
          ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.flex}
            >
              {body}
            </KeyboardAvoidingView>
          )
          : body}
        {footer && <View style={styles.footer}>{footer}</View>}
      </SafeAreaView>
    </View>
  );
}
