import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OTPTextInput from 'react-native-otp-textinput';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import CustomButton from '../componets/CustomButton';
import CustomTextInput from '../componets/CustomTextInput';
import { BaseStyle } from '../constans/Style';
import { spacings, style } from '../constans/Fonts';
import { blackColor, blueColor, grayColor, lightBlueColor, lightOrangeColor, mediumGray, redColor, whiteColor } from '../constans/Color';
import { API_BASE_URL, EMAIL, EMAIL_NOT_RECEIVED, ENTER_FOUR_DIGIT_CODE, ENTER_FOUR_DIGIT_CODE_THAT_YOU_RECEIVED, ENTER_YOU_EMAIL, FORGOT_PASSWORD, GET_HELP, PASSWORD, RESEND_CODE, RESET_PASSWORD, SET_THE_NEW_PASSWORD, UNABLE_TO_RESET_PASSWORD } from '../constans/Constants';
import SuccessModal from '../componets/Modal/SuccessModal';
import Header from '../componets/Header';
import { FORGOT_PASSWORD_IMAGE, OTP_VERIFICATION_IMAGE } from '../assests/images';
import { useOrientation } from '../OrientationContext';
import LinearGradient from 'react-native-linear-gradient';
const { flex, alignItemsCenter, flexDirectionRow, alignJustifyCenter, positionAbsolute, borderRadius5, borderWidth1, textAlign } = BaseStyle;
const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState('email');
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [countdown, setCountdown] = useState(0); // Countdown state
    const [isResendEnabled, setIsResendEnabled] = useState(true);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const { width, height } = useWindowDimensions();
    const { orientation } = useOrientation();
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;

    // Timer effect
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prevCountdown => prevCountdown - 1);
            }, 1000);
        } else {
            clearInterval(timer);
            setIsResendEnabled(true); // Enable resend button after timer ends
        }

        return () => clearInterval(timer); // Cleanup interval
    }, [countdown]);

    // Clear OTP and errors when step changes to email
    useEffect(() => {
        if (currentStep === 'email') {
            setOtpError('');
            setOtp('');
        }
    }, [currentStep]);


    const handleOTPChange = (otp) => {
        setOtp(otp);
        // setIsOtpComplete(otp.length === 6);
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const toggleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // Handle PressGetInfo
    const handlePressGetInfo = () => {
        console.log("pressgetinfo");
    }

    // Handle PressResend 
    const handlePressResend = async () => {
        if (countdown === 0) {
            setIsResendEnabled(false);
            await handleResendOTP();
        }
    };

    // Handle ResendOTP 
    const handleResendOTP = async () => {
        setOtpError('');
        setOtp(''); // Clear previous OTP input when resending

        if (!email) {
            setOtpError('Email is required to resend OTP');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/resendOtp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}`, // Correct URL encoding for email
            });

            const data = await response.json();

            if (response.ok) {
                setOtpError(''); // Clear any previous errors
                setOtp(''); // Clear OTP input
                setCountdown(30); // Start countdown after OTP is resent
                setIsResendEnabled(false); // Disable resend button during countdown
            } else {
                setOtpError(data.message || 'Failed to resend OTP. Please try again.');
            }
        } catch (error) {
            setOtpError('Something went wrong. Please try again.');
        }
    };

    // Handle Email Submit
    const handleEmailSubmit = async () => {
        setEmailError('');
        setOtpError(''); // Clear any previous OTP errors
        setOtp(''); // Clear previous OTP input
        setLoadingEmail(true);

        if (!email) {
            setEmailError('Email is required');
            setLoadingEmail(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            setLoadingEmail(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/technicianforgotPassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}`,
            });

            const data = await response.json();

            if (response.ok) {
                setOtpError(''); // Clear OTP error before moving to OTP step
                setOtp(''); // Clear OTP input
                setCurrentStep("otp");
            } else {
                setEmailError(data.error || 'Failed to send OTP');
            }
        } catch (error) {
            setEmailError('Something went wrong. Please try again.');
        } finally {
            setLoadingEmail(false);
        }
    };

    // Handle OTP Submit
    const handleOTPSubmit = async () => {
        setOtpError('');
        setLoadingOtp(true);

        if (!otp) {
            setOtpError('OTP is required');
            setLoadingOtp(false);
            return;
        }

        if (otp.length !== 4 || !/^\d{4}$/.test(otp)) {
            setOtpError('Please enter a valid 4-digit OTP');
            setLoadingOtp(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/verifyOtp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentStep('password');
            } else {
                setOtpError(data.message || 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            setOtpError('Something went wrong. Please try again.');
        } finally {
            setLoadingOtp(false);
        }
    };

    // Handle Password Submit
    const handlePasswordSubmit = async () => {
        setPasswordError('');
        setConfirmPasswordError('');
        setLoadingPassword(true);

        if (!password && !confirmPassword) {
            setPasswordError('Password is required');
            setConfirmPasswordError('Confirm Password is required');
            setLoadingPassword(false);
            return;
        }

        if (!password) {
            setPasswordError('Password is required');
            setLoadingPassword(false);
            return;
        }

        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            setLoadingPassword(false);
            return;
        }

        if (!confirmPassword) {
            setConfirmPasswordError('Confirm Password is required');
            setLoadingPassword(false);
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            setLoadingPassword(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/technicianResetPassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessModalVisible(true);
            } else {
                setPasswordError(data.message || 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            setPasswordError('Something went wrong. Please try again.');
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
            <Header title={currentStep === 'email' ? "Forget Password" : currentStep === 'otp' ? "Verification" : "Reset Password"}
                onBack={
                    currentStep === 'otp'
                        ? () => {
                            setCurrentStep("email");
                            setOtpError(''); // Clear OTP error when going back
                            setOtp(''); // Clear OTP input when going back
                        }
                        : currentStep === 'password'
                            ? () => {
                                setCurrentStep("otp");
                                setPasswordError(''); // Clear password errors when going back
                                setConfirmPasswordError('');
                            }
                            : () => navigation.goBack()
                } />
            <LinearGradient
                colors={['#400000', '#000000', '#000000']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.4, y: 0.5 }}
                style={{ width: '100%', height: '100%' }}
            >
                <ScrollView
                    contentContainerStyle={{ height: hp(50) }}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >

                    <View style={[styles.container,]}>
                        {currentStep === 'email' && (
                            <View style={styles.box}>
                                <Image source={FORGOT_PASSWORD_IMAGE} style={{ width: "90%", height: isTablet ? hp(45) : hp(30), resizeMode: 'contain', zIndex: 999, alignSelf: "center" }} />
                                <CustomTextInput
                                    label={"Email"}
                                    placeholder={"Enter your email"}
                                    value={email}
                                    onChangeText={(text) => {
                                        const updatedText = text.charAt(0).toLowerCase() + text.slice(1);
                                        setEmail(updatedText);
                                        if (emailError) {
                                            setEmailError('');
                                        }
                                    }}
                                    keyboardType="email-address"
                                    required={true}
                                    leftIcon={
                                        <View>
                                            <MaterialCommunityIcons name={"email"} size={22} color={mediumGray} />
                                        </View>
                                    }
                                    labelStyle={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: whiteColor,
                                        marginBottom: 5,
                                    }}
                                />
                                {emailError && <Text style={styles.error}>{emailError}</Text>}
                                <View style={styles.smallCircle} />
                                <View style={{ marginVertical: hp(5) }}>
                                    <CustomButton title="Confirm"
                                        onPress={handleEmailSubmit}
                                        loading={loadingEmail} disabled={loadingEmail} style={{ backgroundColor: redColor }} />
                                </View>
                            </View>
                        )}

                        {currentStep === 'otp' && (
                            <View style={styles.box}>
                                <Image source={OTP_VERIFICATION_IMAGE} style={{ width: "100%", height: isTablet ? hp(50) : hp(30), resizeMode: 'contain', zIndex: 999, alignSelf: "center" }} />
                                {/* Display email address */}
                                <View style={[styles.emailDisplayContainer, alignJustifyCenter]}>
                                    <Text style={styles.emailDisplayText}>
                                        OTP sent to: <Text style={styles.emailDisplayEmail}>{email}</Text>
                                    </Text>
                                </View>
                                <View style={[{ width: '100%', height: hp(10), marginTop: orientation === "LANDSCAPE" ? hp(5) : 0 }, alignJustifyCenter]}>
                                    <OTPTextInput
                                        handleTextChange={handleOTPChange}
                                        inputCount={4}
                                        tintColor={whiteColor}
                                        offTintColor={mediumGray}
                                        textInputStyle={[styles.otpInput, { color: whiteColor, width: isTablet ? wp(10) : orientation === "LANDSCAPE" ? hp(8) : wp(13), height: isTablet ? wp(10) : orientation === "LANDSCAPE" ? hp(8) : wp(13) }]}
                                    />
                                    {otpError && <Text style={styles.error}>{otpError}</Text>}
                                </View>

                                {countdown > 0 ? (
                                    <Text style={[styles.footerText, textAlign]}> Resend OTP in {countdown}s</Text>
                                ) : (<Text style={[styles.footerText, textAlign]}>
                                    {EMAIL_NOT_RECEIVED}
                                    <Text style={styles.loginText} onPress={handlePressResend} disabled={!isResendEnabled}>
                                        {RESEND_CODE}
                                    </Text>
                                </Text>)}
                                <View style={styles.smallCircle} />

                                <View style={{ marginVertical: hp(5) }}>
                                    <CustomButton title="Confirm"
                                        onPress={handleOTPSubmit}
                                        loading={loadingOtp} disabled={loadingOtp} style={{ backgroundColor: redColor }} />
                                </View>
                            </View>
                        )}

                        {currentStep === 'password' && (
                            <View style={styles.box}>
                                <Text style={[styles.text, textAlign]}>Please Set New Password</Text>
                                <View style={{ zIndex: 999 }}>
                                    <CustomTextInput
                                        label={PASSWORD}
                                        placeholder={PASSWORD}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        required={true}
                                        rightIcon={
                                            <MaterialCommunityIcons
                                                name={showPassword ? 'eye' : 'eye-off'}
                                                size={20}
                                                color={grayColor}
                                                onPress={toggleShowPassword}
                                            />
                                        }
                                        leftIcon={
                                            <View>
                                                <MaterialCommunityIcons name={"lock"} size={22} color={mediumGray} />
                                            </View>
                                        }
                                        labelStyle={{
                                            fontSize: 14,
                                            fontWeight: '500',
                                            color: whiteColor,
                                            marginBottom: 5,
                                        }}
                                    />
                                    {passwordError && <Text style={styles.error}>{passwordError}</Text>}
                                    <CustomTextInput
                                        label="Confirm Password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            if (passwordError) {
                                                setPasswordError('');
                                            }
                                        }}
                                        secureTextEntry={!showConfirmPassword}
                                        required={true}
                                        rightIcon={
                                            <MaterialCommunityIcons
                                                name={showConfirmPassword ? 'eye' : 'eye-off'}
                                                size={20}
                                                color={grayColor}
                                                onPress={toggleShowConfirmPassword}
                                            />
                                        }
                                        leftIcon={
                                            <View>
                                                <MaterialCommunityIcons name={"lock"} size={22} color={mediumGray} />
                                            </View>
                                        }
                                        labelStyle={{
                                            fontSize: 14,
                                            fontWeight: '500',
                                            color: whiteColor,
                                            marginBottom: 5,
                                        }}
                                    />
                                    {confirmPasswordError && <Text style={styles.error}>{confirmPasswordError}</Text>}
                                </View>
                                <View style={{ marginVertical: hp(5), zIndex: 999 }}>
                                    <CustomButton title="Continue"
                                        onPress={handlePasswordSubmit}
                                        loading={loadingPassword} disabled={loadingPassword} style={{ backgroundColor: redColor }} />
                                </View>
                                {!isIOSAndTablet && <View
                                    style={[styles.circle,
                                    {
                                        width: isTablet ? 1200 : 650, height: isTablet ? 1200 : 650,
                                        borderRadius: isTablet ? 2000 : 1000, bottom: isTablet ? -300 : -100, left: isTablet ? -10 : 0
                                    }]} />}
                            </View>
                        )}

                        {successModalVisible && <SuccessModal
                            visible={successModalVisible}
                            onClose={() => setSuccessModalVisible(false)}
                            headingText={"Password Changed"}
                            text={"Password reset successful! You can now log in with your new password."}
                            onPressContinue={() => { setSuccessModalVisible(false), navigation.goBack(); }}
                        />}
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
    container: {
        padding: spacings.large,
        // backgroundColor: whiteColor
    },
    box: {
        width: '100%', height: hp(100), padding: spacings.large,
    },
    backIcon: {
        width: wp(10),
        height: hp(5),
    },
    text: {
        fontSize: 25,
        fontWeight: '600',
        color: whiteColor,
    },
    destext: {
        color: grayColor,
        paddingVertical: spacings.small2x,
        fontSize: 14
    },
    otpInput: {
        borderWidth: 1,
        fontSize: 20,
        color: whiteColor,
        borderRadius: 5,
    },
    error: {
        color: "red",
        fontSize: 12,
        marginTop: 4
    },
    footerText: {
        marginTop: spacings.Large1x,
        color: whiteColor,
        fontSize: style.fontSizeNormal.fontSize
    },
    loginText: {
        fontSize: style.fontSizeNormal.fontSize,
        color: redColor,
        fontWeight: style.fontWeightThin1x.fontWeight,
    },
    circle: {
        backgroundColor: lightBlueColor,
        position: "absolute",
        bottom: -100, left: 0
    },
    smallCircle: {
        width: 150,
        height: 150,
        borderRadius: 1000,
        backgroundColor: lightBlueColor,
        position: "absolute",
        top: hp(7), right: -70
    },
    emailDisplayContainer: {
        marginTop: hp(2),
        marginBottom: hp(1),
        paddingHorizontal: spacings.large,
    },
    emailDisplayText: {
        fontSize: style.fontSizeNormal.fontSize,
        color: whiteColor,
        textAlign: 'center',
    },
    emailDisplayEmail: {
        fontSize: style.fontSizeNormal.fontSize,
        color: redColor,
        fontWeight: style.fontWeightThin1x.fontWeight,
    }
});

