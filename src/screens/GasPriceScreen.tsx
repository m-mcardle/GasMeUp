/** TODO
*
* Get session tokens working (might b impossible)
* Implement db to store cached queries
* Highway vs City driving
*
*/

// React imports
import React, {
  useCallback,
} from 'react';
import {
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';

// Global State Stuff
import { useGlobalState } from '../hooks/hooks';

// Components
import Page from '../components/Page';
import Text from '../components/Text';

// Styles
import styles from '../styles/HomeScreen.styles';

// Mock Data
import { fetchData } from '../data/data';

export default function GasPriceScreen() {
  const [globalState] = useGlobalState();
  const fetchGasPrices = useCallback(async () => {
    console.log('fetching...');
    try {
      const gasPricesResponse = await fetchData(`/gas-prices?country=${globalState.country}`, !globalState['Enable Requests']);

      console.log(gasPricesResponse?.ok);
      if (!gasPricesResponse?.ok || !gasPricesResponse) {
        console.log(`Request for gas prices failed (${gasPricesResponse.status})`);
        const error = await gasPricesResponse.text();
        throw new Error(`Error: ${error} (${gasPricesResponse.status})`);
      }

      const responseData = await gasPricesResponse.json();
      console.log(responseData);
    } catch (err: any) {
      Alert.alert(err.message);
    }
    return null;
  }, [globalState['Enable Requests']]);

  // useEffect(() => {
  //   fetchGasPrices();
  // }, []);

  return (
    <Page>
      <View style={styles.dataContainer}>
        <Text style={styles.title}>Gas Prices</Text>
        <TouchableOpacity onPress={fetchGasPrices}>
          <Text>Fetch Gas Prices</Text>
        </TouchableOpacity>
      </View>
    </Page>
  );
}
