import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, CheckBox, Image, Alert, Dimensions, KeyboardAvoidingView, ScrollView, Keyboard, Platform, Modal, Linking, Pressable, useWindowDimensions } from 'react-native';
import CustomTextInput from '../componets/CustomTextInput';
import { blackColor, blueColor, ExtraExtralightOrangeColor, grayColor, lightBlueColor, lightOrangeColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
import { APP_NAME_IMAGE, REGISTRICT_IMAGE } from '../assests/images';
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

            setError("");
            fetchRegistrationStatus();
        }, [])
    );

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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <LinearGradient
                colors={['#400000', '#000000', '#000000']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.4, y: 1 }}
            >
                {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
                <ScrollView
                    contentContainerStyle={[styles.container, { height: hp(100) }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* <View style={[styles.container, flex]}> */}
                    {/* Logo Section */}
                    <View style={[styles.logoContainer, alignJustifyCenter, { height: isTablet ? hp(35) : hp(27) }]}>
                        <Image
                            source={APP_NAME_IMAGE}
                            style={[styles.logo, resizeModeContain, { height: isTablet ? hp(15) : hp(9) }]}
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
                        {/* <Text style={{ marginVertical: spacings.small }}>Join our Prorevv</Text> */}
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
                                const updatedText = text.charAt(0).toLowerCase() + text.slice(1);
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
                            disabled={isLoading}
                            style={{ backgroundColor: redColor }}
                        />

                        <View style={[alignJustifyCenter, { marginTop: isTablet ? orientation === "LANDSCAPE" ? hp(18) : hp(25) : hp(10) }]}>
                            <View style={[flexDirectionRow]}>
                                <Text style={styles.noAccountText}>{DONT_HAVE_ACCOUNT} </Text>
                                <TouchableOpacity onPress={handelSignUpCliked}>
                                    <Text style={styles.signUpText}>{SIGN_UP}</Text>
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
});

export default LoginScreen;
