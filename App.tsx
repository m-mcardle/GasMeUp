import AppLoading from 'expo-app-loading';
import { useCallback, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { useFonts } from 'expo-font';

import Text from './components/Text';
import Button from './components/Button';
import { colors } from './styles/styles';
import Input from './components/Input';


interface GasPrice {
  name: string,
  currency: string,
  gasoline: number
}

interface KeyValue {
  text: string,
  value: number,
}

interface TripDistance {
  distance: KeyValue,
  duration: KeyValue,
  status: string
}

interface CostRequest {
  loading: boolean,
  cost: number
}

const serverUrl = 'http://carpoolcalc.loca.lt';

export default function App() {
  const [startLocation, setStartLocation] = useState<string>();
  const [endLocation, setEndLocation] = useState<string>();
  const [costRequest, setCostRequest] = useState<CostRequest>({loading: false, cost: 0});

  const {cost, loading} = costRequest;

  const submit = useCallback(() => {
    setCostRequest({loading: true, cost: 0});
    fetch(serverUrl + `/trip-cost/?start=${startLocation}&end=${endLocation}`)
      .then((res) => res.json())
      .then((data) => setCostRequest({loading: false, cost: data.cost}))
      .catch((err) => {
        alert(err);
        setCostRequest({loading: false, cost: 0});
      });
  }, [startLocation, endLocation]);

  let [fontsLoaded] = useFonts({
    'Gotham-Black': require('./assets/fonts/Gotham-Black.otf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.costSection}>
        {loading
          ? <ActivityIndicator />
          : <Text style={styles.costText}>${cost.toFixed(2)}</Text>
        }
      </View>
      <Input placeholder='Start location' onChangeText={setStartLocation} />
      <Input placeholder='End location' onChangeText={setEndLocation} />
      <Button onPress={submit}>
        <Text>Calculate</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkestGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costSection: {
    width: '70%',
    backgroundColor: '#118C4F',
    borderRadius: 5,
    margin: 10,
    padding: 5,
  },
  costText: {
    fontSize: 52
  }
});
