// React
import React, { ComponentType, ReactNode } from 'react';
import {
  ActivityIndicator, ScrollView, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';

// Components
import Card from './Card';
import EmptyState from './EmptyState';

// Styles
import { color, space } from '../styles/theme';

interface Props {
  data: Array<any>,
  loading?: boolean,
  // Scroll inside the card (when the list shares the screen with fixed content).
  scrollable?: boolean,
  Row: ComponentType<any>,
  FooterRow?: ComponentType,
  EmptyState?: ComponentType,
  emptyState?: ReactNode,
  style?: StyleProp<ViewStyle>,
  // Legacy DataTable props, no longer rendered.
  title?: string,
  headers?: Array<unknown>,
  itemsPerPage?: number,
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: space.huge,
    alignItems: 'center',
  },
});

// A card containing a list of rows, with loading and empty states.
export default function Table({
  data,
  Row,
  FooterRow = undefined,
  EmptyState: CustomEmptyState,
  emptyState,
  loading = false,
  scrollable = false,
  style,
}: Props) {
  let content;
  if (loading) {
    content = (
      <View style={styles.loading}>
        <ActivityIndicator color={color.primaryText} size="large" />
      </View>
    );
  } else if (!data.length) {
    content = emptyState ?? (CustomEmptyState
      ? <CustomEmptyState />
      : <EmptyState icon="file-tray-outline" title="Nothing here yet" />);
  } else {
    const rows = data.map((rowData, index) => {
      const { key, ...rest } = rowData;
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Row key={key ?? index} {...rest} isLast={index === data.length - 1} />;
    });
    content = scrollable
      ? <ScrollView showsVerticalScrollIndicator={false}>{rows}</ScrollView>
      : rows;
  }

  return (
    <Card padded={false} style={style}>
      {content}
      {FooterRow && !loading && <FooterRow />}
    </Card>
  );
}
