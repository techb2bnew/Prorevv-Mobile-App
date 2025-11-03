// import React, { useEffect, useState } from "react";
// import { Modal, StyleSheet, ImageBackground, Alert } from "react-native";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../utils';
// import { spacings, style } from '../../constans/Fonts';
// import { whiteColor } from '../../constans/Color';
// import { SPLASH_IMAGE } from "../../assests/images";
// import ReactNativeBiometrics from 'react-native-biometrics';
// import * as Keychain from 'react-native-keychain';

// const BiometricModal = ({ isBiometricModalVisible, setIsBiometricModalVisible }) => {
//     // const handleBiometricAuthentication = async () => {
//     //     const rnBiometrics = new ReactNativeBiometrics();

//     //     try {
//     //         const result = await rnBiometrics.simplePrompt({
//     //             promptMessage: 'Authenticate with Biometrics',
//     //         });

//     //         if (result.success) {
//     //             setTimeout(() => setIsBiometricModalVisible(false), 1000);
//     //         } else {
//     //             setTimeout(() => handleBiometricAuthentication(), 1000);
//     //             // Alert.alert('Authentication Failed', 'Please try again.');
//     //         }
//     //     } catch (error) {
//     //         console.error('Biometric authentication error:', error);
//     //         setTimeout(() => handleBiometricAuthentication(), 1000);
//     //     }
//     // };

//     // useEffect(() => {
//     //     if (isBiometricModalVisible) {
//     //         handleBiometricAuthentication();
//     //     }
//     // }, [isBiometricModalVisible]);
//     const [biometryType, setBiometryType] = useState(null);
//     const [failedAttempts, setFailedAttempts] = useState(0);
//     const MAX_ATTEMPTS = 3;

//     // Check biometric support
//     useEffect(() => {
//         const checkBiometricSupport = async () => {
//             try {
//                 const { available, biometryType } = await rnBiometrics.isSensorAvailable();
//                 if (available) {
//                     setBiometryType(biometryType); // 'FaceID', 'TouchID', or 'Biometrics'
//                 } else {
//                     setBiometryType(null);
//                     Alert.alert('Biometrics Not Available', 'Please use username/password to log in.');
//                 }
//             } catch (error) {
//                 console.error('Error checking biometric support:', error);
//                 setBiometryType(null);
//             }
//         };
//         checkBiometricSupport();
//     }, []);

//     // Save credentials to Keychain (call this after manual login)
//     const saveCredentials = async (username, password) => {
//         try {
//             await Keychain.setGenericPassword(username, password, {
//                 accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
//                 accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
//             });
//             //   Alert.alert('Success', 'Credentials saved securely.');
//             setIsBiometricModalVisible(false)
//         } catch (error) {
//             console.error('Error saving credentials:', error);
//         }
//     };

//     // Authenticate with biometrics or passcode
//     const authenticate = async (usePasscode = false) => {
//         try {
//             let result;
//             if (usePasscode) {
//                 // Prompt for device passcode
//                 result = await rnBiometrics.simplePrompt({
//                     promptMessage: 'Enter Device Passcode',
//                     fallbackPromptMessage: 'Use Passcode',
//                 });
//             } else {
//                 // Prompt for biometrics
//                 result = await rnBiometrics.simplePrompt({
//                     promptMessage: `Authenticate with ${biometryType || 'Biometrics'}`,
//                     fallbackPromptMessage: 'Use Passcode',
//                 });
//             }

//             if (result.success) {
//                 setFailedAttempts(0); // Reset failed attempts
//                 const credentials = await Keychain.getGenericPassword({
//                     accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
//                 });

//                 if (credentials) {
//                     console.log('Success', `Logged in as ${credentials.username}`);
//                     setIsBiometricModalVisible(false)
//                 } else {
//                     console.log('Error', 'No credentials found. Please log in manually.');
//                 }
//             } else {
//                 if (!usePasscode) {
//                     const newAttempts = failedAttempts + 1;
//                     setFailedAttempts(newAttempts);
//                     if (newAttempts >= MAX_ATTEMPTS) {
//                         Alert.alert(
//                             'Biometric Failed',
//                             'Too many failed attempts. Please use device passcode.',
//                             [{ text: 'OK', onPress: () => authenticate(true) }]
//                         );
//                     } else {
//                         console.log('Authentication Failed', `Attempts remaining: ${MAX_ATTEMPTS - newAttempts}`);
//                     }
//                 } else {
//                     console.log('Authentication Failed', 'Incorrect passcode. Please try again or use manual login.');
//                 }
//             }
//         } catch (error) {
//             console.error('Authentication error:', error);
//         }
//     };
//     const handleManualLogin = async () => {
//         const username = 'testUser'; 
//         const password = 'testPassword'; 
//         await saveCredentials(username, password);
//     };

//     useEffect(() => {
//         handleManualLogin();
//     }, [])

//     return (
//         <Modal
//             transparent={true}
//             onRequestClose={() => setIsBiometricModalVisible(false)}
//             animationType="fade"
//             presentationStyle="overFullScreen"
//         >
//             <ImageBackground source={SPLASH_IMAGE} style={styles.backgroundImage} />
//         </Modal>
//     );
// };

// const styles = StyleSheet.create({
//     backgroundImage: {
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         width: "100%",
//         height: "100%",
//     },
//     modalContent: {
//         alignItems: "center",
//         backgroundColor: "rgba(0,0,0,0.6)",
//         padding: 30,
//         borderRadius: 10,
//     },
//     biometricIcon: {
//         width: wp(20),
//         height: hp(10),
//         marginBottom: spacings.large,
//         resizeMode: "contain",
//     },
//     biometricText: {
//         fontSize: style.fontSizeNormal.fontSize,
//         fontWeight: style.fontWeightMedium.fontWeight,
//         color: whiteColor,
//         marginTop: 20,
//     },
// });

// export default BiometricModal;
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, ImageBackground, Alert, Platform, BackHandler, Text, View } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../utils';
import { spacings, style } from '../../constans/Fonts';
import { whiteColor } from '../../constans/Color';
import { SPLASH_IMAGE, SPLASH_IMAGE_LANDSCAPE } from "../../assests/images";
import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import { useOrientation } from "../../OrientationContext";

const BiometricModal = ({ isBiometricModalVisible, setIsBiometricModalVisible }) => {
    const [biometryType, setBiometryType] = useState(null);
    const rnBiometrics = new ReactNativeBiometrics();
    const { orientation } = useOrientation();

    useEffect(() => {
        const initBiometrics = async () => {
            if (!isBiometricModalVisible) return;

            try {
                const { available, biometryType } = await rnBiometrics.isSensorAvailable();

                if (available) {
                    setBiometryType(biometryType);

                    // Ensure UI has rendered on iOS before prompting
                    setTimeout(() => {
                        authenticate();
                    }, Platform.OS === 'ios' ? 600 : 300);
                } else {
                    Alert.alert(
                        'Biometrics Not Available',
                        'Please use username/password to log in.',
                        [{ text: 'OK', onPress: () => setIsBiometricModalVisible(false) }]
                    );
                }
            } catch (error) {
                console.error('Biometrics error:', error);
            }
        };

        initBiometrics();
    }, [isBiometricModalVisible]);


    // Save credentials to Keychain (call this after manual login)
    const saveCredentials = async (username, password) => {
        try {
            await Keychain.setGenericPassword(username, password, {
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                authenticationPrompt: {
                    title: `Authenticate with ${biometryType || 'Biometrics'}`,
                    subtitle: 'Biometric Authentication Required',
                    description: 'Please authenticate to proceed',
                    cancel: 'Cancel',
                },
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, // more consistent on iOS
            });
            // setIsBiometricModalVisible(false)
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    };

    // Authenticate with biometrics or passcode
    const authenticate = async () => {
        try {
            const credentials = await Keychain.getGenericPassword({
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                authenticationPrompt: {
                    title: `Authenticate with ${biometryType || 'Biometrics'}`,
                    subtitle: 'Biometric Authentication Required',
                    description: 'Please authenticate to proceed',
                    cancel: 'Cancel',
                },
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });

            if (credentials) {
                console.log('Success', `Logged in as ${credentials.username}`);
                setIsBiometricModalVisible(false);
            } else {
                console.log('User canceled authentication');
            }
        } catch (error) {
            console.error('Biometric authentication error:', error);

            if (Platform.OS === 'ios') {
                Alert.alert(
                    'Biometric Failed',
                    'Too many failed attempts or not configured. Please try again or use password.',
                    [{ text: 'Try Again', onPress: authenticate }, {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            Alert.alert(
                                'Biometric Required',
                                'Biometric is required to use this app.',
                                [
                                    {
                                        text: 'Try Again',
                                        onPress: authenticate
                                    }
                                ],
                                { cancelable: false }
                            );
                        }
                    }]
                );
            } else {
                Alert.alert(
                    'Authentication Error',
                    'Authentication failed. Please try again.',
                    [{ text: 'OK', onPress: () => BackHandler.exitApp(), }]
                );
            }
        }
    };

    const handleManualLogin = async () => {
        const username = 'testUser';
        const password = 'testPassword';
        await saveCredentials(username, password);
    };

    useEffect(() => {
        if (Platform.OS === 'android') {
            handleManualLogin();
        }
    }, []);

    return (
        <Modal
            visible={isBiometricModalVisible}
            transparent={true}
            onRequestClose={() => setIsBiometricModalVisible(false)}
            animationType="fade"
            presentationStyle="overFullScreen"
        >
            {/* <ImageBackground source={SPLASH_IMAGE} style={styles.backgroundImage} /> */}
            <ImageBackground source={orientation === 'LANDSCAPE' ? SPLASH_IMAGE_LANDSCAPE : SPLASH_IMAGE} style={styles.backgroundImage}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.biometricText}>
                        {/* Please authenticate with {biometryType || 'Biometrics'} */}
                    </Text>
                </View>
            </ImageBackground>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
    },
    modalContent: {
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 30,
        borderRadius: 10,
    },
    biometricIcon: {
        width: wp(20),
        height: hp(10),
        marginBottom: spacings.large,
        resizeMode: "contain",
    },
    biometricText: {
        fontSize: style.fontSizeNormal.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: whiteColor,
        marginTop: 20,
    },
});

export default BiometricModal;