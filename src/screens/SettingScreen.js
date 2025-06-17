import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { blackColor, grayColor, greenColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;


const SettingScreen = () => {
  return (
    <View style={[styles.container, flex]}>
      <Text>SettingScreen</Text>
    </View>
  )
}

export default SettingScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: whiteColor,
    padding: spacings.large
  }
})