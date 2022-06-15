import {
  View,
  Modal,
  TouchableOpacity,
  Switch,
} from 'react-native';

import NumericInput from 'react-native-numeric-input';

import Text from '../Text';

import styles from '../../styles/App.styles';
import { colors, globalStyles } from '../../styles/styles';

interface Props {
  visible: boolean,
  setVisible: (_: any) => void,
  data: number,
  setData: (_: any) => void,
  useCustomValue: boolean,
  setUseCustomValue: (_: any) => void,
}

export default function DataModal(props: Props) {
  const {
    visible,
    setVisible,
    data,
    setData,
    useCustomValue,
    setUseCustomValue,
  } = props;

  const value = data === 0 ? 2.00 : data;
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
    >
      <View
        style={{
          backgroundColor: colors.primary,
          borderRadius: 20,
          paddingVertical: 35,
          marginVertical: '75%',
          width: '60%',
          alignSelf: 'center',
          borderWidth: 2,
        }}
      >
        <Text style={styles.heading}>Configure Gas Price</Text>
        <View style={{ alignSelf: 'center', margin: 8 }}>
          <NumericInput
            rounded
            step={0.01}
            totalHeight={18}
            totalWidth={120}
            containerStyle={{ backgroundColor: 'white' }}
            inputStyle={styles.numericInput}
            valueType="real"
            minValue={0.01}
            leftButtonBackgroundColor={colors.lightGray}
            rightButtonBackgroundColor={colors.tertiary}
            value={value}
            onChange={setData}
          />
        </View>
        <TouchableOpacity style={{ ...globalStyles.button, alignSelf: 'center' }} onPress={() => setVisible(false)}>
          <Text style={{ color: 'white' }}>Done</Text>
        </TouchableOpacity>
        <Switch style={{ alignSelf: 'center' }} value={useCustomValue} onValueChange={setUseCustomValue} />
      </View>
    </Modal>
  );
}
