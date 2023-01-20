import {
  View,
  Modal,
  ViewStyle,
} from 'react-native';
import CheckBox from 'expo-checkbox';

import NumericInput from 'react-native-numeric-input';

import Text from '../Text';
import Button from '../Button';

import styles from '../../styles/HomeScreen.styles';
import { colors, globalStyles } from '../../styles/styles';

interface Props {
  visible: boolean,
  setVisible: (_: any) => void,
  data: number,
  setData: (_: any) => void,
  useCustomValue: boolean,
  setUseCustomValue: (_: any) => void,
}

export default function GasPriceModal(props: Props) {
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
      <View style={styles.modalContainer}>
        <Text style={styles.heading}>Configure Gas Price</Text>
        <View style={{ alignSelf: 'center', margin: 8 }}>
          <NumericInput
            rounded
            step={0.01}
            totalHeight={18}
            totalWidth={120}
            containerStyle={{ backgroundColor: 'white' }}
            inputStyle={globalStyles.numericInput as ViewStyle}
            valueType="real"
            minValue={0.01}
            leftButtonBackgroundColor={colors.lightGray}
            rightButtonBackgroundColor={colors.tertiary}
            value={value}
            onChange={setData}
          />
        </View>
        <View style={styles.checkBoxSection}>
          <Text style={{ color: colors.secondary, fontSize: 12 }}>Use custom gas price:</Text>
          <CheckBox
            color={colors.tertiary}
            value={useCustomValue}
            onValueChange={setUseCustomValue}
            style={styles.modalCheckBox}
          />
        </View>
        <Button style={{ alignSelf: 'center' }} onPress={() => setVisible(false)}>
          <Text style={{ color: colors.primary }}>Done</Text>
        </Button>
      </View>
    </Modal>
  );
}
