import { StyleSheet, ImageBackground } from 'react-native'
import React from 'react'
import { SPLASH_IMAGE } from '../assests/images'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';

export default function SplashScreen() {
    return (
        <ImageBackground source={SPLASH_IMAGE} style={[{ width: wp(100), height: hp(100) }]} >
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
})
