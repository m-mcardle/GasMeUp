import React from 'react';
import {
  StyleSheet, Switch, TextStyle, View,
} from 'react-native';

import NumericInput from '../../../components/NumericInput';
import Sheet from '../../../components/Modal';
import Text from '../../../components/Text';
import Button from '../../../components/Button';

import {
  color, radius, space, type,
} from '../../../styles/theme';

interface Props {
  setting: string,
  visible: boolean,
  units: string,
  description?: string,
  maxValue?: number,
  setVisible: (_: any) => void,
  data: number,
  setData: (_: any) => void,
  inputStep?: number,
  useCustomValue?: boolean,
  setUseCustomValue?: (_: any) => void,
}

const styles = StyleSheet.create({
  stepper: {
    alignItems: 'center',
    paddingVertical: space.lg,
  },
  units: {
    marginTop: space.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.xl,
    gap: space.md,
  },
});

// Sheet for editing a numeric trip input (gas price or fuel efficiency).
export default function SettingModal({
  setting = 'Gas Price',
  visible,
  units,
  description,
  maxValue,
  setVisible,
  data,
  setData,
  inputStep = 0.01,
  useCustomValue,
  setUseCustomValue,
}: Props) {
  const value = data === 0 ? 2.00 : data;
  const invalid = (!!maxValue && data > maxValue) || data <= 0.1;
  return (
    <Sheet
      visible={visible}
      title={setting}
      subtitle={description}
      onDismiss={() => !invalid && setVisible(false)}
    >
      <View style={styles.stepper}>
        <NumericInput
          rounded
          step={inputStep}
          totalHeight={60}
          totalWidth={260}
          containerStyle={{ backgroundColor: color.surfaceRaised, borderRadius: radius.lg }}
          inputStyle={{ ...type.title2, fontSize: 24 } as TextStyle}
          valueType="real"
          minValue={0.01}
          maxValue={maxValue}
          separatorWidth={0}
          borderColor={color.border}
          leftButtonBackgroundColor={color.surfacePressed}
          rightButtonBackgroundColor={color.primary}
          textColor={color.text}
          iconColor={color.text}
          value={value}
          onChange={setData}
        />
        <Text variant="footnote" tone="tertiary" style={styles.units}>{units}</Text>
      </View>
      {setUseCustomValue && (
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text variant="callout">Use this price</Text>
            <Text variant="footnote" tone="tertiary">Off uses the live average for your region</Text>
          </View>
          <Switch
            value={useCustomValue}
            onValueChange={setUseCustomValue}
            trackColor={{ false: color.surfacePressed, true: color.primary }}
            ios_backgroundColor={color.surfacePressed}
          />
        </View>
      )}
      <Button
        title="Done"
        fullWidth
        onPress={() => setVisible(false)}
        disabled={invalid}
      />
    </Sheet>
  );
}
