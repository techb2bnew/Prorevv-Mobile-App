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
import CustomDropdown from '../componets/CustomDropdown';
import CustomerDropdown from '../componets/CustomerDropdown';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const NewJobScreen = ({ route }) => {
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

    useEffect(() => {
        AsyncStorage.getItem('allowedVehicles').then(data => {
            if (data) {
                setStoredVehicles(JSON.parse(data));
            }
        });
    }, []);

    useEffect(() => {
        const fetchPayRate = async () => {
            const rate = await AsyncStorage.getItem('payRate');
            if (rate) {
                setStoredPayRate(rate);
            }
        };
        fetchPayRate();
    }, [])

    useEffect(() => {
        const { vinNumber, customerDetails, paramVehicleTypes } = route.params || {};

        console.log("vinNumber:", vinNumber, "customerId:", customerDetails, "paramVehicleTypes", paramVehicleTypes);

        if (vinNumber && !customerDetails) {
            console.log("working:::::::::::::::::::::::::", vinNumber)
            // Only VIN is present
            setVin(vinNumber);
            fetchCarDetails(vinNumber);
            loadCustomerFromStorage();
        }

        if (vinNumber && customerDetails) {
            // Both VIN and customerId are present
            setVin(vinNumber);
            fetchCarDetails(vinNumber);
            setSelectedVehicleType(paramVehicleTypes);
            fetchSingleCustomerDetails(customerDetails.id);
            setSelectedCustomer(customerDetails)
        }
    }, [route.params?.vinNumber, route.params?.customerDetails]);

    const fetchCustomers = async (page) => {
        if (!hasMore) return;

        setIsCustomerLoading(true);
        try {
            const netState = await NetInfo.fetch();

            if (!netState.isConnected) {
                console.log("No Internet. Loading customers from local storage...");

                const storedCustomers = await AsyncStorage.getItem("customersList");
                if (storedCustomers) {
                    const parsedCustomers = JSON.parse(storedCustomers);
                    setCustomers(parsedCustomers);
                }
                return; // Stop execution if no internet
            }

            const token = await AsyncStorage.getItem("auth_token");

            if (!token) {
                console.error("Token not found!");
                return;
            }

            // Construct the API URL with parameters
            const apiUrl = `${API_BASE_URL}/fetchCustomer?userId=${technicianId}&page=${page}`;
            console.log("Fetching customers from URL:", apiUrl); // Log the API URL

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log("customers::", data.customers);

            if (data.status && data.customers?.customers?.length > 0) {
                const newCustomers = [...customers, ...data.customers.customers];
                setCustomers(newCustomers);

                // Save latest customers list in local storage
                await AsyncStorage.setItem("customersList", JSON.stringify(newCustomers));

                if (data.customers.customers.length >= 10) {
                    setPageNumber(prevPage => prevPage + 1);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Network error:', error);
        } finally {
            setIsCustomerLoading(false);
        }
    };

    useEffect(() => {
        if (technicianId && customers.length === 0) {
            fetchCustomers(1);
            console.log("Fetching customers for the first time...");
        }
    }, [technicianId]);

    const handleLoadMore = () => {
        if (!isCustomerLoading && hasMore && customers.length >= 10) {
            fetchCustomers(pageNumber);
        }
    };

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

    const fetchSingleCustomerDetails = async (customerId) => {
        try {
            console.log("Fetching details for Customer ID:", customerId);

            const netState = await NetInfo.fetch();

            if (!netState.isConnected) {
                console.log("No internet. Loading customer details from local storage...");

                const storedCustomers = await AsyncStorage.getItem("customersList");
                if (storedCustomers) {
                    const customerList = JSON.parse(storedCustomers);
                    const selectedCustomer = customerList.find(cust => cust.id === customerId);

                    if (selectedCustomer) {
                        setCustomerDetails(selectedCustomer);
                        console.log("Loaded customer from storage:", selectedCustomer);
                    } else {
                        console.log("Customer not found in local storage.");
                        setCustomerDetails(null);
                    }
                } else {
                    console.error("No customer details found in local storage.");
                    setCustomerDetails(null);
                }
                return;
            }

            setCustomerDetails(null);

            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }

            if (!customerId) {
                console.error("Invalid customerId");
                return;
            }

            const url = `${API_BASE_URL}/fetchSingleCustomer?customerId=${customerId}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log("API Response Data:", data);

            if (response.ok) {
                const customerData = data?.customers?.customer;
                console.log("customerData:::::", customerData);

                if (customerData?.id === customerId) {
                    setCustomerDetails(customerData);
                    setSearchText(`${capitalize(data?.customers?.customer.firstName)} ${capitalize(data?.customers?.customer.lastName)}`);

                    // ✅ Update AsyncStorage with the latest customer details
                    const storedCustomers = await AsyncStorage.getItem("customersList");
                    let customerList = storedCustomers ? JSON.parse(storedCustomers) : [];

                    customerList = customerList.map(cust =>
                        cust.id === customerId ? customerData : cust
                    );

                    await AsyncStorage.setItem("customersList", JSON.stringify(customerList));

                    // ✅ Only proceed if vehicles array exists and has at least one vehicle with a VIN
                    const vehicles = data?.customers?.customer?.vehicles;
                    if (Array.isArray(vehicles) && vehicles.length > 0 && vehicles[0]?.vin && !route.params?.isFromScanner) {
                        console.log("vehicles:::", vehicles);

                        const vin = vehicles[0].vin;
                        setVin(vin);
                        setCarDetails(vehicles)
                        fetchCarDetails(vin);
                    } else {
                        // ❌ No valid VIN found — clear VIN and car details
                        // setVin('');
                        // setCarDetails([])
                    }
                } else {
                    console.error("Fetched data does not match selected customer.");
                    setCustomerDetails(null);
                }
            } else {
                console.error("Error fetching customer details. Status:", response.status);
                setCustomerDetails(null);
            }
        } catch (error) {
            console.error("Network error:", error);
            setCustomerDetails(null);
        } finally {
            setIsDetailLoading(false); // stop loading
        }
    };

    const handleCustomerSelect = async (item) => {
        console.log("item::", item);
        setSelectedCustomer(item);
        setSearchText(`${capitalize(item.firstName)} ${capitalize(item.lastName)}`);
        setIsDetailLoading(true); // start loading
        fetchSingleCustomerDetails(item.id);
        await AsyncStorage.setItem('selectedCustomer', JSON.stringify(item));
    };

    const loadCustomerFromStorage = async () => {
        try {
            const customerData = await AsyncStorage.getItem('selectedCustomer');
            if (customerData) {
                const customer = JSON.parse(customerData);
                setSelectedCustomer(customer);
                setSearchText(`${capitalize(customer.firstName)} ${capitalize(customer.lastName)}`);

                // Fetch customer details again
                fetchSingleCustomerDetails(customer.id);
            }
        } catch (error) {
            console.error('Error loading customer:', error);
        }
    };


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

        if (!selectedCustomer) {
            Toast.show("Please select a customer.");
            return;
        }
        if (technicianType === "ifs" && !selectedVehicleType && storedPayRate === "Pay Per Vehicles") {
            setVehicleTypeError("Please select a Vehicle Type");
            return;
        }
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
        const formData = new FormData();
        formData.append("vin", vin);
        formData.append("vehicleDescriptor", getValue("Vehicle Descriptor"));
        formData.append("make", getValue("Make"));
        formData.append("manufacturerName", getValue("Manufacturer Name"));
        formData.append("model", getValue("Model"));
        formData.append("modelYear", getValue("Model Year"));
        // formData.append("vehicleType", getValue("Vehicle Type"));
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
        formData.append("assignCustomer", selectedCustomer.id);
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
        loadCustomerFromStorage();
    };

    const capitalize = (str) => {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
    };

    const handleContentSizeChange = (index, event) => {
        const { height } = event.nativeEvent.contentSize;
        setTextInputHeights(prev => ({
            ...prev,
            [index]: Math.min(
                height + 20,
                isTablet ? hp(15) : hp(20)
            )
        }));
    };

    useEffect(() => {
        fetchJobData(route?.params?.jobId)
    }, [route?.params?.jobId])

    const fetchJobData = async (jobId) => {
        try {
            const apiUrl = `${API_BASE_URL}`;
            const token = await AsyncStorage.getItem("auth_token");

            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`${apiUrl}/fetchSingleJobs?jobid=${jobId}`, {
                method: "POST",
                headers,
            });

            const data = await response.json();
            if (response.ok && data.jobs) {
                console.log("API Response Data:in New Job ", data?.jobs);
                fetchSingleCustomerDetails(data?.jobs?.customer?.id);
                setSelectedCustomer(data?.jobs?.customer);
                // setImageUris(data?.jobs?.images);
                setSelectedColor(data?.jobs?.color);
                setVin(data?.jobs?.vin);
                setJobDescription(data?.jobs?.jobDescription);
                setSelectedVehicleType(data?.jobs?.vehicleType);
                setLabourCost(data?.jobs?.labourCost)
                setNotes(data?.jobs?.notes);
                const selectedDetailsArray = selectedVariables.map((key) => {
                    const apiKey = key
                        .toLowerCase()
                        .split(" ")
                        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
                        .join("");

                    return {
                        Variable: key, // 👈 original label
                        Value: data.jobs[apiKey], // 👈 actual value
                    };
                });
                // 👇 Set it in state
                setCarDetails(selectedDetailsArray);
            } else {
                console.error("Error fetching job data:", data.error || "Unknown error");
            }

        } catch (error) {
            console.error("An error occurred while fetching job data:", error);
        }
    };

    const handleUpdateJob = async () => {

        if (!selectedCustomer) {
            Toast.show("Please select a customer.");
            return;
        }
        if (technicianType === "ifs" && !selectedVehicleType && storedPayRate === "Pay Per Vehicles") {
            setVehicleTypeError("Please select a Vehicle Type");
            return;
        }
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
        const formData = new FormData();
        formData.append("vin", vin);
        formData.append("vehicleDescriptor", getValue("Vehicle Descriptor"));
        formData.append("make", getValue("Make"));
        formData.append("manufacturerName", getValue("Manufacturer Name"));
        formData.append("model", getValue("Model"));
        formData.append("modelYear", getValue("Model Year"));
        // formData.append("vehicleType", getValue("Vehicle Type"));
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
        formData.append("assignCustomer", selectedCustomer.id);
        formData.append("notes", notes || " ");
        formData.append("payRate", storedPayRate);
        formData.append("payVehicleType", selectedVehicleType);
        formData.append("jobId", route?.params?.jobId);
        formData.append("jobName", null);


        // if (imageUris && imageUris.length > 0) {
        //     imageUris.forEach((uri, index) => {
        //         formData.append("images", {
        //             uri: uri,
        //             name: `image_${index}.jpg`,
        //             type: "image/jpeg",
        //         });
        //     });
        // }



        console.log("fomerData", formData);

        setLoading(true);
        setNewFormData(formData)
        setError("");
        setJobDescriptionError("");

        try {
            const response = await axios.post(
                `${API_BASE_URL}/updateJob`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 201) {
                navigation.navigate("JobDetails", { jobId: route?.params?.jobId })
            } else {
                setError("Failed to updating job.");
            }
        } catch (error) {
            console.error("Error updating job:", error.response?.data);
            if (/jobDescription\[\d+\]\.cost/.test(error.response.data.error)) {
                setJobDescriptionError("Cost cannot be empty.");
            } else if (/jobDescription\[\d+\]/.test(error.response.data.error)) {
                setJobDescriptionError("Job description cannot be empty.");
            } else {
                setError(error.response.data.error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <Header title={(route?.params?.jobId) ? "Edit Job" : "Create Job"} onBack={() => navigation.navigate("Home")} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: whiteColor }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={[styles.container]}>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.label}>
                                Customer <Text style={{ color: "red" }}>*</Text>
                            </Text>

                            {/* Custom Dropdown */}
                            <CustomerDropdown
                                data={customers}
                                selectedValue={customerDetails}
                                onSelect={handleCustomerSelect}
                                showIcon={true}
                                rightIcon={true}
                                titleText="Select Customer"
                                handleLoadMore={handleLoadMore}
                                isLoading={isCustomerLoading}
                                disabled={route?.params?.jobId}
                            />

                            {/* Show Loading Skeleton if loading */}

                            {customerDetails && (
                                <View style={[styles.details, justifyContentSpaceBetween, flexDirectionRow]}>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.label, { marginBottom: spacings.normal }]}>Name:</Text>
                                        <Text style={styles.detailValue}>
                                            {capitalize(customerDetails.firstName)} {capitalize(customerDetails.lastName)}
                                        </Text>

                                        <Text style={[styles.label, { marginBottom: spacings.normal, marginTop: spacings.large }]}>Email:</Text>
                                        <Text style={styles.detailValue}>{customerDetails.email}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.label, { marginBottom: spacings.normal }]}>Phone:</Text>
                                        <Text style={styles.detailValue}>{customerDetails.phoneNumber}</Text>
                                    </View>
                                </View>

                            )}
                        </View>

                        {/* Scan VIN Button */}
                        {/* {(!carDetails || carDetails.length === 0) && ( */}
                        {!route?.params?.jobId && <TouchableOpacity style={styles.scanButton}
                            onPress={() => {
                                if (!selectedCustomer) {
                                    Toast.show("Please select a customer.");
                                    return;
                                }

                                // Navigate only if customer is selected
                                setVin("");
                                setCarDetails(null);
                                navigation.navigate('ScannerScreen');
                            }}
                        >
                            <Text style={[styles.scanButtonText, textAlign]}>Scan VIN</Text>
                        </TouchableOpacity>}
                        {/* // )} */}

                        {/* Divider */}
                        {/* {(!carDetails || carDetails.length === 0) && ( */}
                        {!route?.params?.jobId && <View style={[styles.dividerContainer, flexDirectionRow, alignItemsCenter]}>
                            <View style={styles.divider} />
                            <Text style={styles.orText}>Or</Text>
                            <View style={styles.divider} />
                        </View>}
                        {/* // )} */}

                        {/* VIN Section */}
                        <View>
                            <Text style={styles.label}>VIN Manually <Text style={{ color: "red" }}>*</Text></Text>
                            <View style={[flexDirectionRow, alignItemsCenter, justifyContentSpaceBetween]}>
                                <TextInput
                                    placeholder="Enter VIN Manually"
                                    style={[styles.vinInput, { width: isSaveVisible ? wp(87) : wp(60), height: isTablet ? hp(3.5) : hp(5) }]}
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
                                    editable={!route?.params?.jobId} // 👈 only editable when jobId is not present

                                />
                                {!isSaveVisible && <TouchableOpacity style={[styles.fetchButton, alignJustifyCenter, { paddingVertical: !isTablet ? spacings.normalx : spacings.xxLarge, width: isTablet ? wp(30) : wp(25), height: isTablet ? hp(3.5) : hp(5) }]}
                                    onPress={() => fetchCarDetails(vin)}
                                    disabled={isLoadingCarDetails} >
                                    {isLoadingCarDetails ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={[styles.fetchButtonText, textAlign]}>Fetch</Text>
                                    )}
                                </TouchableOpacity>}
                            </View>
                            {vinError && <Text style={{ color: 'red', padding: spacings.normal }}>{vinError}</Text>}
                        </View>


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

                                                setIsSaveVisible(false); // ✅ Hide Save button after saving
                                            }}
                                        >
                                            <Text style={[styles.editButtonText, { fontSize: 16, color: whiteColor, textAlign: "center" }]}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

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
                                {technicianType === "ifs" && storedPayRate === "Pay Per Vehicles" && (<Text style={[styles.label, { marginTop: 5 }]}>Vehicle Type <Text style={{ color: "red" }}>*</Text></Text>)}
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
                                            borderRadius: vTypeopen ? 10 : 50,
                                        }}
                                        dropDownContainerStyle={{
                                            borderColor: blueColor,
                                            borderWidth: 1,
                                            zIndex: 1000,
                                            backgroundColor: lightBlueColor,
                                            maxHeight: hp(15)
                                        }}
                                        listMode="SCROLLVIEW"
                                    />
                                )}
                                {technicianType === "ifs" && vehicleTypeError && storedPayRate === "Pay Per Vehicles" && (<Text style={{ color: 'red' }}>{vehicleTypeError}</Text>)}


                                {/* Job Description */}
                                <View style={{ marginTop: spacings.large }}>
                                    <View style={[flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter]}>
                                        <View style={{ width: "65%" }}>
                                            <Text style={[styles.label, { marginBottom: 0 }]}>Job Description</Text>
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

                                {technicianType === "single-technician" &&
                                    <CustomTextInput
                                        label={"R/I R/R (Labour/Service Cost)"}
                                        placeholder="Enter R/I R/R (Labour/Service Cost)"
                                        value={labourCost}
                                        keyboardType="numeric"
                                        maxLength={5} // Maximum 5 digits
                                        onChangeText={(text) => setLabourCost(text)} />
                                }

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
                                        borderRadius: open ? 10 : 50,
                                    }}
                                    dropDownContainerStyle={{
                                        borderColor: blueColor,
                                        borderWidth: 1,
                                        zIndex: 1000,
                                        backgroundColor: lightBlueColor
                                    }}
                                    listMode="SCROLLVIEW"
                                />
                                {selectedColorError && <Text style={{ color: 'red' }}>{selectedColorError}</Text>}



                                {/* image */}
                                {!route.params?.jobId && (
                                    <>
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
                                    </>)
                                }

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
                                <View style={{ width: "100%", marginTop: spacings.xLarge }}>
                                    <CustomButton
                                        title="Submit"
                                        onPress={route?.params?.jobId ? handleUpdateJob : handleSubmitJob}
                                        loading={loading} disabled={loading} />
                                </View>
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

export default NewJobScreen;

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
        // width: wp(60),
        backgroundColor: whiteColor,
        borderWidth: 1,
        borderColor: blueColor,
        borderRadius: 50,
        padding: spacings.large,
        color: blackColor,
        fontSize: style.fontSizeNormal1x.fontSize,
    },
    fetchButton: {
        backgroundColor: blueColor,
        // paddingVertical: spacings.xxLarge,
        // paddingHorizontal: spacings.xxxxLarge,
        borderRadius: 15,
        // width: wp(30),
        height: hp(5)
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
        borderRadius: 15,
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
        borderRadius: 50,
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
