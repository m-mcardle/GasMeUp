import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {

  // Fetch data from the Node server
  useEffect(() => {
    fetch('http://tough-islands-feel-173-34-49-205.loca.lt/api')
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
