import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import Text from './Text';

import { getIcon } from '../helpers/iconHelper';
import { color, radius } from '../styles/theme';

interface Props {
  name: string,
  email?: string,
  size?: number,
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    backgroundColor: color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

const initials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('');

// Gravatar (identicon fallback) over an initials circle, so there is never an empty hole
// while the image loads or when the device is offline.
export default function Avatar({ name, email, size = 40 }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.base, { width: size, height: size }]}>
      <Text variant="headline" tone="brand" style={{ fontSize: size * 0.38, lineHeight: size * 0.46 }}>
        {initials(name) || '?'}
      </Text>
      {!failed && (
        <Image
          accessibilityIgnoresInvertColors
          source={getIcon({ email, name })}
          onError={() => setFailed(true)}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
      )}
    </View>
  );
}
