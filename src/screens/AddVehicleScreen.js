import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Pressable, ScrollView, Alert, ScrollViewBase, Image, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Keyboard, Dimensions, TouchableWithoutFeedback } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { blackColor, blueColor, grayColor, greenColor, lightBlueColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import { API_BASE_URL, CREATE_NEW_JOB, NEW_WORK_ORDER } from '../constans/Constants';
import axios from 'axios';
import CustomButton from '../componets/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SuccessModal from '../componets/Modal/SuccessModal';
import Toast from 'react-native-simple-toast';
import { ALERT_IMAGE, SUCCESS_IMAGE, XCIRCLE_IMAGE } from '../assests/images';
import NetInfo from "@react-native-community/netinfo";
import { EventRegister } from 'react-native-event-listeners';
import Header from '../componets/Header';
import CustomerDropdown from '../componets/CustomerDropdown';
import DropDownPicker from 'react-native-dropdown-picker';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const AddVehicleScreen = ({ route }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const navigation = useNavigation();
    const [vin, setVin] = useState('');
    const [carDetails, setCarDetails] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [vinError, setVinError] = useState('');
    const [isCustomerLoading, setIsCustomerLoading] = useState(true);
    const [isLoadingCarDetails, setIsLoadingCarDetails] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedValues, setUpdatedValues] = useState({});
    const [technicianId, setTechnicianId] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [searchText, setSearchText] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSaveVisible, setIsSaveVisible] = useState(false);
    const [isVinApiError, setIsVinApiError] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [addVehicleLoading, setAddVehicleLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [vTypeopen, setVTypeOpen] = useState(false);
    const [selectedVehicleType, setSelectedVehicleType] = useState(null);
    const [storedVehicles, setStoredVehicles] = useState([]);
    const [vehicleTypeError, setVehicleTypeError] = useState();
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

                    }
                } catch (error) {
                    console.error("Error fetching stored user:", error);
                }
            };

            getTechnicianDetail();
        }, [])
    );

    useEffect(() => {
        const fetchCustomerId = async () => {
            const id = await AsyncStorage.getItem("current_customer_id");
            if (id) {
                console.log("Customer ID:", id);
                fetchSingleCustomerDetails(id)
            }
        };
        fetchCustomerId();
    }, []);

    useEffect(() => {
        console.log("route.params?.vinNumber", route.params?.vinNumber)
        if (route.params?.vinNumber) {
            setVin(route.params.vinNumber);
            fetchCarDetails(route.params.vinNumber);
            loadCustomerFromStorage();
        }
    }, [route.params?.vinNumber]);

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
            console.error(error);
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
            console.log("customer iddd::", customerId);

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
                setCustomerDetails(customerData);
                setSearchText(`${capitalize(data?.customers?.customer.firstName)} ${capitalize(data?.customers?.customer.lastName)}`);
                setSelectedCustomer(customerData)
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


    const handleTextInputChange = (text) => {
        setSearchText(text);

        if (text === "") {
            setSelectedCustomer(null);
            setFilteredCustomers([]);
            setCustomerDetails(null)
        } else {
            const filtered = customers.filter((customer) => {
                const fullName = `${capitalize(customer.firstName)} ${capitalize(customer.lastName)}`.toLowerCase();
                return fullName.includes(text.toLowerCase());
            });
            setFilteredCustomers(filtered);
        }
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

    const capitalize = (str) => {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
    };

    const handleSubmit = async (actionType, setLoadingState) => {
        try {
            setLoadingState(true);

            if (!customerDetails || !customerDetails.id) {
                Toast.show("Please select a customer first");
                return;
            }

            if (!vin || vin.trim().length < 17) {
                setVinError("Please enter a valid VIN (17 characters)");
                return;
            }

            const token = await AsyncStorage.getItem("auth_token");
            console.log(token);

            if (!token) {
                console.log("Error", "Authentication token not found");
                return;
            }
            if (technicianType === "ifs" && !selectedVehicleType && storedPayRate === "Pay Per Vehicles") {
                setVehicleTypeError("Please select a Vehicle Type");
                return;
            }

            // Manually build form body (URL-encoded string)
            const vehicleData = {
                vin,
                vehicleDescriptor: updatedValues['Vehicle Descriptor'],
                make: updatedValues['Make'],
                manufacturerName: updatedValues['Manufacturer Name'],
                model: updatedValues['Model'],
                modelYear: updatedValues['Model Year'],
                // vehicleType: updatedValues['Vehicle Type'],
                vehicleType: selectedVehicleType,
                plantCountry: updatedValues['Plant Country'],
                plantCompanyName: updatedValues['Plant Company Name'],
                plantState: updatedValues['Plant State'],
                bodyClass: updatedValues['Body Class'],
                customerId: customerDetails.id,
                roleType: technicianType,
                userId: technicianId
            };

            const formBody = Object.entries(vehicleData)
                .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join("&");


            console.log("form:::", formBody);

            const response = await fetch(`${API_BASE_URL}/addVehicleInfo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                body: formBody
            });

            const responseText = await response.text();
            console.log("Server response:", responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (err) {
                console.error("JSON parse error:", err);
                return;
            }

            if (response.ok && data.status) {
                if (actionType === "AddVehicleScreen") {
                    navigation.navigate('NewJob', {
                        vinNumber: vin,
                        customerDetails: customerDetails,
                        paramVehicleTypes: selectedVehicleType
                    });
                } else {
                    navigation.navigate('Home');
                }
            } else {
                console.log("API Error:", data.message || "Failed to add vehicle");
                Toast.show(data.message || "Failed to add vehicle")
            }

        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setLoadingState(false);
        }
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <Header onBack={() => navigation.navigate('Home')} title={"Add Vehicle"} />
            <TouchableOpacity
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
                <Ionicons name="bag-add-outline" size={20} color={whiteColor} />
                <Text style={[styles.label, textAlign, { marginBottom: 0, padding: 5, color: whiteColor }]}>
                    Create Job
                </Text>
            </TouchableOpacity>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: whiteColor }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={[styles.container]}>
                            {/* Customer Search */}
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

                            <TouchableOpacity style={styles.scanButton}
                                onPress={() => {
                                    if (!selectedCustomer) {
                                        Toast.show("Please select a customer.");
                                        return;
                                    }

                                    // Navigate only if customer is selected
                                    setVin("");
                                    setCarDetails(null);
                                    navigation.navigate('ScannerScreen', { from: "AddVehicle" });
                                }}
                            // onPress={() => { navigation.navigate('ScannerScreen', { from: "AddVehicle" }), setVin(""), setCarDetails(null) }}
                            >
                                <Text style={[styles.scanButtonText, textAlign]}>Scan VIN</Text>
                            </TouchableOpacity>


                            <View style={[styles.dividerContainer, flexDirectionRow, alignItemsCenter]}>
                                <View style={styles.divider} />
                                <Text style={styles.orText}>Or</Text>
                                <View style={styles.divider} />
                            </View>


                            {/* VIN Section */}
                            <View>
                                <Text style={styles.label}>VIN Manually</Text>
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
                                    />
                                    {!isSaveVisible && <TouchableOpacity style={[styles.fetchButton, alignJustifyCenter, { paddingVertical: !isTablet ? spacings.normalx : spacings.xxLarge, width: isTablet ? wp(30) : wp(25), height: isTablet ? hp(3.5) : hp(5) }]}
                                        onPress={() => fetchCarDetails(vin)}
                                        disabled={isLoadingCarDetails} >
                                        {isLoadingCarDetails ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={[styles.fetchButtonText, textAlign]}>{NEW_WORK_ORDER}</Text>
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
                                            <View style={styles.detailItem}>
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
                                                    value={updatedValues[item] || ''}
                                                    onChangeText={(text) => {
                                                        handleChange(item, text);
                                                        const allFieldsFilled = carSelectedVariables.every(
                                                            (f) => updatedValues[f] && updatedValues[f].trim() !== ''
                                                        );
                                                        setIsSaveVisible(allFieldsFilled);
                                                    }}
                                                    returnKeyType={index === carSelectedVariables.length - 1 ? 'done' : 'next'}
                                                    onSubmitEditing={() => {
                                                        if (index < carSelectedVariables.length - 1) {
                                                            inputRefs.current[index + 1]?.focus();
                                                        } else {
                                                            Keyboard.dismiss(); // Last field, dismiss keyboard
                                                        }
                                                    }}
                                                    blurOnSubmit={index === carSelectedVariables.length - 1}
                                                    keyboardType={item === 'Model Year' ? 'numeric' : 'default'}
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

                            {carDetails && !isVinApiError && (
                                <View>
                                    <FlatList
                                        data={carDetails?.filter(detail => carSelectedVariables.includes(detail.Variable))}
                                        keyExtractor={(item, index) => index.toString()}
                                        renderItem={({ item, index }) => {
                                            // console.log("Rendering Item:", item); // ✅ Debugging ke liye
                                            return item?.Value ? (
                                                <View style={[styles.detailItem]}>
                                                    <Text style={[styles.label]}>
                                                        {item.Variable}:
                                                    </Text>
                                                    {isEditing ? (
                                                        <TextInput
                                                            style={[styles.input, { width: isTablet ? wp(45) : wp(40), height: isTablet ? hp(3.5) : hp(5) }]}
                                                            value={updatedValues[item.Variable] ?? item.Value}
                                                            onChangeText={(text) => {
                                                                console.log(`Updated ${item.Variable}:`, text); // ✅ Input change track karne ke liye
                                                                handleChange(item.Variable, text);
                                                            }}
                                                            multiline={false} // Ensures single line
                                                            numberOfLines={1}
                                                        />
                                                    ) : (
                                                        <Text style={styles.detailValue}>
                                                            {updatedValues[item.Variable] || item.Value}
                                                        </Text>
                                                    )}
                                                </View>
                                            ) : null;
                                        }}
                                        numColumns={2}
                                        contentContainerStyle={[styles.details, justifyContentSpaceBetween]}
                                    />

                                    {/* EditButton */}
                                    {/* {carDetails && carDetails.length > 0 && (<TouchableOpacity onPress={toggleEdit} style={[styles.editButton, { top: -2 }]}>
                                    {isEditing ? (
                                        <Text style={[styles.editButtonText, { borderWidth: 1, paddingHorizontal: 5, borderColor: greenColor, borderRadius: 4 }]}>Save</Text>
                                    ) : (
                                        <View style={{ borderWidth: 1, paddingHorizontal: 5, borderColor: blueColor, borderRadius: 4, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={[styles.editButtonText, { color: blueColor }]}>Edit</Text>
                                            <Ionicons name="pencil-sharp" size={15} color={blueColor} style={{ marginLeft: 5 }} />
                                        </View>
                                    )}
                                </TouchableOpacity>)} */}
                                </View>
                            )}

                            {carDetails && carDetails.length > 0 && technicianType === "ifs" && storedPayRate === "Pay Per Vehicles" && (
                                <>
                                    <Text style={[styles.label, { marginTop: 5 }]}>Vehicle Type <Text style={{ color: "red" }}>*</Text></Text>
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
                                            maxHeight: hp(20)
                                        }}
                                        listMode="SCROLLVIEW"
                                    />
                                    {vehicleTypeError && <Text style={{ color: 'red' }}>{vehicleTypeError}</Text>}

                                </>
                            )}

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
                                        navigation.navigate("NewJob"); // Navigate back to the same screen
                                    }}
                                />
                            )}
                        </View>

                    </ScrollView>
                    <View style={[{ backgroundColor: whiteColor, paddingHorizontal: spacings.xxxLarge, position: "absolute", bottom: 0, width: wp(100), paddingTop: spacings.xLarge }, alignJustifyCenter]}>
                        {/* <CustomButton
                            title="Create Job"
                            onPress={() => handleSubmit("AddVehicleScreen", setAddVehicleLoading)}
                            style={[styles.button]}
                            loading={addVehicleLoading}
                            disabled={addVehicleLoading || submitLoading}
                            iconType="Ionicons"
                            iconName="bag-add-outline"
                        /> */}
                        <CustomButton
                            title="Submit"
                            onPress={() => handleSubmit(null, setSubmitLoading)}
                            style={[styles.button, { backgroundColor: blueColor, borderWidth: 1, borderColor: blueColor }]}
                            textStyle={{ color: whiteColor }}
                            loading={submitLoading}
                            disabled={submitLoading || addVehicleLoading}
                        />

                    </View>
                </>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default AddVehicleScreen;

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
        paddingHorizontal: spacings.Large2x,
        paddingBottom: Platform.OS === "android" ? hp(20) : hp(10),
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
        maxHeight: hp(12)
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
        borderRadius: 15,
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
        right: wp(1),
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

    saveButtonContainer: {
        marginTop: spacings.large,
    },
    button: {
        marginBottom: spacings.large,
        width: wp(90)
    },
});
