// React imports
import React from 'react';
import {
  View,
} from 'react-native';

// Components
import Page from '../components/Page';
import Text from '../components/Text';

// Styles
import { globalStyles } from '../styles/styles';

export default function MaintenanceScreen() {
  return (
    <Page>
      <View style={globalStyles.centered}>
        <Text style={{ ...globalStyles.h1, marginBottom: 24 }}>GasMeUp Unavailable</Text>
        <Text style={globalStyles.h2}>
          GasMeUp is currently undergoing maintenance.
        </Text>
        <Text style={globalStyles.h2}>
          Please come back later!
        </Text>
      </View>
    </Page>
  );
}
