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
import DatePicker from "react-native-date-picker";
import CustomerDropdown from '../componets/CustomerDropdown';
import Feather from 'react-native-vector-icons/Feather';

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
    const [rrTechnicians, setRrTechnicians] = useState([]);
    const [isTechnicianLoading, setIsTechnicianLoading] = useState(false);
    const [technicianPage, setTechnicianPage] = useState(1);
    const [hasMoreTechnicians, setHasMoreTechnicians] = useState(true);
    // const [selectedTechnicians, setSelectedTechnicians] = useState([]);
    const [selectedNormalTechnicians, setSelectedNormalTechnicians] = useState([]);
    const [selectedRrTechnicians, setSelectedRrTechnicians] = useState([]);
    const [technicianError, setTechnicianError] = useState('');
    const [rrTechnicianError, setRrTechnicianError] = useState('');
    const [expandedTechId, setExpandedTechId] = useState(null);
    const [jobDetails, setJobDetails] = useState();
    const [simpleFlatRate, setSimpleFlatRate] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [rirValue, setRirValue] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

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
            const apiUrl = `${API_BASE_URL}/fetchCustomer?userId=${technicianId}&roleType=${technicianType}&page=${page}`;
            console.log("Fetching customers from URL:", apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log("customers::", data);

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
        if (!jobId) {
            console.warn("Invalid job ID");
            return;
        }

        try {
            setLoading(true);
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
            // console.log("fetchSingleJobs API Response Data :", data.jobs);

            if (response.ok && data.jobs) {
                const job = data.jobs;

                // ✅ 1. Set job details and jobName
                setJobDetails(job);
                setJobName(job?.jobName);
                setEstimatedCost(job?.estimatedCost)

                // ✅ 2. Set start and end dates (parse ISO string to Date)
                setStartDate(new Date(job.startDate));
                setEndDate(new Date(job.endDate));

                // ✅ 3. Filter and set technicians
                const allTechs = job.technicians || [];

                const rrTechs = allTechs.filter(t => t?.techType?.toLowerCase() !== 'technician');
                const normalTechs = allTechs.filter(t => t?.techType?.toLowerCase() === 'technician');

                setSelectedNormalTechnicians(normalTechs);
                setSelectedRrTechnicians(rrTechs);

                // ✅ 4. Extract pay rate and rRate from first technician (if exists)
                const normalTech = allTechs.find(t => t?.techType?.toLowerCase() === 'technician');
                if (normalTech?.UserJob) {
                    setSimpleFlatRate(normalTech.UserJob.techFlatRate || "");
                }

                // Find first R/I/R technician (for rRate)
                const rrTech = allTechs.find(t => t?.techType?.toLowerCase() !== 'technician');
                if (rrTech?.UserJob) {
                    setRirValue(rrTech.UserJob.rRate || "");
                }

            } else {
                console.error("Error fetching job data:", data.error || "Unknown error");
            }
        } catch (error) {
            console.error("An error occurred while fetching job data:", error);
        } finally {
            setLoading(false);
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
            console.log(newTechs);

            if (data.status && newTechs.length > 0) {
                const updatedList = page === 1 ? newTechs : [...technicians, ...newTechs];
                // setTechnicians(updatedList);
                // console.log("data", updatedList);
                const rrList = updatedList.filter(
                    tech => tech?.techType?.toLowerCase() !== 'technician'
                );

                const technicianList = updatedList.filter(
                    tech => tech?.techType?.toLowerCase() === 'technician'
                );

                setTechnicians(technicianList);
                setRrTechnicians(rrList);

                if (technicianList.length === 1) {
                    setSelectedNormalTechnicians([technicianList[0]]);
                }
                if (rrList.length === 1) {
                    setSelectedRrTechnicians([rrList[0]]);
                }
                console.log("RR Technicians:", rrList);
                console.log("Other Technicians:", technicianList);
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


    const isNormalTechnicianSelected = (technicianId) => {
        return selectedNormalTechnicians.some(t => t.id === technicianId);
    };

    const isRrTechnicianSelected = (technicianId) => {
        return selectedRrTechnicians.some(t => t.id === technicianId);
    };

    const toggleNormalTechnicianSelection = (tech) => {
        const already = selectedNormalTechnicians.some(t => t.id === tech.id);
        if (already) {
            setSelectedNormalTechnicians(prev => prev.filter(t => t.id !== tech.id));
        } else {
            setSelectedNormalTechnicians(prev => [...prev, tech]);
        }
    };

    const toggleRrTechnicianSelection = (tech) => {
        const already = selectedRrTechnicians.some(t => t.id === tech.id);
        if (already) {
            setSelectedRrTechnicians(prev => prev.filter(t => t.id !== tech.id));
        } else {
            setSelectedRrTechnicians(prev => [...prev, tech]);
        }
    };

    const handleSubmitJob = async () => {
        setCustomerError('');
        setJobNameError('');
        setTechnicianError('');
        setRrTechnicianError('');

        let valid = true;

        if (!selectedCustomer || !selectedCustomer.id) {
            setCustomerError("Please select a customer.");
            valid = false;
        }

        if (!jobName.trim()) {
            setJobNameError("Please enter a job name.");
            valid = false;
        }

        // if (technicianType === 'manager' && selectedNormalTechnicians.length === 0) {
        //     setTechnicianError("Please select at least one technician.");
        //     valid = false;
        // }
        // if (technicianType === 'manager' && selectedRrTechnicians.length === 0) {
        //     setRrTechnicianError("Please select at least one Rr Technician.");
        //     valid = false;
        // }
        if (!valid) return;

        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('auth_token');

            const requestBody = {
                jobName: jobName,
                assignCustomer: selectedCustomer?.id,
                jobId: route?.params?.jobId || undefined,
                assignTechnician: technicianType === 'manager'
                    ? selectedNormalTechnicians?.map(tech => tech?.id)
                    : [technicianId],
                assignManager: technicianType === 'manager' ? technicianId : null,
                createdBy: 'app',
                roleType: technicianType,
                estimatedBy: technicianName,
                startDate: startDate ? startDate.toISOString() : null,
                endDate: endDate ? endDate.toISOString() : null,
                selectedTechnicians: technicianType === 'single-technician'
                    ? [{ userId: technicianId }]
                    : [
                        ...selectedNormalTechnicians?.map(tech => ({
                            userId: tech?.id,
                            techFlatRate: simpleFlatRate,
                        })),
                        ...selectedRrTechnicians?.map(tech => ({
                            userId: tech?.id,
                            rRate: rirValue,
                        }))
                    ],
                estimatedCost: estimatedCost
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

                            <View style={{ paddingTop: spacings.large}}>
                                {/* Filter & Date Picker */}
                                <View style={styles.datePickerContainer}>
                                    <View style={{ width: "45%" }}>
                                        <Text style={styles.label}>Start Date</Text>
                                    </View>
                                    <View style={{ width: "45%" }}>
                                        <Text style={styles.label}>End Date</Text>
                                    </View>
                                </View>
                                <View style={[styles.datePickerContainer]}>
                                    <TouchableOpacity onPress={() => setIsStartPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
                                        <Text style={styles.dateText}>
                                            {startDate?.toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </Text>
                                        <Feather name="calendar" size={20} color={blackColor} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsEndPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
                                        <Text style={styles.dateText}>
                                            {endDate?.toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </Text>
                                        <Feather name="calendar" size={20} color={blackColor} />
                                    </TouchableOpacity>
                                </View>

                                <DatePicker
                                    modal
                                    open={isStartPickerOpen}
                                    date={startDate}
                                    mode="datetime"
                                    onConfirm={(date) => {
                                        setStartDate(date);
                                        setIsStartPickerOpen(false);
                                    }}
                                    onCancel={() => setIsStartPickerOpen(false)}
                                />

                                <DatePicker
                                    modal
                                    open={isEndPickerOpen}
                                    date={endDate}
                                    mode="datetime"
                                    minimumDate={startDate}
                                    onConfirm={(date) => {
                                        const newEndDate = date;
                                        setEndDate(newEndDate);
                                        setIsEndPickerOpen(false);
                                    }}
                                    onCancel={() => setIsEndPickerOpen(false)}
                                />

                            </View>

                            {technicianType === "manager" &&
                                <>
                                    <CustomTextInput
                                        label="Tech Pay rate"
                                        placeholder="Enter Tech Pay rate"
                                        value={simpleFlatRate}
                                        onChangeText={(text) => setSimpleFlatRate(text)}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />

                                    {rrTechnicians.length > 0 && <CustomTextInput
                                        label="R/I/R"
                                        placeholder="Enter R/I/R"
                                        value={rirValue}
                                        onChangeText={(text) => setRirValue(text)}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />}

                                    <View style={{ marginTop: spacings.xxLarge }}>
                                        <Text style={styles.label}>Select Technicians</Text>
                                        <View style={{
                                            borderWidth: 1,
                                            borderColor: blueColor,
                                            borderRadius: 8,
                                            maxHeight: hp(20),
                                            overflow: "hidden",
                                            // marginBottom: 16,
                                        }}>
                                            <FlatList
                                                nestedScrollEnabled={true}
                                                data={technicians}
                                                keyExtractor={(item) => item.id.toString()}
                                                renderItem={({ item }) => {
                                                    const selected = isNormalTechnicianSelected(item.id);
                                                    return (
                                                        <TouchableOpacity
                                                            style={[styles.techItem, flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter, {
                                                                backgroundColor: selected ? lightBlueColor : "#fff"
                                                            }]}
                                                            onPress={() => toggleNormalTechnicianSelection(item)}
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
                                            <Text style={{ color: 'red', marginTop: 5, fontSize: 12 }}>{technicianError}</Text>
                                        ) : null}
                                    </View>



                                    {rrTechnicians.length > 0 && <View style={{ marginTop: 5 }}>
                                        <Text style={styles.label}>Select R Technicians</Text>
                                        <View style={{
                                            borderWidth: 1,
                                            borderColor: blueColor,
                                            borderRadius: 8,
                                            maxHeight: hp(20),
                                            overflow: "hidden",
                                            // marginBottom: 16,
                                        }}>
                                            <FlatList
                                                nestedScrollEnabled={true}
                                                data={rrTechnicians}
                                                keyExtractor={(item) => item.id.toString()}
                                                renderItem={({ item }) => {
                                                    const selected = isRrTechnicianSelected(item.id);
                                                    return (
                                                        <TouchableOpacity
                                                            style={[styles.techItem, flexDirectionRow, justifyContentSpaceBetween, alignItemsCenter, {
                                                                backgroundColor: selected ? lightBlueColor : "#fff"
                                                            }]}
                                                            onPress={() => toggleRrTechnicianSelection(item)}
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
                                        {rrTechnicianError ? (
                                            <Text style={{ color: 'red', marginTop: 5, fontSize: 12 }}>{rrTechnicianError}</Text>
                                        ) : null}
                                    </View>}

                                </>
                            }

                            <CustomTextInput
                                label="Job Estimated Cost"
                                placeholder="Enter Estimated Cost"
                                value={estimatedCost}
                                onChangeText={(text) => setEstimatedCost(text)}
                                keyboardType="numeric"
                                maxLength={8}
                            />
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
        borderRadius: 20

    },
    dateText: {
        color: blackColor,
        marginRight: spacings.small2x,
        fontSize: style.fontSizeNormal.fontSize,
    },


});
