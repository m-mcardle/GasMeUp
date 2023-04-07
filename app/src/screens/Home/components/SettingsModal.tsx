import {
  View,
  Modal,
  ViewStyle,
} from 'react-native';
import CheckBox from 'expo-checkbox';

import NumericInput from 'react-native-numeric-input';

import Text from '../../../components/Text';
import Button from '../../../components/Button';

import styles from '../../../styles/HomeScreen.styles';
import { colors, globalStyles } from '../../../styles/styles';

interface Props {
  setting: string,
  visible: boolean,
  units: string,
  maxValue?: number,
  setVisible: (_: any) => void,
  data: number,
  setData: (_: any) => void,
  inputStep?: number,
  useCustomValue?: boolean,
  setUseCustomValue?: (_: any) => void,
}

export default function SettingModal(props: Props) {
  const {
    setting = 'Gas Price',
    visible,
    units,
    maxValue,
    setVisible,
    data,
    setData,
    inputStep = 0.01,
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
        <Text style={styles.heading}>
          {`Configure ${setting}`}
        </Text>
        <Text style={styles.subHeading}>
          {units}
        </Text>
        <View style={{ alignSelf: 'center', margin: 8 }}>
          <NumericInput
            rounded
            step={inputStep}
            totalHeight={25}
            totalWidth={150}
            containerStyle={{ backgroundColor: 'white' }}
            inputStyle={globalStyles.numericInput as ViewStyle}
            valueType="real"
            minValue={0.01}
            maxValue={maxValue}
            leftButtonBackgroundColor={colors.lightGray}
            rightButtonBackgroundColor={colors.action}
            textColor={colors.primary}
            value={value}
            onChange={setData}
          />
        </View>
        {setUseCustomValue && (
        <View style={styles.checkBoxSection}>
          <Text style={{ color: colors.secondary, fontSize: 14 }}>Use custom gas price:</Text>
          <CheckBox
            color={colors.action}
            value={useCustomValue}
            onValueChange={setUseCustomValue}
            style={styles.modalCheckBox}
          />
        </View>
        )}
        <Button
          style={{ alignSelf: 'center' }}
          onPress={() => setVisible(false)}
          disabled={(!!maxValue && data > maxValue) || data <= 0.1}
        >
          <Text style={{ color: colors.secondary }}>Done</Text>
        </Button>
      </View>
    </Modal>
  );
}

SettingModal.defaultProps = {
  useCustomValue: false,
  setUseCustomValue: undefined,
  inputStep: 0.01,
  maxValue: undefined,
};
