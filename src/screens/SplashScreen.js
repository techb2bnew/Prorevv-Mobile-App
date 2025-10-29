import { StyleSheet, ImageBackground, useWindowDimensions } from 'react-native'
import React from 'react'
import { SPLASH_IMAGE, SPLASH_IMAGE_LANDSCAPE } from '../assests/images'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { useOrientation } from '../OrientationContext';

export default function SplashScreen() {
     const { orientation } = useOrientation()
         const { width, height } = useWindowDimensions();
     
    return (
        <ImageBackground source={orientation === 'LANDSCAPE' ? SPLASH_IMAGE_LANDSCAPE : SPLASH_IMAGE} style={[{ width: wp(100), height: hp(100) }]} >
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
})
