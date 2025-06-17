import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../componets/Header';
import { SUPPORT_EMAIL, SUPPORT_MOBILE } from '../constans/Constants';
import { APP_NAME_IMAGE, HOME_SCREEN_IMAGE, STEP_FIVE_GIF, STEP_FOUR_GIF, STEP_NINE_GIF, STEP_ONE_GIF, STEP_SEVEN_GIF } from '../assests/images';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { blackColor, whiteColor, grayColor, blueColor, lightGrayColor } from '../constans/Color';
import { spacings, style } from '../constans/Fonts';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HowToPlayScreen = () => {
    const [expandedStep, setExpandedStep] = useState(0);
    const [businessLogo, setBusinessLogo] = useState(null);

    const steps = [
        {
            title: 'Create Your Technician Account',
            description: [
                'Open the app and click on the “Register” button.',
                'Choose between "Single Technician" or "IFS" based on your role.',
                'Fill in your personal details, including your full name, contact number, and email address.',
                'Create and confirm your password.',
                'Click “Register” to create your technician account.',
                'Your account will be reviewed and approved by the Super Admin.',
                'You will receive an email confirmation once approved.'
            ],
            // gif: STEP_ONE_GIF
        },
        {
            title: 'Login to Your Account',
            description: [
                'Open the Tech Repair Tracker app.',
                'Enter your username and password.',
                'Click “Login” to access your dashboard.'
            ],
        },
        {
            title: 'Access the Dashboard',
            description: [
                'Upon logging in, you will see the Prorevv Dashboard.',
                'From here, you can manage customer information, register new jobs,register new Vehicle and track job history.'
            ],
            // gif: HOME_SCREEN_IMAGE
        },
        {
            title: 'Add Customer & Create Job',
            description: [
                'From the dashboard, click on “Add Customer”.',
                'Fill in the customer’s details like full name, address, and phone number.',
                'After entering customer details, you’ll see two buttons: “Submit” and “Add Vehicle”.',
                '➤ **Click “Submit”** to save the customer and return to the home screen.',
                '➤ **Click “Add Vehicle”** to proceed to vehicle registration with the customer info auto-filled.',
                'On the vehicle registration screen:',
                'The previously entered customer details will be auto-filled.',
                'You can scan the VIN using your camera or manually enter it.',
                'After entering the VIN, vehicle details like make, model, and year will appear.',
                'You’ll again see two buttons: “Submit” and “Create Job”.',
                '➤ **Click “Submit”** to save vehicle info and return to the home screen.',
                '➤ **Click “Create Job”** to continue to the job creation screen, where both customer and vehicle info will be auto-filled.',
                'In the job creation screen, you can review all pre-filled details and enter any job-specific info.',
                'Finally, click “Submit” to save and create the job. You will then be redirected to the home screen.',
                'The newly created job will be visible in the Job History section with full customer and vehicle details.'
            ],
            gif: "https://ronaldo-trt.s3.ap-south-1.amazonaws.com/Ronald+GIF+3.gif"


        },
        {
            title: 'Add Vehicle & Create Job',
            description: [
                'From the dashboard, click on “Add Vehicle”.',
                'A customer dropdown will appear — select the customer for whom the vehicle is being added.',
                'You can then either manually enter the vehicle’s VIN number or scan it using the camera.',
                'Once the VIN is entered or scanned, the vehicle details (make, model, year, etc.) will be automatically fetched.',

                'You’ll now see two buttons:',
                '➤ **Click “Submit”** to save the vehicle information and return to the home screen.',
                '➤ **Click “Create Job”** to proceed to the job creation screen, where both the selected customer and vehicle details will be auto-filled.',

                'On the job creation screen:',
                'Review the auto-filled customer and vehicle information.',
                'Enter any additional job-related details.',
                'Click “Submit” to create the job.',

                'You will be redirected to the home screen after submission.',
                'The newly created job will appear in the Job History section, including both customer and vehicle information.'
            ],
            gif: "https://ronaldo-trt.s3.ap-south-1.amazonaws.com/Ronald+GIF+Done.gif"

        },
        {
            title: 'Create Only Job',
            description: [
                'From the dashboard, click the “Create Job” button.',
                'Select the customer from the dropdown to choose a registered customer.',
                'Select “Scan VIN” to begin scanning the vehicle’s VIN.'
            ],
        },
        {
            title: 'Scan the VIN',
            description: [
                'A QR code will appear on the screen.',
                'Use the camera to scan the VIN barcode on the vehicle’s plate.',
                'Vehicle information will appear on the screen after scanning.'
            ]
        },
        {
            title: 'Manually Add VIN Information (If Needed)',
            description: [
                'If the VIN is not found, enter the vehicle details manually.',
                'Fill out the required fields such as make, model, and year.',
                'Click “Submit” to save the details and create the job.'
            ],
            // gif: STEP_SEVEN_GIF
        },
        {
            title: 'Job Creation and Home Redirection',
            description: [
                'Once the job is created, it will be added to your job history.',
                'You will be redirected back to the home screen.',
                'View the new job in the Job History section.',
                'Tap on the job to see details including customer info and VIN.'
            ]
        },
        {
            title: 'Start and Complete the Job',
            description: [
                'Go to the job detail page.',
                'Click the "Complete This Job" button.',
                'The job status will update from "In Progress" to "Completed."'
            ],
            gif: "https://ronaldo-trt.s3.ap-south-1.amazonaws.com/Ron+app+job+history.gif"
        },
        {
            title: 'Job Notifications',
            description: [
                'Customer Notification: The customer will receive immediate notifications or email from the beginning until the job is completed.'
            ]
        },
        {
            title: 'Additional Features and Tips',
            description: [
                'Job History: You can always refer to your job history to check previous jobs, statuses, and outcomes.',
                'Customer Communication: Maintain clear communication with customers through the app to ensure smooth service delivery.',
                'Job Prioritization: If necessary, prioritize urgent jobs by labeling them accordingly within the app.'
            ]
        },
        {
            title: 'Help & Support',
            description: [
                'If you need any assistance, please contact our support team.',
                `Call us at: ${SUPPORT_MOBILE}`,
                `Email us at: ${SUPPORT_EMAIL}`,
            ]
        },
    ];

    useEffect(() => {
        const fetchBusinessLogo = async () => {
            const logoUrl = await AsyncStorage.getItem('businessLogo');
            if (logoUrl) setBusinessLogo(logoUrl);
        };
        fetchBusinessLogo();
    }, []);

    const toggleStep = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedStep(expandedStep === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <Header title="How To Use" />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.welcomeTitle}>Welcome to Tech Repair Tracker!</Text>
                    <Text style={styles.welcomeMessage}>
                        A user-friendly application designed to streamline job registration and management for car technicians. Whether you're a new user or need a refresher, this guide will help you navigate the app with ease.
                    </Text>

                    {steps.map((step, index) => (
                        <View key={index} style={styles.accordionContainer}>
                            <TouchableOpacity onPress={() => toggleStep(index)} style={styles.accordionHeader}>
                                <View style={{ width: "85%" }}>
                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                </View>
                                <Ionicons name={expandedStep === index ? 'chevron-up' : 'chevron-down'} size={24} color={blueColor} />
                            </TouchableOpacity>

                            {expandedStep === index && (
                                <View style={styles.accordionBody}>
                                    {step.description.map((desc, i) => {
                                        if (desc.includes(SUPPORT_MOBILE)) {
                                            return (
                                                <Text key={i} style={styles.stepDescription}>
                                                    • Call us at: <Text onPress={() => Linking.openURL(`tel:${SUPPORT_MOBILE}`)} style={styles.link}>{SUPPORT_MOBILE}</Text>
                                                </Text>
                                            );
                                        } else if (desc.includes(SUPPORT_EMAIL)) {
                                            return (
                                                <Text key={i} style={styles.stepDescription}>
                                                    • Email us at: <Text onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.link}>{SUPPORT_EMAIL}</Text>
                                                </Text>
                                            );
                                        } else {
                                            return (
                                                <Text key={i} style={styles.stepDescription}>• {desc}</Text>
                                            );
                                        }
                                    })}
                                    {step.gif && (
                                        <FastImage
                                            source={{ uri: step.gif }}
                                            style={styles.image}
                                            resizeMode={FastImage.resizeMode.contain}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    ))}

                    <Text style={[styles.stepTitle, { textAlign: 'center', marginTop: 20, color: blueColor }]}>
                        Thanks for Being a Valued Technician!
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default HowToPlayScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: whiteColor,
    },
    content: {
        padding: spacings.large,
    },
    welcomeTitle: {
        fontSize: style.fontSizeNormal2x.fontSize,
        fontWeight: 'bold',
        color: blueColor,
        marginBottom: spacings.small,
    },
    welcomeMessage: {
        fontSize: style.fontSizeNormal.fontSize,
        color: grayColor,
        marginBottom: spacings.large,
    },
    accordionContainer: {
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: lightGrayColor,
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacings.medium,
        backgroundColor: whiteColor,
    },
    accordionBody: {
        paddingHorizontal: spacings.medium,
        paddingBottom: spacings.medium,
    },
    stepTitle: {
        fontSize: style.fontSizeNormal1x.fontSize,
        fontWeight: 'bold',
        color: blueColor,
    },
    stepDescription: {
        fontSize: style.fontSizeNormal.fontSize,
        color: grayColor,
        marginBottom: spacings.small,
    },
    link: {
        color: blueColor,
        textDecorationLine: 'underline',
    },
    image: {
        width: '100%',
        height: hp(40),
        marginTop: spacings.medium,
    },
});
