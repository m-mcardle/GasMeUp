import React, {
  ReactNode,
  useEffect, useRef,
} from 'react';
import {
  Animated, Easing,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

const customColors = [
  '#118C4F',
  '#006241',
  '#7851a9',
  '#603fef',
];

const Gradient = React.forwardRef(({
  x = 0,
  y = 0.2,
  color0,
  color1,
  style,
  children,
  onTouchEnd,
}: any, ref: any) => (
  <LinearGradient
    ref={ref}
    colors={[color0, color1]}
    start={{ x, y }}
    style={{
      ...style,
    }}
    onTouchEnd={onTouchEnd}
  >
    {children}
  </LinearGradient>
));

const AnimatedLinearGradient = Animated.createAnimatedComponent(Gradient);

interface Props {
  animate: boolean,
  speed: number,
  children: ReactNode,
  colors?: string[],
  style?: object,
  x?: number,
  y?: number,
  onTouchEnd?: () => void,
}

export default function AnimatedGradient(props: Props) {
  const {
    animate,
    children,
    style,
    speed,
    x,
    y,
    colors = customColors,
    onTouchEnd = () => {},
  } = props;
  const color0 = useRef(new Animated.Value(0)).current;
  const color1 = useRef(new Animated.Value(0)).current;

  const colorGradient = Animated.parallel(
    [color0, color1].map((animatedColor) => Animated.timing(animatedColor, {
      toValue: colors.length,
      duration: colors.length * speed,
      easing: Easing.linear,
      useNativeDriver: false,
    })),
  );

  const gradientAnimation = Animated.loop(colorGradient);

  // Start the animation or stop it when `animate` changes
  useEffect(() => {
    if (animate) {
      gradientAnimation.start();
    } else {
      gradientAnimation.start();
      [color0, color1].forEach((color) => color.setValue(0));
    }
  }, [animate]);

  // Idk what this actually does tbh
  const preferColors: any = [];
  while (preferColors.length < 2) {
    preferColors.push(
      colors
        .slice(preferColors.length)
        .concat(colors.slice(0, preferColors.length + 1)),
    );
  }

  const interpolatedColors = [color0, color1].map(
    (animatedColor, index) => animatedColor.interpolate({
      inputRange: Array.from({ length: colors.length + 1 }, (v, k) => k),
      outputRange: preferColors[index],
    }),
  );

  return (
    <AnimatedLinearGradient
      color0={interpolatedColors[0]}
      color1={interpolatedColors[1]}
      x={x}
      y={y}
      style={style}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </AnimatedLinearGradient>
  );
}
