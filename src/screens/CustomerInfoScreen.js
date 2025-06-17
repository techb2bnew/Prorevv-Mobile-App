import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, ScrollView, Image, Pressable, TouchableOpacity, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, TextInput, Dimensions, PermissionsAndroid, Alert } from "react-native";
import CustomButton from '../componets/CustomButton';
import CustomTextInput from '../componets/CustomTextInput';
import { blackColor, blueColor, grayColor, lightBlueColor, lightOrangeColor, lightShadeBlue, mediumGray, orangeColor, redColor, whiteColor } from "../constans/Color";
import { ADDRESS, ALREADY_HAVE_AN_ACCOUNT, API_BASE_URL, CITY, COUNTRY, CREATE_YOUE_NEW_ACCOUNT, CUSTOMER_INFORMATION, EMAIL, ESSENTIAL_FOR_REGISTRATION, FIRST_NAME, LAST_NAME, LOGIN, PHONE_NUMBER, STATE, WELCOME, ZIP_CODE } from "../constans/Constants";
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import PhoneInput from "react-native-phone-number-input";
import DatePicker from "react-native-date-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import CustomDropdown from "../componets/CustomDropdown";
import NetInfo from "@react-native-community/netinfo";
import Header from "../componets/Header";
import { useFocusEffect } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { Image as ImageCompressor } from 'react-native-compressor';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const CustomerInfoScreen = ({ navigation }) => {
    const phoneInput = useRef(null);
    const [errors, setErrors] = useState({});
    // const [loading, setLoading] = useState(false);
    const [isLoadingState, setIsLoadingState] = useState(true);
    const [states, setStates] = useState([]);
    const [stateValue, setStateValue] = useState("");
    const [countries, setCountries] = useState([]);
    const [countryValue, setCountryValue] = useState("United States" || "");
    const [technicianId, setTechnicianId] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [isConnected, setIsConnected] = useState(true);
    const { width, height } = Dimensions.get("window");
    const [cities, setCities] = useState([]);
    const [cityValue, setCityValue] = useState("");
    const [capturedImage, setCapturedImage] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [addVehicleLoading, setAddVehicleLoading] = useState(false);

    const isTablet = width >= 668 && height >= 1024;

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        country: countryValue,
        state: "",
        city: "",
        zipCode: "",
        image: null
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


    useFocusEffect(
        React.useCallback(() => {
            const checkConnectionAndFetchCountries = async () => {
                const netInfo = await NetInfo.fetch();
                if (netInfo.isConnected) {
                    fetchCountries();
                } else {
                    console.log("Offline mode: Not fetching countries.");
                    setIsLoadingState(false); // ensure loader doesn't keep spinning

                }
            };

            checkConnectionAndFetchCountries();
        }, [])
    );

    // useEffect(() => {
    //     const checkConnectionAndFetchStates = async () => {
    //         const netInfo = await NetInfo.fetch();
    //         if (netInfo.isConnected) {
    //             fetchStates();
    //         } else {
    //             console.log("Offline mode: Not fetching states.");
    //             setIsLoadingState(false); // ensure loader doesn't keep spinning

    //         }
    //     };
    //     checkConnectionAndFetchStates();
    // }, [formData.country]);


    // useEffect(() => {
    //     const checkConnectionAndFetchCities = async () => {
    //         const netInfo = await NetInfo.fetch();
    //         if (netInfo.isConnected) {
    //             if (formData.country && formData.state) {
    //                 fetchCities(); // fetch only when country & state both selected
    //             } else {
    //                 console.log("Country or State not selected. Skipping city fetch.");
    //                 setIsLoadingState(false); // ensure loader doesn't keep spinning

    //             }
    //         } else {
    //             console.log("Offline mode: Not fetching cities.");
    //         }
    //     };
    //     checkConnectionAndFetchCities();
    // }, [formData.country, formData.state]);


    const fetchCountries = async () => {
        setIsLoadingState(true);
        try {
            console.log("Fetching countries...");
            const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
            const data = await response.json();

            console.log("Fetched Countries:", data);
            if (Array.isArray(data)) {
                const countryNames = data.map((item) => item.name.common);
                const sortedCountries = countryNames.sort((a, b) => a.localeCompare(b));
                setCountries(sortedCountries);
            } else {
                console.log("No countries found.");
            }
        } catch (error) {
            console.error("Error fetching countries:", error);
        } finally {
            setIsLoadingState(false);
        }
    };


    const fetchStates = async () => {
        setIsLoadingState(true);
        console.log("formData.country", formData?.country);
        try {
            const response = await axios.post(
                "https://countriesnow.space/api/v0.1/countries/states",
                { country: formData?.country }
            );

            if (response.data && response.data.data && response.data.data.states) {
                console.log("States of", formData.country, ":", response.data.data.states);
                setStates(response.data.data.states)
            } else {
                console.log("No states found for", formData.country);
            }
        } catch (error) {
            console.error("Error fetching states:", error);
        } finally {
            setIsLoadingState(false)
        }
    };

    const fetchCities = async () => {
        setIsLoadingState(true);
        try {
            const response = await axios.post(
                "https://countriesnow.space/api/v0.1/countries/state/cities",
                {
                    country: formData.country,
                    state: formData.state,
                }
            );

            if (response.data && response.data.data) {
                console.log("Cities of", formData.state, ":", response.data.data);
                setCities(response.data.data);
            } else {
                console.log("No cities found for", formData.state);
            }
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setIsLoadingState(false);
        }
    };

    const handleInputChange = (field, value) => {
        console.log("fieldfield", field);

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
            console.log("Internet Status Changed: ", state.isConnected);

            // if (state.isConnected) {
            //     console.log("Internet is back. Syncing offline customers...");
            //     syncOfflineCustomers();
            // }
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    // const handleSubmit = async () => {
    //     if (!technicianId) {
    //         setErrors({ apiError: "Technician ID is required." });
    //         return;
    //     }

    //     console.log("Internet status:", isConnected);

    //     const customerData = {
    //         ...formData,
    //         userId: technicianId,
    //         roleType: technicianType
    //     };

    //     if (isConnected) {
    //         console.log("Internet available. Sending data to API...");
    //         await syncCustomerToAPI(customerData);
    //     } else {
    //         console.log("No internet. Saving data locally...");
    //         await saveCustomerOffline(customerData);
    //     }
    // };


    const validateForm = () => {
        const newErrors = {};

        // First Name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
            newErrors.firstName = "First name should contain only letters";
        }

        // Last Name validation
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        }

        // Phone number validation
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        } else if (!/^[0-9\s\-().+]{7,20}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "Please enter a valid phone number";
        }


        // else if (!/^\+[0-9]{1,3}-[0-9]{3,14}$/.test(formData.phoneNumber)) {
        //     newErrors.phoneNumber = "Please enter a valid phone number";
        // }

        // Address validation
        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        // Country validation
        if (!formData.country.trim()) {
            newErrors.country = "Country is required";
        }

        // State validation
        // if (!formData.state.trim()) {
        //     newErrors.state = "State is required";
        // }

        // City validation
        // if (!formData.city.trim()) {
        //     newErrors.city = "City is required";
        // }

        // // Zip Code validation
        if (!formData.zipCode.trim()) {
            newErrors.zipCode = "Zip code is required";
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
            // Toast.show("Please fix the errors in the form");
            return;
        }
        const customerData = {
            ...formData,
            userId: technicianId,
            roleType: technicianType
        };
        setLocalLoading(true);

        let success = false;

        if (isConnected) {
            success = await syncCustomerToAPI(customerData);
        } else {
            success = await saveCustomerOffline(customerData);
        }
        setLocalLoading(false);

        if (success) {
            Toast.show("Successfully created a new customer!");
            if (nextAction === "AddVehicleScreen") {
                navigation.navigate("AddVehicle");
            } else {
                navigation.goBack();
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
        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }

            // setLoading(true);
            const formDataToSend = new FormData();

            // Append customer data
            for (const key in customerData) {
                if (key !== 'image' && customerData.hasOwnProperty(key)) {
                    formDataToSend.append(key, customerData[key]);
                }
            }

            // Append image if available
            if (customerData.image) {
                const newUri = Platform.OS === 'ios'
                    ? customerData.image.replace('file://', '')
                    : customerData.image;

                formDataToSend.append("image", {
                    uri: newUri,
                    name: "image.jpg",
                    type: "image/jpeg"
                });
            }

            const response = await axios.post(
                `${API_BASE_URL}/createCustomer`,
                formDataToSend,
                {
                    headers: {
                        // "Content-Type": "application/x-www-form-urlencoded",
                        "Content-Type": "multipart/form-data",
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
                // setIsSecondStep(false);
            } else if (errorMsg.includes("invalid email format")) {
                setErrors({ email: "Invalid email format" });
                // setIsSecondStep(false);
            } else if (errorMsg.includes("phone number already exists")) {
                setErrors({ phoneNumber: "Phone number already exists" });
                // setIsSecondStep(false);
            } else {
                setErrors({ apiError: errorMsg || "An error occurred. Please try again." });
            }
            // setErrors({ apiError: error.response?.data?.error || "An error occurred." });
            // Toast.show(error.response?.data?.error)
            return false;

        }
    };

    const handleImageUpload = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                { text: "Camera", onPress: requestCameraPermission },
                { text: "Gallery", onPress: openGallery },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'This app needs access to your camera to take photos.',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                // Permission granted, open the camera
                openCamera();
            } else {
                // Permission denied
                Alert.alert('Permission Denied', 'You need to allow camera access to take photos.');
            }
        } else {
            // iOS doesn't need manual permission handling
            openCamera();
        }
    };

    // Function to compress the selected image
    const compressImage = async (uri) => {
        try {
            const compressedUri = await ImageCompressor.compress(uri, {
                quality: 0.7, // Reduce quality to 70%
                maxWidth: 500, // Resize width
                maxHeight: 500, // Resize height
            });

            return compressedUri;
        } catch (error) {
            console.log('Image Compression Error:', error);
            return uri; // Return original URI if compression fails
        }
    };

    // Function to handle image selection from Camera
    const openCamera = () => {
        launchCamera(
            {
                mediaType: "photo",
                quality: 1,
                includeBase64: false,
                maxWidth: 800,
                maxHeight: 800,
            },
            async (response) => {
                if (response.didCancel) {
                    console.log("User canceled camera");
                } else if (response.errorCode) {
                    console.log("Camera Error: ", response.errorMessage);
                } else {
                    const compressedUri = await compressImage(response.assets[0].uri);
                    setCapturedImage(compressedUri);
                    handleInputChange("image", compressedUri)
                }
            }
        );
    };

    // Function to handle image selection from Gallery
    const openGallery = () => {
        launchImageLibrary(
            {
                mediaType: "photo",
                quality: 1,
                includeBase64: false,
                selectionLimit: 1,
                maxWidth: 800,
                maxHeight: 800,
            },
            async (response) => {
                if (response.didCancel) {
                    console.log("User canceled gallery");
                } else if (response.errorCode) {
                    console.log("Gallery Error: ", response.errorMessage);
                } else {
                    const compressedUri = await compressImage(response.assets[0].uri);
                    setCapturedImage(compressedUri);
                    handleInputChange("image", compressedUri)
                }
            }
        );
    };


    return (
        <View style={{ flex: 1, backgroundColor: whiteColor }}>
            {isLoadingState && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={blueColor} />
                </View>
            )}
            <KeyboardAvoidingView
                style={[flex]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >

                <Header title={CUSTOMER_INFORMATION} />
                {isConnected && <TouchableOpacity
                    onPress={() => handleSubmit("AddVehicleScreen", setAddVehicleLoading)}
                    disabled={addVehicleLoading || submitLoading}
                    style={{
                        position: "absolute",
                        top: Platform.OS === "android" ? isTablet ? 20 : 10 : isTablet ? 20 : 13,
                        right: 10,
                        borderColor: blueColor,
                        height: isTablet ? wp(6) : wp(9),
                        borderRadius: 5,
                        borderWidth: 2,
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                        backgroundColor: blueColor,
                        paddingHorizontal: spacings.large,
                    }}
                >
                    <Ionicons name="car-sport-outline" size={25} color={whiteColor} />
                    <Text style={[styles.label, textAlign, { marginBottom: 0, padding: 5, color: whiteColor }]}>
                        Add Vehicle
                    </Text>
                </TouchableOpacity>}
                <ScrollView style={[styles.container, flex]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    <View style={styles.content}>
                        <TouchableOpacity onPress={handleImageUpload} style={[styles.circleButton, { marginTop: spacings.large }]}>
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
                            Customer Image (Optional)
                        </Text>
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
                                defaultValue={formData.phoneNumber}
                                defaultCode="US"
                                layout="second"
                                onChangeFormattedText={(text) => handleInputChange("phoneNumber", text)}
                                textInputProps={{
                                    maxLength: 13,
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

                        <CustomTextInput
                            label="Address"
                            placeholder="Enter your address"
                            value={formData.address}
                            onChangeText={(text) => handleInputChange("address", text)}
                            required={true}
                        />
                        {errors.address && <Text style={styles.error}>{errors.address}</Text>}

                        <View style={[flexDirectionRow, justifyContentSpaceBetween]}>
                            <View style={[styles.phoneContainer, { width: "48%" }]}>
                                {isConnected && <Text style={styles.label}>
                                    Country<Text style={styles.asterisk}> *</Text>
                                </Text>}

                                {isConnected ? (
                                    <CustomDropdown
                                        data={countries}
                                        country={true}
                                        selectedValue={countryValue}
                                        onSelect={(value) => {
                                            setCountryValue(value);
                                            handleInputChange("country", value);
                                            // fetchStates(value)
                                            setStateValue("");
                                            setCityValue("");
                                            setStates([]);
                                            setCities([]);
                                        }}
                                        // showIcon={true}
                                        titleText={"Select a Country"}
                                        rightIcon={true}

                                    />
                                ) : (
                                    <CustomTextInput
                                        label="Country"
                                        placeholder="Enter country"
                                        value={formData.country}
                                        onChangeText={(text) => handleInputChange("country", text)}
                                        required={true}
                                        multiline={false} // Ensures single line
                                        numberOfLines={1} // Keeps text in one line

                                    />
                                )}

                                {errors.country && <Text style={styles.error}>{errors.country}</Text>}
                            </View>

                            <View style={[{ width: "48%" }]}>
                                {/* {isConnected && <Text style={styles.label}>
                                    State
                                </Text>} */}

                                {/* {isConnected ? (
                                    <CustomDropdown
                                        data={states}
                                        state={true}
                                        selectedValue={stateValue}
                                        onSelect={(value) => {
                                            setStateValue(value);
                                            handleInputChange("state", value);
                                            setCityValue("");
                                            setCities([]);
                                        }}
                                        // showIcon={true}
                                        titleText={"Select a State"}
                                        rightIcon={true}

                                    />
                                ) : ( */}
                                <CustomTextInput
                                    label="State"
                                    placeholder="Enter state"
                                    value={formData.state}
                                    onChangeText={(text) => handleInputChange("state", text)}
                                    // required={true}
                                    multiline={false}
                                    numberOfLines={1}
                                />
                                {/* )} */}

                                {errors.state && <Text style={styles.error}>{errors.state}</Text>}
                            </View>
                        </View>


                        <View style={[flexDirectionRow, justifyContentSpaceBetween]}>
                            <View style={[{ width: "48%", marginTop: 0, marginRight: 10, }]}>
                                {/* {isConnected && <Text style={styles.label}>
                                    City
                                </Text>} */}

                                {/* {isConnected ? (
                                    <CustomDropdown
                                        data={cities}
                                        selectedValue={cityValue}
                                        onSelect={(value) => {
                                            console.log("value", value);
                                            setCityValue(value);
                                            handleInputChange("city", value);
                                        }}
                                        titleText={"Select a City"}
                                        placeholder={"Select a City"}
                                        rightIcon={true}
                                    />
                                ) : ( */}
                                <CustomTextInput
                                    label="City"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChangeText={(text) => handleInputChange("city", text)}
                                    style={[styles.halfInput, { width: isTablet ? wp(44.5) : wp(42.5) }]}
                                    // required={true}
                                    multiline={false}
                                    numberOfLines={1}

                                />
                                {/* )} */}

                                {errors.city && <Text style={styles.error}>{errors.city}</Text>}
                            </View>
                            <View>
                                <CustomTextInput
                                    label="Zip Code"
                                    placeholder="Enter zip code"
                                    value={formData.zipCode}
                                    onChangeText={(text) => handleInputChange("zipCode", text)}
                                    style={[styles.halfInput, { width: isTablet ? wp(44.5) : wp(42.5) }]}
                                    required={true}
                                    multiline={false} // Ensures single line
                                    numberOfLines={1} // Keeps text in one line
                                    maxLength={10}

                                />
                                {errors.zipCode && <Text style={styles.error}>{errors.zipCode}</Text>}
                            </View>
                        </View>
                        {errors?.apiError?.message ? (
                            <Text style={styles.error}>{errors.apiError.message}</Text>
                        ) : (
                            <Text style={styles.error}>{JSON.stringify(errors.apiError)}</Text>
                        )}
                    </View>

                </ScrollView >

            </KeyboardAvoidingView>
            <View style={[{ backgroundColor: whiteColor, paddingTop: spacings.xLarge, paddingHorizontal: spacings.xxxLarge }, alignJustifyCenter]}>
                {/* {isConnected && <CustomButton
                        title="Add Vehicle"
                        onPress={() => handleSubmit("AddVehicleScreen", setAddVehicleLoading)}
                        style={[styles.button]}
                        loading={addVehicleLoading}
                        disabled={addVehicleLoading || submitLoading}
                        iconType="Ionicons"
                        iconName="car-sport-outline"
                    />} */}
                <CustomButton
                    title="Submit"
                    onPress={() => handleSubmit(null, setSubmitLoading)}
                    style={[styles.button, { backgroundColor: blueColor, borderWidth: 1, borderColor: blueColor }]}
                    textStyle={{ color: whiteColor }}
                    loading={submitLoading}
                    disabled={submitLoading || addVehicleLoading}
                />

            </View>
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
        marginBottom: spacings.large
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

export default CustomerInfoScreen;
