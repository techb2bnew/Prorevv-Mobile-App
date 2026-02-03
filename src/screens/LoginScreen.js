import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, CheckBox, Image, Alert, Dimensions, KeyboardAvoidingView, ScrollView, Keyboard, Platform, Modal, Linking, Pressable, useWindowDimensions } from 'react-native';
import CustomTextInput from '../componets/CustomTextInput';
import { blackColor, blueColor, ExtraExtralightOrangeColor, grayColor, lightBlueColor, lightGrayColor, lightOrangeColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
import { APP_NAME_IMAGE, FACEID_IMAGE, REGISTRICT_IMAGE } from '../assests/images';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import { API_BASE_URL, DONT_HAVE_ACCOUNT, FORGOT_PASSWORD, LOGIN_TO_YOUR_ACCOUNT, REMEMBER_ME, SIGN_UP, SUPPORT_EMAIL, SUPPORT_MOBILE } from '../constans/Constants';
import CustomButton from '../componets/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { useFocusEffect } from '@react-navigation/native';
import SuccessModal from '../componets/Modal/SuccessModal';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Fontisto from 'react-native-vector-icons/dist/Fontisto';
import Feather from 'react-native-vector-icons/dist/Feather';
import { useOrientation } from '../OrientationContext';
import LinearGradient from 'react-native-linear-gradient';
import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics from 'react-native-biometrics';
// const { width, height } = Dimensions.get('window');

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween } = BaseStyle;

const LoginScreen = ({ navigation }) => {
    const { width, height } = useWindowDimensions();
    const { orientation } = useOrientation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [supportModalVisible, setSupportModalVisible] = useState(false);
    const [showBiometricButton, setShowBiometricButton] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [biometryType, setBiometryType] = useState(null);
    const originalEmailRef = useRef('');
    const originalPasswordRef = useRef('');

    const isTablet = width >= 668 && height >= 1024;


    useFocusEffect(
        React.useCallback(() => {
            const fetchRegistrationStatus = async () => {
                try {
                    const status = await AsyncStorage.getItem('isRegistered');
                    console.log("Registration Status:", status);
                    if (status === 'true') {
                        setIsRegistered(true);

                        // 10 seconds ke baad remove karna hai
                        setTimeout(async () => {
                            setIsRegistered(false);
                            await AsyncStorage.removeItem('isRegistered');
                            console.log("isRegistered removed from AsyncStorage");
                        }, 10000);
                    } else {
                        setIsRegistered(false);
                    }
                } catch (error) {
                    console.error("Error fetching registration status:", error);
                }
            };

            // Check if credentials are saved (using AsyncStorage flag to avoid triggering biometric prompt)
            const checkBiometricAvailability = async () => {
                try {
                    // ✅ AsyncStorage flag check karo instead of Keychain access
                    // This way biometric prompt nahi aayega
                    const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
                    const hasCredentials = await AsyncStorage.getItem('hasBiometricCredentials');

                    if (biometricEnabled === 'true' || hasCredentials === 'true') {
                        // Credentials saved hain, biometric button dikhao
                        setShowBiometricButton(true);

                        // Check biometric sensor availability (yeh prompt nahi trigger karega)
                        const rnBiometrics = new ReactNativeBiometrics();
                        const { available, biometryType } = await rnBiometrics.isSensorAvailable();
                        if (available) {
                            setBiometryType(biometryType);
                        }
                    } else {
                        // First time login - biometric button mat dikhao
                        setShowBiometricButton(false);
                    }
                } catch (error) {
                    console.error("Error checking biometric availability:", error);
                    setShowBiometricButton(false);
                }
            };

            // ✅ Prefill email/password if saved
            const loadSavedCredentials = async () => {
                try {
                    const savedEmail = await AsyncStorage.getItem('savedEmail');
                    const savedPassword = await AsyncStorage.getItem('savedPassword');

                    if (savedEmail) {
                        setEmail(savedEmail);
                        originalEmailRef.current = savedEmail; // Store original value
                    }
                    if (savedPassword) {
                        setPassword(savedPassword);
                        originalPasswordRef.current = savedPassword; // Store original value
                    }
                } catch (error) {
                    console.error("Error loading saved credentials:", error);
                }
            };

            setError("");
            fetchRegistrationStatus();
            checkBiometricAvailability();
            loadSavedCredentials(); // ✅ Load saved email/password for prefilling
        }, [])
    );

    // ✅ Check if email/password changed from original - hide biometric button if changed
    useEffect(() => {
        const checkIfCredentialsChanged = async () => {
            // Only check if biometric button was initially available
            const hasCredentials = await AsyncStorage.getItem('hasBiometricCredentials');
            const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');

            if (hasCredentials === 'true' || biometricEnabled === 'true') {
                const emailChanged = email.trim() !== originalEmailRef.current.trim();
                const passwordChanged = password.trim() !== originalPasswordRef.current.trim();

                if (emailChanged || passwordChanged) {
                    // User ne credentials change kiye hain - biometric button hide karo
                    setShowBiometricButton(false);
                } else {
                    // Original credentials match karte hain - biometric button show karo
                    const rnBiometrics = new ReactNativeBiometrics();
                    const { available } = await rnBiometrics.isSensorAvailable();
                    if (available) {
                        setShowBiometricButton(true);
                    }
                }
            }
        };

        // Check only if both email and password have values (to avoid premature hiding)
        if (email.trim() && password.trim()) {
            checkIfCredentialsChanged();
        }
    }, [email, password]);

    const handleLogin = async () => {
        let hasError = false;

        if (!email.trim()) {
            setEmailError("Please enter your email");
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email address");
            hasError = true;
        } else {
            setEmailError('');
        }

        if (!password.trim()) {
            setPasswordError("Please enter your password");
            hasError = true;
        } else {
            setPasswordError('');
        }

        if (!hasError) {
            try {
                setIsLoading(true);
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        email: email.trim(),
                        password: password.trim(),
                    }).toString(),
                });

                const result = await response.json();

                if (response.ok) {
                    if (result.user?.role === "super admin" || result.user?.type === "super admin") {
                        console.log("Super Admin cannot log in.");
                        setError("Super Admin is not allowed to log in.");
                        return;
                    }

                    console.log("Login successful:", result);
                    await AsyncStorage.setItem('auth_token', result.token);
                    await AsyncStorage.setItem('userDeatils', JSON.stringify(result.user));
                    console.log("result.user", result.user);

                    // ✅ Email/password AsyncStorage me save karo (prefilling ke liye)
                    const trimmedEmail = email.trim();
                    const trimmedPassword = password.trim();
                    await AsyncStorage.setItem('savedEmail', trimmedEmail);
                    await AsyncStorage.setItem('savedPassword', trimmedPassword);

                    // ✅ Update original refs with new values
                    originalEmailRef.current = trimmedEmail;
                    originalPasswordRef.current = trimmedPassword;

                    // ✅ First time login ke baad credentials Keychain me save karo (biometric protection ke sath)
                    try {
                        await Keychain.setGenericPassword(
                            email.trim(),
                            password.trim(),
                            {
                                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                            }
                        );
                        // ✅ Flag set karo taaki next time button dikh sake (without accessing Keychain)
                        await AsyncStorage.setItem('hasBiometricCredentials', 'true');
                        console.log("✅ Credentials saved to Keychain for biometric login");
                    } catch (keychainError) {
                        console.error("❌ Error saving credentials to Keychain:", keychainError);
                        // Continue even if keychain save fails
                    }

                    // Navigate to Home screen
                    // navigation.replace('MainNavigator');
                    // const userRole = result.user?.role;
                    // if (userRole === "manager") {
                    //     navigation.replace('ManagerNavigator');
                    // } else {
                    navigation.replace('MainNavigator');
                    // }
                    await AsyncStorage.setItem('biometricEnabled', 'true');
                    await AsyncStorage.removeItem('isRegistered');
                } else {
                    console.log("Login failed:", result);

                    let errorMessage = result.error;
                    let modalTitle = "Error"; // Default title
                    let showPopup = false; // Flag to determine if modal should be shown

                    // ✅ **Custom Messages Based on Backend Errors**
                    if (errorMessage.includes("is still under review")) {
                        modalTitle = "Account Under Review";
                        errorMessage = "Your account is still under review. You will be notified via email once it is approved. Please try logging in later.";
                        showPopup = true;
                    } else if (errorMessage.includes("account is blocked")) {
                        modalTitle = "Account Blocked";
                        errorMessage = "Your account has been blocked. Please contact the administrator for further assistance.";
                        showPopup = true;
                    } else if (errorMessage.includes("account is Deleted")) {
                        modalTitle = "Account Deleted";
                        errorMessage = "Your account has been deleted. Please contact support for further assistance.";
                        showPopup = true;
                    } else {
                        // Store all other errors in UI state but don't show modal
                        setError(errorMessage);
                    }

                    // Show modal only for specific errors
                    if (showPopup) {
                        setModalTitle(modalTitle);
                        setModalMessage(errorMessage);
                        setModalVisible(true);
                    }
                }
            } catch (error) {
                console.error("Error logging in:", error);
                setError(result.error)
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handelSignUpCliked = () => {
        setEmail('');
        setPassword('')
        navigation.navigate("Register");
    };


    const handleForgotPassword = () => {
        setEmail('');
        setPassword('')
        navigation.navigate("ForgotPassword");
    };

    const handleBiometricLogin = async () => {
        try {
            setBiometricLoading(true);
            setError('');

            // Check if biometric sensor is available
            const rnBiometrics = new ReactNativeBiometrics();
            const { available } = await rnBiometrics.isSensorAvailable();

            if (!available) {
                Toast.show("Biometric authentication is not available on this device.");
                setBiometricLoading(false);
                return;
            }

            // Fetch credentials from Keychain (biometric prompt automatically show hoga)
            const credentials = await Keychain.getGenericPassword({
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                authenticationPrompt: {
                    title: 'Authenticate to continue',
                    subtitle: Platform.OS === 'android'
                        ? 'Use your fingerprint or device PIN/Pattern/Password'
                        : 'Please authenticate to continue',
                    description: Platform.OS === 'android'
                        ? 'Authenticate using biometrics or device security'
                        : 'Scan your face or finger',
                    cancel: 'Cancel',
                },
            });

            if (!credentials || !credentials.username || !credentials.password) {
                Toast.show("Failed to retrieve saved credentials.");
                setBiometricLoading(false);
                return;
            }

            // ✅ Biometric success hone par saved credentials se API call karo
            const savedEmail = credentials.username;
            const savedPassword = credentials.password;

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    email: savedEmail,
                    password: savedPassword,
                }).toString(),
            });

            const result = await response.json();

            if (response.ok) {
                if (result.user?.role === "super admin" || result.user?.type === "super admin") {
                    console.log("Super Admin cannot log in.");
                    setError("Super Admin is not allowed to log in.");
                    setBiometricLoading(false);
                    return;
                }

                console.log("Biometric login successful:", result);
                await AsyncStorage.setItem('auth_token', result.token);
                await AsyncStorage.setItem('userDeatils', JSON.stringify(result.user));

                navigation.replace('MainNavigator');
                await AsyncStorage.setItem('biometricEnabled', 'true');
                Toast.show("Login successful!");
            } else {
                console.log("Biometric login failed:", result);
                let errorMessage = result.error || "Login failed. Please try again.";

                // Handle specific errors
                if (errorMessage.includes("is still under review")) {
                    setModalTitle("Account Under Review");
                    errorMessage = "Your account is still under review. You will be notified via email once it is approved. Please try logging in later.";
                    setModalMessage(errorMessage);
                    setModalVisible(true);
                } else if (errorMessage.includes("account is blocked")) {
                    setModalTitle("Account Blocked");
                    errorMessage = "Your account has been blocked. Please contact the administrator for further assistance.";
                    setModalMessage(errorMessage);
                    setModalVisible(true);
                } else if (errorMessage.includes("account is Deleted")) {
                    setModalTitle("Account Deleted");
                    errorMessage = "Your account has been deleted. Please contact support for further assistance.";
                    setModalMessage(errorMessage);
                    setModalVisible(true);
                } else {
                    setError(errorMessage);
                }
            }
        } catch (error) {
            console.error("Biometric login error:", error);

            // Handle user cancellation
            if (error.message && (
                error.message.includes('canceled') ||
                error.message.includes('cancel') ||
                error.message.includes('User substitution')
            )) {
                // User cancelled biometric - no error message needed
                console.log("User cancelled biometric authentication");
            } else {
                setError("Biometric authentication failed. Please try again or use email/password.");
                Toast.show("Biometric authentication failed. Please try again.");
            }
        } finally {
            setBiometricLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <LinearGradient
                colors={['#400000', '#000000', '#000000']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.4, y: 1 }}
                style={{ flex: 1 }}
            >
                {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    bounces={false}
                >

                    {/* <View style={[styles.container, flex]}> */}
                    {/* Logo Section */}
                    <View style={[styles.logoContainer, alignJustifyCenter, { height: isTablet ? hp(35) : hp(27) }]}>
                        <Image
                            source={APP_NAME_IMAGE}
                            style={[styles.logo, resizeModeContain, { height: isTablet ? hp(12) : hp(9) }]}
                        />

                        {/* {isRegistered ?
                    <View style={[styles.messageBox, { padding: isTablet ? 8 : 5, }]}>
                        <Text style={[styles.messageText, { fontWeight: style.fontWeightThin.fontWeight }]}>
                            Thank you for signing up!
                        </Text>
                        <Text style={styles.messageText}>
                            Your account request has been submitted successfully and is currently under review by our team.
                        </Text>
                        <Text style={styles.messageText}>
                            You will receive an email notification once your account is approved.
                        </Text>
                    </View>
                    : */}
                        {/* <> */}
                        <Text style={styles.title}>Welcome Back!</Text>
                        {/* <Text style={{ marginVertical: spacings.small }}>Join our ProRevv</Text> */}
                        {/* </> */}
                        {/* } */}
                    </View>

                    <View style={styles.box}>
                        {/* Input Fields */}
                        <Text style={[styles.title, { fontSize: style.fontSizeLargeXX.fontSize }]}>Login</Text>

                        <CustomTextInput
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={text => {
                                // const updatedText = text.charAt(0).toLowerCase() + text.slice(1);
                                const updatedText = text.toLowerCase();

                                setEmail(updatedText);
                                if (emailError) {
                                    setEmailError('');
                                }
                            }}
                            label="Email"
                            labelStyle={{
                                fontSize: 14,
                                fontWeight: '500',
                                color: whiteColor,
                                marginBottom: 5,
                            }}
                        />
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        <CustomTextInput
                            placeholder="Enter your Password"
                            value={password}
                            secureTextEntry={!isPasswordVisible}
                            onChangeText={text => {
                                setPassword(text);
                                if (passwordError) {
                                    setPasswordError('');
                                }
                            }}
                            label="Password"
                            labelStyle={{
                                fontSize: 14,
                                fontWeight: '500',
                                color: whiteColor,
                                marginBottom: 5,
                            }}
                            rightIcon={
                                <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
                                    <MaterialCommunityIcons name={isPasswordVisible ? "eye" : "eye-off"} size={20} color={grayColor} />
                                </TouchableOpacity>
                            }
                        />
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        {/* Remember Me and Forgot Password */}
                        <View style={[styles.optionsRow, flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter]}>
                            <View style={[flexDirectionRow, alignItemsCenter]}>
                            </View>
                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={styles.forgotPassword}>{FORGOT_PASSWORD}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <CustomButton
                            title="Login"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={isLoading || biometricLoading}
                            style={{ backgroundColor: redColor }}
                        />

                        {/* Biometric Login Button - Only show if credentials are saved */}
                        {showBiometricButton && (
                            <>
                                <View style={[styles.dividerContainer, flexDirectionRow, alignItemsCenter, { marginVertical: spacings.large }]}>
                                    <View style={styles.divider} />
                                    <Text style={[styles.orText, { color: whiteColor }]}>Or</Text>
                                    <View style={styles.divider} />
                                </View>

                                <TouchableOpacity
                                    onPress={handleBiometricLogin}
                                    disabled={isLoading || biometricLoading}
                                    style={[
                                        styles.biometricButton,
                                        {
                                            opacity: (isLoading || biometricLoading) ? 0.5 : 1,
                                            backgroundColor: lightGrayColor,
                                        }
                                    ]}
                                >
                                    {biometricLoading ? (
                                        <Text style={[styles.biometricButtonText, { color: blackColor }]}>Authenticating...</Text>
                                    ) : (
                                        <>
                                            {Platform.OS === "ios" ?
                                                // <Ionicons
                                                //     name="scan-sharp"
                                                //     size={24}
                                                //     color={blackColor}
                                                //     style={{ marginRight: 10 }}
                                                // /> 
                                                <Image
                                                    source={FACEID_IMAGE}
                                                    style={{ width: 24, height: 24, marginRight: 10 }}
                                                />
                                                :
                                                <Ionicons
                                                    name={'finger-print'}
                                                    size={24}
                                                    color={blackColor}
                                                    style={{ marginRight: 10 }}
                                                />}
                                            <Text style={[styles.biometricButtonText, { color: blackColor }]}>
                                                {biometryType === 'FaceID'
                                                    ? 'Login with Face ID'
                                                    : biometryType === 'TouchID'
                                                        ? 'Login with Touch ID'
                                                        : 'Login with Biometric'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={[alignJustifyCenter, { marginTop: isTablet ? orientation === "LANDSCAPE" ? hp(18) : hp(25) : hp(10) }]}>
                            <View style={[flexDirectionRow]}>
                                <Text style={styles.noAccountText}>{DONT_HAVE_ACCOUNT} </Text>
                                <TouchableOpacity onPress={handelSignUpCliked}>
                                    <Text style={styles.signUpText}>Register</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.noAccountText, { marginVertical: 10 }]}>Or</Text>
                            <View style={[flexDirectionRow]}>
                                <Text style={styles.noAccountText}>Facing any Issue ? </Text>
                                <TouchableOpacity onPress={() => setSupportModalVisible(true)}>
                                    <Text style={styles.signUpText}>Contact Support </Text>
                                </TouchableOpacity>
                            </View>

                        </View>

                    </View>
                    {supportModalVisible && <Modal
                        visible={supportModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setSupportModalVisible(false)}
                        presentationStyle="overFullScreen"
                        supportedOrientations={["portrait", "landscape-left", "landscape-right"]}
                    >
                        <Pressable style={styles.modalOverlay} onPress={() => setSupportModalVisible(false)}>
                            <View style={styles.modalBox}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Contact Support</Text>
                                    <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                                        <Ionicons name="close-circle" size={28} color={redColor} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalContent}>
                                    <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.contactItem}>
                                        <Fontisto name="email" size={25} color={redColor} />
                                        <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${SUPPORT_MOBILE}`)} style={styles.contactItem}>
                                        <Feather name="phone" size={24} color={redColor} />
                                        <Text style={styles.contactText}>{SUPPORT_MOBILE}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Pressable>
                    </Modal>}
                    {modalVisible && <SuccessModal
                        visible={modalVisible}
                        onClose={() => setModalVisible(false)}
                        image={REGISTRICT_IMAGE}
                        headingText={modalTitle}
                        text={modalMessage}
                        buttonText={'Okay'}
                        onPressContinue={() => { setModalVisible(false), setError(""), setEmailError(""), setPasswordError("") }}
                    />}

                    {/* </View > */}
                </ScrollView>
            </LinearGradient>
            {/* </TouchableWithoutFeedback> */}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: spacings.Large1x,
        flexGrow: 1,
        paddingBottom: Platform.OS === 'android' ? hp(10) : 0,
        // backgroundColor: whiteColor
    },
    logoContainer: {
        height: hp(25),
    },
    logo: {
        width: wp(40),
        height: hp(9),
        marginBottom: spacings.large,
    },
    title: {
        fontSize: style.fontSizeLarge3x.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: whiteColor,
    },
    box: {
        // backgroundColor: whiteColor,
        height: "100%",
        width: "100%",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: spacings.Large1x
    },
    optionsRow: {
        marginBottom: spacings.Large1x,
        marginTop: spacings.xxLarge,
    },
    rememberText: {
        marginLeft: spacings.small2x,
        fontSize: style.fontSizeNormal.fontSize,
        color: blackColor,
    },
    forgotPassword: {
        fontSize: style.fontSizeNormal.fontSize,
        color: whiteColor,
        textDecorationLine: "underline"
    },
    noAccountText: {
        fontSize: style.fontSizeNormal.fontSize,
        color: whiteColor,
    },
    signUpText: {
        fontSize: style.fontSizeNormal.fontSize,
        color: redColor,
        fontWeight: style.fontWeightThin1x.fontWeight,
    },
    checkBoxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkBox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        // marginTop: 5,
    },
    messageBox: {
        marginHorizontal: 20,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#e6f7ff',
        borderWidth: 1,
        borderColor: '#a1caff',
    },
    messageText: {
        color: blackColor,
        fontSize: 14,
        textAlign: 'center',
    },
    dividerContainer: {
        marginVertical: spacings.xLarge,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    orText: {
        marginHorizontal: spacings.large,
        color: blackColor,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalBox: {
        width: "90%",
        padding: 20,
        backgroundColor: "white",
        borderRadius: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    modalContent: {
        width: "100%",
        // alignItems: "center",
        marginVertical: 10,
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    contactText: {
        marginLeft: 10,
        fontSize: 16,
        color: blackColor,
        textDecorationLine: "underline",
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacings.large,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: spacings.medium,
        borderWidth: 1,
        borderColor: lightGrayColor,
    },
    biometricButtonText: {
        fontSize: style.fontSizeNormal.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: blackColor,
    },
});

export default LoginScreen;
