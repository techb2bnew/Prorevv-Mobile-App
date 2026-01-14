import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { spacings } from '../constans/Fonts';
import { blackColor, blueColor, grayColor, lightShadeBlue, mediumGray, redColor, whiteColor } from '../constans/Color';

const CustomTextInput = React.forwardRef(({ placeholder, style, rightIcon, label, required, leftIcon, labelStyle, ...props }, ref) => {
  return (
    <View style={{ marginTop: spacings.xxxLarge }}>
      <Text style={[styles.label, labelStyle]}>{label}{required && <Text style={styles.asterisk}> *</Text>}</Text>
      <View style={[styles.inputContainer, style]}>
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor={mediumGray}
          scrollEnabled={true}
          editable={true}
          {...props}
        />
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>
    </View>
  );
});

CustomTextInput.displayName = 'CustomTextInput';

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: blackColor,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: blackColor,
    borderRadius: 50,
    paddingHorizontal: 15,
    paddingVertical: 2,
    backgroundColor: whiteColor,
    color: blackColor
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 7,
  },
  iconContainer: {
    marginLeft: 5,
  },
  asterisk: {
    color: 'red',
  },
});

export default CustomTextInput;
