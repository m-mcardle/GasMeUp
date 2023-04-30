import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { globalStyles } from '../../../styles/styles';

interface Props {
  onPress: () => void,
}

export default function SettingsIcon({ onPress }: Props) {
  return (
    <View style={{ ...globalStyles.headerSection, top: 24 }}>
      <TouchableOpacity onPress={onPress}>
        <Ionicons name="settings" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
