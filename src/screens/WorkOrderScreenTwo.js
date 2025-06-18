import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Pressable, ScrollView, Alert, ScrollViewBase, Image, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Keyboard, Dimensions, TouchableWithoutFeedback } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { blackColor, blueColor, grayColor, greenColor, lightBlueColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { API_BASE_URL, CREATE_NEW_JOB, NEW_WORK_ORDER } from '../constans/Constants';
import CustomTextInput from '../componets/CustomTextInput';
import axios from 'axios';
import CustomButton from '../componets/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkInfo } from 'react-native-network-info';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import SuccessModal from '../componets/Modal/SuccessModal';
import Toast from 'react-native-simple-toast';
import { ALERT_IMAGE, SUCCESS_IMAGE, XCIRCLE_IMAGE } from '../assests/images';
import { Image as ImageCompressor } from 'react-native-compressor';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import NetInfo from "@react-native-community/netinfo";
import { EventRegister } from 'react-native-event-listeners';
import Header from '../componets/Header';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const WorkOrderScreenTwo = ({ route }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const navigation = useNavigation();
    const [vin, setVin] = useState('');
    const [carDetails, setCarDetails] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [vinError, setVinError] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    const [notes, setNotes] = useState("");
    const [imageUris, setImageUris] = useState([]);
    const [selectedColor, setSelectedColor] = useState();
    const [selectedColorError, setSelectedColorError] = useState();
    const [imageError, setImageError] = useState();
    const [loading, setLoading] = useState(false);
    const [isCustomerLoading, setIsCustomerLoading] = useState(true);
    const [isLoadingCarDetails, setIsLoadingCarDetails] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedValues, setUpdatedValues] = useState({});
    const [technicianId, setTechnicianId] = useState();
    const [technicianName, setTechnicianName] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [duplicateVinModal, setDuplicateVinModal] = useState(false);
    const [newFormData, setNewFormData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jobDescription, setJobDescription] = useState([{ jobDescription: "", cost: "" }]);
    const [jobDescriptionError, setJobDescriptionError] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSaveVisible, setIsSaveVisible] = useState(false);
    const [isVinApiError, setIsVinApiError] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [labourCost, setLabourCost] = useState('');
    const [textInputHeights, setTextInputHeights] = useState({});
    const [vTypeopen, setVTypeOpen] = useState(false);
    const [selectedVehicleType, setSelectedVehicleType] = useState(null);
    const [vehicleTypeError, setVehicleTypeError] = useState();
    const [storedVehicles, setStoredVehicles] = useState([]);
    const [storedPayRate, setStoredPayRate] = useState('');
    const inputRefs = useRef([]);
    const [step, setStep] = useState(1); // 1 = VIN Input, 2 = Car Info Form


    const [modalData, setModalData] = useState({
        visible: false,
        headingText: '',
        buttonText: '',
        button2Text: '',
        image: "",
        navigateTo: '',
    });

    // Color options array (color name and hex code)
    const colorOptions = [
        'Black', 'Grey', 'Blue', 'Silver', 'Red', 'Maroon',
        'Yellow', 'White', 'Brown', 'Tan', 'Gold', 'Green', 'Orange'
    ];

    // Function to get hex value from color name (for visual color circle)
    const getColorHex = (color) => {
        const colorMap = {
            Black: '#000000',
            Grey: '#808080',
            Blue: '#0000FF',
            Silver: '#C0C0C0',
            Red: '#FF0000',
            Maroon: '#800000',
            Yellow: '#FFFF00',
            White: '#FFFFFF',
            Brown: '#A52A2A',
            Tan: '#D2B48C',
            Gold: '#FFD700',
            Green: '#008000',
            Orange: '#FFA500',
        };
        return colorMap[color] || '#000'; // fallback to black
    };

    // Prepare dropdown items with icons (color circle)
    const dropdownItems = colorOptions.map((color) => ({
        label: color,
        value: color.toLowerCase(),
        icon: () => (
            <View style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: getColorHex(color),
                marginRight: 10,
                borderWidth: 1,
                borderColor: '#ccc'
            }} />
        )
    }));

    const selectedVariables = [
        "Vehicle Descriptor",
        "Make",
        "Model",
        "Model Year",
        "Manufacturer Name",
        // "Vehicle Type",
        "Plant City",
        "Plant Country",
        "Plant Company Name",
        "Plant State",
        "Body Class"
    ];

    const carSelectedVariables = [
        "Vehicle Descriptor",
        "Make",
        "Model",
        "Model Year",
        "Manufacturer Name",
        // "Vehicle Type",
    ];

    useFocusEffect(
        useCallback(() => {
            const getTechnicianDetail = async () => {
                try {
                    const storedData = await AsyncStorage.getItem('userDeatils');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        console.log("parsedData:::::", parsedData);
                        setTechnicianId(parsedData.id);
                        setTechnicianType(parsedData.types);
                        const storedName = await AsyncStorage.getItem('technicianName');
                        if (storedName) {
                            setTechnicianName(storedName);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching stored user:", error);
                }
            };

            getTechnicianDetail();
        }, [])
    );

    //IP-Add
    useEffect(() => {
        // Fetch the IP Address when the component is mounted
        NetworkInfo.getIPAddress()
            .then(ip => {
                setIpAddress(ip);
                console.log("ip", ip)
            })
            .catch(err => {
                console.log('Error getting IP address:', err);
            });
    }, []);

    // Tech Assigned Vehicle
    useEffect(() => {
        AsyncStorage.getItem('allowedVehicles').then(data => {
            if (data) {
                setStoredVehicles(JSON.parse(data));
            }
        });
    }, []);

    // Tech Pay Rate
    useEffect(() => {
        const fetchPayRate = async () => {
            const rate = await AsyncStorage.getItem('payRate');
            if (rate) {
                setStoredPayRate(rate);
            }
        };
        fetchPayRate();
    }, [])

    //Vin
    useEffect(() => {
        const { vinNumber } = route.params || {};
        if (vinNumber) {
            console.log("working:::::::::::::::::::::::::", vinNumber)
            // Only VIN is present
            setVin(vinNumber);
            fetchCarDetails(vinNumber);
        }
    }, [route.params?.vinNumber]);

    // fetch Car Details 
    const fetchCarDetails = async (vinNumber) => {
        setCarDetails([]);
        setIsVinApiError(false);
        Keyboard.dismiss();
        if (!vinNumber) {
            setVinError('Please enter a VIN number!');
            return;
        }
        if (vinNumber.trim().length < 17) {
            setVinError('VIN must be 17 characters!');
            return;
        }
        setIsLoadingCarDetails(true)
        try {
            const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/${vinNumber}?format=json`);
            console.log("response.data", response.data.Results);
            // setCarDetails(response.data.Results);
            const filteredData = response.data.Results.filter(detail =>
                selectedVariables.includes(detail.Variable) && detail.Value
            );
            // ✅ Agar selectedVariables me se sirf **2 ya zyada values** hain tabhi proceed karega
            if (filteredData.length >= 2) {
                setCarDetails(filteredData);
                const initialUpdatedValues = {};
                filteredData.forEach(detail => {
                    initialUpdatedValues[detail.Variable] = detail.Value;
                });
                setUpdatedValues(initialUpdatedValues);
                setStep(2);
            } else {
                setIsVinApiError(true);
                setModalData({
                    visible: true,
                    headingText: "VIN Not Found",
                    buttonText: "Manually Enter Vehicle Info",
                    image: XCIRCLE_IMAGE,
                    navigateTo: "",
                });
                // setVin("")
            }
        } catch (error) {
            console.error("error", error);
            setIsVinApiError(true);
            setModalData({
                visible: true,
                headingText: "VIN Not Found",
                buttonText: "Manually Enter Vehicle Info",
                image: XCIRCLE_IMAGE,
                navigateTo: "",
            });
        } finally {
            setIsLoadingCarDetails(false);
        }
    };

    // image upload
    const handleImageUpload = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                { text: "Camera", onPress: () => openCamera() },
                { text: "Gallery", onPress: () => openGallery() },
                { text: "Cancel", style: "cancel" }
            ]
        );
        Keyboard.dismiss();
    };

    // 📷 Open Camera
    const openCamera = () => {
        launchCamera(
            {
                mediaType: 'photo',
                quality: 1,
                includeBase64: false,
                maxWidth: 800,
                maxHeight: 800,
            },
            (response) => {
                if (response.didCancel) {
                    console.log('User canceled camera');
                } else if (response.errorCode) {
                    console.log('Camera Error: ', response.errorMessage);
                } else {
                    // setImageUris([...imageUris, response.assets[0].uri]);
                    compressImage(response.assets[0].uri);
                }
            }
        );
    };

    // 🖼️ Open Gallery
    const openGallery = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                quality: 1,
                includeBase64: false,
                selectionLimit: 1,
                maxWidth: 800,
                maxHeight: 800,
            },
            (response) => {
                if (response.didCancel) {
                    console.log('User canceled gallery');
                } else if (response.errorCode) {
                    console.log('Gallery Error: ', response.errorMessage);
                } else {
                    // setImageUris([...imageUris, response.assets[0].uri]);
                    compressImage(response.assets[0].uri);
                }
            }
        );
    };

    // 📉 Compress Image Before Saving
    const compressImage = async (uri) => {
        try {
            const compressedUri = await ImageCompressor.compress(uri, {
                quality: 0.7, // Reduce quality (1 = 100%)
                maxWidth: 500, // Resize width
                maxHeight: 500, // Resize height
            });

            setImageUris([...imageUris, compressedUri]);
            setImageError("")
        } catch (error) {
            console.log('Image Compression Error:', error);
        }
    };

    // ❌ Remove Image
    const removeImage = (index) => {
        Alert.alert(
            "Remove Image?",
            "Are you sure you want to delete this image?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: () => {
                        const updatedImages = [...imageUris];
                        updatedImages.splice(index, 1);
                        setImageUris(updatedImages);
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleChange = (variable, text) => {
        setUpdatedValues(prev => ({ ...prev, [variable]: text }));
    };

    const toggleEdit = () => {
        if (isEditing) {
            // Save the updated values (if needed, send them to API here)
            console.log("Updated Values: ", updatedValues);
        }
        setIsEditing(!isEditing);
    };

    // Handle Input Change
    const handleInputChange = (text, index, field) => {
        const updatedFields = jobDescription.map((item, i) =>
            i === index ? { ...item, [field]: text } : item
        );
        setJobDescription(updatedFields);
    };

    // Add New Row
    const addNewField = () => {
        setJobDescription([...jobDescription, { jobDescription: "", cost: "" }]);
    };

    // Delete Row
    const handleDelete = (index) => {
        const updatedFields = jobDescription.filter((_, i) => i !== index);
        setJobDescription(updatedFields);
    };

    const saveOfflineJob = async (jobData) => {
        try {
            const existingJobs = await AsyncStorage.getItem("offlineJobs");
            const jobsArray = existingJobs ? JSON.parse(existingJobs) : [];
            jobsArray.push(jobData);
            await AsyncStorage.setItem("offlineJobs", JSON.stringify(jobsArray));
            console.log("Job saved offline.");
            setModalData({
                visible: true,
                headingText: "Vehicle Saved successfully!",
                buttonText: "Go to HomeScreen",
                button2Text: 'Add New Vehicle',
                image: SUCCESS_IMAGE,
                navigateTo: "Home",
            });
            setLoading(false);
        } catch (error) {
            console.error("Error saving job offline:", error);
        }
    };

    // Function to handle submit job
    const handleSubmitJob = async () => {
        // if (technicianType === "ifs" && !selectedVehicleType && storedPayRate === "Pay Per Vehicles") {
        //     setVehicleTypeError("Please select a Vehicle Type");
        //     return;
        // }
        if (!selectedColor) {
            setSelectedColorError("Please select a color");
            return;
        }

        const token = await AsyncStorage.getItem("auth_token");
        if (!token) {
            console.error("Token not found!");
            return;
        }
        const getValue = (variableName) => {
            return updatedValues[variableName] ||
                (carDetails.find(item => item.Variable === variableName)?.Value || "");
        };

        console.log("working");

        const formData = new FormData();
        formData.append("vin", vin);
        formData.append("vehicleDescriptor", getValue("Vehicle Descriptor"));
        formData.append("make", getValue("Make"));
        formData.append("manufacturerName", getValue("Manufacturer Name"));
        formData.append("model", getValue("Model"));
        formData.append("modelYear", getValue("Model Year"));
        formData.append("vehicleType", selectedVehicleType);
        formData.append("plantCountry", getValue("Plant Country"));
        formData.append("plantCompanyName", getValue("Plant Company Name"));
        formData.append("plantState", getValue("Plant State"));
        formData.append("bodyClass", getValue("Body Class"));
        jobDescription.forEach((item, index) => {
            formData.append(`jobDescription[${index}][jobDescription]`, item.jobDescription);
            formData.append(`jobDescription[${index}][cost]`, item.cost);
        });
        formData.append("color", selectedColor);
        formData.append("createdBy", "app");
        formData.append("estimatedBy", technicianName);
        formData.append("ip", ipAddress);
        formData.append("assignTechnicians[0]", technicianId);
        formData.append("roleType", technicianType);
        formData.append("labourCost", labourCost || "");
        formData.append("schedule", "true");
        formData.append("assignCustomer", selectedCustomer?.id);
        formData.append("notes", notes || " ");
        formData.append("payRate", storedPayRate);
        formData.append("payVehicleType", selectedVehicleType);

        if (imageUris && imageUris.length > 0) {
            imageUris.forEach((uri, index) => {
                formData.append("images", {
                    uri: uri,
                    name: `image_${index}.jpg`,
                    type: "image/jpeg",
                });
            });
        }
        console.log("working1111");

        console.log("fomerData", formData);

        setLoading(true);
        setNewFormData(formData)
        setError("");
        setJobDescriptionError("");

        const netState = await NetInfo.fetch();

        if (!netState.isConnected) {
            await saveOfflineJob(formData);
            console.log("No internet, job saved offline.");
            return;
        }
        try {
            const response = await axios.post(
                `${API_BASE_URL}/technicianCreateJob`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 201) {
                setModalData({
                    visible: true,
                    headingText: "Job Created successfully!",
                    buttonText: "Go to HomeScreen",
                    button2Text: 'Create New Job',
                    image: SUCCESS_IMAGE,
                    navigateTo: "Home",
                });
            } else {
                setError("Failed to submit job.");
            }
        } catch (error) {
            console.error("Error submitting job:", error.response?.data);
            if (/jobDescription\[\d+\]\.cost/.test(error.response.data.error)) {
                setJobDescriptionError("Cost cannot be empty.");
            } else if (/jobDescription\[\d+\]/.test(error.response.data.error)) {
                setJobDescriptionError("Job description cannot be empty.");
            } else {
                setError(error.response.data.error);
            }
            if (error.response?.data?.error === "Failed to create technician job: Duplicate VIN found") {
                setError("");
                setDuplicateVinModal(true);
            }
        } finally {
            setLoading(false);
        }
    };

    // Function to handle Yes click (send same formData with different API)
    const handleConfirmDuplicateVin = async () => {
        setIsSubmitting(true);  // Start loading
        try {
            const token = await AsyncStorage.getItem("auth_token");

            if (!token) {
                console.error("Token is missing!");
                Toast.show("Authentication error. Please log in again.");
                setIsSubmitting(false);
                return;
            }

            if (!newFormData) {
                console.error("FormData is missing!");
                Toast.show("Something went wrong. Please try again.");
                setIsSubmitting(false);
                return;
            }

            console.log("Sending FormData:", newFormData);

            const response = await axios.post(
                `${API_BASE_URL}/createVinDetails`,
                newFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("API Response:", response);


            if (response.status === 201) {
                Toast.show("Job Created successfully!");
                setDuplicateVinModal(false);
                navigation.navigate("Home")
            } else {
                Toast.show("Failed to override job.");
            }
        } catch (error) {
            console.error("Error overriding job:", error);
            Toast.show("Something went wrong.");
        } finally {
            setIsSubmitting(false); // Stop loading after request completes
        }
    };

    const resetForm = () => {
        setVin('');
        setCarDetails([]);
        setSelectedCustomer(null);
        setCustomerDetails(null);
        setVinError('');
        setNotes("");
        setLabourCost("");
        setImageUris([]);
        setSelectedColor(null);
        setSelectedColorError('');
        setImageError('');
        setJobDescription([{ jobDescription: "", cost: "" }]);
        setJobDescriptionError('');
        setIsVinApiError(false);
        setSelectedVehicleType(null);
    };

    const handleContentSizeChange = (index, event) => {
        const { height } = event.nativeEvent.contentSize;
        setTextInputHeights(prev => ({
            ...prev,
            [index]: Math.min(
                height + (Platform.OS === "ios" ? 20 : 8),
                isTablet ? hp(15) : hp(20)
            )
        }));
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <Header title={route?.params?.jobName} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: whiteColor }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    {step === 1 ?
                        (
                            <Text style={[styles.label, { fontSize: style.fontSizeLarge.fontSize, marginTop: 10, marginLeft: 10 }]}>Scan Vehicle <Text style={{ color: 'red' }}>*</Text></Text>
                        ) : (
                            <Text style={[styles.label, { fontSize: style.fontSizeLarge.fontSize, marginTop: 10, marginLeft: 10, color: blueColor }]}>VIN : {vin}</Text>
                        )}

                    <View style={[styles.container]}>
                        {step === 1 && (
                            <>
                                <TouchableOpacity style={styles.scanButton}
                                    onPress={() => {
                                        // Navigate only if customer is selected
                                        setVin("");
                                        setCarDetails(null);
                                        navigation.navigate('ScannerScreen');
                                    }}
                                >
                                    <Text style={[styles.scanButtonText, textAlign]}>Scan VIN</Text>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={[styles.dividerContainer, flexDirectionRow, alignItemsCenter]}>
                                    <View style={styles.divider} />
                                    <Text style={styles.orText}>Or</Text>
                                    <View style={styles.divider} />
                                </View>


                                {/* VIN Section */}
                                <View>
                                    <Text style={styles.label}>VIN Manually </Text>
                                    <View style={[flexDirectionRow, alignItemsCenter, justifyContentSpaceBetween]}>
                                        <TextInput
                                            placeholder="Enter VIN Manually"
                                            style={[styles.vinInput, { width: wp(50), height: isTablet ? hp(3.5) : hp(5.5) }]}
                                            value={vin}
                                            onChangeText={(text) => {
                                                setVin(text);
                                                if (text.trim() !== '') {
                                                    setVinError('');
                                                }
                                            }}
                                            autoCapitalize="characters"
                                            maxLength={20}
                                            placeholderTextColor={mediumGray}

                                        />
                                        <TouchableOpacity style={[styles.fetchButton, alignJustifyCenter, { paddingVertical: !isTablet ? spacings.normalx : spacings.xxLarge, width: wp(30), height: isTablet ? hp(3.5) : hp(5.5) }]}
                                            onPress={() => fetchCarDetails(vin)}
                                            disabled={isLoadingCarDetails} >
                                            {isLoadingCarDetails ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <Text style={[styles.fetchButtonText, textAlign]}>Fetch</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    {vinError && <Text style={{ color: 'red', padding: spacings.normal }}>{vinError}</Text>}
                                </View>
                            </>
                        )}
                        {(isVinApiError) && (
                            <View>
                                <FlatList
                                    data={carSelectedVariables}
                                    keyExtractor={(item) => item}
                                    numColumns={2}
                                    contentContainerStyle={{ marginTop: spacings.large }}
                                    renderItem={({ item, index }) => (
                                        <View style={[styles.detailItem]}>
                                            <Text style={styles.label}>{item}:</Text>
                                            <TextInput
                                                ref={(ref) => (inputRefs.current[index] = ref)}
                                                style={[
                                                    styles.input,
                                                    {
                                                        width: isTablet ? wp(45) : wp(40),
                                                        height: isTablet ? hp(3.5) : hp(5),
                                                    },
                                                ]}
                                                placeholder={`Enter ${item}`}
                                                value={updatedValues[item] || ""}
                                                onChangeText={(text) => {
                                                    handleChange(item, text);

                                                    const allFieldsFilled = carSelectedVariables.every(
                                                        (f) => updatedValues[f] && updatedValues[f].trim() !== ""
                                                    );
                                                    setIsSaveVisible(allFieldsFilled);
                                                }}
                                                returnKeyType={
                                                    index === carSelectedVariables.length - 1 ? "done" : "next"
                                                }
                                                onSubmitEditing={() => {
                                                    if (index < carSelectedVariables.length - 1) {
                                                        inputRefs.current[index + 1]?.focus();
                                                    } else {
                                                        Keyboard.dismiss(); // Dismiss on last input
                                                    }
                                                }}
                                                blurOnSubmit={index === carSelectedVariables.length - 1}
                                                keyboardType={item === "Model Year" ? "numeric" : "default"}
                                                multiline={false}
                                                numberOfLines={1}
                                            />
                                        </View>
                                    )}
                                />

                                {isSaveVisible && (
                                    <View style={styles.saveButtonContainer}>
                                        <TouchableOpacity
                                            style={[{ backgroundColor: blueColor, padding: spacings.large, borderRadius: 15 }]}
                                            onPress={() => {
                                                console.log("updated value", updatedValues);

                                                // ✅ Ensure `carDetails` is an array before updating
                                                setCarDetails(prevDetails => [
                                                    ...(Array.isArray(prevDetails) ? prevDetails : []),
                                                    ...Object.keys(updatedValues).map(key => ({
                                                        Variable: key,
                                                        Value: updatedValues[key]
                                                    }))
                                                ]);

                                                setIsSaveVisible(false);
                                                setStep(2) // ✅ Hide Save button after saving
                                            }}
                                        >
                                            <Text style={[styles.editButtonText, { fontSize: 16, color: whiteColor, textAlign: "center" }]}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                        {step === 2 && (<>
                            {carDetails?.length > 0 && !isVinApiError && (
                                <View>
                                    <FlatList
                                        data={carDetails?.filter(detail =>
                                            carSelectedVariables.includes(detail.Variable)
                                        )}
                                        keyExtractor={(item, index) => index.toString()}
                                        numColumns={2}
                                        contentContainerStyle={[styles.details, justifyContentSpaceBetween, { borderWidth: 1, borderRadius: 5, marginVertical: 8, borderColor: blueColor }]}
                                        renderItem={({ item, index }) => {
                                            return item?.Value ? (
                                                <View style={[styles.detailItem]}>
                                                    <Text style={[styles.label]}>{item.Variable}:</Text>

                                                    {isEditing ? (
                                                        <TextInput
                                                            ref={(ref) => (inputRefs.current[index] = ref)} // ✅ shared ref set
                                                            style={[
                                                                styles.input,
                                                                {
                                                                    width: isTablet ? wp(45) : wp(40),
                                                                    height: isTablet ? hp(3.5) : hp(5),
                                                                },
                                                            ]}
                                                            value={String(updatedValues[item.Variable] ?? item.Value)}
                                                            onChangeText={(text) => {
                                                                handleChange(item.Variable, text);
                                                            }}
                                                            multiline={false}
                                                            numberOfLines={1}
                                                            returnKeyType={
                                                                index === carSelectedVariables.length - 1 ? "done" : "next"
                                                            }
                                                            onSubmitEditing={() => {
                                                                if (index < carSelectedVariables.length - 1) {
                                                                    inputRefs.current[index + 1]?.focus();
                                                                } else {
                                                                    Keyboard.dismiss();
                                                                }
                                                            }}
                                                            blurOnSubmit={index === carSelectedVariables.length - 1}
                                                        />
                                                    ) : (
                                                        <Text style={styles.detailValue}>
                                                            {updatedValues[item.Variable] || item.Value}
                                                        </Text>
                                                    )}
                                                </View>
                                            ) : null;
                                        }}
                                    />

                                    {/* EditButton */}
                                    {carDetails && carDetails.length > 0 && (<TouchableOpacity onPress={toggleEdit} style={[styles.editButton, { top: -2 }]}>
                                        {isEditing ? (
                                            <Text style={[styles.editButtonText, { borderWidth: 1, paddingHorizontal: 5, borderColor: greenColor, borderRadius: 4 }]}>Save</Text>
                                        ) : (
                                            <View style={{ borderWidth: 1, paddingHorizontal: 5, borderColor: blueColor, borderRadius: 4, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                                                <Text style={[styles.editButtonText, { color: blueColor }]}>Edit</Text>
                                                <Ionicons name="pencil-sharp" size={15} color={blueColor} style={{ marginLeft: 5 }} />
                                            </View>
                                        )}
                                    </TouchableOpacity>)}
                                </View>
                            )}

                            {carDetails && carDetails.length > 0 && (
                                <>
                                    {/* vechilecolor */}
                                    <Text style={[styles.label, { marginTop: 5 }]}>Vehicle Color <Text style={{ color: "red" }}>*</Text></Text>
                                    <DropDownPicker
                                        open={open}
                                        value={selectedColor}
                                        items={dropdownItems}
                                        setOpen={(val) => {
                                            if (val) {
                                                Keyboard.dismiss(); // Keyboard ko close kar do jab dropdown open ho
                                            }
                                            setOpen(val);
                                        }} setValue={(val) => {
                                            setSelectedColor(val);
                                            setSelectedColorError("");
                                        }}
                                        placeholder="Select a Color"
                                        style={{
                                            borderColor: blueColor,
                                            borderWidth: 1,
                                            marginBottom: 10,
                                            zIndex: 1000,
                                            borderRadius: 10,
                                        }}
                                        dropDownContainerStyle={{
                                            borderColor: blueColor,
                                            borderWidth: 1,
                                            zIndex: 100000,
                                            backgroundColor: lightBlueColor,
                                              maxHeight: hp(15)
                                        }}
                                        listMode="SCROLLVIEW"
                                    />
                                    {selectedColorError && <Text style={{ color: 'red' }}>{selectedColorError}</Text>}



                                    {/* Work Description */}
                                    <View style={{ marginTop: spacings.large }}>
                                        <View style={[flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter]}>
                                            <View style={{ width: "65%" }}>
                                                <Text style={[styles.label, { marginBottom: 0 }]}>Work Description</Text>
                                            </View>
                                            <View style={{ width: jobDescription.length > 1 ? "33%" : "30%" }}>
                                                <Text style={[styles.label, { marginBottom: 0 }]}>Cost</Text>
                                            </View>

                                        </View>

                                        <FlatList
                                            data={jobDescription}
                                            keyExtractor={(_, index) => index.toString()}
                                            renderItem={({ item, index }) => {
                                                return (
                                                    <View style={[flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter, { marginTop: spacings.xLarge }]}>
                                                        <TextInput
                                                            style={[styles.input, {
                                                                width: "65%",
                                                                height: textInputHeights[index] || (isTablet ? hp(3.5) : hp(5)),
                                                                textAlignVertical: "top",
                                                                paddingHorizontal: 20, // Consistent padding
                                                                paddingBottom: 0,
                                                            }]}
                                                            placeholder="Enter job description"
                                                            value={item.jobDescription}
                                                            placeholderTextColor={mediumGray}
                                                            multiline={true}
                                                            onChangeText={(text) => handleInputChange(text, index, "jobDescription")}
                                                            onContentSizeChange={(e) => handleContentSizeChange(index, e)}

                                                        />
                                                        <TextInput
                                                            style={[styles.input, { width: jobDescription.length > 1 ? "26%" : "30%", height: isTablet ? hp(3.5) : hp(5) }]}
                                                            placeholder="$0"
                                                            keyboardType="number-pad"
                                                            value={item.cost}
                                                            placeholderTextColor={mediumGray}
                                                            maxLength={5} // Maximum 5 digits
                                                            onChangeText={(text) => handleInputChange(text, index, "cost")}
                                                        />
                                                        {jobDescription.length > 1 && (
                                                            <TouchableOpacity onPress={() => handleDelete(index)}>
                                                                <Ionicons name="trash-outline" size={18} color="red" />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                );
                                            }}
                                        />
                                        {jobDescriptionError && <Text style={{ color: 'red' }}>{jobDescriptionError}</Text>}
                                        <View style={[flexDirectionRow, justifyContentSpaceBetween]}>
                                            <TouchableOpacity style={[flexDirectionRow, alignJustifyCenter, styles.addMore, { backgroundColor: blueColor, borderRadius: 10 }]} onPress={addNewField}>
                                                <Text style={styles.addMoreText}>Add More</Text>
                                                <Ionicons name="add-circle-outline" size={18} color={whiteColor} />
                                            </TouchableOpacity>
                                            {(jobDescription.some(item => item.jobDescription.trim() !== '' || item.cost.trim() !== '')) && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setJobDescription([{ jobDescription: '', cost: '' }]); // Reset to one empty item
                                                        setTextInputHeights({}); // Reset heights
                                                    }}
                                                    style={[flexDirectionRow, alignJustifyCenter, styles.addMore, { backgroundColor: blueColor, borderRadius: 10 }]}
                                                >
                                                    <Text style={styles.addMoreText}>Clear</Text>
                                                    <Ionicons name="trash-outline" size={18} color="white" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>


                                    {technicianType === "ifs" && storedPayRate === "Pay Per Vehicles" && (<Text style={[styles.label, { marginTop: 5 }]}>Vehicle Type </Text>)}
                                    {technicianType === "ifs" && storedPayRate === "Pay Per Vehicles" && (
                                        <DropDownPicker
                                            open={vTypeopen}
                                            value={selectedVehicleType} // ✅ this should match the value in your items array
                                            items={storedVehicles}
                                            setOpen={(val) => {
                                                if (val) Keyboard.dismiss();
                                                setVTypeOpen(val);
                                            }}
                                            setValue={(callback) => {
                                                const val = callback();
                                                setSelectedVehicleType(val);
                                                setVehicleTypeError('');
                                            }}
                                            placeholder="Select a Vehicle Type"
                                            style={{
                                                borderColor: blueColor,
                                                borderWidth: 1,
                                                marginBottom: 10,
                                                borderRadius: 10,
                                            }}
                                            dropDownContainerStyle={{
                                                borderColor: blueColor,
                                                borderWidth: 1,
                                                // zIndex: 1000,
                                                backgroundColor: lightBlueColor,
                                                maxHeight: hp(15)
                                            }}
                                            listMode="SCROLLVIEW"
                                        />
                                    )}
                                    {technicianType === "ifs" && vehicleTypeError && storedPayRate === "Pay Per Vehicles" && (<Text style={{ color: 'red' }}>{vehicleTypeError}</Text>)}

                                    {technicianType === "single-technician" &&
                                        <CustomTextInput
                                            label={"R/I R/R (Labour/Service Cost)"}
                                            placeholder="Enter R/I R/R (Labour/Service Cost)"
                                            value={labourCost}
                                            keyboardType="numeric"
                                            maxLength={5} // Maximum 5 digits
                                            onChangeText={(text) => setLabourCost(text)} />
                                    }

                                    {/* image */}
                                    {imageUris.length === 0 ? (
                                        <>
                                            <TouchableOpacity style={[styles.uploadImage, alignJustifyCenter]}
                                                onPress={handleImageUpload}
                                            >
                                                <Ionicons name="cloud-upload-outline" size={25} color={blackColor} />
                                                <Text style={styles.label}>Upload vehicle Image</Text>
                                                <Text style={[styles.label, { fontSize: 10, color: grayColor }]}>(Only “jpeg , webp and png” images will be accepted)</Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.label, { fontSize: 10, color: redColor }, textAlign]}>Note: Upload an image, and I'll help! 😊</Text>
                                        </>
                                    ) : (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                                            {/* Uploaded Images with Remove Button */}
                                            {imageUris.map((uri, index) => (
                                                <View key={index} style={{ position: 'relative' }}>
                                                    <Image source={{ uri }} style={{ width: wp(27), height: hp(14), borderRadius: 5 }} />
                                                    <TouchableOpacity
                                                        style={{
                                                            position: 'absolute', top: -5, right: -5,
                                                            borderRadius: 15, padding: 3, backgroundColor: blueColor
                                                        }}
                                                        onPress={() => removeImage(index)}
                                                    >
                                                        <Ionicons name="close-circle" size={20} color={whiteColor} />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}

                                            {/* Placeholder for Adding New Image */}
                                            {imageUris.length < 5 && (
                                                <TouchableOpacity
                                                    style={{
                                                        width: wp(27), height: hp(14), borderRadius: 5,
                                                        backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
                                                        borderWidth: 1, borderColor: '#ccc'
                                                    }}
                                                    onPress={handleImageUpload}
                                                >
                                                    <Ionicons name="add" size={40} color="#aaa" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                    {imageError && <Text style={{ color: 'red' }}>{imageError}</Text>}


                                    {/* Notes */}
                                    <View style={styles.sectionContainer}>
                                        <Text style={styles.label}>Notes</Text>
                                        <TextInput
                                            placeholder="Write your notes here..."
                                            style={styles.notesInput}
                                            multiline={true}
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                            onChangeText={(text) => setNotes(text)}
                                            value={notes}
                                        />
                                    </View>

                                    {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}

                                    {/* Submit */}
                                    <View style={{ width: "100%", marginTop: spacings.xLarge, flexDirection: "row", justifyContent: "space-between" }}>
                                        <CustomButton
                                            title="Submit"
                                            onPress={handleSubmitJob}
                                            loading={loading}
                                            style={{ width: wp(33) }}
                                            disabled={loading} />
                                        <CustomButton
                                            title="Scan Next VIN"
                                            onPress={() => {
                                                setVin('');
                                                setCarDetails(null);
                                                setStep(1); // Go back to Step 1
                                            }}
                                            style={{ width: wp(50) }}
                                            loading={loading}
                                            disabled={loading} />
                                    </View>
                                </>)}


                        </>)}
                        {modalData.visible && (
                            <SuccessModal
                                visible={modalData.visible}
                                onClose={() => setModalData({ ...modalData, visible: false })}
                                headingText={modalData.headingText}
                                buttonText={modalData.buttonText}
                                button2Text={modalData.button2Text}
                                image={modalData.image}
                                onPressContinue={() => {
                                    setModalData({ ...modalData, visible: false });
                                    navigation.navigate(modalData.navigateTo);
                                }}
                                onPressbutton2={() => {
                                    setModalData({ ...modalData, visible: false });
                                    resetForm(); // Reset all form fields
                                    navigation.navigate("NewJob", { isFromScanner: true, }); // Navigate back to the same screen
                                }}
                            />
                        )}

                        {duplicateVinModal && (
                            <Modal
                                transparent={true}
                                visible={duplicateVinModal}
                                animationType="slide"
                                onRequestClose={() => setDuplicateVinModal(false)}
                            >
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <Image source={ALERT_IMAGE} style={{ width: 80, height: 80, marginBottom: 10 }} />
                                        <Text style={styles.modalText}>
                                            Duplicate VIN found.
                                        </Text>
                                        <Text style={{ color: grayColor, marginBottom: 20 }}>
                                            Are you sure you want to continue?
                                        </Text>
                                        <View style={styles.buttonContainer}>
                                            <TouchableOpacity
                                                style={styles.confirmButton}
                                                onPress={handleConfirmDuplicateVin}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Text style={styles.buttonText}>Yes</Text>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={() => setDuplicateVinModal(false)}
                                            >
                                                <Text style={styles.buttonText}>Re-enter</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </Modal>
                        )}
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default WorkOrderScreenTwo;

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
        paddingHorizontal: spacings.Large2x,
        paddingBottom: hp(10),
        width: "100%",
    },
    logoContainer: {
        height: hp(3),
    },
    title: {
        fontSize: style.fontSizeLargeXX.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: blackColor,
        marginBottom: spacings.large,
    },
    sectionContainer: {
        marginTop: spacings.xLarge,
    },
    label: {
        fontSize: style.fontSizeNormal.fontSize,
        fontWeight: "500",
        color: blackColor,
        marginBottom: spacings.large,
    },
    searchContainer: {
        backgroundColor: whiteColor,
        borderWidth: 1,
        borderColor: blueColor,
        borderRadius: 50,
        paddingHorizontal: 11,
        fontSize: style.fontSizeNormal.fontSize,
    },
    textInput: {
        flex: 1,
        color: blackColor,
        fontSize: style.fontSizeNormal1x.fontSize,
        paddingVertical: spacings.large
    },
    customerList: {
        backgroundColor: whiteColor,
        marginTop: spacings.large,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: blueColor,
        maxHeight: hp(13)
    },
    customerItem: {
        padding: spacings.small,
        paddingLeft: spacings.large,
        color: blackColor,
    },
    vinInput: {
        backgroundColor: whiteColor,
        borderWidth: 1,
        borderColor: blueColor,
        borderRadius: 10,
        padding: spacings.large,
        color: blackColor,
        fontSize: style.fontSizeNormal1x.fontSize,
    },
    fetchButton: {
        backgroundColor: blueColor,
        borderRadius: 10,
        height: hp(5),
    },
    fetchButtonText: {
        color: whiteColor,
        fontWeight: style.fontWeightThin.fontWeight,
        fontSize: 12
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
    scanButton: {
        backgroundColor: blueColor,
        paddingVertical: spacings.xLarge,
        borderRadius: 10,
        marginTop: spacings.Large1x
    },
    scanButtonText: {
        color: whiteColor,
        fontWeight: style.fontWeightThin.fontWeight,
        fontWeight: style.fontWeightMedium.fontWeight,
    },
    details: {
        padding: spacings.small,
    },
    detailItem: {
        margin: 3,
        width: "50%",
    },
    detailValue: {
        fontSize: style.fontSizeSmall2x.fontSize,
        color: grayColor,
    },
    customerDetailContainer: {
        padding: 16,
        backgroundColor: whiteColor,
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    uploadImage: {
        width: "100%",
        borderColor: blueColor,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: spacings.small2x,
        marginVertical: spacings.large
    },
    notesInput: {
        borderWidth: 1,
        borderColor: blueColor,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: "top",
    },
    showColorButton: {
        padding: spacings.large,
        backgroundColor: whiteColor,
        borderWidth: 1,
        borderColor: grayColor,
        borderRadius: 5,
        marginBottom: spacings.large
    },
    dropdown: {
        backgroundColor: whiteColor,
        borderRadius: 5,
        borderColor: blackColor,
        borderWidth: 1,
        // position: 'absolute',
        // top: Platform.OS == "android" ? hp(76) : hp(93),
        // left: wp(6),
        zIndex: 999,
        width: "99.8%",
        maxHeight: 180,
    },
    colorOption: {
        padding: spacings.large,
        borderRadius: 5,
        alignItems: 'center',
        borderBottomColor: blackColor,
        borderBottomWidth: 1,
        width: "100%"
    },
    input: {
        borderWidth: 1,
        borderColor: blueColor,
        padding: spacings.large,
        borderRadius: 10,
        height: hp(5),
        // width: wp(45)
    },
    editButton: {
        padding: 10,
        position: 'absolute',
        // top: 0,
        right: -10,
    },
    editButtonText: {
        color: greenColor,
        fontWeight: style.fontWeightMedium.fontWeight,
        fontSize: 14,
    },
    noCustomersText: {
        fontSize: 16,
        color: "gray",
        textAlign: "center",
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalText: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 10
    },
    cancelButton: {
        width: "45%",
        paddingVertical: 8,
        backgroundColor: blueColor,
        borderRadius: 5,
        alignItems: "center",
        marginRight: 10,
    },
    confirmButton: {
        width: "45%",
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: "#5cb85c",
        borderRadius: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
    addMore: {
        marginTop: spacings.xLarge,
        width: wp(30),
    },
    addMoreText: {
        color: whiteColor,
        fontSize: style.fontSizeSmall2x.fontSize,
        fontWeight: style.fontWeightThin1x.fontWeight,
        marginRight: spacings.xsmall,
        padding: spacings.small2x,

    },
    itemContainer: {
        marginBottom: 10,
        marginRight: 10
    },
    saveButtonContainer: {
        marginTop: spacings.large,
    },
});
