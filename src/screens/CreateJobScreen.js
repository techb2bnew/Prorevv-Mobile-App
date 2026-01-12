import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Pressable, ScrollView, Alert, ScrollViewBase, Image, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Keyboard, Dimensions, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { blackColor, blueColor, grayColor, greenColor, lightBlueColor, lightGrayColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from "react-native-date-picker";
import CustomerDropdown from '../componets/CustomerDropdown';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons
    from 'react-native-vector-icons/SimpleLineIcons';
import { useOrientation } from '../OrientationContext';


const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const CreateJobScreen = ({ route }) => {
    //   const { jobId } = route?.params;
    const { width, height } = useWindowDimensions();
    const { orientation } = useOrientation();
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
    const [selectedNormalTechnicians, setSelectedNormalTechnicians] = useState([]);
    const [selectedRrTechnicians, setSelectedRrTechnicians] = useState([]);
    const [technicianError, setTechnicianError] = useState('');
    const [rrTechnicianError, setRrTechnicianError] = useState('');
    const [expandedTechId, setExpandedTechId] = useState(null);
    const [jobDetails, setJobDetails] = useState();
    const [simpleFlatRate, setSimpleFlatRate] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [rirValue, setRirValue] = useState('');
    const [startDate, setStartDate] = useState(null);  // Set initial state to null
    const [endDate, setEndDate] = useState(null);
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
    const [jobsRawData, setJobsRawData] = useState([])
    const [jobPage, setJobPage] = useState(1);
    const [hasMoreJob, setHasMoreJob] = useState(true);
    const [isAddMode, setIsAddMode] = useState(false);
    const [viewType, setViewType] = useState('list');
    const [isJobLoading, setIsJobLoading] = useState(false);
    const [isJobLoadingMore, setIsJobLoadingMore] = useState(false);
    const isIOsAndTablet = Platform.OS === "ios" && isTablet;
    const [notes, setNotes] = useState("");
    const [editableJobId, setEditableJobId] = useState(null);
    const [showPriceTooltip, setShowPriceTooltip] = useState(false);
    const scrollViewRef = useRef(null);
    const notesInputRef = useRef(null);


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

    useEffect(() => {
        fetchJobHistory(1, false);
    }, [technicianId, isAddMode])


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
            console.log("fetchSingleJobs API Response Data :", data.jobs);

            if (response.ok && data.jobs) {
                const job = data.jobs;

                // ✅ 1. Set job details and jobName
                setJobDetails(job);
                setJobName(job?.jobName);
                setEstimatedCost(job?.estimatedCost);
                setNotes(job?.notes)

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

    const fetchJobHistory = async (newPage = 1, isPagination = false) => {
        if (!technicianId) {
            console.warn("No Technician ID found. Exiting function.");
            return;
        }

        // Show loading indicators based on request type
        if (isPagination) {
            setIsJobLoadingMore(true);
        } else {
            setIsJobLoading(true);
        }

        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("No token found");
                return;
            }
            // console.log("token", technicianId);
            const apiUrl = technicianType === "manager"
                ? `${API_BASE_URL}/fetchAllJobs?roleType=${technicianType}&page=${newPage}&limit=${viewType === 'list' ? "20" : "10"}`
                : technicianType === "single-technician"
                    ? `${API_BASE_URL}/fetchAllJobs?userId=${technicianId}&roleType=${technicianType}&page=${newPage}&limit=${viewType === 'list' ? "20" : "10"}`
                    : `${API_BASE_URL}/fetchAllJobs?userId=${technicianId}&page=${newPage}&limit=${viewType === 'list' ? "20" : "10"}`;
            const response = await axios.get(
                apiUrl,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newJobs = (technicianType === "manager") ? (response?.data?.jobs?.jobs) : (response?.data?.jobs?.jobs) || [];

            const updatedJobs = newPage === 1 ? newJobs : [...jobsRawData, ...newJobs];
            console.log("fetchJobHistory", updatedJobs);

            setJobsRawData(updatedJobs);


            setHasMoreJob(newJobs.length > 0);
            setJobPage(newPage);
        } catch (error) {
            console.error("Error fetching job history:", error);
        } finally {
            if (isPagination) {
                setIsJobLoadingMore(false);
            } else {
                setIsJobLoading(false);
            }
        }
    };

    useEffect(() => {
        if (route?.params?.jobId) {
            fetchJobData(route?.params?.jobId);
            setEditableJobId(route?.params?.jobId)
            setIsAddMode(true)
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
            console.log("Fetched Page:", page, "Techs Count:", newTechs.length);

            // if (data.status && newTechs.length > 0) {
            //     const updatedList = page === 1 ? newTechs : [...technicians, ...newTechs];
            //     // setTechnicians(updatedList);
            //     console.log("data:::::", updatedList);
            //     const rrList = updatedList.filter(
            //         tech => tech?.techType?.toLowerCase() !== 'technician'
            //     );
            //     const technicianList = updatedList.filter(
            //         tech => tech?.techType?.toLowerCase() === 'technician'
            //     );

            //     setTechnicians(technicianList);
            //     setRrTechnicians(rrList);

            //     if (technicianList.length === 1) {
            //         setSelectedNormalTechnicians([technicianList[0]]);
            //     }
            //     if (rrList.length === 1) {
            //         setSelectedRrTechnicians([rrList[0]]);
            //     }
            //     console.log("RR Technicians:", rrList);
            //     console.log("Other Technicians:", technicianList);
            //     await AsyncStorage.setItem('technicianList', JSON.stringify(updatedList));

            //     // if (newTechs.length >= 10) {
            //     //     setTechnicianPage(prev => prev + 1);
            //     // } else {
            //     //     setHasMoreTechnicians(false);
            //     // }
            //     setTechnicianPage(page);
            //     setHasMoreTechnicians(newTechs.length >= 10);

            // } 
            if (data.status && newTechs.length > 0) {
                const newRrList = newTechs.filter(tech => tech?.techType?.toLowerCase() !== 'technician');
                const newTechnicianList = newTechs.filter(tech => tech?.techType?.toLowerCase() === 'technician');

                if (page === 1) {
                    setTechnicians(newTechnicianList);
                    setRrTechnicians(newRrList);
                } else {
                    setTechnicians(prev => [...prev, ...newTechnicianList]);
                    setRrTechnicians(prev => [...prev, ...newRrList]);
                }

                if (newTechnicianList.length === 1 && page === 1) {
                    setSelectedNormalTechnicians([newTechnicianList[0]]);
                }
                if (newRrList.length === 1 && page === 1) {
                    setSelectedRrTechnicians([newRrList[0]]);
                }

                setTechnicianPage(page);
                setHasMoreTechnicians(newTechs.length >= 10);
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
            // fetchTechnicians(technicianPage);
            console.log("Calling fetch for Page:", technicianPage + 1);
            fetchTechnicians(technicianPage + 1);

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
                jobId: route?.params?.jobId || editableJobId || undefined,
                assignTechnician: technicianType === 'manager'
                    ? selectedNormalTechnicians?.map(tech => tech?.id)
                    : [technicianId],
                assignManager: technicianType === 'manager' ? technicianId : null,
                createdBy: 'app',
                roleType: technicianType,
                estimatedBy: technicianName,
                startDate: startDate ? startDate.toISOString() : new Date().toISOString(),
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
                estimatedCost: estimatedCost,
                notes: notes
            };
            console.log("req", requestBody);

            // ✅ If editing, include jobId and change endpoint
            const endpoint = route?.params?.jobId || editableJobId ? `${API_BASE_URL}/updateJob` : `${API_BASE_URL}/technicianCreateJob`;

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
                if (route?.params?.jobId || editableJobId) {
                    Toast.show("Job updated successfully");
                    // navigation.goBack();
                    setIsAddMode(false)
                    setEditableJobId(null)
                } else {
                    Toast.show("Job created successfully");
                    setIsAddMode(false)
                }
            } else {
                console.error("error>>>", result.error);
                setError(result.error)
            }

        } catch (error) {
            console.error("Submission failed:", error);
            setError(error)
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        console.log("🚀 API Response Start Date:", jobDetails?.startDate);
        console.log("🚀 API Response End Date:", jobDetails?.endDate);

        setStartDate(jobDetails?.startDate ? new Date(jobDetails.startDate) : null);
        setEndDate(jobDetails?.endDate ? new Date(jobDetails.endDate) : null);
    }, [jobDetails]);

    return (
        <KeyboardAvoidingView
            style={[flex]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}

            <View style={{ flex: 1 }}>
                <Header title={route?.params?.jobId || editableJobId ? "Update Job" : !isAddMode ? "Jobs" : "Create Job"}
                    onBack={() => route?.params?.jobId || editableJobId ? (setIsAddMode(false), setEditableJobId(null)) : navigation.navigate("Home")} />
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
                        }]}>
                        <Ionicons name="grid-sharp" size={isTablet ? 35 : orientation === "LANDSCAPE" ? 35 : 20} color={viewType === 'grid' ? blackColor : blackColor} />
                    </TouchableOpacity>

                </View>}
                {!isAddMode ? (
                    <>
                        {viewType === 'list' && (
                            <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ backgroundColor: whiteColor }}>
                                        {/* Table Header */}
                                        <View style={[styles.tableHeader, flexDirectionRow]}>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(25) }]}>Job Title</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(33) }]}>Number of W.O</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(33) }]}>Customer Name</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(33) }]}>Vehicle Price</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(33) }]}>Start Date</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(33) }]}>End Date</Text>
                                            <Text style={[styles.tableHeaderText, { width: isTablet ? wp(25) : orientation === "LANDSCAPE" ? wp(15) : wp(25) }]}>Action</Text>
                                        </View>

                                        {/* Table Rows */}
                                        {isJobLoading ? (
                                            <View style={{ width: wp(100), justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                                                <ActivityIndicator size="large" color={blackColor} />
                                                <Text style={{ marginTop: 10, color: '#555' }}>Loading jobs...</Text>
                                            </View>
                                        ) : (
                                            <FlatList
                                                data={jobsRawData}
                                                keyExtractor={(item, index) => index.toString()}
                                                renderItem={({ item, index }) => (
                                                    <Pressable
                                                        style={[
                                                            styles.tableRow,
                                                            flexDirectionRow,
                                                            {
                                                                backgroundColor: index % 2 === 0 ? lightGrayColor : whiteColor,
                                                            },
                                                        ]}
                                                        onPress={() => navigation.navigate("NewJobDetailsScreen", {
                                                            jobId: item?.id
                                                        })}
                                                    >
                                                        <Text style={[styles.tableText, { width: isTablet ? wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(30), paddingRight: spacings.large }]}>{capitalize(item.jobName) || '—'}</Text>
                                                        <Text style={[styles.tableText, { width: isTablet ? wp(10) : orientation === "LANDSCAPE" ? wp(10) : wp(30), paddingLeft: spacings.large }]}>{item?.vehicles?.length}</Text>
                                                        <Text style={[styles.tableText, { width: isTablet ? wp(20) : orientation === "LANDSCAPE" ? wp(20) : wp(35) }]}>{capitalize(item.customer?.fullName) || '—'}</Text>
                                                        <Text style={[styles.tableText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(30) }]}>
                                                            {item.estimatedCost ? `$${item.estimatedCost}` : '—'}
                                                        </Text>
                                                        <Text style={[styles.tableText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(33) }]}>
                                                            {item.startDate
                                                                ? new Date(item.startDate).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: '2-digit',
                                                                    year: 'numeric',
                                                                })
                                                                : '—'}
                                                        </Text>
                                                        <Text style={[styles.tableText, { width: isTablet ? wp(15) : orientation === "LANDSCAPE" ? wp(15) : wp(33) }]}>
                                                            {item.endDate
                                                                ? new Date(item.endDate).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: '2-digit',
                                                                    year: 'numeric',
                                                                })
                                                                : '—'}
                                                        </Text>
                                                        <Pressable onPress={() => navigation.navigate("NewJobDetailsScreen", {
                                                            jobId: item?.id
                                                        })}>
                                                            <Text style={styles.viewText}>View</Text>
                                                        </Pressable>
                                                        {item.jobStatus !== true && (<Pressable onPress={() => {
                                                            fetchJobData(item?.id);
                                                            setEditableJobId(item?.id)
                                                            setIsAddMode(true);
                                                        }}>
                                                            <Text style={styles.viewText}>Edit</Text>
                                                        </Pressable>)}
                                                    </Pressable>
                                                )}
                                                onEndReached={() => {
                                                    if (!isJobLoading && hasMoreJob) {
                                                        fetchJobHistory(jobPage + 1, true);
                                                    }
                                                }}
                                                onEndReachedThreshold={0.3}
                                                ListFooterComponent={() =>
                                                    isJobLoadingMore ? (
                                                        <View style={{ paddingVertical: 10, alignItems: "center", justifyContent: "center" }}>
                                                            <ActivityIndicator size="small" color="#0000ff" />
                                                        </View>
                                                    ) : null
                                                }
                                                ListEmptyComponent={() =>
                                                    !isJobLoading && (
                                                        <View style={styles.emptyContainer}>
                                                            <Text style={styles.emptyText}>No Jobs found</Text>
                                                        </View>
                                                    )
                                                }
                                            />)}
                                    </View>
                                </ScrollView>

                                {/* Floating Add Button */}
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsAddMode(true);  // Enable add mode
                                        // Clear job-related states
                                        setJobName('');
                                        setNotes('');
                                        setEstimatedCost('');
                                        setSimpleFlatRate('');
                                        setRirValue('');
                                        // setSelectedCustomer(null);
                                        setSelectedNormalTechnicians([]);
                                        setSelectedRrTechnicians([]);
                                        setStartDate(null);
                                        setEndDate(null);
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
                                    <Ionicons name="add-outline" size={28} color={whiteColor} />
                                </TouchableOpacity>
                            </>
                        )}

                        {viewType === 'grid' && (
                            <View style={{ flex: 1, backgroundColor: whiteColor, paddingBottom: hp(5), backgroundColor: whiteColor }}>
                                <FlatList
                                    data={jobsRawData}
                                    keyExtractor={(item, index) => index.toString()}
                                    contentContainerStyle={{ padding: 10 }}
                                    showsVerticalScrollIndicator={false}
                                    renderItem={({ item, index }) => (
                                        <Pressable style={{
                                            backgroundColor: index % 2 === 0 ? lightGrayColor : whiteColor,
                                            borderRadius: 10,
                                            padding: 10,
                                            marginBottom: 10,
                                            //  marginHorizontal: 10,
                                            borderWidth: 1,
                                            borderColor: blackColor
                                        }}
                                            onPress={() => navigation.navigate("NewJobDetailsScreen", {
                                                jobId: item?.id
                                            })}
                                        >
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                                {item.jobStatus !== true && (<Pressable
                                                    onPress={() => {
                                                        fetchJobData(item?.id);
                                                        setEditableJobId(item?.id)
                                                        setIsAddMode(true);
                                                    }}
                                                    style={{ position: "absolute", right: -5, top: -10, zIndex: 999 }}>
                                                    <AntDesign name="edit" size={20} color={blackColor} />

                                                </Pressable>)}
                                                <View style={{ width: '48%', marginBottom: 10 }}>
                                                    <Text style={{ color: '#555', fontSize: 11 }}>JobName</Text>
                                                    <Text>{item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}</Text>
                                                </View>
                                                <View style={{ width: '48%', marginBottom: 10 }}>
                                                    <Text style={{ color: '#555', fontSize: 11 }}>Number of W.O</Text>
                                                    <Text >{item?.vehicles?.length}</Text>
                                                </View>
                                                <View style={{ width: '48%', marginBottom: 10 }}>
                                                    <Text style={{ color: '#555', fontSize: 11 }}>Customer Name</Text>
                                                    <Text >{capitalize(item.customer?.fullName) || '—'}</Text>
                                                </View>
                                                <View style={{ width: '48%', marginBottom: 10 }}>
                                                    <Text style={{ color: '#555', fontSize: 11 }}>Vehicle Price</Text>
                                                    <Text >{item.estimatedCost ? `$${item.estimatedCost}` : '—'}</Text>
                                                </View>
                                                <View style={{ width: '48%', marginBottom: 10 }}>
                                                    <Text style={{ color: '#555', fontSize: 11 }}>Start Date</Text>
                                                    <Text >{item.startDate
                                                        ? new Date(item.startDate).toLocaleDateString('en-US', {
                                                            month: 'long',
                                                            day: '2-digit',
                                                            year: 'numeric',
                                                        })
                                                        : '—'}
                                                    </Text>
                                                </View>
                                                <View style={{ width: '48%', marginBottom: 10 }}>
                                                    <Text style={{ color: '#555', fontSize: 11 }}>End Date</Text>
                                                    <Text >{item.endDate
                                                        ? new Date(item.endDate).toLocaleDateString('en-US', {
                                                            month: 'long',
                                                            day: '2-digit',
                                                            year: 'numeric',
                                                        })
                                                        : '—'}
                                                    </Text>
                                                </View>

                                            </View>

                                        </Pressable>
                                    )}

                                    onEndReached={() => {
                                        if (!isJobLoading && hasMoreJob) {
                                            fetchJobHistory(jobPage + 1, true);
                                        }
                                    }}
                                    onEndReachedThreshold={0.3}
                                    ListFooterComponent={() =>
                                        isJobLoadingMore ? (
                                            <View style={{ paddingVertical: 10, alignItems: "center", justifyContent: "center" }}>
                                                <ActivityIndicator size="small" color="#0000ff" />
                                            </View>
                                        ) : null
                                    }
                                    ListEmptyComponent={() =>
                                        !isJobLoading && (
                                            <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>No Jobs found</Text>
                                            </View>
                                        )
                                    }
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsAddMode(true);  // Enable add mode
                                        // Clear job-related states
                                        setJobName('');
                                        setNotes('');
                                        setEstimatedCost('');
                                        setSimpleFlatRate('');
                                        setRirValue('');
                                        // setSelectedCustomer(null);
                                        setSelectedNormalTechnicians([]);
                                        setSelectedRrTechnicians([]);
                                        setStartDate(null);
                                        setEndDate(null);
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
                                    <Ionicons name="add-outline" size={28} color={whiteColor} />
                                </TouchableOpacity>
                            </View>
                        )
                        }
                    </>
                ) : (
                    <>
                        {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
                        <ScrollView
                            ref={scrollViewRef}
                            contentContainerStyle={{
                                flexGrow: 1,
                                backgroundColor: whiteColor,
                                paddingBottom: Platform.OS === 'ios' ? hp(10) : hp(2),
                                paddingHorizontal: spacings.xxLarge,
                            }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            keyboardDismissMode="interactive"
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
                                    maxLength={50}
                                />
                                {jobNameError ? (
                                    <Text style={{ color: 'red', marginTop: 4, fontSize: 12 }}>{jobNameError}</Text>
                                ) : null}

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
                                    <View style={[styles.datePickerContainer]}>
                                        <Pressable
                                            // onPress={() => setIsStartPickerOpen(true)}
                                            style={[styles.datePicker, flexDirectionRow, alignItemsCenter, { opacity: 0.5 }]}>
                                            <Text style={styles.dateText}>
                                                {startDate !== null && startDate !== undefined && startDate !== "null"
                                                    ? new Date(startDate).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })
                                                    : new Date().toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                            </Text>
                                            <Feather name="calendar" size={20} color={blackColor} />
                                        </Pressable>
                                        <TouchableOpacity onPress={() => setIsEndPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
                                            <Text style={styles.dateText}>
                                                {endDate !== null && endDate !== undefined && endDate !== "null"
                                                    ? new Date(endDate).toLocaleDateString("en-US", {
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
                                        onConfirm={(date) => {
                                            setStartDate(date);
                                            setIsStartPickerOpen(false);
                                        }}
                                        onCancel={() => setIsStartPickerOpen(false)}
                                    />

                                    <DatePicker
                                        modal
                                        open={isEndPickerOpen}
                                        date={endDate ? new Date(endDate) : new Date()}
                                        // date={endDate || new Date()}  // Avoid showing today's date if no endDate selected
                                        mode="date"
                                        minimumDate={startDate ? new Date(startDate) : new Date()}
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
                                            label="Tech Pay rate($)"
                                            placeholder="Enter Tech Pay rate"
                                            value={simpleFlatRate}
                                            onChangeText={(text) => setSimpleFlatRate(text)}
                                            keyboardType="numeric"
                                            maxLength={5}
                                        />

                                        {rrTechnicians.length > 0 && <CustomTextInput
                                            label="R/I/R($)"
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
                                                borderColor: blackColor,
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
                                                                    color={selected ? blackColor : "#ccc"}
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
                                                borderColor: blackColor,
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
                                                                    color={selected ? blackColor : "#ccc"}
                                                                    type="MaterialCommunityIcons"
                                                                />
                                                            </TouchableOpacity>
                                                        );
                                                    }}
                                                    onEndReached={handleLoadMoreTechnicians}
                                                    onEndReachedThreshold={0.5}
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

                                <View style={{ marginTop: spacings.xxxLarge }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                        <Text style={styles.label}>Price per vehicle($)</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowPriceTooltip(true)}
                                            style={{ marginLeft: spacings.large, marginBottom: spacings.large }}
                                        >
                                            <SimpleLineIcons name="question" size={16} color={blueColor} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.inputContainer]}>
                                        <TextInput
                                            placeholder="Price per vehicle"
                                            value={estimatedCost}
                                            onChangeText={(text) => setEstimatedCost(text)}
                                            keyboardType="numeric"
                                            maxLength={8}
                                            style={styles.textInput}
                                            placeholderTextColor={mediumGray}
                                        />
                                    </View>
                                </View>

                                <Modal
                                    visible={showPriceTooltip}
                                    transparent={true}
                                    animationType="fade"
                                    onRequestClose={() => setShowPriceTooltip(false)}
                                >
                                    <TouchableWithoutFeedback onPress={() => setShowPriceTooltip(false)}>
                                        <View style={styles.modalOverlay}>
                                            <TouchableWithoutFeedback onPress={() => { }}>
                                                <View style={styles.tooltipContainer}>
                                                    <View style={styles.tooltipHeader}>
                                                        <Text style={styles.tooltipTitle}>Price per vehicle</Text>
                                                        <TouchableOpacity onPress={() => setShowPriceTooltip(false)}>
                                                            <Ionicons name="close" size={24} color={blackColor} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <Text style={styles.tooltipText}>
                                                        This is the price of the majority of vehicles that will be paid to you. If there are exceptions you will have the opportunity to override this after you scan the vehicle
                                                    </Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>

                                <View style={styles.sectionContainer}>
                                    <Text style={styles.label}>Notes</Text>
                                    <TextInput
                                        ref={notesInputRef}
                                        placeholder="Write your notes here..."
                                        style={styles.notesInput}
                                        multiline={true}
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                        onChangeText={(text) => setNotes(text)}
                                        value={notes}
                                        onFocus={() => {
                                            // Scroll to end to ensure input is visible when keyboard appears
                                            setTimeout(() => {
                                                if (scrollViewRef.current) {
                                                    scrollViewRef.current.scrollToEnd({ animated: true });
                                                }
                                            }, 100);
                                        }}
                                    />
                                </View>

                            </View>
                            {error ? (
                                <Text style={{ color: 'red', marginTop: 4, fontSize: 12 }}>{error}</Text>
                            ) : null}
                        </ScrollView>
                        <View style={{ paddingHorizontal: hp(2), paddingVertical: hp(3.5), backgroundColor: whiteColor }}>
                            <CustomButton
                                title={route?.params?.jobId || editableJobId ? "Update Job" : "Create Job"}
                                onPress={handleSubmitJob}
                                loading={loading}
                                disabled={loading}
                                style={{ backgroundColor: blackColor }}
                            />
                        </View>
                        {/* </TouchableWithoutFeedback> */}
                    </>)}
            </View>
            {/* </TouchableWithoutFeedback> */}
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
        borderColor: blackColor,
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
        borderBottomColor: blackColor,
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
        borderColor: blackColor,
        borderRadius: 20

    },
    dateText: {
        color: blackColor,
        marginRight: spacings.small2x,
        fontSize: style.fontSizeNormal.fontSize,
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
    viewText: {
        marginLeft: 5,
        fontSize: style.fontSizeSmall1x.fontSize,
        color: blackColor,
        borderColor: blackColor,
        borderWidth: 1,
        padding: 4,
        borderRadius: 2,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: blackColor,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: "top",
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: blackColor,
        borderRadius: 50,
        paddingHorizontal: 15,
        paddingVertical: 2,
        backgroundColor: whiteColor,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    tooltipContainer: {
        backgroundColor: whiteColor,
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tooltipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    tooltipTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: blackColor,
    },
    tooltipText: {
        fontSize: 14,
        color: blackColor,
        lineHeight: 20,
    },

});
