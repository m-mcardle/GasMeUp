// React
import React, {
  ReactNode, useEffect, useRef, useState,
} from 'react';
import {
  Animated, Dimensions, Easing, KeyboardAvoidingView, Modal, Platform,
  Pressable, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from './Text';
import IconButton from './IconButton';

// Styles
import {
  color, motion, radius, size, space,
} from '../styles/theme';

interface Props {
  children: ReactNode,
  visible: boolean,
  title?: string,
  subtitle?: string,
  // Fill most of the screen (maps, long lists) instead of hugging the content.
  tall?: boolean,
  style?: StyleProp<ViewStyle>,
  onDismiss: () => void,
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.overlay,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.borderStrong,
    maxHeight: '92%',
    paddingHorizontal: size.screenGutter,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: color.borderStrong,
    marginTop: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.md,
  },
  headerText: {
    flex: 1,
    paddingTop: space.xs,
  },
});

// Bottom sheet used for every modal in the app.
export default function Sheet({
  children, visible, title, subtitle, tall = false, style, onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: motion.base + 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: motion.base,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, space.lg), transform: [{ translateY }] },
            tall ? { height: '88%' } : null,
          ]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              {!!title && <Text variant="title2" accessibilityRole="header">{title}</Text>}
              {!!subtitle && <Text variant="subhead" tone="secondary" style={{ marginTop: space.xs }}>{subtitle}</Text>}
            </View>
            <IconButton icon="close" accessibilityLabel="Close" size={32} onPress={onDismiss} />
          </View>
          <View style={[tall ? { flex: 1 } : null, style]}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
