// React
import React, { ReactNode } from 'react';
import { View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { Modal } from 'react-native-paper';

// Styles
import { colors, globalStyles } from '../styles/styles';

interface Props {
  children: ReactNode,
  style?: object,
  visible: boolean,
  onDismiss: () => void,
}

export default function MyModal({
  children, style, visible, onDismiss,
}: Props) {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={globalStyles.modal}
    >
      <View style={[{ height: '100%', padding: 4 }, style]}>
        <View style={{ width: '100%', height: 24, alignItems: 'flex-end' }}>
          <Ionicons name="close" size={24} color={colors.secondary} onPress={onDismiss} />
        </View>
        <View style={{ maxHeight: '95%' }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}
