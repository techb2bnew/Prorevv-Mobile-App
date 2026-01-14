import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, ScrollView, Image, Pressable, TouchableOpacity, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, TextInput, Dimensions, PermissionsAndroid, Alert, FlatList, useWindowDimensions, Keyboard } from "react-native";
import CustomButton from '../componets/CustomButton';
import CustomTextInput from '../componets/CustomTextInput';
import { blackColor, blueColor, grayColor, lightBlueColor, lightGrayColor, lightOrangeColor, lightShadeBlue, mediumGray, orangeColor, redColor, whiteColor } from "../constans/Color";
import { ADDRESS, ALREADY_HAVE_AN_ACCOUNT, API_BASE_URL, CITY, COUNTRY, CREATE_YOUE_NEW_ACCOUNT, CUSTOMER_INFORMATION, EMAIL, ESSENTIAL_FOR_REGISTRATION, FIRST_NAME, GOOGLE_MAP_API_KEY, LAST_NAME, LOGIN, PHONE_NUMBER, STATE, WELCOME, ZIP_CODE } from "../constans/Constants";
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import AntDesign from 'react-native-vector-icons/dist/AntDesign';
import PhoneInput from "react-native-phone-number-input";
import DatePicker from "react-native-date-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import NetInfo from "@react-native-community/netinfo";
import Header from "../componets/Header";
import { useFocusEffect } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { Image as ImageCompressor } from 'react-native-compressor';
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useOrientation } from "../OrientationContext";

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const CustomerInfoScreen = ({ navigation }) => {
    const phoneInput = useRef(null);
    const [errors, setErrors] = useState({});
    const [technicianId, setTechnicianId] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [isConnected, setIsConnected] = useState(true);
    const { width, height } = useWindowDimensions();
    const { orientation } = useOrientation();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const googleRef = useRef();
    const addressTextRef = useRef("");
    const isTablet = width >= 668 && height >= 1024;
    const isIOsAndTablet = Platform.OS === "ios" && isTablet;
    const [viewType, setViewType] = useState('list');
    const [isAddMode, setIsAddMode] = useState(false); // false = show list, true = show form
    const [isEditMode, setIsEditMode] = useState(false); // false = show list, true = show form
    const [customerId, setCustomerId] = useState()
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [defaultIsoCode, setDefaultIsoCode] = useState('US');
    const [address, setAddress] = useState("");
    const [rawNumber, setRawNumber] = useState('');

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",

    });

    useEffect(() => {
        const getTechnicianDetail = async () => {
            try {
                const storedData = await AsyncStorage.getItem("userDeatils");
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    console.log("Technician ID:", parsedData.id);
                    setTechnicianId(parsedData.id);
                    setTechnicianType(parsedData.types);

                }
            } catch (error) {
                console.error("Error fetching stored user:", error);
            }
        };

        getTechnicianDetail();
    }, []);

    // Function to get country ISO code from calling code
    const getCountryByCallingCode = async (callingCode) => {
        try {
            const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,idd');
            const countries = response.data;
            const country = countries.find(c => {
                const root = c.idd?.root;
                const suffixes = c.idd?.suffixes || [];
                return suffixes.some(suffix => `${root}${suffix}` === callingCode);
            });
            if (country) {
                return country.cca2;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching country data:', error);
            return null;
        }
    };

    // Helper function to extract phone number parts synchronously
    const extractPhoneNumberParts = (phoneNumber) => {
        if (!phoneNumber || !phoneNumber.startsWith('+')) {
            return { isoCode: 'US', rawNumber: '' };
        }

        // Extract calling code (can be 1-4 digits after +)
        const matchedCode = phoneNumber.match(/^\+(\d{1,4})/);
        const callingCode = matchedCode ? `+${matchedCode[1]}` : null;

        if (callingCode) {
            // Common country codes mapping (synchronous)
            const commonCodes = {
                '+1': 'US', '+44': 'GB', '+91': 'IN', '+86': 'CN',
                '+81': 'JP', '+49': 'DE', '+33': 'FR', '+39': 'IT',
                '+34': 'ES', '+7': 'RU', '+61': 'AU', '+55': 'BR',
                '+82': 'KR', '+52': 'MX', '+31': 'NL', '+46': 'SE',
                '+41': 'CH', '+32': 'BE', '+47': 'NO', '+45': 'DK',
                '+358': 'FI', '+351': 'PT', '+353': 'IE', '+48': 'PL',
                '+420': 'CZ', '+36': 'HU', '+40': 'RO', '+30': 'GR',
            };

            const isoCode = commonCodes[callingCode] || 'US';

            // Extract only the number part (remove country code and any separators)
            const rawNumber = phoneNumber
                .replace(callingCode, '')
                .replace(/[^0-9]/g, '')
                .trim();

            return { isoCode, rawNumber };
        }

        return { isoCode: 'US', rawNumber: phoneNumber.replace(/[^0-9]/g, '') };
    };

    // Refine country code asynchronously if not in common codes (optional enhancement)
    useEffect(() => {
        const refineCountryCode = async () => {
            if (formData.phoneNumber?.startsWith('+') && isEditMode && defaultIsoCode === 'US') {
                const matchedCode = formData.phoneNumber.match(/^\+(\d{1,4})/);
                const callingCode = matchedCode ? `+${matchedCode[1]}` : null;

                // Only fetch if it's not +1 (US) and we haven't set a specific country yet
                if (callingCode && callingCode !== '+1') {
                    const iso = await getCountryByCallingCode(callingCode);
                    if (iso && iso !== 'US') {
                        setDefaultIsoCode(iso);
                    }
                }
            }
        };

        refineCountryCode();
    }, [formData.phoneNumber, isEditMode, customerId, defaultIsoCode]);

    const handleInputChange = (field, value) => {
        if (field === "phoneNumber") {
            const countryCode = phoneInput.current?.getCallingCode(); // Get selected country code
            if (countryCode) {
                let phoneWithoutCode = value.replace(`+${countryCode}`, "").trim();

                // Format the phone number with "-" after country code
                const formattedPhone = `+${countryCode}-${phoneWithoutCode}`;
                console.log("formattedPhone,formattedPhone", formattedPhone);

                // const formattedPhone = `${"+" + countryCode}-${value}`;
                setFormData((prev) => ({ ...prev, [field]: formattedPhone }));
            } else {
                setFormData((prev) => ({ ...prev, [field]: value }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    useEffect(() => {
        // Listener for internet connectivity change
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected); // Update state
            // console.log("Internet Status Changed: ", state.isConnected);

            // if (state.isConnected) {
            //     console.log("Internet is back. Syncing offline customers...");
            //     syncOfflineCustomers();
            // }
        });

        return () => unsubscribe();
    }, []);

    // Keyboard listeners for Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            const keyboardWillShow = Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const keyboardWillHide = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardHeight(0);
            });

            return () => {
                keyboardWillShow.remove();
                keyboardWillHide.remove();
            };
        }
    }, []);


    useEffect(() => {
        if (technicianId && technicianType) {
            fetchCustomers(1);
        }
    }, [technicianId, technicianType, isAddMode]);


    const fetchCustomers = async (pageNum = 1) => {
        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token || !technicianId || !technicianType) return;

            setIsLoading(true);
            const apiUrl = technicianType === "manager"
                ? `${API_BASE_URL}/fetchAllCustomer?page=${pageNum}&userId=${technicianId}&limit=${viewType === 'list' ? "20" : "10"}&roleType=${technicianType}`
                : technicianType === "ifs"
                    ? `${API_BASE_URL}/fetchCustomer?page=${pageNum}&userId=${technicianId}&limit=10` :
                    `${API_BASE_URL}/fetchCustomer?page=${pageNum}&userId=${technicianId}&limit=${viewType === 'list' ? "20" : "10"}&roleType=${technicianType}`;

            const response = await axios.get(
                apiUrl,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const newCustomers = response?.data?.customers?.customers || [];

            // If page is 1, reset list. Else, append.
            if (pageNum === 1) {
                setCustomers(newCustomers);
            } else {
                setCustomers(prev => [...prev, ...newCustomers]);
            }

            // If less than 10 items fetched, no more data
            setHasMore(newCustomers.length === 10);
            setPage(pageNum);
            console.log("newCustomers", customers);

        } catch (error) {
            console.error("Error fetching customers aaaa:", error.response?.data || error.message);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // First Name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
            newErrors.fullName = "Full name should contain only letters";
        }

        // Email validation - only if value is entered
        if (formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                newErrors.email = "Please enter a valid email address";
            }
        }

        // Phone number validation - only if value is entered
        if (formData.phoneNumber.trim()) {
            // Extract only digits from the phone number
            const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
            // Check if it has at least 7 digits (minimum valid phone number length)
            if (digitsOnly.length < 7 || digitsOnly.length > 15) {
                newErrors.phoneNumber = "Please enter a valid phone number";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (nextAction, setLocalLoading) => {
        if (!technicianId) {
            setErrors({ apiError: "Technician ID is required." });
            return;
        }

        if (!validateForm()) {
            return;
        }

        // 👇 Force format phone number here if not already in +XX-XXXX format
        const countryCode = phoneInput.current?.getCallingCode();
        const rawPhone = formData.phoneNumber || "";

        let formattedPhone = rawPhone;

        if (countryCode && rawPhone.trim() !== "" && !rawPhone.startsWith(`+${countryCode}`)) {
            // In case it's stored as "1234567890", make it "+XX-1234567890"
            formattedPhone = `+${countryCode}-${rawPhone.trim()}`;
        }

        const customerData = {
            ...formData,
            phoneNumber: formattedPhone, // 👈 override with formatted
            address: address || addressTextRef.current || formData.address, // 👈 use address state
            userId: String(technicianId),
            roleType: String(technicianType)
        };
        console.log("customerDatacustomerData", customerData);

        const customerEditData = {
            ...customerData,
            customerId: customerId
        };

        setLocalLoading(true);
        let success = false;

        if (isConnected) {
            if (isEditMode) {
                success = await syncCustomerEditToAPI(customerEditData);
                setIsAddMode(false);
                setIsEditMode(false);
                setErrors({});
                // Reset phone number states after edit
                setDefaultIsoCode('US');
                setRawNumber('');
                setFormData({
                    fullName: "",
                    email: "",
                    phoneNumber: "",
                    address: "",
                });
                setAddress("");
                addressTextRef.current = "";
            } else {
                success = await syncCustomerToAPI(customerData);
            }
        } else {
            success = await saveCustomerOffline(customerData);
        }

        setLocalLoading(false);

        if (success) {
            Toast.show("Successfully created a new customer!");
            if (nextAction === "AddVehicleScreen") {
                navigation.navigate("AddVehicle");
            } else {
                setIsAddMode(false);
                setIsEditMode(false);
                setErrors({});
                // Reset phone number states after create
                setDefaultIsoCode('US');
                setRawNumber('');
                setAddress("");
                addressTextRef.current = "";
                setFormData({
                    fullName: "",
                    email: "",
                    phoneNumber: "",
                    address: "",
                });
            }
        }
    };

    const saveCustomerOffline = async (customerData) => {
        try {
            const existingData = await AsyncStorage.getItem("offlineCustomers");
            const customerList = existingData ? JSON.parse(existingData) : [];
            customerList.push(customerData);
            await AsyncStorage.setItem("offlineCustomers", JSON.stringify(customerList));
            console.log("Customer data saved offline:", customerData);
            console.log("No internet. Customer saved locally.");
            // Toast.show("Successfully created a new customer!")
            // navigation.goBack();
            return true;
        } catch (error) {
            console.error("Error saving customer offline:", error);
            return false;
        }
    };


    const syncCustomerToAPI = async (customerData) => {
        console.log(customerData);

        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }

            const bodyData = { ...customerData };

            const response = await axios.post(
                `${API_BASE_URL}/createCustomer`,
                bodyData,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            console.log("Customer synced successfully:", response.data);
            console.log("Customer added successfully.");

            if (response?.data?.message === "Customer created successfully") {
                const customerId = response?.data?.customer?.id;
                await AsyncStorage.setItem("current_customer_id", customerId.toString());
                console.log("Customer ID saved in AsyncStorage:", customerId);
                return true;

            }
        } catch (error) {
            console.error("API request failed:", error.response ? error.response.data.error : error.message);
            const errorMsg = (error.response ? error.response.data.error : error.message)?.toLowerCase();

            if (errorMsg.includes("email already exists")) {
                setErrors({ email: "Email already exists" });
            } else if (errorMsg.includes("invalid email format")) {
                setErrors({ email: "Invalid email format" });
            } else if (errorMsg.includes("phone number already exists")) {
                setErrors({ phoneNumber: "Phone number already exists" });
            } else {
                setErrors({ apiError: errorMsg || "An error occurred. Please try again." });
            }
            return false;

        }
    };

    const syncCustomerEditToAPI = async (customerData) => {
        console.log("customerData::::::", customerData);

        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }

            const bodyData = { ...customerData };

            const response = await axios.post(
                `${API_BASE_URL}/updateCustomer`,
                bodyData,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (response?.data?.message === "Customer created successfully") {
                const customerId = response?.data?.customer?.id;
                await AsyncStorage.setItem("current_customer_id", customerId.toString());
                console.log("Customer ID saved in AsyncStorage:", customerId);
                return true;

            }
        } catch (error) {
            console.error("API request failed:", error.response ? error.response.data.error : error.message);
            const errorMsg = (error.response ? error.response.data.error : error.message)?.toLowerCase();

            if (errorMsg.includes("email already exists")) {
                setErrors({ email: "Email already exists" });
            } else if (errorMsg.includes("invalid email format")) {
                setErrors({ email: "Invalid email format" });
            } else if (errorMsg.includes("phone number already exists")) {
                setErrors({ phoneNumber: "Phone number already exists" });
            } else {
                setErrors({ apiError: errorMsg || "An error occurred. Please try again." });
            }
            return false;

        }
    };

    const capitalize = (str) => {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
    };

    return (
        <View style={{ flex: 1, backgroundColor: whiteColor }}>
            {/* {isLoadingState && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={blueColor} />
                </View>
            )} */}
            <KeyboardAvoidingView
                style={[flex]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                enabled={Platform.OS === 'ios'}
            >
                <Header title={isEditMode ? "Edit Customer info" : CUSTOMER_INFORMATION} onBack={() => {
                    if (isEditMode) {
                        setIsEditMode(false);
                        setIsAddMode(false);
                        setErrors({});
                        // Reset phone number states
                        setDefaultIsoCode('US');
                        setRawNumber('');
                        setCustomerId(null);
                        setFormData({
                            fullName: '',
                            email: '',
                            phoneNumber: '',
                            address: '',
                        });
                        setAddress("");
                        addressTextRef.current = "";
                    } else {
                        navigation.goBack();
                    }
                }} />
                {!isAddMode && <View style={{
                    flexDirection: 'row',
                    position: "absolute",
                    top: Platform.OS === "android" ? isTablet ? hp(1) : orientation === "LANDSCAPE" ? hp(2.5) : 10 : isTablet ? orientation === "LANDSCAPE" ? hp(.2) : 20 : 13,
                    right: 10,
                    zIndex: 10
                }}>

                    <TouchableOpacity
                        onPress={() => setViewType('list')}
                        style={[{
                            backgroundColor: viewType === 'list' ? lightGrayColor : whiteColor,
                            width: isTablet ? wp(8) : wp(12),
                            height: orientation === "LANDSCAPE" ? hp(6.5) : hp(4.5),
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 5,
                            marginRight: 10,
                            borderWidth: 1

                        }]}>
                        <Ionicons name="list" size={isTablet ? 35 : orientation === "LANDSCAPE" ? 35 : 20} color={viewType === 'list' ? blackColor : blackColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewType('grid')}
                        style={[, {
                            backgroundColor: viewType === 'grid' ? lightGrayColor : whiteColor,
                            width: isTablet ? wp(8) : wp(12),
                            height: orientation === "LANDSCAPE" ? hp(6.5) : hp(4.5),
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 5,
                            borderWidth: 1
                        }]}>
                        <Ionicons name="grid-sharp" size={isTablet ? 35 : orientation === "LANDSCAPE" ? 35 : 20} color={viewType === 'grid' ? blackColor : blackColor} />
                    </TouchableOpacity>

                </View>}

                {/* Toggle: Add Customer Form OR List/Grid View */}
                {!isAddMode ? (
                    <>
                        {viewType === 'list' && (
                            <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View>
                                        <View style={[styles.tableHeader, flexDirectionRow]}>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(40) }]}>Name</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(40) }]}>Phone</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(25) : orientation === "LANDSCAPE" ? wp(20) : wp(60) }]}>Email</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? orientation === "LANDSCAPE" ? wp(28) : wp(45) : orientation === "LANDSCAPE" ? wp(32) : wp(80) }]}>Address</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? orientation === "LANDSCAPE" ? wp(8) : wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(20) }]}>Action</Text>

                                        </View>
                                        <FlatList
                                            data={customers}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item, index }) => (
                                                <Pressable style={[
                                                    styles.tableRow,
                                                    flexDirectionRow,
                                                    { backgroundColor: index % 2 === 0 ? lightGrayColor : whiteColor }

                                                ]}
                                                    onPress={() => {
                                                        setIsEditMode(true);
                                                        setIsAddMode(true);
                                                        setErrors({});
                                                        setCustomerId(item?.id);

                                                        // Extract phone number parts synchronously
                                                        const phoneParts = extractPhoneNumberParts(item.phoneNumber || '');
                                                        setDefaultIsoCode(phoneParts.isoCode);
                                                        setRawNumber(phoneParts.rawNumber);

                                                        // Set form data
                                                        setFormData({
                                                            fullName: item.fullName || '',
                                                            email: item.email || '',
                                                            phoneNumber: item.phoneNumber || '',
                                                            address: item.address || '',
                                                        });
                                                        setTimeout(() => {
                                                            if (googleRef?.current?.setAddressText) {
                                                                googleRef.current.setAddressText(item.address || '');
                                                            }
                                                        }, 100);
                                                    }}>
                                                    <Text style={[styles.tableText, { width: isTablet ? wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(40) }]}>{capitalize(item.fullName) || '—'}</Text>
                                                    <Text style={[styles.tableText, { width: isTablet ? wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(40) }]}>{item.phoneNumber || '—'}</Text>
                                                    <Text style={[styles.tableText, { width: isTablet ? wp(25) : orientation === "LANDSCAPE" ? wp(20) : wp(60) }]}>{item.email || '—'}</Text>
                                                    <Text style={[styles.tableText, { width: isTablet ? orientation === "LANDSCAPE" ? wp(26) : wp(40) : orientation === "LANDSCAPE" ? wp(30) : wp(70) }]}>{item.address || '—'}</Text>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setIsEditMode(true);
                                                            setIsAddMode(true);
                                                            setErrors({});
                                                            setCustomerId(item?.id);

                                                            // Extract phone number parts synchronously
                                                            const phoneParts = extractPhoneNumberParts(item.phoneNumber || '');
                                                            setDefaultIsoCode(phoneParts.isoCode);
                                                            setRawNumber(phoneParts.rawNumber);

                                                            // Set form data
                                                            setFormData({
                                                                fullName: item.fullName || '',
                                                                email: item.email || '',
                                                                phoneNumber: item.phoneNumber || '',
                                                                address: item.address || '',
                                                            });
                                                            setTimeout(() => {
                                                                if (googleRef?.current?.setAddressText) {
                                                                    googleRef.current.setAddressText(item.address || '');
                                                                }
                                                            }, 100);
                                                        }}

                                                    >
                                                        <Text style={[styles.tableText, { width: isTablet ? orientation === "LANDSCAPE" ? wp(8) : wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(20), marginLeft: 50 }]}>Edit</Text>
                                                    </TouchableOpacity>
                                                </Pressable>
                                            )}
                                            onEndReached={() => {
                                                if (!isLoading && hasMore) {
                                                    fetchCustomers(page + 1);
                                                }
                                            }}
                                            onEndReachedThreshold={0.3}
                                            ListFooterComponent={() =>
                                                isLoading ? (
                                                    <View style={{ paddingVertical: 10, alignItems: "center", width: wp(100), height: hp(50), justifyContent: "center" }}>
                                                        <ActivityIndicator size="small" color="#0000ff" />
                                                    </View>
                                                ) : null
                                            }
                                            ListEmptyComponent={() => {
                                                if (isLoading) return null; // 👈 Loading ke time kuch mat dikhao
                                                return (
                                                    <View style={styles.emptyContainer}>
                                                        <Text style={styles.emptyText}>No Customer found</Text>
                                                    </View>
                                                );
                                            }}
                                        />
                                    </View>

                                </ScrollView>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsAddMode(true);
                                        setIsEditMode(false);
                                        setErrors({});
                                        // Reset phone number states for new customer
                                        setDefaultIsoCode('US');
                                        setRawNumber('');
                                        setFormData({
                                            fullName: '',
                                            email: '',
                                            phoneNumber: '',
                                            address: '',
                                        });
                                        setAddress("");
                                        addressTextRef.current = "";
                                    }}
                                    style={{
                                        position: 'absolute',
                                        bottom: hp(5),
                                        right: wp(8),
                                        backgroundColor: blackColor,
                                        width: 60,
                                        height: 60,
                                        borderRadius: 30,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        elevation: 5,
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 3.84,
                                    }}
                                >
                                    <Ionicons name="person-add" size={28} color={whiteColor} />
                                </TouchableOpacity>
                            </>
                        )}

                        {viewType === 'grid' && (
                            <View style={{ height: hp(90) }}>
                                <FlatList
                                    data={customers}
                                    keyExtractor={(item, index) => index.toString()}
                                    contentContainerStyle={{ padding: 10 }}
                                    showsVerticalScrollIndicator={false}
                                    renderItem={({ item }) => {
                                        const initials = item.fullName?.charAt(0)?.toUpperCase();

                                        return (
                                            <Pressable style={{
                                                backgroundColor: whiteColor,
                                                marginVertical: spacings.xLarge,
                                                borderRadius: 15,
                                                ...Platform.select({
                                                    ios: {
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: 0.2,
                                                        shadowRadius: 5,
                                                    },
                                                    android: {
                                                        elevation: 3,
                                                    }
                                                })
                                            }}
                                                onPress={() => {
                                                    setIsEditMode(true);
                                                    setIsAddMode(true);
                                                    setErrors({});
                                                    setCustomerId(item?.id);

                                                    // Extract phone number parts synchronously
                                                    const phoneParts = extractPhoneNumberParts(item.phoneNumber || '');
                                                    setDefaultIsoCode(phoneParts.isoCode);
                                                    setRawNumber(phoneParts.rawNumber);

                                                    // Set form data
                                                    setFormData({
                                                        fullName: item.fullName || '',
                                                        email: item.email || '',
                                                        phoneNumber: item.phoneNumber || '',
                                                        address: item.address || '',
                                                    });
                                                    setTimeout(() => {
                                                        if (googleRef?.current?.setAddressText) {
                                                            googleRef.current.setAddressText(item.address || '');
                                                        }
                                                    }, 100);
                                                }}>
                                                {/* Header */}
                                                <View style={{
                                                    backgroundColor: blackColor,
                                                    paddingVertical: spacings.normalx,
                                                    paddingHorizontal: spacings.large,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    borderTopLeftRadius: 15,
                                                    borderTopRightRadius: 15,
                                                    justifyContent: "space-between"
                                                }}>
                                                    <View style={[flexDirectionRow, alignItemsCenter, { width: isTablet ? '90%' : "78%" }]}>
                                                        <View style={{
                                                            backgroundColor: whiteColor,
                                                            width: isIOsAndTablet ? wp(6) : isTablet ? wp(8.5) : wp(10),
                                                            height: Platform.OS === "ios" ? hp(4.5) : hp(5),
                                                            borderRadius: isTablet ? 50 : 20,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginRight: spacings.large,
                                                        }}>
                                                            <Text style={{ fontSize: style.fontSizeMedium.fontSize, fontWeight: style.fontWeightThin1x.fontWeight, color: blackColor }}>{initials}</Text>
                                                        </View>
                                                        <Text style={{ color: whiteColor, fontSize: style.fontSizeMedium.fontSize, fontWeight: style.fontWeightThin1x.fontWeight }}>{capitalize(item.fullName)}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setIsEditMode(true);
                                                            setIsAddMode(true);
                                                            setErrors({});
                                                            setCustomerId(item?.id);

                                                            // Extract phone number parts synchronously
                                                            const phoneParts = extractPhoneNumberParts(item.phoneNumber || '');
                                                            setDefaultIsoCode(phoneParts.isoCode);
                                                            setRawNumber(phoneParts.rawNumber);

                                                            // Set form data
                                                            setFormData({
                                                                fullName: item.fullName || '',
                                                                email: item.email || '',
                                                                phoneNumber: item.phoneNumber || '',
                                                                address: item.address || '',
                                                            });
                                                            setTimeout(() => {
                                                                if (googleRef?.current?.setAddressText) {
                                                                    googleRef.current.setAddressText(item.address || '');
                                                                }
                                                            }, 100);
                                                        }}

                                                    >
                                                        <AntDesign name="edit" style={[styles.tableText, { width: wp(20), marginLeft: 40 }]} size={25} color={whiteColor} />
                                                        {/* <Text style={[styles.tableText, { width: wp(20), marginLeft: 40, color: whiteColor }]}>Edit</Text> */}
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Body */}
                                                <View style={{ padding: spacings.xLarge }}>
                                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacings.small }}>
                                                        <Text style={{ fontSize: style.fontSizeNormal.fontSize, color: grayColor, width: "50%" }}>Email:</Text>
                                                        <Text style={{ color: blackColor, fontWeight: style.fontWeightThin1x.fontWeight, width: "40%", textAlign: "right" }}>{item?.email || '—'}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacings.small }}>
                                                        <Text style={{ fontSize: style.fontSizeNormal.fontSize, color: grayColor, width: "50%" }}>Phone:</Text>
                                                        <Text style={{ color: blackColor, fontWeight: style.fontWeightThin1x.fontWeight }}>{item?.phoneNumber || '—'}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                        <Text style={{ fontSize: style.fontSizeNormal.fontSize, color: grayColor, width: "50%" }}>Address:</Text>
                                                        <Text style={{ color: blackColor, fontWeight: style.fontWeightThin1x.fontWeight, flexShrink: 1, textAlign: 'right' }}>{item?.address || '—'}</Text>
                                                    </View>

                                                </View>
                                            </Pressable>
                                        );
                                    }}


                                    onEndReached={() => {
                                        if (!isLoading && hasMore) {
                                            fetchCustomers(page + 1);
                                        }
                                    }}
                                    onEndReachedThreshold={0.3}
                                    ListFooterComponent={() =>
                                        isLoading ? (
                                            <View style={{ paddingVertical: 10, alignItems: "center", width: wp(100), height: hp(50), justifyContent: "center" }}>
                                                <ActivityIndicator size="small" color="#0000ff" />
                                            </View>
                                        ) : null
                                    }
                                    ListEmptyComponent={() => {
                                        if (isLoading) return null; // 👈 Loading ke time kuch mat dikhao
                                        return (
                                            <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>No Customer found</Text>
                                            </View>
                                        );
                                    }}
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsAddMode(true);
                                        setIsEditMode(false);
                                        setErrors({});
                                        // Reset phone number states for new customer
                                        setDefaultIsoCode('US');
                                        setRawNumber('');
                                        setFormData({
                                            fullName: '',
                                            email: '',
                                            phoneNumber: '',
                                            address: '',
                                        });
                                        setAddress("");
                                        addressTextRef.current = "";
                                    }}
                                    style={{
                                        position: 'absolute',
                                        bottom: hp(8),
                                        right: wp(8),
                                        backgroundColor: blackColor,
                                        width: 60,
                                        height: 60,
                                        borderRadius: 30,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        elevation: 5,
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 3.84,
                                    }}
                                >
                                    <Ionicons name="person-add" size={28} color={whiteColor} />
                                </TouchableOpacity>
                            </View>
                        )
                        }
                    </>
                ) : (
                    // 👇 Add Customer Form
                    <View style={{ flex: 1, position: 'relative' }}>
                        <ScrollView
                            style={[styles.container, { flex: 1 }]}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="always"
                            contentContainerStyle={{
                                paddingBottom: Platform.OS === 'android' && keyboardHeight > 0
                                    ? keyboardHeight + 100
                                    : 100
                            }}
                        >
                            <View style={styles.content}>
                                <CustomTextInput
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    value={formData.firstName || formData.fullName}
                                    onChangeText={(text) => handleInputChange("fullName", text)}
                                    required={true}
                                    maxLength={20}
                                />
                                {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}
                                <CustomTextInput
                                    label="Email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChangeText={(text) => {
                                        const updatedText = text?.charAt(0).toLowerCase() + text.slice(1);
                                        handleInputChange("email", updatedText);
                                    }}
                                // required={true}

                                />
                                {errors.email && <Text style={styles.error}>{errors.email}</Text>}

                                <View style={styles.phoneContainer}>
                                    <Text style={styles.label}>
                                        Phone Number
                                    </Text>
                                    <PhoneInput
                                        key={`phone-input-${customerId || 'new'}-${defaultIsoCode}-${rawNumber}`}
                                        ref={phoneInput}
                                        defaultValue={rawNumber}
                                        defaultCode={defaultIsoCode}
                                        layout="second"
                                        onChangeFormattedText={(text) => handleInputChange("phoneNumber", text)}
                                        textInputProps={{
                                            maxLength: 15,
                                            keyboardType: "default",
                                        }}
                                        containerStyle={styles.phoneInput}
                                        textContainerStyle={styles.phoneText}
                                        textInputStyle={[styles.phoneTextInput, { marginBottom: isTablet ? 12 : 0 }]}
                                        flagButtonStyle={styles.flagButton}
                                        placeholder="Enter your phone number"
                                    />
                                </View>
                                {errors.phoneNumber && <Text style={styles.error}>{errors.phoneNumber}</Text>}

                                <View style={[styles.inputGroup, {
                                    height: isTablet
                                        ? orientation === "LANDSCAPE"
                                            ? hp(10)
                                            : hp(8)
                                        : hp(10), marginTop: spacings.large
                                }]}>
                                    <Text style={styles.label}>Address</Text>

                                    <View style={{ flex: 1, position: 'relative', zIndex: 999 }}>
                                        <GooglePlacesAutocomplete
                                            ref={googleRef}
                                            placeholder="Enter Address"
                                            fetchDetails={true}

                                            onPress={(data, details = null) => {
                                                const selected = data?.description || "";
                                                addressTextRef.current = selected;
                                                setAddress(selected);
                                                // setFormData((prev) => ({ ...prev, address: selected }));
                                            }}

                                            enablePoweredByContainer={false}

                                            query={{
                                                key: GOOGLE_MAP_API_KEY,
                                                language: 'en',
                                            }}

                                            textInputProps={{
                                                defaultValue: address,   // ⭐ PREFILLED FIX
                                                multiline: true,
                                                onChangeText: (text) => {
                                                    addressTextRef.current = text;
                                                    setAddress(text);       // ⭐ TYPING FIX
                                                    // setFormData((prev) => ({ ...prev, address: text }));
                                                },
                                            }}

                                            styles={{
                                                container: {
                                                    flex: 1,
                                                    zIndex: 999,
                                                },
                                                listView: {
                                                    position: "absolute",
                                                    top: isTablet ? hp(4) : hp(7),
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: "#fff",
                                                    zIndex: 999999,
                                                    elevation: 10,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: "#eee",
                                                },
                                                textInputContainer: {
                                                    zIndex: 999,
                                                },
                                                textInput: {
                                                    height: Platform.OS === 'android' ? isTablet ? hp(3.5) : hp(6) : isTablet ? orientation === "LANDSCAPE" ? hp(3.5) : hp(3) : hp(5),
                                                    borderWidth: 1,
                                                    borderColor: blackColor,
                                                    borderRadius: 50,
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 12,
                                                    backgroundColor: '#fff',
                                                    textAlignVertical: 'top',
                                                },
                                            }}
                                        />
                                    </View>
                                </View>

                                {errors.address && <Text style={styles.error}>{errors.address}</Text>}

                                {errors?.apiError?.message ? (
                                    <Text style={styles.error}>{errors.apiError.message}</Text>
                                ) : (
                                    <Text style={styles.error}>{JSON.stringify(errors.apiError)}</Text>
                                )}
                            </View>
                        </ScrollView>
                        {isAddMode && (
                            <View style={[
                                {
                                    backgroundColor: whiteColor,
                                    paddingTop: spacings.xLarge,
                                    paddingHorizontal: spacings.xxxLarge,
                                    paddingBottom: spacings.large,
                                    borderTopWidth: 1,
                                    borderTopColor: lightGrayColor,
                                    ...(Platform.OS === 'android' && keyboardHeight > 0 ? {
                                        position: 'absolute',
                                        bottom: keyboardHeight,
                                        left: 0,
                                        right: 0,
                                        width: '100%',
                                    } : { bottom: hp(4.4) }),
                                    // elevation: 5,
                                    // shadowColor: "#000",
                                    // shadowOffset: { width: 0, height: -2 },
                                    // shadowOpacity: 0.1,
                                    // shadowRadius: 3,
                                },
                                alignJustifyCenter
                            ]}>
                                <CustomButton
                                    title={isEditMode ? "Update" : "Submit"}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        handleSubmit(null, setSubmitLoading);
                                    }}
                                    style={[styles.button, { backgroundColor: blackColor, borderWidth: 1, borderColor: blackColor }]}
                                    textStyle={{ color: whiteColor }}
                                    loading={submitLoading}
                                    disabled={submitLoading}
                                />
                            </View>
                        )}
                    </View>
                )}

            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
    },
    logoContainer: {
        marginBottom: spacings.Large1x,
        height: Platform.OS === "android" ? hp(10) : hp(10),
    },
    logo: {
        width: wp(40),
        height: hp(5),
        marginBottom: spacings.large,
    },
    content: {
        paddingHorizontal: spacings.Large2x,
        paddingBottom: spacings.Large2x,
        // backgroundColor:'red'
    },
    title: {
        fontSize: style.fontSizeLargeXX.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: blackColor,
        marginVertical: spacings.large,
    },
    subtitle: {
        color: grayColor,
    },

    halfInput: {
        width: wp(42.5),
        marginRight: spacings.large,
    },
    button: {
        // marginTop: 2,
        width: wp(90),
        marginBottom: spacings.xLarge
    },
    footerText: {
        marginTop: spacings.Large2x,
        color: blackColor,
    },

    phoneContainer: {
        marginTop: 14,
    },
    label: {
        fontSize: 14,
        color: blackColor,
        marginBottom: 7,
        fontWeight: "500",
    },
    phoneInput: {
        borderWidth: 1,
        borderColor: blackColor,
        borderRadius: 50,
        height: 42,
        width: "100%",
        overflow: "hidden"
    },
    phoneText: {
        backgroundColor: whiteColor,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    phoneTextInput: {
        fontSize: 16,
        color: blackColor,
        height: 40
    },
    flagButton: {
        width: 70,
        justifyContent: "center",
        alignItems: "center",
    },
    error: { color: "red", fontSize: 12, marginTop: 4 },
    dobContainer: {
        marginTop: 16,
    },
    dobInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 5,
        backgroundColor: "#fff",
    },
    asterisk: {
        color: 'red',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
    },
    circleButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: lightBlueColor,
        alignItems: "center",
        justifyContent: "center",
        // overflow: "hidden",
        borderWidth: 1,
        borderColor: blackColor,
        alignSelf: "center"
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 50, // Image bhi circle me aaye
    },
    defaultIcon: {
        width: "100%",
        height: "100%",
        tintColor: "#888", // Light gray color
    },
    tableHeader: {
        padding: spacings.xxLarge,
        backgroundColor: whiteColor,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        backgroundColor: blackColor
    },
    tableHeaderText: {
        fontWeight: style.fontWeightThin1x.fontWeight,
        textAlign: "left",
        color: whiteColor
    },
    tableRow: {
        padding: spacings.large,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E6E6E6'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: mediumGray
    },
});

export default CustomerInfoScreen;
