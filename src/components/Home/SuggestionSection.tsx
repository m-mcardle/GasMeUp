import React from 'react';
import { StyleSheet, View } from 'react-native';

import Text from '../Text';

import { colors, boldItalicFont } from '../../styles/styles';

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
    minHeight: 72,
  },
  emptyList: {
    padding: 5,
    fontStyle: 'italic',
    fontWeight: '200',
    fontSize: 10,
    fontFamily: boldItalicFont,
    color: colors.black,
  },
  text: {
    fontSize: 10,
    padding: 5,
    color: colors.black,
  },
});

export default function SuggestionsSection(props: Props) {
  const { items, onSelect } = props;

  return (
    <View style={styles.container}>
      {items?.length > 0
        ? items.map((el, i) => {
          if (i < 3) {
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
