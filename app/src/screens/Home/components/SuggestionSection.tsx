import React from 'react';
import { StyleSheet, View } from 'react-native';

import Text from '../../../components/Text';

import { colors, boldFont } from '../../../styles/styles';

interface Props {
  items: Array<string>,
  onSelect: (arg0: string) => void,
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 5,
    width: '75%',
    backgroundColor: colors.lightTertiary,
    margin: 5,
    padding: 5,
    minHeight: 128,
  },
  emptyList: {
    padding: 5,
    fontStyle: 'italic',
    fontWeight: '200',
    fontSize: 10,
    fontFamily: boldFont,
    color: colors.secondary,
  },
  text: {
    fontSize: 10,
    padding: 5,
    color: colors.secondary,
  },
});

export default function SuggestionsSection(props: Props) {
  const { items, onSelect } = props;

  return (
    <View style={styles.container}>
      {items?.length > 0
        ? items.map((el, i) => {
          if (i < 5) {
            return (
              <Text
                style={styles.text}
                key={el}
                onPress={() => onSelect(el)}
                numberOfLines={1}
              >
                {el}
              </Text>
            );
          }
          return null;
        })
        : <Text style={styles.emptyList}>No suggestions</Text>}
    </View>
  );
}
