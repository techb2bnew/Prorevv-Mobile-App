import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Pressable, ScrollView, Alert, ScrollViewBase, Image, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Keyboard, Dimensions, TouchableWithoutFeedback } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { blackColor, blueColor, grayColor, greenColor, lightBlueColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { API_BASE_URL } from '../constans/Constants';
import CustomTextInput from '../componets/CustomTextInput';
import axios from 'axios';
import CustomButton from '../componets/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import SuccessModal from '../componets/Modal/SuccessModal';
import { ALERT_IMAGE, SUCCESS_IMAGE, XCIRCLE_IMAGE } from '../assests/images';
import { Image as ImageCompressor } from 'react-native-compressor';
import Header from '../componets/Header';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from "react-native-date-picker";
import Feather from 'react-native-vector-icons/Feather';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const WorkOrderScreenTwo = ({ route }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const navigation = useNavigation();
    const [vin, setVin] = useState('' || vehicleDetails);
    const [carDetails, setCarDetails] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [vinError, setVinError] = useState('');
    const [notes, setNotes] = useState("");
    const [imageUris, setImageUris] = useState([]);
    const [selectedColor, setSelectedColor] = useState();
    const [selectedColorError, setSelectedColorError] = useState();
    const [imageError, setImageError] = useState();
    const [loading, setLoading] = useState(false);
    const [isLoadingCarDetails, setIsLoadingCarDetails] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedValues, setUpdatedValues] = useState({});
    const [technicianId, setTechnicianId] = useState();
    const [technicianName, setTechnicianName] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    const [jobDescription, setJobDescription] = useState([{ jobDescription: "", cost: "" }]);
    const [jobDescriptionError, setJobDescriptionError] = useState('');
    const [isSaveVisible, setIsSaveVisible] = useState(false);
    const [isVinApiError, setIsVinApiError] = useState(false);
    const [labourCost, setLabourCost] = useState('');
    const [textInputHeights, setTextInputHeights] = useState({});
    const [vTypeopen, setVTypeOpen] = useState(false);
    const inputRefs = useRef([]);
    const [step, setStep] = useState(route?.params?.vehicleId ? 2 : 1);
    const [selectedJobName, setSelectedJobName] = useState("");
    const [selectedJobId, setSelectedJobId] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);
    const [duplicateVinModal, setDuplicateVinModal] = useState(false);
    const [duplicateVinMessage, setDuplicateVinMessage] = useState('');
    const [extractedVin, setExtractedVin] = useState('');
    const [extractedJob, setExtractedJob] = useState('');
    const [extractedCustomer, setExtractedCustomer] = useState('');
    const [newFormData, setNewFormData] = useState(null);
    const [scanLoading, setScanLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTechnicians, setSelectedTechnicians] = useState([]); // store selected IDs
    const [vehicleDetails, setVehicleDetails] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
    const [duplicatePopupSource, setDunplicatePopupSource] = useState("");

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
        "Vehicle Type",
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
    ];


    useFocusEffect(
        React.useCallback(() => {
            const loadSelectedJob = async () => {
                const savedJob = await AsyncStorage.getItem("current_Job");
                console.log("savedJob", savedJob);

                if (savedJob) {
                    const parsed = JSON.parse(savedJob);
                    setSelectedJobName(parsed.jobName);
                    setSelectedJobId(parsed.id);
                    setSelectedCustomer(parsed.assignCustomer);
                    setTechnicians(parsed.technicians);
                    setSelectedTechnicians(parsed.technicians); // store full technician objects
                }
            };

            loadSelectedJob();

            // cleanup if needed
            return () => { };
        }, [])
    );

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



    //Vin
    useEffect(() => {
        const { vinNumber } = route.params || {};
        if (vinNumber) {
            // Only VIN is present
            const loadSelectedJob = async () => {
                const savedJob = await AsyncStorage.getItem("current_Job");
                if (savedJob) {
                    // console.log("working:::::::::::::::::::::::::", vinNumber)
                    const parsed = JSON.parse(savedJob);
                    console.log("savedJob:::::", parsed);
                    setSelectedJobName(parsed.jobName);
                    setSelectedJobId(parsed.id);
                    setSelectedCustomer(parsed.assignCustomer)
                }
            };

            loadSelectedJob();
            setVin(vinNumber);
            fetchCarDetails(vinNumber);
        }
    }, [route.params?.vinNumber]);

    // fetch Car Details 
    const fetchCarDetails = async (vinNumber, skipDuplicateCheck = false) => {
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
        const token = await AsyncStorage.getItem("auth_token");
        if (!token) {
            console.error("Token not found!");
            return;
        }
        const savedJob = await AsyncStorage.getItem("current_Job");
        const parsed = JSON.parse(savedJob);
        console.log("savedjob", parsed);

        try {
            if (!skipDuplicateCheck) {
                const formData = new URLSearchParams();
                formData.append('customerId', parsed.assignCustomer);
                formData.append('jobName', parsed.jobName);
                formData.append('vin', vinNumber);

                const duplicateResponse = await axios.post(
                    `${API_BASE_URL}/checkVehicle`,
                    formData.toString(),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                console.log("🔁 VIN check response:", duplicateResponse.data);
                console.log("duplicateResponse", duplicateResponse);

                if (duplicateResponse?.data?.status === false) {
                    setDuplicateVinModal(true);
                    setIsLoadingCarDetails(false);
                    return;
                }
            }
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
            if (error.response?.status === 409 && error.response?.data?.status === false) {
                const msg = error.response.data.message;

                const vinMatch = msg.match(/VIN (\w+)/);
                const jobMatch = msg.match(/job (\w+)/);
                const customerMatch = msg.match(/customer (.+)\./); // till dot

                setDuplicateVinModal(true);
                setIsLoadingCarDetails(false);

                setDuplicateVinMessage(msg); // for reference

                setExtractedVin(vinMatch ? vinMatch[1] : "");
                setExtractedJob(jobMatch ? jobMatch[1] : "");
                setExtractedCustomer(customerMatch ? customerMatch[1] : "");

                return;
            }
            console.error("error::::::", error);
            setIsVinApiError(true);
            setCarDetails([])
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
        setJobDescriptionError("")
    };

    // Function to handle submit job
    const handleSubmitJob = async (shouldNavigate = false, setLoaderFn) => {
        // if (!selectedColor) {
        //     setSelectedColorError("Please select a color");
        //     return;
        // }

        // console.log("finalFlatRate", finalFlatRate);

        const invalidJob = jobDescription?.find(item => {
            const desc = item.jobDescription?.trim();
            const cost = item.cost?.trim();

            // Block if either one is filled and the other is empty
            return (desc && !cost) || (!desc && cost);
        });

        // if (invalidJob) {
        //     setJobDescriptionError("Please enter both description and cost.");
        //     return;
        // }


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
        formData.append("jobName", selectedJobName);
        formData.append("jobId", selectedJobId);
        formData.append("vin", vin);
        formData.append("vehicleId", route?.params?.vehicleId || undefined);
        formData.append("vehicleDescriptor", getValue("Vehicle Descriptor") || vehicleDetails?.vehicleDescriptor);
        formData.append("make", getValue("Make") || vehicleDetails?.make);
        formData.append("manufacturerName", getValue("Manufacturer Name") || vehicleDetails?.manufacturerName);
        formData.append("model", getValue("Model") || vehicleDetails?.model);
        formData.append("modelYear", getValue("Model Year") || vehicleDetails?.modelYear);
        formData.append("vehicleType", getValue("Vehicle Type") || vehicleDetails?.vehicleType);
        formData.append("plantCountry", getValue("Plant Country") || vehicleDetails?.plantCountry);
        formData.append("plantCompanyName", getValue("Plant Company Name") || vehicleDetails?.plantCompanyName);
        formData.append("plantState", getValue("Plant State") || vehicleDetails?.plantState);
        formData.append("bodyClass", getValue("Body Class") || vehicleDetails?.bodyClass);
        formData.append("customerId", selectedCustomer);
        formData.append("roleType", technicianType);
        formData.append("labourCost", labourCost || "");
        formData.append("notes", notes || " ");
        formData.append("color", selectedColor);
        formData.append("createdBy", "app");
        formData.append("estimatedBy", technicianName);
        jobDescription.forEach((item) => {
            formData.append("jobDescription[]", item.jobDescription);
            // formData.append("cost", item.cost);
        });

        if (startDate) {
            formData.append("startDate", startDate.toISOString());
        }

        if (endDate) {
            formData.append("endDate", endDate.toISOString());
        }
        selectedTechnicians.forEach((tech, index) => {
            console.log(`Technician ${index}:`, tech); // 👈 Technician object console me print karega
            formData.append(`technicians[${index}][id]`, tech.id);
            formData.append(`technicians[${index}][techFlatRate]`, tech?.UserJob?.techFlatRate || tech?.VehicleTechnician?.techFlatRate || "");
            formData.append(`technicians[${index}][rRate]`, tech?.UserJob?.rRate || tech?.VehicleTechnician?.rRate || "");
        });
        if (technicianType === "manager") {
            selectedTechnicians.forEach((tech, index) => {
                formData.append(`userId[${index}]`, tech.id);
            });
        } else {
            formData.append("userId[0]", technicianId);
            formData.append("technicianid[0]", technicianId || '');
        }

        if (route?.params?.vehicleId) {
            console.log("Vehicle ID present:", route.params.vehicleId);

            if (Array.isArray(imageUris)) {
                imageUris.forEach((item, index) => {
                    // For new local images (file objects or local URIs)
                    if (item instanceof File) {
                        formData.append('images[]', item);
                    } else if (typeof item === 'string') {
                        if (item.startsWith('http')) {
                            // Old image URL - send as string
                            formData.append('images[]', item);
                        } else {
                            // New local file path (uri)
                            formData.append("images", {
                                uri: item,
                                name: `image_${index}.jpg`,
                                type: "image/jpeg",
                            });
                        }
                    } else if (item?.uri) {
                        if (item.uri.startsWith('http')) {
                            formData.append('images[]', item.uri);
                        } else {
                            formData.append("images[]", {
                                uri: item.uri,
                                name: `image_${index}.jpg`,
                                type: "image/jpeg",
                            });
                        }
                    }
                });
            }

        } else {
            if (imageUris && imageUris.length > 0) {
                imageUris.forEach((uri, index) => {
                    formData.append("images", {
                        uri: uri,
                        name: `image_${index}.jpg`,
                        type: "image/jpeg",
                    },);
                });
            }
        }

        console.log("form:::", formData);
        setNewFormData(formData);
        setLoaderFn(true);
        setError("");
        setJobDescriptionError("");
        try {
            const apiUrlEndPoint = route?.params?.vehicleId ? `${API_BASE_URL}/updateVehicleInfo` : `${API_BASE_URL}/addVehicleInfo`

            const response = await fetch(apiUrlEndPoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const responseJson = await response.json();
            console.log("Server response:", responseJson);
            if (responseJson.status === true) {
                if (shouldNavigate) {
                    navigation.navigate("Home");
                    setLoaderFn(false);
                    if (route?.params?.vehicleId) {
                        Toast.show("Vehicle update successfully!");
                    }
                    Toast.show((route?.params?.vehicleId) ? "Vehicle update successfully!" : "Vehicle add successfully!");
                } else {
                    resetForm();
                    // setStep(1);
                    // setLoaderFn(false);
                    navigation.navigate('ScannerScreen', {
                        from: "scanNext"
                    });

                    if (route?.params?.vehicleId) {
                        Toast.show("Vehicle update successfully!");
                    }
                    Toast.show((route?.params?.vehicleId) ? "Vehicle update successfully!" : "Vehicle add successfully!");
                }
            } else {
                const msg = responseJson?.error || "";

                // Check if the error contains duplicate VIN format
                if (msg.includes("already exists in the job")) {
                    const vinMatch = msg.match(/VIN (\w+)/);
                    const jobMatch = msg.match(/job (\w+)/);
                    const customerMatch = msg.match(/customer (.+)\./); // till dot
                    setDunplicatePopupSource("submit")
                    setDuplicateVinModal(true);
                    setIsLoadingCarDetails(false);

                    setDuplicateVinMessage(msg); // for reference

                    setExtractedVin(vinMatch ? vinMatch[1] : "");
                    setExtractedJob(jobMatch ? jobMatch[1] : "");
                    setExtractedCustomer(customerMatch ? customerMatch[1] : "");
                } else {
                    console.warn("Submission failed:", msg);
                    setError(msg); // Show default error
                }
            }
        } catch (error) {
            console.error("Error create vehicle:", error);
        } finally {
            setLoaderFn(false);
        }
    };

    const resetForm = () => {
        setVin('');
        setCarDetails([]);
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
        // setSelectedVehicleType(null);
    };

    const handleContentSizeChange = (index, event) => {
        const { height } = event.nativeEvent.contentSize;
        setTextInputHeights(prev => ({
            ...prev,
            [index]: Math.min(
                height + (Platform.OS === "ios" ? 20 : isTablet ? 13 : 13),
                isTablet ? hp(15) : hp(20)
            )
        }));
    };

    const capitalize = (str) => {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
    };

    const toggleTechnicianSelection = (item) => {
        setSelectedTechnicians((prevSelected) => {
            const isAlreadySelected = prevSelected.some((tech) => tech.id === item.id);
            if (isAlreadySelected) {
                return prevSelected.filter((tech) => tech.id !== item.id); // unselect
            } else {
                return [...prevSelected, item]; // select full object
            }
        });
    };

    const isTechnicianSelected = (id) => {
        return selectedTechnicians.some((tech) => tech.id === id);
    };

    // useEffect(() => {
    //     if (technicians?.length > 0) {
    //         setSelectedTechnicians(technicians); // store full technician objects
    //     }
    // }, [technicians]);


    const fetchVehileData = async (vehicleId) => {
        try {
            setLoading(true);

            const apiUrl = `${API_BASE_URL}`;
            const token = await AsyncStorage.getItem("auth_token");

            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            // console.log(vehicleId);

            const response = await fetch(`${apiUrl}/fetchSingleVehicleInfo?vehicleId=${vehicleId}`, {
                method: "GET", // ✅ FIXED
                headers,
            });

            const contentType = response.headers.get("Content-Type");

            if (response.ok && contentType?.includes("application/json")) {
                const data = await response.json();
                console.log("API Response Data:", data?.vehicle?.vehicle);

                if (data?.vehicle?.vehicle) {
                    setVehicleDetails(data?.vehicle?.vehicle);
                    setVin(data?.vehicle?.vehicle?.vin)
                    setSelectedJobName(data?.vehicle?.vehicle?.jobName)
                    setSelectedJobId(data?.vehicle?.vehicle?.jobId)
                    setLabourCost(data?.vehicle?.vehicle?.labourCost)
                    setSelectedColor(data?.vehicle?.vehicle?.color)
                    setStartDate(
                        data?.vehicle?.vehicle?.startDate && data?.vehicle?.vehicle?.startDate !== "null"
                            ? new Date(data.vehicle.vehicle.startDate)
                            : null
                    );
                    setEndDate(
                        data?.vehicle?.vehicle?.endDate && data?.vehicle?.vehicle?.endDate !== "null"
                            ? new Date(data.vehicle.vehicle.endDate)
                            : null
                    ); 
                    setTechnicians(data?.vehicle?.vehicle?.assignedTechnicians);
                    setSelectedTechnicians(data?.vehicle?.vehicle?.assignedTechnicians);
                    setSelectedCustomer(data?.vehicle?.vehicle.customerId)
                    setNotes(data?.vehicle?.vehicle?.notes)
                    if (data?.vehicle?.vehicle?.images?.length > 0) {
                        setImageUris(data.vehicle.vehicle.images);
                    }
                    const formattedJobDescriptions = (data?.vehicle?.vehicle?.jobDescription || []).map(item => ({
                        jobDescription: item || "",
                        // cost: item.cost?.toString() || ""  // Ensure cost is string
                    }));

                    setJobDescription(formattedJobDescriptions.length > 0 ? formattedJobDescriptions : [{ jobDescription: "", cost: "" }]);

                } else {
                    console.error("No vehicle found in API response.");
                }
            } else {
                const rawText = await response.text();
                console.error("Unexpected non-JSON response:", rawText);
            }
        } catch (error) {
            console.error("An error occurred while fetching job data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (route?.params?.vehicleId) {
            fetchVehileData(route?.params?.vehicleId);
        }
    }, [route?.params?.vehicleId]);

    const updateTechnicianField = (id, field, value) => {
        console.log("value:::", value);

        const updatedTechs = technicians.map((tech) => {
            if (tech.id === id) {
                // Prioritize updating in the correct source
                if (tech.UserJob && tech.UserJob[field] !== undefined) {
                    return {
                        ...tech,
                        UserJob: {
                            ...tech.UserJob,
                            [field]: value
                        }
                    };
                } else if (tech.VehicleTechnician && tech.VehicleTechnician[field] !== undefined) {
                    return {
                        ...tech,
                        VehicleTechnician: {
                            ...tech.VehicleTechnician,
                            [field]: value
                        }
                    };
                } else {
                    // Fallback if field doesn't exist
                    return {
                        ...tech,
                        UserJob: {
                            ...(tech.UserJob || {}),
                            [field]: value
                        }
                    };
                }
            }
            return tech;
        });

        setTechnicians(updatedTechs);
        // ✅ Update only selected technicians with updated values
        const updatedSelected = selectedTechnicians.map((tech) => {
            const updated = updatedTechs.find((t) => t.id === tech.id);
            return updated || tech;
        });

        setSelectedTechnicians(updatedSelected);
    };

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
                Toast.show("Vehicle add successfully!");
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

    const fetchTechnicians = async () => {
        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }

            const url = `${API_BASE_URL}/fetchTechnicianJob?types=${technicianType}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            const jobTechs = data?.technician?.technicians || [];

            if (data.status && jobTechs.length > 0) {
                const processedTechs = jobTechs.map(tech => ({
                    ...tech,
                    UserJob: {
                        techFlatRate: null,
                        rRate: null,
                    }
                }));

                // ✅ Filter out duplicates
                const filteredNewTechs = processedTechs.filter(
                    tech => !technicians.some(existing => existing.id === tech.id)
                );

                // ✅ Append to existing list
                setTechnicians(prev => [...prev, ...filteredNewTechs]);
            } else {
                console.log("No technicians found.");
            }
        } catch (error) {
            console.error("Technician Joby Fetch Error:", error);
        }
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}

        >
            {/* Header */}
            <Header
                title={selectedJobName?.charAt(0).toUpperCase() + selectedJobName?.slice(1)}
                // onBack={() => navigation.navigate("WorkOrderScreen")}
                onBack={() => {
                    if (route?.params?.jobName || route.params?.isFromScanner) {
                        navigation.navigate("WorkOrderScreen");
                    } else {
                        navigation.goBack();
                    }
                }}
            />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: whiteColor, paddingBottom: Platform.OS === "ios" ? hp(15) : 0 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                                            style={[styles.vinInput, { width: isTablet ? wp(60) : wp(50), height: isTablet ? hp(3.5) : hp(5.5) }]}
                                            value={vin}
                                            onChangeText={(text) => {
                                                setVin(text || route?.params?.vehicleInfo?.vin);
                                                if (text.trim() !== '') {
                                                    setVinError('');
                                                }
                                            }}
                                            autoCapitalize="characters"
                                            maxLength={17}
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

                            {((carDetails && carDetails.length > 0) || route?.params?.vehicleId) && (
                                <>
                                    {/* vechilecolor */}
                                    <Text style={[styles.label, { marginTop: 5 }]}>Vehicle Color
                                        {/* <Text style={{ color: "red" }}>*</Text> */}
                                    </Text>
                                    <DropDownPicker
                                        open={open}
                                        value={selectedColor}
                                        items={dropdownItems}
                                        setOpen={(val) => {
                                            if (val) {
                                                Keyboard.dismiss();
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
                                            <View style={{ width: "100%" }}>
                                                <Text style={[styles.label, { marginBottom: 0 }]}>Work Description</Text>
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
                                                                width: "100%",
                                                                height: textInputHeights[index] || (isTablet ? hp(3.5) : hp(5)),
                                                                textAlignVertical: "top",
                                                                paddingHorizontal: 20,
                                                                paddingBottom: 0,
                                                            }]}
                                                            placeholder="Enter work description"
                                                            value={item.jobDescription}
                                                            placeholderTextColor={mediumGray}
                                                            multiline={true}
                                                            onChangeText={(text) => handleInputChange(text, index, "jobDescription")}
                                                            onContentSizeChange={(e) => handleContentSizeChange(index, e)}

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
                                            {(jobDescription?.some(item => item?.jobDescription?.trim() !== '')) && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setJobDescription([{ jobDescription: '', cost: '' }]);
                                                        setTextInputHeights({});
                                                    }}
                                                    style={[flexDirectionRow, alignJustifyCenter, styles.addMore, { backgroundColor: blueColor, borderRadius: 10 }]}
                                                >
                                                    <Text style={styles.addMoreText}>Clear</Text>
                                                    <Ionicons name="trash-outline" size={18} color="white" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    {technicianType === "single-technician" && <View style={{ marginTop: spacings.xxLarge }}>
                                        <Text style={styles.label}>Job Override Cost</Text>
                                        <TextInput
                                            style={[styles.input, { height: isTablet ? hp(3.5) : hp(5.5), marginTop: 5 }]}
                                            placeholder="Job Override Cost"
                                            value={labourCost}
                                            onChangeText={setLabourCost}
                                            keyboardType="numeric"
                                            maxLength={5}
                                        />
                                    </View>}

                                    <View style={{ paddingTop: spacings.large }}>
                                        {/* Filter & Date Picker */}
                                        <View style={styles.datePickerContainer}>
                                            <View style={{ width: "45%" }}>
                                                <Text style={styles.label}>Start Date</Text>
                                            </View>
                                            <View style={{ width: "45%" }}>
                                                <Text style={styles.label}>End Date</Text>
                                            </View>
                                        </View>

                                        {console.log("🚀 Rendering StartDate:", startDate)}
                                        {console.log("🚀 Rendering EndDate:", endDate)}
                                        <View style={[styles.datePickerContainer, { marginBottom: 15, color: blackColor }]}>
                                            <TouchableOpacity onPress={() => setIsStartPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
                                                <Text style={styles.dateText}>
                                                    {startDate && startDate instanceof Date && !isNaN(startDate.getTime())
                                                        ? startDate.toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : "Select Start Date"}
                                                </Text>
                                                <Feather name="calendar" size={20} color={blackColor} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setIsEndPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
                                                <Text style={styles.dateText}>
                                                    {endDate && typeof endDate === "object" && endDate instanceof Date && !isNaN(endDate)
                                                        ? endDate.toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : "Select End Date"}
                                                </Text>
                                                <Feather name="calendar" size={20} color={blackColor} />
                                            </TouchableOpacity>
                                        </View>

                                        <DatePicker
                                            modal
                                            open={isStartPickerOpen}
                                            // date={startDate}
                                            date={startDate ? new Date(startDate) : new Date()}
                                            mode="date"
                                            // maximumDate={new Date()}
                                            onConfirm={(date) => {
                                                setStartDate(date);
                                                setIsStartPickerOpen(false);
                                            }}
                                            onCancel={() => setIsStartPickerOpen(false)}
                                        />

                                        <DatePicker
                                            modal
                                            open={isEndPickerOpen}
                                            // date={endDate}
                                            date={endDate ? new Date(endDate) : new Date()}
                                            mode="date"
                                            minimumDate={startDate}
                                            // maximumDate={new Date()}
                                            onConfirm={(date) => {
                                                const newEndDate = date;
                                                setEndDate(newEndDate);
                                                setIsEndPickerOpen(false);
                                            }}
                                            onCancel={() => setIsEndPickerOpen(false)}
                                        />

                                    </View>

                                    {/* image */}
                                    <Text style={[styles.label]}>Attachments</Text>

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

                                    {technicianType === 'manager' && technicians?.length > 0 &&
                                        <View style={{ marginTop: 20 }}>
                                            <Text style={styles.label}>Selected Technician</Text>
                                            <View style={{
                                                borderWidth: 1,
                                                borderColor: blueColor,
                                                borderRadius: 8,
                                                // height: hp(20), // Fixed height is good
                                                overflow: "hidden",
                                                marginBottom: 8,
                                            }}>
                                                <FlatList
                                                    nestedScrollEnabled={true}
                                                    data={technicians}
                                                    keyExtractor={(item) => item.id.toString()}
                                                    renderItem={({ item }) => {

                                                        const selected = isTechnicianSelected(item.id);
                                                        const userJob = item.UserJob ?? item.VehicleTechnician ?? {};

                                                        return (
                                                            <View
                                                                style={[
                                                                    styles.techItem,
                                                                    {
                                                                        backgroundColor: selected ? lightBlueColor : "#fff",
                                                                        paddingVertical: 10,
                                                                        paddingHorizontal: 12,
                                                                    },
                                                                ]}
                                                            >
                                                                {/* Top row: name and checkbox */}
                                                                <View style={[flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter]}>
                                                                    <Text style={{ fontSize: 16, flex: 1 }}>
                                                                        {capitalize(item.firstName)} {capitalize(item.lastName)}
                                                                        {item.techType?.toLowerCase() !== 'technician' ? ` (${item.techType})` : ''}
                                                                    </Text>

                                                                    <TouchableOpacity onPress={() => toggleTechnicianSelection(item)}>
                                                                        <Icon
                                                                            name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                                                                            size={24}
                                                                            color={selected ? blueColor : "#ccc"}
                                                                            type="MaterialCommunityIcons"
                                                                        />
                                                                    </TouchableOpacity>
                                                                </View>

                                                                {item.techType?.toLowerCase() === 'technician' && (
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: "space-between" }}>
                                                                        <Text style={{ fontSize: 14, marginRight: 8 }}>Flat Rate:</Text>
                                                                        <TextInput
                                                                            value={(userJob.techFlatRate ?? '0').toString()}
                                                                            keyboardType="numeric"
                                                                            onChangeText={(text) => updateTechnicianField(item.id, 'techFlatRate', text)}
                                                                            style={{
                                                                                borderWidth: 1,
                                                                                borderColor: "#ccc",
                                                                                borderRadius: 6,
                                                                                padding: 6,
                                                                                width: 100,
                                                                            }}
                                                                            placeholder="0.00"
                                                                        />
                                                                    </View>
                                                                )}

                                                                {item.techType?.toLowerCase() !== 'technician' && (
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: "space-between" }}>
                                                                        <Text style={{ fontSize: 14, marginRight: 8 }}>R Rate:</Text>
                                                                        <TextInput
                                                                            value={(userJob.rRate ?? '0').toString()}
                                                                            keyboardType="numeric"
                                                                            onChangeText={(text) => updateTechnicianField(item.id, 'rRate', text)}
                                                                            style={{
                                                                                borderWidth: 1,
                                                                                borderColor: "#ccc",
                                                                                borderRadius: 6,
                                                                                padding: 6,
                                                                                width: 100,
                                                                            }}
                                                                            placeholder="0.00"
                                                                        />
                                                                    </View>
                                                                )}

                                                            </View>
                                                        );
                                                    }}
                                                />
                                            </View>
                                            <TouchableOpacity
                                                style={[flexDirectionRow, alignJustifyCenter, { backgroundColor: blueColor, borderRadius: 10, width: wp(35), alignSelf: "flex-end" }]}
                                                onPress={() => {
                                                    fetchTechnicians(1);
                                                }}
                                            >
                                                <Ionicons name="add-circle-outline" size={18} color={whiteColor} />
                                                <Text style={styles.addMoreText}>Add technician</Text>
                                            </TouchableOpacity>
                                        </View>}

                                    {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}

                                    {/* Submit */}
                                    <View style={{ width: "100%", marginTop: spacings.xLarge, flexDirection: "row", justifyContent: "space-between" }}>
                                        <CustomButton
                                            title={route?.params?.vehicleId ? "Update" : "Submit"}
                                            onPress={() => handleSubmitJob(true, setSubmitLoading)}
                                            loading={submitLoading}
                                            style={{ width: (route?.params?.vehicleId) ? "100%" : wp(33) }}
                                            disabled={submitLoading || scanLoading}
                                        />

                                        {!route?.params?.vehicleId && <CustomButton
                                            title="Scan Next VIN"
                                            onPress={() => handleSubmitJob(false, setScanLoading)}
                                            //     onPress={() => {
                                            // // Navigate only if customer is selected
                                            // setVin("");
                                            // setCarDetails(null);
                                            // navigation.navigate('ScannerScreen');
                                            // }}
                                            loading={scanLoading}
                                            style={{ width: wp(50) }}
                                            disabled={submitLoading || scanLoading}
                                        />}
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

                    </View>
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
                                        {duplicatePopupSource === "submit"
                                            ? "Are you sure you want to proceed and add this vehicle with the same VIN to the job?"
                                            : "Duplicate VIN found."}
                                    </Text>
                                    <Text style={[textAlign]}>
                                        VIN{' '}
                                        <Text style={{ fontWeight: 'bold' }}>{extractedVin}</Text>{' '}
                                        already exists in the job{' '}
                                        <Text style={{ fontWeight: 'bold' }}>{extractedJob}</Text>{' '}
                                        for customer{' '}
                                        <Text style={{ fontWeight: 'bold' }}>{extractedCustomer}</Text>.
                                    </Text>

                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.confirmButton}
                                            // onPress={handleConfirmDuplicateVin}
                                            onPress={
                                                duplicatePopupSource === "submit"
                                                    ? handleConfirmDuplicateVin // agar source "submit" hai, toh yeh function chale
                                                    : () => {
                                                        setDuplicateVinModal(false);        // popup close karo
                                                        fetchCarDetails(vin, true);         // scan wale case mein VIN dubara fetch karo
                                                    }
                                            }

                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.buttonText}>{duplicatePopupSource === "submit" ? "Yes" : "Create Again"}</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => {
                                                setDuplicateVinModal(false),
                                                    setVin('');
                                                setCarDetails(null);
                                                setStep(1);
                                            }}
                                        >
                                            <Text style={styles.buttonText}>{duplicatePopupSource === "submit" ? "No" : "Re-Scan"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}
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
        marginBottom: spacings.xsmall,
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
        paddingHorizontal: 10,
        backgroundColor: "#5cb85c",
        borderRadius: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 13,
        textAlign: "center"
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
    techItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomColor: blueColor,
        borderBottomWidth: 1,
        backgroundColor: "#fff",
    },
    datePickerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        // marginHorizontal: 10,
        // marginBottom: 15
    },
    datePicker: {
        width: "47%",
        padding: spacings.large,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: blueColor,
        borderRadius: 10

    },
    dateText: {
        color: blackColor,
        marginRight: spacings.small2x,
        fontSize: style.fontSizeNormal.fontSize,
    },
});
