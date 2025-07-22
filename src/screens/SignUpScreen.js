import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, ScrollView, Image, Pressable, TouchableOpacity, Platform, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, Modal, ActivityIndicator, FlatList, PermissionsAndroid, Dimensions, TextInput } from "react-native";
import CustomButton from '../componets/CustomButton';
import CustomTextInput from '../componets/CustomTextInput';
import { blackColor, blueColor, grayColor, lightBlueColor, lightOrangeColor, mediumGray, orangeColor, redColor, whiteColor } from "../constans/Color";
import { ADDRESS, ALREADY_HAVE_AN_ACCOUNT, API_BASE_URL, CITY, COUNTRY, CREATE_YOUE_NEW_ACCOUNT, EMAIL, FIRST_NAME, GOOGLE_MAP_API_KEY, LAST_NAME, LOGIN, PHONE_NUMBER, STATE, WELCOME, ZIP_CODE } from "../constans/Constants";
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import PhoneInput from "react-native-phone-number-input";
import Toast from 'react-native-simple-toast';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DocumentPicker from 'react-native-document-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Image as ImageCompressor } from 'react-native-compressor';
import SuccessModal from "../componets/Modal/SuccessModal";
import Header from "../componets/Header";
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const SignUpScreen = ({ navigation }) => {
    const route = useRoute();
    console.log(route.params?.role);
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const phoneInput = useRef(null);
    const secondyPhoneInput = useRef(null);
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSecondStep, setIsSecondStep] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [states, setStates] = useState([]);
    const [countries, setCountries] = useState([]);
    const [countryValue, setCountryValue] = useState("United States" || "");
    const [stateValue, setStateValue] = useState("");
    const [isLoadingState, setIsLoadingState] = useState(false);
    const [enterpriseOpen, setEnterpriseOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [enterpriseValue, setEnterpriseValue] = useState("Single-Technician");
    const [files, setFiles] = useState([]);
    const [businessLogo, setBusinessLogo] = useState(null);
    const filesWithAddButton = [...files, { isAddButton: true }];
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [cities, setCities] = useState([]);
    const [cityValue, setCityValue] = useState("");
    const googleRef = useRef();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        // country: countryValue,
        // state: "",
        // city: "",
        // zipCode: "",
        secondaryEmail: "",
        secondaryPhoneNumber: "",
        password: "",
        confirmPassword: "",
        businessName: ""
    });

    const validateForm = () => {
        const newErrors = {};
        // Validation for the first step
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        // Email validation: separate checks for empty or invalid email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";  // If email is empty
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = "Valid email is required";  // If email format is invalid
        }

        // Phone number validation: separate checks for empty or invalid phone number
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";  // If phone number is empty
        } else if (formData.phoneNumber.length < 10) {
            newErrors.phoneNumber = "Valid phone number is required";  // If phone number length is less than 10
        }

        if (!formData.address.trim()) newErrors.address = "Address is required";
        // if (!formData.country.trim()) newErrors.country = "Country is required";
        // if (!formData.state.trim()) newErrors.state = "State is required";
        // if (!formData.city.trim()) newErrors.city = "City is required";
        // if (!formData.zipCode.trim()) newErrors.zipCode = "Zip code is required";
        // Validation for secondary email and phone number if provided
        // if (formData.secondaryEmail.trim() && !/^\S+@\S+\.\S+$/.test(formData.secondaryEmail)) {
        //     newErrors.secondaryEmail = "Valid secondary email is required";
        // }
        // if (formData.secondaryPhoneNumber.trim() && formData.secondaryPhoneNumber.length < 10) {
        //     newErrors.secondaryPhoneNumber = "Valid secondary phone number is required";
        // }
        // Validation for the second step
        // if (isSecondStep) {
        if (!formData.password.trim()) newErrors.password = "Password is required";
        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = "Confirm password is required";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords must match";
        }
        // }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field, value) => {
        console.log("fieldfield", field);

        if (field === "phoneNumber" || field === "secondaryPhoneNumber") {
            const countryCode = phoneInput.current?.getCallingCode(); // Get selected country code
            if (countryCode) {
                // Remove the country code from value
                let phoneWithoutCode = value.replace(`+${countryCode}`, "").trim();

                // ✅ If no number entered after country code, treat it as empty
                if (!phoneWithoutCode) {
                    setFormData((prev) => ({ ...prev, [field]: "" }));
                } else {
                    const formattedPhone = `+${countryCode}-${phoneWithoutCode}`;
                    console.log("formattedPhone,formattedPhone", formattedPhone);
                    setFormData((prev) => ({ ...prev, [field]: formattedPhone }));
                }
            } else {
                setFormData((prev) => ({ ...prev, [field]: value }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }

        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const handleNext = () => {
        if (validateForm()) {
            setIsSecondStep(true);
        }
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Camera Permission",
                        message: "App needs access to your camera to take pictures",
                        buttonPositive: "OK",
                        buttonNegative: "Cancel",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const openFrontCamera = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert("Permission Denied", "You need to allow camera access to take pictures.");
            return;
        }

        const options = {
            mediaType: "photo",
            cameraType: "front",
            saveToPhotos: true,
            quality: 1, // Capture at highest quality
        };

        launchCamera(options, async (response) => {
            if (response.didCancel) {
                console.log("User cancelled image picker");
            } else if (response.errorMessage) {
                console.log("Image Picker Error: ", response.errorMessage);
            } else {
                const imageUri = response.assets[0]?.uri;
                console.log("Captured Image URI:", imageUri);

                if (imageUri) {
                    try {
                        // 🔹 **Compress Image (reduce size by 50%)**
                        const compressedUri = await ImageCompressor.compress(imageUri, {
                            compressionMethod: "auto", // Auto compression
                            quality: 0.5, // 50% quality
                            maxWidth: 800, // Limit max width (optional)
                            maxHeight: 800, // Limit max height (optional)
                        });

                        console.log("Compressed Image URI:", compressedUri);
                        setCapturedImage(compressedUri);
                    } catch (error) {
                        console.error("Image compression error:", error);
                    }
                }
            }
        });
    };

    const handleRegister = async () => {
        Keyboard.dismiss();

        if (!validateForm()) {
            return; // agar validation fail ho gaya toh stop
        }
        console.log("handleRegister called", enterpriseValue); // Debugging log
        setIsLoading(true);
        const apiUrl = `${API_BASE_URL}/register`;

        console.log("captures", businessLogo);

        // Create a new FormData object
        const formDataToSend = new FormData();

        // Append the form fields as you would in your curl command
        formDataToSend.append('firstName', formData.firstName);
        formDataToSend.append('lastName', formData.lastName);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('phoneNumber', formData.phoneNumber);
        formDataToSend.append('address', formData.address);
        // formDataToSend.append('country', formData.country);
        // formDataToSend.append('state', formData.state);
        // formDataToSend.append('city', formData.city);
        // formDataToSend.append('zipCode', formData.zipCode);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('secondaryContactName', formData.secondaryPhoneNumber);
        formDataToSend.append('secondaryEmail', formData.secondaryEmail || "");
        formDataToSend.append('agreeTerms', "true");
        formDataToSend.append('businessName', formData.businessName);
        formDataToSend.append('role', enterpriseValue === "Single-Technician" ? "singletechnician" : "technician");
        formDataToSend.append('types', enterpriseValue === "Single-Technician" ? "single-technician" : "ifs");
        // formDataToSend.append('payRate', "");
        // formDataToSend.append('amountPercentage', "");
        formDataToSend.append("createdBy", "app");


        if (capturedImage) {
            const newUri = Platform.OS === 'ios' ? capturedImage.replace('file://', '') : capturedImage;
            console.log(newUri);

            // Convert the image URI into a file object
            formDataToSend.append("image", {
                uri: newUri,
                name: "image.jpg", // Give a default name
                type: "image/jpeg"  // Ensure correct MIME type
            });
        } else {
            formDataToSend.append("image", "");
        }

        if (businessLogo) {
            const newUri = Platform.OS === 'ios' ? businessLogo.replace('file://', '') : businessLogo;
            console.log(newUri);

            // Convert the image URI into a file object
            formDataToSend.append("businessLogo", {
                uri: newUri,
                name: "image.jpg", // Give a default name
                type: "image/jpeg"  // Ensure correct MIME type
            });
        } else {
            formDataToSend.append("businessLogo", "");
        }

        // ✅ Check if files are selected
        // if (files.length > 0) {
        //     files.forEach(file => {
        //         const newUri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;

        //         formDataToSend.append('taxForms', {
        //             uri: newUri,
        //             name: file.name || `file_${Date.now()}.pdf`,
        //             type: file.type || 'application/pdf',
        //         });
        //     });
        // } else {
        //     formDataToSend.append('taxForms', ''); // Avoid empty array issue
        // }
        if (files.length > 0) {
            for (const file of files) {
                const newUri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;

                try {
                    const blob = await getBlobFromUri(newUri);

                    formDataToSend.append('taxForms', {
                        uri: newUri,
                        name: file.name || `file_${Date.now()}.${file.type?.includes("image") ? "jpg" : "pdf"}`,
                        type: file.type || 'application/pdf',
                    });

                    // PATCH — replace actual content with blob
                    const lastIndex = formDataToSend._parts.length - 1;
                    formDataToSend._parts[lastIndex] = ['taxForms', blob];

                } catch (e) {
                    console.warn('Error loading taxForm file:', e);
                }
            }
        } else {
            formDataToSend.append('taxForms', '');
        }

        try {
            console.log("Payload being sent:", formDataToSend);

            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formDataToSend, // No need to set Content-Type, fetch will handle it
            });

            console.log("Response received");

            const data = await response.json();

            if (!response.ok) {
                // console.error("Error:", data.error);
                // setErrors({ apiError: data.error || "An error occurred. Please try again." });
                // setIsLoading(false);

                console.error("Error:", data.error);

                const errorMsg = data.error?.toLowerCase();

                if (errorMsg.includes("email already exists")) {
                    setErrors({ email: "Email already exists" });
                    // setIsSecondStep(false);
                } else if (errorMsg.includes("phone number already exists")) {
                    setErrors({ phoneNumber: "Phone number already exists" });
                    // setIsSecondStep(false);
                } else {
                    setErrors({ apiError: data.error || "An error occurred. Please try again." });
                }
                setIsLoading(false);
            } else {
                console.log("Success: Technician created successfully!");
                await AsyncStorage.setItem("isRegistered", "true");
                // navigation.navigate("Login");
                setSuccessModalVisible(true)
                // Toast.show("You have successfully registered! Waiting for admin approval.");
            }
        } catch (error) {
            console.error("Network request failed:", error);
            setErrors({ apiError: "Network request failed. Please check your internet connection." });
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        navigation.navigate("Login");
    };

    useEffect(() => {
        fetchCountries();
    }, []);

    

    useEffect(() => {
        fetchCountries();
    }, []);


    const fetchCountries = async () => {
        try {
            setIsLoadingState(true);
            const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
            const data = await response.json();
            console.log("wokting:::fetchcountyr", data);

            const countryNames = data.map((item) => item.name.common);
            const sortedCountries = countryNames.sort((a, b) => a.localeCompare(b));

            setCountries(sortedCountries);
        } catch (error) {
            console.error("Error fetching countries:", error);
        } finally {
            setIsLoadingState(false);
        }
    };

    const fetchStates = async (country) => {
        console.log("countyr:::", country);
        try {
            setIsLoadingState(true);
            console.log("Sending request to fetch states...");

            const response = await axios.post("https://countriesnow.space/api/v0.1/countries/states", { country });

            console.log("API response:", response.data);

            const stateList = response.data?.data?.states || [];
            console.log("Extracted state list:", stateList);

            setStates(stateList);
        } catch (error) {
            console.error("Error fetching states:", error);
        } finally {
            setIsLoadingState(false);
        }
    };

    const fetchCities = async (country, state) => {
        try {
            setIsLoadingState(true);
            const response = await axios.post("https://countriesnow.space/api/v0.1/countries/state/cities", {
                country,
                state,
            });
            setCities(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setIsLoadingState(false);
        }
    };

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
            });

            if (files.length < 10) {
                setFiles([...files, result[0]]);
            } else {
                alert("You can only upload up to 10 files.");
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log("User cancelled the picker");
            } else {
                console.log("Error:", err);
            }
        }
    };

    const removeFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
    };

    return (
        <KeyboardAvoidingView
            style={[flex]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Header title={"Register"} onBack={() => { navigation.goBack(); 
            }} />
            {isLoadingState && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={blueColor} />
                </View>
            )}
            <ScrollView style={[styles.container, flex]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.subtitle, textAlign]}>{CREATE_YOUE_NEW_ACCOUNT}</Text>
                <TouchableOpacity onPress={openFrontCamera} style={[styles.circleButton, { marginTop: spacings.large }]}>
                    {capturedImage ? (
                        <>
                            <Image source={{ uri: capturedImage }} style={styles.image} />
                            <View style={[{
                                position: "absolute", width: 30, height: 30,
                                bottom: 2, right: 0, borderRadius: 50, backgroundColor: whiteColor,
                                borderColor: blueColor, borderWidth: 1
                            }, alignJustifyCenter]}>
                                <Ionicons name="camera" size={20} color={blueColor} />

                            </View>
                        </>
                    ) : (
                        <Ionicons name="camera" size={35} color={blueColor} />
                    )}
                </TouchableOpacity>
                <Text style={[styles.label, textAlign, { marginVertical: spacings.large }]}>
                    Profile Image
                </Text>
                <Text style={[styles.label, textAlign, { fontSize: 11, color: redColor }]}>
                    Note - To ensure account verification, please use a profile picture that clearly shows your face. Accounts with other types of images may be rejected.
                </Text>
                {enterpriseValue === "Single-Technician" && (
                    <>
                        <CustomTextInput
                            label="Business Name (Optional)"
                            placeholder="Enter your business name"
                            value={formData.businessName}
                            onChangeText={(text) => handleInputChange("businessName", text)}
                            required={false}
                        />
                        {errors.businessName && <Text style={styles.error}>{errors.businessName}</Text>}
                        <View style={styles.phoneContainer}>
                            <Text style={styles.label}>
                                Business Logo (Optional)
                            </Text>
                            {!businessLogo ? (
                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            if (Platform.OS === 'android') {
                                                const granted = await PermissionsAndroid.request(
                                                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                                                    {
                                                        title: "Storage Permission",
                                                        message: "App needs access to your storage to select images",
                                                        buttonPositive: "OK",
                                                    }
                                                );
                                                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                                                    Alert.alert("Permission Denied", "You need to allow storage access to select images.");
                                                    return;
                                                }
                                            }

                                            // Launch image picker
                                            const result = await launchImageLibrary({
                                                mediaType: 'photo',
                                                quality: 0.8,
                                                selectionLimit: 1, // Only allow single selection
                                            });

                                            if (!result.didCancel && result.assets && result.assets.length > 0) {
                                                const selectedImage = result.assets[0];
                                                console.log(selectedImage);

                                                // Compress the image
                                                const compressedImage = await ImageCompressor.compress(selectedImage.uri, {
                                                    maxWidth: 1024,
                                                    maxHeight: 1024,
                                                    quality: 0.8,
                                                    compressionMethod: 'auto'
                                                });

                                                // Set the compressed image URI in state
                                                setBusinessLogo(compressedImage);
                                            }
                                        } catch (err) {
                                            console.log("Error picking business logo:", err);
                                        }
                                    }}
                                    style={[{
                                        width: "100%",
                                        borderColor: blueColor,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderStyle: 'dashed',
                                        padding: spacings.small2x,
                                    }, alignJustifyCenter]}
                                >
                                    <Ionicons name="cloud-upload-outline" size={30} color={grayColor} />
                                    <Text style={{ marginTop: 5, fontSize: 12 }}>Upload Business Logo</Text>
                                    <Text style={[styles.label, { fontSize: 10, color: grayColor }]}>
                                        (Only image files will be accepted)
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ marginTop: 10, alignItems: "center", position: "relative" }}>
                                    <Image
                                        source={{ uri: businessLogo }}
                                        style={{ width: 100, height: 100, borderRadius: 5 }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setBusinessLogo(null)}
                                        style={{
                                            position: "absolute",
                                            top: -5,
                                            right: -5,
                                            backgroundColor: "red",
                                            borderRadius: 10,
                                            width: 20,
                                            height: 20,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: "white", fontSize: 12 }}>X</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {errors.businessLogo && <Text style={styles.error}>{errors.businessLogo}</Text>}
                        </View>
                    </>
                )}
                {/* Input fields */}
                <CustomTextInput
                    label="First Name"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange("firstName", text)}
                    required={true}
                    maxLength={20}
                />
                {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

                <CustomTextInput
                    label="Last Name"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange("lastName", text)}
                    required={true}
                    maxLength={20}
                />
                {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

                <CustomTextInput
                    label="Email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChangeText={(text) => {
                        const updatedText = text.charAt(0).toLowerCase() + text.slice(1);
                        handleInputChange("email", updatedText);
                    }}
                    required={true}
                />
                {errors.email && <Text style={styles.error}>{errors.email}</Text>}

                <View style={styles.phoneContainer}>
                    <Text style={styles.label}>
                        Phone Number<Text style={styles.asterisk}> *</Text>
                    </Text>
                    <PhoneInput
                        ref={phoneInput}
                        defaultValue={formData.phoneNumber.replace(/^\+\d+\s?-?\s?/, '')}
                        defaultCode="US"
                        layout="second"
                        onChangeFormattedText={(text) => handleInputChange("phoneNumber", text)}
                        containerStyle={styles.phoneInput}
                        textContainerStyle={styles.phoneText}
                        textInputStyle={[styles.phoneTextInput, { marginBottom: isTablet ? 12 : 0 }]}
                        textInputProps={{
                            maxLength: 13,
                            keyboardType: "default",
                        }}
                        flagButtonStyle={styles.flagButton}
                        placeholder="Enter your phone number"
                    />
                </View>
                {errors.phoneNumber && <Text style={styles.error}>{errors.phoneNumber}</Text>}
                <View style={styles.phoneContainer}>
                    <Text style={styles.label}>
                        Address<Text style={styles.asterisk}> *</Text>
                    </Text>
                    <View style={{ flex: 1, position: 'relative', zIndex: 999 }}>
                        <GooglePlacesAutocomplete
                            ref={googleRef}
                            placeholder="Enter Your Address"
                            fetchDetails={true}
                            onPress={(data, details = null) => {
                                console.log('Selected:', data?.description);
                                handleInputChange("address", data?.description);
                                // Update text manually
                                googleRef.current?.setAddressText(data?.description);

                                // Delay the blur slightly to ensure suggestions unmount properly
                                setTimeout(() => {
                                    googleRef.current?.blur();
                                }, 100);
                            }}
                            enablePoweredByContainer={false}
                            // keepResultsAfterBlur={Platform.OS === "android" ? false : true}
                            query={{
                                key: GOOGLE_MAP_API_KEY,
                                language: 'en',
                            }}
                            styles={{
                                container: {
                                    flex: 1,
                                    zIndex: 999,
                                },
                                listView: {
                                    zIndex: 999,
                                    elevation: 5,
                                    backgroundColor: "#fff",
                                    marginTop: 5,
                                },
                                textInputContainer: {
                                    zIndex: 999,
                                },
                                textInput: {
                                    height: 44,
                                    borderWidth: 1,
                                    borderColor: blueColor,
                                    borderRadius: 50,
                                    paddingHorizontal: 16,
                                    backgroundColor: '#fff',
                                },
                            }}
                        />
                    </View>
                </View>
                {errors.address && <Text style={styles.error}>{errors.address}</Text>}
                <CustomTextInput
                    label="Secondary Email (Optional)"
                    placeholder="Enter your secondary email"
                    value={formData.secondaryEmail}
                    // onChangeText={(text) => handleInputChange("secondaryEmail", text)}
                    onChangeText={(text) => {
                        const updatedText = text.charAt(0).toLowerCase() + text.slice(1);
                        handleInputChange("secondaryEmail", updatedText);  // Update the form data with modified email
                    }}
                />
                {errors.secondaryEmail && <Text style={styles.error}>{errors.secondaryEmail}</Text>}
                <View style={styles.phoneContainer}>
                    <Text style={styles.label}>
                        Secondary Phone Number (Optional)
                    </Text>
                    <PhoneInput
                        ref={phoneInput}
                        defaultValue={formData.secondaryPhoneNumber}
                        defaultCode="US"
                        layout="second"
                        onChangeFormattedText={(text) => handleInputChange("secondaryPhoneNumber", text)}
                        textInputProps={{
                            maxLength: 13,
                            keyboardType: "default",
                        }}
                        containerStyle={styles.phoneInput}
                        textContainerStyle={styles.phoneText}
                        textInputStyle={[styles.phoneTextInput, { marginBottom: isTablet ? 12 : 0 }]}
                        flagButtonStyle={styles.flagButton}
                        placeholder="Enter your secondary phone number"
                    />
                </View>
                {errors.secondaryPhoneNumber && <Text style={styles.error}>{errors.secondaryPhoneNumber}</Text>}
                <View style={styles.phoneContainer}>
                    <Text style={styles.label}>
                        Tax Forms (Optional)
                    </Text>
                    {files.length === 0 ? (
                        <TouchableOpacity
                            onPress={pickFile}
                            style={[{
                                width: "100%",
                                borderColor: blueColor,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderStyle: 'dashed',
                                padding: spacings.small2x,
                            }, alignJustifyCenter]}
                        >
                            <Ionicons name="cloud-upload-outline" size={30} color={grayColor} />
                            <Text style={{ marginTop: 5, fontSize: 12 }}>Upload File</Text>
                            <Text style={[styles.label, { fontSize: 10, color: grayColor }]}>
                                (Only PDF, PNG, JPEG, and WEBP files will be accepted)
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <FlatList
                            data={filesWithAddButton}
                            numColumns={4}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item, index }) => (
                                item.isAddButton ? (
                                    files.length < 10 && (
                                        <TouchableOpacity
                                            onPress={pickFile}
                                            style={{
                                                width: 68.5,
                                                height: 68.5,
                                                borderRadius: 5,
                                                backgroundColor: "#eee",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                margin: 5,
                                            }}
                                        >
                                            <Ionicons name="add" size={24} color="black" />
                                        </TouchableOpacity>
                                    )
                                ) : (
                                    <View style={{ margin: 5, alignItems: "center", position: "relative" }}>
                                        {item.type.startsWith("image/") ? (
                                            <Image
                                                source={{ uri: item.uri }}
                                                style={{ width: 68.5, height: 68.5, borderRadius: 5 }}
                                            />
                                        ) : (
                                            <View
                                                style={{
                                                    width: 68.5,
                                                    height: 68.5,
                                                    borderRadius: 5,
                                                    backgroundColor: "#ccc",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ fontSize: 8, textAlign: "center" }}>{item.name}</Text>
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            onPress={() => removeFile(index)}
                                            style={{
                                                position: "absolute",
                                                top: -5,
                                                right: -5,
                                                backgroundColor: "red",
                                                borderRadius: 10,
                                                width: 20,
                                                height: 20,
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: "white", fontSize: 12 }}>X</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                            )}
                        />
                    )}
                </View>

                <CustomTextInput
                    label="Password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChangeText={(text) => handleInputChange("password", text)}
                    secureTextEntry={!isPasswordVisible}
                    required={true}
                    rightIcon={
                        <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
                            <MaterialCommunityIcons name={isPasswordVisible ? "eye" : "eye-off"} size={20} color={grayColor} />
                        </TouchableOpacity>
                    }
                />
                {errors.password && <Text style={styles.error}>{errors.password}</Text>}

                <CustomTextInput
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange("confirmPassword", text)}
                    secureTextEntry={!isConfirmPasswordVisible}
                    required={true}
                    rightIcon={
                        <TouchableOpacity onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                            <MaterialCommunityIcons name={isConfirmPasswordVisible ? "eye" : "eye-off"} size={20} color={grayColor} />
                        </TouchableOpacity>
                    }
                />
                {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
                {errors.apiError && <Text style={styles.error}>{errors.apiError}</Text>}

                <CustomButton title="Register" onPress={handleRegister} style={styles.button} loading={isLoading} disabled={isLoading} />
                {/* </>
                )} */}

                <Text style={[styles.footerText, textAlign]}>
                    {ALREADY_HAVE_AN_ACCOUNT}{" "}
                    <Text style={styles.loginText} onPress={handleLogin}>
                        {LOGIN}
                    </Text>
                </Text>
                {successModalVisible && <SuccessModal
                    visible={successModalVisible}
                    onClose={() => setSuccessModalVisible(false)}
                    headingText={"Thank You for signing up!"}
                    text={"Your account request has been submitted successfully and is currently under review by our team. You will receive an email notification once your account is approved."}
                    onPressContinue={() => { setSuccessModalVisible(false), navigation.navigate("Login"); }}
                />}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
        paddingTop: 20
    },
    logoContainer: {
        marginBottom: spacings.Large1x,
        height: Platform.OS === "android" ? hp(19) : hp(17),
    },
    logo: {
        width: wp(35),
        height: hp(9),
        marginVertical: spacings.large,
    },
    content: {
        paddingHorizontal: spacings.Large2x,
        paddingBottom: spacings.Large2x
    },
    title: {
        fontSize: style.fontSizeLargeXX.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: blackColor,
        marginVertical: spacings.large,
    },
    subtitle: {
        fontSize: style.fontSizeLargeXX.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: blackColor,
    },

    halfInput: {
        width: wp(42.5),
        marginRight: spacings.large,
        // height: Platform.OS === "android" ? hp(5.5) : hp(4.5),
    },
    button: {
        marginTop: spacings.Large2x,
    },
    footerText: {
        marginTop: spacings.Large2x,
        marginBottom: spacings.large,
        color: blackColor,
    },
    loginText: {
        fontSize: style.fontSizeNormal.fontSize,
        color: blueColor,
        fontWeight: style.fontWeightThin1x.fontWeight,
    },
    phoneContainer: {
        marginTop: 16,
    },
    label: {
        fontSize: 14,
        color: blackColor,
        marginBottom: 7,
        fontWeight: "500",
    },
    phoneInput: {
        borderWidth: 1,
        borderColor: blueColor,
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
        height: 40,
    },
    flagButton: {
        width: 70,
        justifyContent: "center",
        alignItems: "center",
    },
    error: {
        color: "red",
        fontSize: 12,
        marginTop: 4
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
        borderColor: blueColor,
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

});

export default SignUpScreen;
