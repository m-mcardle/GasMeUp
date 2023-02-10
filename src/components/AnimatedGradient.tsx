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
  color0, color1, style, children, onTouchEnd,
}: any, ref: any) => (
  <LinearGradient
    ref={ref}
    colors={[color0, color1]}
    start={{ x: 0, y: 0.2 }}
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
  children: ReactNode,
  colors?: string[],
  style?: object,
  gradientOnIdle?: boolean,
  onTouchEnd?: () => void,
}

export default function AnimatedGradient(props: Props) {
  const {
    animate,
    children,
    style,
    colors = customColors,
    gradientOnIdle = true,
    onTouchEnd = () => {},
  } = props;
  const color0 = useRef(new Animated.Value(0)).current;
  const color1 = useRef(new Animated.Value(0)).current;

  const colorGradient = Animated.parallel(
    [color0, color1].map((animatedColor) => Animated.timing(animatedColor, {
      toValue: colors.length,
      duration: colors.length * 1000,
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

  const showGradient = animate || gradientOnIdle;
  return (
    <AnimatedLinearGradient
      color0={showGradient ? interpolatedColors[0] : undefined}
      color1={showGradient ? interpolatedColors[1] : undefined}
      style={style}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </AnimatedLinearGradient>
  );
}

AnimatedGradient.defaultProps = {
  colors: customColors,
  style: undefined,
  gradientOnIdle: true,
  onTouchEnd: () => {},
};
