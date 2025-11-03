import React from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '.././../utils';
import { BaseStyle } from '../../constans/Style';
import { spacings, style } from '../../constans/Fonts';
import { blackColor, blackOpacity5, blueColor, grayColor, orangeColor, redColor, whiteColor } from '../../constans/Color';
import { SUCCESS_IMAGE } from '../../assests/images';

const { textAlign, alignJustifyCenter, flex, borderRadius10, positionAbsolute } = BaseStyle;

const SuccessModal = ({ visible, onClose, onPressContinue, headingText, text, buttonText, image, color, button2Text, onPressbutton2 }) => {
  const handleContinue = () => {
    onPressContinue();
  };
  const handlePressButton2 = () => {
    onPressbutton2();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" presentationStyle="overFullScreen" supportedOrientations={["portrait", "landscape-left", "landscape-right"]}>
      <View style={[styles.modalContainer, flex, alignJustifyCenter]}>
        <View style={[styles.modalContent, borderRadius10, alignJustifyCenter, { backgroundColor: whiteColor, width: button2Text ? wp(95) : wp(85), }]}>
          <Image source={image ? image : SUCCESS_IMAGE} style={styles.image} resizeMode="contain" />
          <Text style={[styles.message, textAlign, { color: blackColor }]}>{headingText ? headingText : "Successfully"}</Text>
          {text && <Text style={[styles.text, textAlign, { color: grayColor }]}>{text}</Text>}
          <View style={[styles.buttonContainer, button2Text ? styles.rowButtons : {}, alignJustifyCenter]}>
            <TouchableOpacity onPress={handleContinue} style={[styles.continueButton, alignJustifyCenter, borderRadius10, { backgroundColor: color ? color : blackColor, width: button2Text ? "46%" : "80%", }]}>
              <Text style={[styles.buttonText, textAlign]}>{buttonText ? buttonText : "Continue"}</Text>
            </TouchableOpacity>
            {button2Text && <TouchableOpacity onPress={handlePressButton2} style={[styles.continueButton, alignJustifyCenter, borderRadius10, { backgroundColor: color ? color : blackColor, width: "46%", marginLeft: spacings.large }]}>
              <Text style={[styles.buttonText, textAlign]}>{button2Text}</Text>
            </TouchableOpacity>}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: blackOpacity5,
  },
  modalContent: {
    // width: wp(95),
    padding: spacings.xLarge,
    backgroundColor: whiteColor,
  },
  image: {
    width: wp(20),
    height: hp(10),
    // marginVertical: spacings.large,
  },
  message: {
    fontSize: style.fontSizeLarge.fontSize,
    color: blackColor,
    marginTop: spacings.large,
  },
  text: {
    fontSize: style.fontSizeNormal.fontSize,
    color: grayColor,
    marginTop: spacings.medium,
  },
  closeButton: {
    top: spacings.small,
    right: spacings.small,
  },
  buttonContainer: {
    marginTop: spacings.Large2x,
    width: wp(90)
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  continueButton: {
    height: hp(5),
    justifyContent: 'center',
  },
  buttonText: {
    color: whiteColor,
    fontSize: style.fontSizeNormal1x.fontSize
  },
});

export default SuccessModal;
