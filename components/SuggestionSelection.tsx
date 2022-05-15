import { StyleSheet, View } from 'react-native';

import Text from './Text'

import { italicFont } from '../styles/styles'

interface Props {
  items: Array<string>,
  onSelect: (arg0: string) => void,
}

export default function SuggestionsSection(props: Props) {
  const { items, onSelect } = props;

  return (
    <View style={styles.container}>
      {items?.length > 0
        ? items.map(el => 
          <Text style={{fontSize: 10}}  key={el} onPress={() => { onSelect(el) }}>{el}</Text>
        )
        : <Text style={styles.emptyList}>No suggestions</Text>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 5,
    width: '70%',
    backgroundColor: 'white',
    margin: 5,
    padding: 5
  },
  emptyList: {
    padding: 5,
    fontStyle: 'italic',
    fontWeight: '200',
    fontSize: 10,
    fontFamily: italicFont
  }
})