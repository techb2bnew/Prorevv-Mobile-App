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
// import React, { useEffect, useState, useRef } from "react";
// import {
//     Modal,
//     StyleSheet,
//     ImageBackground,
//     Alert,
//     Platform,
//     Text,
//     View,
//     TouchableOpacity,
//     InteractionManager
// } from "react-native";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../utils';
// import { spacings, style } from '../../constans/Fonts';
// import { whiteColor } from '../../constans/Color';
// import { SPLASH_IMAGE, SPLASH_IMAGE_LANDSCAPE } from "../../assests/images";
// import ReactNativeBiometrics from 'react-native-biometrics';
// import * as Keychain from 'react-native-keychain';
// import { useOrientation } from "../../OrientationContext";

 
// const BiometricModal = ({ isBiometricModalVisible, setIsBiometricModalVisible }) => {
//     const [biometryType, setBiometryType] = useState(null);
//     const isAuthenticating = useRef(false);
//     const rnBiometrics = new ReactNativeBiometrics();
//     const { orientation } = useOrientation();
 
//     useEffect(() => {
//         if (isBiometricModalVisible) {
//             // Android ke liye credentials ensure karo taaki device password prompt aaye
//             if (Platform.OS === 'android') {
//                 ensureCredentialsSaved();
//             }
//             initBiometrics();
//         }
//     }, [isBiometricModalVisible]);

//     // Android ke liye credentials ensure karo taaki device password prompt aaye
//     const ensureCredentialsSaved = async () => {
//         try {
//             const existingCredentials = await Keychain.getGenericPassword();
//             if (!existingCredentials) {
//                 // Agar credentials nahi hain to dummy save karo (just for device password prompt)
//                 await Keychain.setGenericPassword('biometric_user', 'biometric_auth', {
//                     accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
//                     accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
//                 });
//             }
//         } catch (error) {
//             console.log('Error ensuring credentials:', error);
//         }
//     };
 
//     const initBiometrics = async () => {
//         try {
//             const { available, biometryType: type } = await rnBiometrics.isSensorAvailable();
//             if (available) {
//                 setBiometryType(type);
                
//                 // Modal load hon de thodi der baad prompt dikhao taaki UI glitch na kare
//                 // Android pe InteractionManager use karo for better reliability
//                 const delay = 800;
                
//                 if (Platform.OS === 'android') {
//                     // Android pe InteractionManager se ensure karte hain ki UI ready ho
//                     InteractionManager.runAfterInteractions(() => {
//                         setTimeout(() => {
//                             authenticate();
//                         }, delay);
//                     });
//                 } else {
//                     // iOS pe direct setTimeout sufficient hai
//                     setTimeout(() => {
//                         authenticate();
//                     }, delay);
//                 }
//             } else {
//                 handleNoBiometrics();
//             }
//         } catch (error) {
//             console.error('Init Error:', error);
//             handleNoBiometrics();
//         }
//     };
 
//     const authenticate = async () => {
//         if (isAuthenticating.current) return;
//         isAuthenticating.current = true;

//         try {
//             // Dono platforms ke liye Keychain use karo - ye automatically device password prompt dikhayega
//             const credentials = await Keychain.getGenericPassword({
//                 accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
//                 accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
//                 authenticationPrompt: {
//                     title: 'Authenticate to continue',
//                     subtitle: Platform.OS === 'android' ? 'Use your fingerprint or device PIN/Pattern/Password' : 'Please authenticate to continue',
//                     description: Platform.OS === 'android' ? 'Authenticate using biometrics or device security' : 'Scan your face or finger',
//                     cancel: 'Cancel',
//                 },
//             });

//             if (credentials) {
//                 console.log('Authentication successful');
//                 setIsBiometricModalVisible(false);
//             } else {
//                 console.log('User cancelled authentication');
//                 setIsBiometricModalVisible(false);
//             }
//         } catch (error) {
//             console.log('Auth Error:', error);
//             // Handle errors
//             if (error.message && (error.message.includes('User substitution') || error.message.includes('canceled') || error.message.includes('cancel'))) {
//                 // User cancelled - close modal
//                 setIsBiometricModalVisible(false);
//             } else if (error.message && error.message.includes('LockedOut')) {
//                 Alert.alert("Locked Out", "Too many attempts. Please try again later.");
//             } else {
//                 // Other errors - show alert with retry option
//                 Alert.alert(
//                     "Authentication Error",
//                     "Failed to authenticate. Please try again.",
//                     [
//                         {
//                             text: "Retry",
//                             onPress: () => {
//                                 isAuthenticating.current = false;
//                                 authenticate();
//                             }
//                         }
//                     ]
//                 );
//             }
//         } finally {
//             isAuthenticating.current = false;
//         }
//     };
 
//     const handleNoBiometrics = () => {
//         Alert.alert(
//             'Not Enabled',
//             'Biometrics not set up on this device. Please check settings.',
//             [{ text: 'OK', onPress: () => setIsBiometricModalVisible(false) }]
//         );
//     };
 
//     return (
//         <Modal
//             visible={isBiometricModalVisible}
//             transparent={true}
//             onRequestClose={() => setIsBiometricModalVisible(false)}
//             animationType="fade"
//         >
//             <ImageBackground 
//                 source={orientation === 'LANDSCAPE' ? SPLASH_IMAGE_LANDSCAPE : SPLASH_IMAGE} 
//                 style={styles.backgroundImage}
//             >
//                 <View style={styles.overlay}>
//                     {/* <TouchableOpacity 
//                         activeOpacity={0.8} 
//                         onPress={authenticate}
//                         style={styles.contentContainer}
//                     >
//                         <Text style={styles.biometricText}>
//                             {`Authenticating with ${biometryType || 'Biometric'}...`}
//                         </Text>
//                         <View style={styles.button}>
//                             <Text style={styles.buttonText}>Tap to Retry</Text>
//                         </View>
//                     </TouchableOpacity> */}
                    
//                 </View>
//             </ImageBackground>
//         </Modal>
//     );
// };
 
// const styles = StyleSheet.create({
//     backgroundImage: { flex: 1, width: "100%", height: "100%" },
//     overlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     contentContainer: {
//         padding: 30,
//         backgroundColor: 'rgba(255,255,255,0.1)',
//         borderRadius: 15,
//         alignItems: 'center',
//     },
//     biometricText: {
//         fontSize: 18,
//         color: 'white',
//         textAlign: 'center',
//         marginBottom: 20,
//     },
//     button: {
//         paddingVertical: 10,
//         paddingHorizontal: 20,
//         backgroundColor: '#fff',
//         borderRadius: 8,
//     },
//     buttonText: { color: '#000', fontWeight: 'bold' }
// });
 
// export default BiometricModal;
 

// import React, { useEffect, useState, useRef } from "react";
// import {
//     Modal,
//     StyleSheet,
//     ImageBackground,
//     Alert,
//     Platform,
//     BackHandler,
//     Text,
//     View,
//     TouchableOpacity,
//     InteractionManager
// } from "react-native";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../utils';
// import { spacings, style } from '../../constans/Fonts';
// import { whiteColor } from '../../constans/Color';
// import { SPLASH_IMAGE, SPLASH_IMAGE_LANDSCAPE } from "../../assests/images";
// import ReactNativeBiometrics from 'react-native-biometrics';
// import * as Keychain from 'react-native-keychain';
// import { useOrientation } from "../../OrientationContext";
 
// const BiometricModal = ({ isBiometricModalVisible, setIsBiometricModalVisible }) => {
//     const [biometryType, setBiometryType] = useState(null);
//     const isAuthenticating = useRef(false);
//     const rnBiometrics = new ReactNativeBiometrics();
//     const { orientation } = useOrientation();
 
//     useEffect(() => {
//         if (isBiometricModalVisible) {
//             initBiometrics();
//         }
//     }, [isBiometricModalVisible]);
 
//     const initBiometrics = async () => {
//         try {
//             const { available, biometryType: type } = await rnBiometrics.isSensorAvailable();
//             if (available) {
//                 setBiometryType(type);
                
//                 // iOS te 1 second da wait zaroori hai taaki Modal stable ho jave
//                 const delay = Platform.OS === 'ios' ? 1000 : 500;
                
//                 InteractionManager.runAfterInteractions(() => {
//                     setTimeout(() => {
//                         authenticate();
//                     }, delay);
//                 });
//             } else {
//                 handleNoBiometrics();
//             }
//         } catch (error) {
//             console.error('Init Error:', error);
//         }
//     };
 
//     const authenticate = async () => {
//         if (isAuthenticating.current) return;
//         isAuthenticating.current = true;
 
//         try {
//             const credentials = await Keychain.getGenericPassword({
//                 // iOS 17/18 de focus issues fix karan layi BIOMETRY_ANY best hai
//                 accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
//                 authenticationPrompt: {
//                     title: `Authenticate with ${biometryType || 'Biometrics'}`,
//                     subtitle: 'Secure Access Required',
//                     description: 'Please authenticate to proceed',
//                     cancel: 'Cancel',
//                 },
//                 accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
//             });
 
//             if (credentials) {
//                 setIsBiometricModalVisible(false);
//             } else {
//                 console.log('User cancelled the prompt');
//             }
//         } catch (error) {
//             console.log('Auth Error Details:', error);
            
//             // Lockout handle karan layi
//             if (error.message.includes('LockedOut')) {
//                 Alert.alert("Locked Out", "Too many failed attempts. Please use your device passcode.");
//             }
//         } finally {
//             isAuthenticating.current = false;
//         }
//     };
 
//     const handleNoBiometrics = () => {
//         Alert.alert(
//             'Biometrics Not Set',
//             'Please enable FaceID/Fingerprint in your phone settings or use password.',
//             [{ text: 'OK', onPress: () => setIsBiometricModalVisible(false) }]
//         );
//     };
 
//     return (
//         <Modal
//             visible={isBiometricModalVisible}
//             transparent={true}
//             onRequestClose={() => setIsBiometricModalVisible(false)}
//             animationType="fade"
//             presentationStyle="overFullScreen"
//         >
//             <ImageBackground 
//                 source={orientation === 'LANDSCAPE' ? SPLASH_IMAGE_LANDSCAPE : SPLASH_IMAGE} 
//                 style={styles.backgroundImage}
//             >
//                 <View style={styles.overlay}>
//                     <TouchableOpacity 
//                         activeOpacity={0.7} 
//                         onPress={authenticate}
//                         style={styles.contentContainer}
//                     >
//                         {/* Prompt na khullan te user aithe click kar sakda hai */}
//                         <Text style={styles.biometricText}>
//                             {`Authenticating with ${biometryType || 'Biometric'}...`}
//                         </Text>
//                         <Text style={styles.subText}>Tap here if prompt doesn't appear</Text>
//                     </TouchableOpacity>
//                 </View>
//             </ImageBackground>
//         </Modal>
//     );
// };
 
// const styles = StyleSheet.create({
//     backgroundImage: {
//         flex: 1,
//         width: "100%",
//         height: "100%",
//     },
//     overlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.3)', // Thoda dark overlay taaki text dikhe
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     contentContainer: {
//         padding: 20,
//         alignItems: 'center',
//     },
//     biometricText: {
//         fontSize: style.fontSizeNormal.fontSize,
//         fontWeight: style.fontWeightMedium.fontWeight,
//         color: whiteColor,
//         textAlign: 'center',
//     },
//     subText: {
//         fontSize: 12,
//         color: 'rgba(255,255,255,0.6)',
//         marginTop: 10,
//     }
// });
 
// export default BiometricModal;
 