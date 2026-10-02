// React imports
import React from 'react';
import { View } from 'react-native';

// Components
import Page from '../components/Page';
import EmptyState from '../components/EmptyState';

export default function MaintenanceScreen() {
  return (
    <Page>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon="construct-outline"
          title="We’ll be right back"
          message="GasMeUp is getting some maintenance. Please check back soon."
        />
      </View>
    </Page>
  );
}
