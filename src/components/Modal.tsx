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
    <Modal visible={visible} onDismiss={onDismiss}>
      <View style={[globalStyles.modal, style]}>
        <View style={{ width: '100%', height: 24, alignItems: 'flex-end' }}>
          <Ionicons name="close" size={24} color={colors.secondary} onPress={onDismiss} />
        </View>
        {children}
      </View>
    </Modal>
  );
}

MyModal.defaultProps = {
  style: undefined,
};
