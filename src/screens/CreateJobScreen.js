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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomerDropdown from '../componets/CustomerDropdown';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const CreateJobScreen = ({ route }) => {
    //   const { jobId } = route?.params;
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const navigation = useNavigation();
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isCustomerLoading, setIsCustomerLoading] = useState(true);
    const [technicianId, setTechnicianId] = useState();
    const [technicianName, setTechnicianName] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [error, setError] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [jobName, setJobName] = useState('');
    const [customerError, setCustomerError] = useState('');
    const [jobNameError, setJobNameError] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [isTechnicianLoading, setIsTechnicianLoading] = useState(false);
    const [technicianPage, setTechnicianPage] = useState(1);
    const [hasMoreTechnicians, setHasMoreTechnicians] = useState(true);
    const [selectedTechnicians, setSelectedTechnicians] = useState([]);
    const [technicianError, setTechnicianError] = useState('');
    const [expandedTechId, setExpandedTechId] = useState(null);
    const [jobDetails, setJobDetails] = useState();
    const [simpleFlatRate, setSimpleFlatRate] = useState('');
    const [rirValue, setRirValue] = useState('');

    console.log("jobDetailsjobDetailsjobDetails>>", jobDetails, route?.params?.jobId);

    // const toggleExpanded = (id) => {
    //     setExpandedTechId(prev => prev === id ? null : id);
    // };

    useFocusEffect(
        useCallback(() => {
            const getTechnicianDetail = async () => {
                try {
                    const storedData = await AsyncStorage.getItem('userDeatils');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        // console.log("parsedData:::::", parsedData);
                        setTechnicianId(parsedData.id);
                        setTechnicianType(parsedData.types)
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
            console.log("Fetching customers from URL:", apiUrl);

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

    const fetchSingleCustomerDetails = async (customerId) => {
        console.log("customerIdcustomerId", customerId);

        try {
            console.log("Fetching details for Customer ID:", customerId);
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

                    // ✅ Update AsyncStorage with the latest customer details
                    const storedCustomers = await AsyncStorage.getItem("customersList");
                    let customerList = storedCustomers ? JSON.parse(storedCustomers) : [];

                    customerList = customerList.map(cust =>
                        cust.id === customerId ? customerData : cust
                    );

                    await AsyncStorage.setItem("customersList", JSON.stringify(customerList));


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
        }
    };

    const handleCustomerSelect = async (item) => {
        setSelectedCustomer(item);
        fetchSingleCustomerDetails(item.id);

        await AsyncStorage.setItem('selectedCustomer', JSON.stringify(item));
    };

    const loadCustomerFromStorage = async () => {
        try {
            const customerData = await AsyncStorage.getItem('selectedCustomer');
            if (customerData) {
                const customer = JSON.parse(customerData);
                // setSelectedCustomer(customer);

                // Fetch customer details again
                fetchSingleCustomerDetails(customer.id);
            }
        } catch (error) {
            console.error('Error loading customer:', error);
        }
    };

    const capitalize = (str) => {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
    };
    useEffect(() => {
        fetchTechnicians(1);
    }, []);

    const fetchJobData = async (jobId) => {
        try {
            setLoading(true); // Start loading
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
                console.log("API Response Data:", data.jobs);

                // ✅ State update
                setJobDetails(data.jobs);
                setJobName(data?.jobs?.jobName)
            } else {
                console.error("Error fetching job data:", data.error || "Unknown error");
            }
        } catch (error) {
            console.error("An error occurred while fetching job data:", error);
        } finally {
            setLoading(false); // Stop loading after API call
        }
    };

    useEffect(() => {
        if (route?.params?.jobId) {
            fetchJobData(route?.params?.jobId);
        }
    }, [route?.params?.jobId]);

    useEffect(() => {
        if (jobDetails) {
            setSelectedCustomer(jobDetails?.customer);
            fetchSingleCustomerDetails(jobDetails?.customer?.id);
        }
    }, [jobDetails]);

    const fetchTechnicians = async (page = 1) => {
        if (!hasMoreTechnicians) return;

        setIsTechnicianLoading(true);
        try {
            const netState = await NetInfo.fetch();

            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }

            const url = `${API_BASE_URL}/fetchTechnician?page=${page}&types=${technicianType}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            const newTechs = data?.technician?.technicians || [];

            if (data.status && newTechs.length > 0) {
                const updatedList = page === 1 ? newTechs : [...technicians, ...newTechs];
                setTechnicians(updatedList);
                console.log("data", updatedList);

                // Save locally
                await AsyncStorage.setItem('technicianList', JSON.stringify(updatedList));

                if (newTechs.length >= 10) {
                    setTechnicianPage(prev => prev + 1);
                } else {
                    setHasMoreTechnicians(false);
                }
            } else {
                setHasMoreTechnicians(false);
            }
        } catch (err) {
            console.error("Technician Fetch Error:", err);
        } finally {
            setIsTechnicianLoading(false);
        }
    };

    const handleLoadMoreTechnicians = () => {
        if (!isTechnicianLoading && hasMoreTechnicians) {
            fetchTechnicians(technicianPage);
        }
    };

    const toggleTechnicianSelection = (technician) => {
        const exists = selectedTechnicians.some(t => t.id === technician.id);

        if (exists) {
            // Deselect
            setSelectedTechnicians(prev =>
                prev.filter(t => t.id !== technician.id)
            );
        } else {
            // Select
            setSelectedTechnicians(prev => [...prev, technician]);
        }
    };

    const isTechnicianSelected = (technicianId) => {
        return selectedTechnicians.some(t => t.id === technicianId);
    };

    const handleRateChange = (techId, key, value) => {
        const updated = selectedTechnicians.map((tech) => {
            if (tech.id === techId) {
                // 1. Percentage or Pay Per Job using amountPercentage (not used now for Pay Per Job)
                if (key === 'amountPercentage') {
                    return {
                        ...tech,
                        [key]: value,
                    };
                }

                // 2. All rates stored in simpleFlatRate (including Pay Per Job's technician field)
                const currentRates = tech.simpleFlatRate ? JSON.parse(tech.simpleFlatRate) : {};
                currentRates[key] = value;

                return {
                    ...tech,
                    simpleFlatRate: JSON.stringify(currentRates),
                };
            }
            return tech;
        });

        console.log(updated);
        setSelectedTechnicians(updated);
    };

    // const handleSubmitJob = async () => {
    //     setCustomerError('');
    //     setJobNameError('');
    //     setTechnicianError('');

    //     let valid = true;

    //     if (!selectedCustomer || !selectedCustomer.id) {
    //         setCustomerError("Please select a customer.");
    //         valid = false;
    //     }

    //     if (!jobName.trim()) {
    //         setJobNameError("Please enter a job name.");
    //         valid = false;
    //     }

    //     // ✅ Validate technicians only if the role is 'manager'
    //     if (technicianType === 'manager' && selectedTechnicians.length === 0) {
    //         setTechnicianError("Please select at least one technician.");
    //         valid = false;
    //     }

    //     if (!valid) return;

    //     try {
    //         setLoading(true);

    //         // Get local storage values
    //         const token = await AsyncStorage.getItem('auth_token');


    //         // console.log("technicianCreateJob", requestBody);


    //         const requestBody = {
    //             jobName: jobName,
    //             assignCustomer: selectedCustomer.id,
    //             // assignTechnician: selectedTechnicians.map(tech => tech.id),
    //             assignTechnician:
    //                 technicianType === 'manager'
    //                     ? selectedTechnicians.map(tech => tech.id)
    //                     : [technicianId],
    //             createdBy: 'app',
    //             roleType: technicianType,
    //             estimatedBy: technicianName,
    //             selectedTechnicians: selectedTechnicians.map(tech => ({
    //                 id: tech.id,
    //                 payRate: tech.payRate,
    //                 payVehicleType: tech.payVehicleType,
    //                 simpleFlatRate: typeof tech.simpleFlatRate === 'string' ? tech.simpleFlatRate : JSON.stringify(tech.simpleFlatRate),
    //                 amountPercentage: tech.amountPercentage,
    //             })),
    //         };
    //         console.log("requestBodyrequestBody>>", requestBody);

    //         const endpoint = `${API_BASE_URL}/technicianCreateJob`;
    //         const response = await fetch(endpoint, {
    //             method: 'POST',
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(requestBody),
    //         });

    //         const result = await response.json();

    //         if (response.ok) {
    //             if (route?.params?.jobId) {
    //                 Toast.show("Job Updated successfully");
    //                 navigation.goBack();
    //             }
    //             Toast.show("Job created successfully");
    //             navigation.goBack();
    //         } else {
    //             console.error("error>>>", result.error);

    //         }

    //     } catch (error) {
    //         console.error("Submission failed:", error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleSubmitJob = async () => {
        setCustomerError('');
        setJobNameError('');
        setTechnicianError('');

        let valid = true;

        if (!selectedCustomer || !selectedCustomer.id) {
            setCustomerError("Please select a customer.");
            valid = false;
        }

        if (!jobName.trim()) {
            setJobNameError("Please enter a job name.");
            valid = false;
        }

        if (technicianType === 'manager' && selectedTechnicians.length === 0) {
            setTechnicianError("Please select at least one technician.");
            valid = false;
        }

        if (!valid) return;

        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('auth_token');

            const requestBody = {
                jobName: jobName,
                assignCustomer: selectedCustomer.id,
                jobId: route?.params?.jobId || undefined,
                assignTechnician:
                    technicianType === 'manager'
                        ? selectedTechnicians.map(tech => tech.id)
                        : [technicianId],
                createdBy: 'app',
                roleType: technicianType,
                estimatedBy: technicianName,
                selectedTechnicians: selectedTechnicians.map(tech => ({
                    id: tech.id,
                    payRate: tech.payRate,
                    payVehicleType: tech.payVehicleType,
                    simpleFlatRate: typeof tech.simpleFlatRate === 'string'
                        ? tech.simpleFlatRate
                        : JSON.stringify(tech.simpleFlatRate),
                    amountPercentage: tech.amountPercentage,
                })),
            };

            // ✅ If editing, include jobId and change endpoint
            const endpoint = route?.params?.jobId ? `${API_BASE_URL}/updateJob` : `${API_BASE_URL}/technicianCreateJob`;



            console.log("requestBody>>", requestBody);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();
            console.log("resultresult>>>", result);

            //  const result = await response.text();
            if (response.ok) {
                if (route?.params?.jobId) {
                    Toast.show("Job updated successfully");
                } else {
                    Toast.show("Job created successfully");
                }
                navigation.goBack();
            } else {
                console.error("error>>>", result.error);
            }

        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1 }}>
                    <Header title={route?.params?.jobId ? "Update Job" : "Create Job"} onBack={() => navigation.navigate("Home")} />
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            backgroundColor: whiteColor,
                            paddingBottom: hp(18),
                            paddingHorizontal: spacings.xxLarge,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
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
                                defaultValue={jobDetails}
                                rightIcon={true}
                                titleText="Select Customer"
                                handleLoadMore={handleLoadMore}
                                isLoading={isCustomerLoading}
                                disabled={route?.params?.jobId}
                            />
                            {customerError ? (
                                <Text style={{ color: 'red', marginTop: 4, fontSize: 12 }}>{customerError}</Text>
                            ) : null}

                            <CustomTextInput
                                label="Job Name"
                                placeholder="Enter Job name"
                                value={jobName}
                                onChangeText={(text) => setJobName(text)}
                                required={true}
                            />
                            {jobNameError ? (
                                <Text style={{ color: 'red', marginTop: 4, fontSize: 12 }}>{jobNameError}</Text>
                            ) : null}

                            {/* Tech Pay Rate (enabled only if payRate is Simple Flat Rate) */}
                            <CustomTextInput
                                label="Tech Pay rate"
                                placeholder="Enter Tech Pay rate"
                                value={simpleFlatRate}
                                onChangeText={(text) => setSimpleFlatRate(text)}
                            />

                            {/* R/I/R (enabled only if payRate is R/I/R) */}
                            <CustomTextInput
                                label="R/I/R"
                                placeholder="Enter R/I/R"
                                value={rirValue}
                                onChangeText={(text) => setRirValue(text)}
                            />

                            {technicianType === "manager" &&
                                <>
                                    <View style={{ marginTop: 20 }}>
                                        <Text style={styles.label}>Select Technician</Text>
                                        <View style={{
                                            borderWidth: 1,
                                            borderColor: blueColor,
                                            borderRadius: 8,
                                            height: hp(20),
                                            overflow: "hidden",
                                            marginBottom: 16,
                                        }}>
                                            <FlatList
                                                nestedScrollEnabled={true}
                                                data={technicians}
                                                keyExtractor={(item) => item.id.toString()}
                                                renderItem={({ item }) => {
                                                    const selected = isTechnicianSelected(item.id);
                                                    return (
                                                        <TouchableOpacity
                                                            style={[styles.techItem, flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter, {
                                                                backgroundColor: selected ? lightBlueColor : "#fff"
                                                            }]}
                                                            onPress={() => toggleTechnicianSelection(item)}
                                                        >
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={{ fontSize: 16 }}>{capitalize(item.firstName)} {capitalize(item.lastName)}</Text>
                                                            </View>
                                                            <Icon
                                                                name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                                                                size={24}
                                                                color={selected ? blueColor : "#ccc"}
                                                                type="MaterialCommunityIcons"
                                                            />
                                                        </TouchableOpacity>
                                                    );
                                                }}
                                                onEndReached={handleLoadMoreTechnicians}
                                                onEndReachedThreshold={0.3}
                                                showsVerticalScrollIndicator={false}
                                                ListFooterComponent={isTechnicianLoading ? <ActivityIndicator /> : null}
                                            />
                                        </View>
                                        {technicianError ? (
                                            <Text style={{ color: 'red', marginTop: 6, fontSize: 12 }}>{technicianError}</Text>
                                        ) : null}
                                    </View>

                                    {/* {selectedTechnicians.length > 0 && (
                                        <View style={{ marginTop: 16 }}>
                                            <Text style={[styles.label, { marginBottom: 8 }]}>Pay Rates:</Text>

                                            {selectedTechnicians.map((tech) => {
                                                const isExpanded = expandedTechId === tech.id;

                                                return (
                                                    <View key={tech.id} style={{ marginBottom: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 10 }}>
                                                        <TouchableOpacity
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: 12,
                                                                backgroundColor: '#F0F4FF',
                                                                borderTopLeftRadius: 10,
                                                                borderTopRightRadius: 10,
                                                            }}
                                                            onPress={() => toggleExpanded(tech.id)}
                                                        >
                                                            <Text style={{ fontSize: 16, fontWeight: '600' }}>
                                                                {capitalize(tech.firstName)} {capitalize(tech.lastName)}
                                                            </Text>

                                                            <Icon
                                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                                type="Feather"
                                                                size={22}
                                                                color="#333"
                                                            />
                                                        </TouchableOpacity>

                                                        {isExpanded && (
                                                            <View style={{ paddingHorizontal: spacings.large, paddingBottom: spacings.xxLarge }}>

                                                                <View style={styles.flexRowInputBox}>
                                                                    <Text style={[styles.inputLabel, { width: "50%" }]}>Pay Rate</Text>
                                                                    <Text style={styles.inputValue}>{tech?.payRate}</Text>
                                                                </View>

                                                                {tech.payRate === "Simple Percentage" && (
                                                                    <View style={styles.flexRowInputBox}>
                                                                        <Text style={styles.inputLabel}>Simple Percentage (%)</Text>
                                                                        <TextInput
                                                                            value={tech?.amountPercentage?.toString() || "0"}
                                                                            onChangeText={(text) => handleRateChange(tech?.id, 'amountPercentage', text)}
                                                                            style={styles.inputEditable}
                                                                            keyboardType="numeric"
                                                                            placeholder="Enter % commission"
                                                                            placeholderTextColor="#999"
                                                                        />
                                                                    </View>
                                                                )}

                                                                {(tech?.payRate === "Simple Flat Rate" || tech?.payRate === "Pay Per Vehicles") &&
                                                                    tech?.simpleFlatRate &&
                                                                    Object.entries(JSON.parse(tech?.simpleFlatRate)).map(([type, rate], idx) => (
                                                                        <View key={idx} style={styles.flexRowInputBox}>
                                                                            {tech?.payRate === "Pay Per Vehicles" ? (
                                                                                <Text style={styles.inputLabel}>{type}</Text>
                                                                            ) : (
                                                                                <Text style={styles.inputLabel}>Simple Flat Rate</Text>
                                                                            )}
                                                                            <TextInput
                                                                                value={rate.toString()}
                                                                                onChangeText={(text) => handleRateChange(tech?.id, type, text)}
                                                                                style={styles.inputEditable}
                                                                                keyboardType="numeric"
                                                                                placeholder={`Enter rate for ${type}`}
                                                                                placeholderTextColor="#999"
                                                                            />
                                                                        </View>
                                                                    ))}

                                                                {tech?.payRate === "Pay Per Job" && (
                                                                    <View style={styles.flexRowInputBox}>
                                                                        <Text style={styles.inputLabel}>Enter Amount</Text>
                                                                        <TextInput
                                                                            value={JSON.parse(tech?.simpleFlatRate || "{}")?.technician?.toString() || ""}
                                                                            onChangeText={(text) => handleRateChange(tech?.id, 'technician', text)}
                                                                            style={styles.inputEditable}
                                                                            keyboardType="numeric"
                                                                            placeholder="Enter flat job amount"
                                                                            placeholderTextColor="#999"
                                                                        />
                                                                    </View>
                                                                )}

                                                            </View>
                                                        )}
                                                        

                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )} */}
                                </>
                            }

                            {technicianType === "manager" &&
                                <>
                                    <View style={{ marginTop: 20 }}>
                                        <Text style={styles.label}>Select R/I/R Technician</Text>
                                        <View style={{
                                            borderWidth: 1,
                                            borderColor: blueColor,
                                            borderRadius: 8,
                                            height: hp(20),
                                            overflow: "hidden",
                                            marginBottom: 16,
                                        }}>
                                            <FlatList
                                                nestedScrollEnabled={true}
                                                data={technicians}
                                                keyExtractor={(item) => item.id.toString()}
                                                renderItem={({ item }) => {
                                                    const selected = isTechnicianSelected(item.id);
                                                    return (
                                                        <TouchableOpacity
                                                            style={[styles.techItem, flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter, {
                                                                backgroundColor: selected ? lightBlueColor : "#fff"
                                                            }]}
                                                            onPress={() => toggleTechnicianSelection(item)}
                                                        >
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={{ fontSize: 16 }}>{capitalize(item.firstName)} {capitalize(item.lastName)}</Text>
                                                            </View>
                                                            <Icon
                                                                name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                                                                size={24}
                                                                color={selected ? blueColor : "#ccc"}
                                                                type="MaterialCommunityIcons"
                                                            />
                                                        </TouchableOpacity>
                                                    );
                                                }}
                                                onEndReached={handleLoadMoreTechnicians}
                                                onEndReachedThreshold={0.3}
                                                showsVerticalScrollIndicator={false}
                                                ListFooterComponent={isTechnicianLoading ? <ActivityIndicator /> : null}
                                            />
                                        </View>
                                        {technicianError ? (
                                            <Text style={{ color: 'red', marginTop: 6, fontSize: 12 }}>{technicianError}</Text>
                                        ) : null}
                                    </View>

                                    {/* {selectedTechnicians.length > 0 && (
                                        <View style={{ marginTop: 16 }}>
                                            <Text style={[styles.label, { marginBottom: 8 }]}>Pay Rates:</Text>

                                            {selectedTechnicians.map((tech) => {
                                                const isExpanded = expandedTechId === tech.id;

                                                return (
                                                    <View key={tech.id} style={{ marginBottom: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 10 }}>
                                                        <TouchableOpacity
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: 12,
                                                                backgroundColor: '#F0F4FF',
                                                                borderTopLeftRadius: 10,
                                                                borderTopRightRadius: 10,
                                                            }}
                                                            onPress={() => toggleExpanded(tech.id)}
                                                        >
                                                            <Text style={{ fontSize: 16, fontWeight: '600' }}>
                                                                {capitalize(tech.firstName)} {capitalize(tech.lastName)}
                                                            </Text>

                                                            <Icon
                                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                                type="Feather"
                                                                size={22}
                                                                color="#333"
                                                            />
                                                        </TouchableOpacity>

                                                        {isExpanded && (
                                                            <View style={{ paddingHorizontal: spacings.large, paddingBottom: spacings.xxLarge }}>

                                                                <View style={styles.flexRowInputBox}>
                                                                    <Text style={[styles.inputLabel, { width: "50%" }]}>Pay Rate</Text>
                                                                    <Text style={styles.inputValue}>{tech?.payRate}</Text>
                                                                </View>

                                                                {tech.payRate === "Simple Percentage" && (
                                                                    <View style={styles.flexRowInputBox}>
                                                                        <Text style={styles.inputLabel}>Simple Percentage (%)</Text>
                                                                        <TextInput
                                                                            value={tech?.amountPercentage?.toString() || "0"}
                                                                            onChangeText={(text) => handleRateChange(tech?.id, 'amountPercentage', text)}
                                                                            style={styles.inputEditable}
                                                                            keyboardType="numeric"
                                                                            placeholder="Enter % commission"
                                                                            placeholderTextColor="#999"
                                                                        />
                                                                    </View>
                                                                )}

                                                                {(tech?.payRate === "Simple Flat Rate" || tech?.payRate === "Pay Per Vehicles") &&
                                                                    tech?.simpleFlatRate &&
                                                                    Object.entries(JSON.parse(tech?.simpleFlatRate)).map(([type, rate], idx) => (
                                                                        <View key={idx} style={styles.flexRowInputBox}>
                                                                            {tech?.payRate === "Pay Per Vehicles" ? (
                                                                                <Text style={styles.inputLabel}>{type}</Text>
                                                                            ) : (
                                                                                <Text style={styles.inputLabel}>Simple Flat Rate</Text>
                                                                            )}
                                                                            <TextInput
                                                                                value={rate.toString()}
                                                                                onChangeText={(text) => handleRateChange(tech?.id, type, text)}
                                                                                style={styles.inputEditable}
                                                                                keyboardType="numeric"
                                                                                placeholder={`Enter rate for ${type}`}
                                                                                placeholderTextColor="#999"
                                                                            />
                                                                        </View>
                                                                    ))}

                                                                {tech?.payRate === "Pay Per Job" && (
                                                                    <View style={styles.flexRowInputBox}>
                                                                        <Text style={styles.inputLabel}>Enter Amount</Text>
                                                                        <TextInput
                                                                            value={JSON.parse(tech?.simpleFlatRate || "{}")?.technician?.toString() || ""}
                                                                            onChangeText={(text) => handleRateChange(tech?.id, 'technician', text)}
                                                                            style={styles.inputEditable}
                                                                            keyboardType="numeric"
                                                                            placeholder="Enter flat job amount"
                                                                            placeholderTextColor="#999"
                                                                        />
                                                                    </View>
                                                                )}

                                                            </View>
                                                        )}
                                                        

                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )} */}
                                </>
                            }
                        </View>
                    </ScrollView>

                    <View style={{ padding: hp(2), backgroundColor: whiteColor }}>
                        <CustomButton
                            title={route?.params?.jobId ? "Update Job" : "Create Job"}
                            onPress={handleSubmitJob}
                            loading={loading}
                            disabled={loading}
                        />
                    </View>

                </View>
            </TouchableWithoutFeedback >
        </KeyboardAvoidingView >
    );
};

export default CreateJobScreen;

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
        paddingHorizontal: spacings.xxLarge,
        width: "100%",
        flex: 1
    },
    title: {
        fontSize: style.fontSizeLargeXX.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: blackColor,
        marginBottom: spacings.large,
    },
    sectionContainer: {
        marginTop: spacings.xLarge,
        // height: hp(100),
    },
    label: {
        fontSize: style.fontSizeNormal.fontSize,
        fontWeight: "500",
        color: blackColor,
        marginBottom: spacings.large,
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
    details: {
        padding: spacings.small,
    },
    detailItem: {
        margin: 3,
        width: "50%",
    },
    techItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomColor: blueColor,
        borderBottomWidth: 1,
        backgroundColor: "#fff",
    },
    readOnlyInputBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginTop: 10,
        backgroundColor: lightBlueColor,
        flexDirection: "row",
        justifyContent: "space-between"
    },
    inputValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
        flex: 1,
        textAlign: 'right',
    },
    flexRowInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    inputLabel: {
        width: '50%',  // fixed width for labels
        fontSize: 15,
        color: '#333',
    },
    inputEditable: {
        width: '50%',  // fixed width for input
        borderBottomWidth: 1,
        borderColor: '#ccc',
        textAlign: 'center',
        paddingVertical: 4,
        fontSize: 15,
    },



});
