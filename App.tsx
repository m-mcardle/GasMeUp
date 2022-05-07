import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {

  // Fetch data from the Node server
  useEffect(() => {
    // This is gross but it works, always have to manually update for new link though
    fetch('http://beige-peaches-eat-173-34-49-205.loca.lt/gas-prices')
      .then((res) => res.json())
      .then((json) => console.log(json))
      .catch((error) => console.log(error))
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
