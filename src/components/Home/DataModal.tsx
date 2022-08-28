import {
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import CheckBox from 'expo-checkbox';

import NumericInput from 'react-native-numeric-input';

import Text from '../Text';

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
      <View style={styles.modalContainer}>
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
            isCurrency
            editable={false}
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
        <TouchableOpacity style={{ ...globalStyles.button, alignSelf: 'center' }} onPress={() => setVisible(false)}>
          <Text style={{ color: colors.primary }}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
