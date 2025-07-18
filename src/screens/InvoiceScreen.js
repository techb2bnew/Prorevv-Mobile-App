import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions, TouchableWithoutFeedback, ScrollView, Alert, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp, exportToCSV } from '../utils';
import { blackColor, whiteColor, grayColor, mediumGray, orangeColor, greenColor, redColor, lightGrayColor, blueColor, lightBlueColor, verylightGrayColor, goldColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { spacings, style } from '../constans/Fonts';
import DatePicker from "react-native-date-picker";
import { useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SORT_IMAGE } from '../assests/images';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import NetInfo from "@react-native-community/netinfo";
import Header from '../componets/Header';
import { API_BASE_URL } from '../constans/Constants';
import Share from 'react-native-share';
import Feather from 'react-native-vector-icons/Feather';
import CustomerDropdown from '../componets/CustomerDropdown';
import JobDropdown from '../componets/jobDropdown';
import CustomButton from '../componets/CustomButton';
import Toast from 'react-native-simple-toast';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter, justifyContentSpaceEvenly } = BaseStyle;

const InvoiceScreen = ({ navigation }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;
    const [technicianId, setTechnicianId] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [selectedVehicles, setSelectedVehicles] = useState([]);  // Array to store selected vehicles
    const [workOrdersRawData, setWorkOrdersRawData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
    const [viewType, setViewType] = useState('list');
    const [customers, setCustomers] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMoreCustomer, setHasMoreCustomer] = useState(true);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [isCustomerLoading, setIsCustomerLoading] = useState(true);
    const [allJobList, setAllJobList] = useState([]);
    const [jobList, setJobList] = useState([]);
    const pageRef = useRef(1);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [selectedJobEstimated, setSelectedJobEstimated] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDateFilterActive, setIsDateFilterActive] = useState(false);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all'); // all, paid, unpaid
    const [searchText, setSearchText] = useState('');


    useEffect(() => {
        const getTechnicianDetail = async () => {
            try {
                const storedData = await AsyncStorage.getItem("userDeatils");
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    setTechnicianId(parsedData?.id);
                    setTechnicianType(parsedData?.types);
                }
            } catch (error) {
                console.error("Error fetching stored user:", error);
            }
        };

        getTechnicianDetail();
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [technicianId])


    useFocusEffect(
        useCallback(() => {
            const today = new Date();

            console.log("Focus effect ran on screen focus");
            console.log("endDate:", endDate.toISOString());
            console.log("today:", today.toISOString());

            if (endDate > today) {
                console.log("Resetting endDate to today");
                setEndDate(today);
            }

            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);
            console.log("Resetting startDate to last month");
            setStartDate(lastMonth);

        }, []) // <-- keep this empty so it only runs on focus
    );

    // Function to handle selection/deselection of vehicles
    const toggleSelection = (vehicleItem) => {
        setSelectedVehicles(prevState => {
            const exists = prevState.find(v => v.id === vehicleItem.id);

            if (exists) {
                // If already selected, remove the item
                return prevState.filter(v => v.id !== vehicleItem.id);
            } else {
                // Add the full item
                return [...prevState, vehicleItem];
            }
        });
    };

    const shareCSVFile = async (filePath) => {
        try {
            const shareOptions = {
                title: 'Export CSV',
                url: `file://${filePath}`, // ⚠️ must include file://
                type: 'text/csv',
            };

            await Share.open(shareOptions);
        } catch (err) {
            console.log('Sharing error:', err);
        }
    };

    const formatDate = (date) => {
        return date
            ? new Date(date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            })
            : '-';
    };

    const handleExport = async () => {
        if (selectedVehicles.length === 0) {
            Alert.alert("No Selection", "Please select at least one vehicle to export.");
            return;
        }
        console.log(selectedVehicles, customerDetails.fullName);

        const exportData = selectedVehicles.map((item, index) => ({
            No: index + 1,
            Vin: item?.vin ?? '',
            Make: item?.make ?? '',
            Model: item?.model ?? '',
            JobName: item?.jobName ?? '',
            CustomerName: customerDetails?.fullName ?? '',
            LabourCost: item?.labourCost ?? '',
            JobEstimatedCost: selectedJobEstimated ?? '',
            StartDate: formatDate(item?.startDate),
            EndDate: formatDate(item?.endDate),
            Status: getStatusText(item?.vehicleStatus),
        }));
        const filePath = await exportToCSV(
            exportData,
            ['JobName', 'CustomerName', 'Vin', 'Make', 'Model', 'LabourCost', 'JobEstimatedCost', 'StartDate', 'EndDate', 'Status'],
            'work_orders_invoice.csv'
        );

        if (filePath && Platform.OS === 'ios') {
            shareCSVFile(filePath); // ✅ Only iOS will share
        } else if (filePath && Platform.OS === 'android') {
            console.log("✅ File exported to:", filePath);
            Alert.alert("Export Successful", `CSV saved to:\n${filePath}`);
        }
    };

    const fetchCustomers = async (page) => {
        if (!hasMoreCustomer) return;

        setIsCustomerLoading(true);
        try {
            const token = await AsyncStorage.getItem("auth_token");

            if (!token) {
                console.error("Token not found!");
                return;
            }

            // const apiUrl = `${API_BASE_URL}/fetchAllTechnicianCustomer?userId=${technicianId}&page=${page}`;
            const apiUrl = technicianType === "manager"
                ? `${API_BASE_URL}/fetchAllTechnicianCustomer?roleType=${technicianType}&page=${page}`
                : `${API_BASE_URL}/fetchAllTechnicianCustomer?userId=${technicianId}&page=${page}`;

            console.log("technicianId", technicianId, token);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log("data.jobs", data.jobs);

            let uniqueCustomers = [];

            if (data.status && data.jobs?.jobs?.length > 0) {
                setAllJobList(data.jobs?.jobs);

                const newCustomers = data.jobs.jobs
                    .map(job => {
                        if (job.customer && job.customer.id) {
                            return {
                                ...job.customer,
                                jobName: job.jobName,
                                jobId: job.id
                            };
                        }
                        return null;
                    })
                    .filter(cust => cust);

                uniqueCustomers = [...customers, ...newCustomers].filter(
                    (cust, index, self) => index === self.findIndex(c => c.id === cust.id)
                );

                setCustomers(uniqueCustomers);

                if (data.jobs.jobs.length >= 10) {
                    setPageNumber(prevPage => prevPage + 1);
                } else {
                    setHasMoreCustomer(false);
                }
            } else {
                setHasMoreCustomer(false);
                setAllJobList([]);
                setCustomers([]);
            }

        } catch (error) {
            console.error('Network error:', error);
        } finally {
            setIsCustomerLoading(false);
        }
    };

    const fetchSingleCustomerDetails = async (customerId) => {
        try {
            console.log("customerId", customerId);

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
            // console.log("API Response Data:", data);

            if (response.ok) {
                const customerData = data?.customers?.customer;
                setCustomerDetails(customerData);
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
        fetchSingleCustomerDetails(item.id);
        setJobList([]);
        pageRef.current = 1;
        const customerJobs = allJobList.filter(job => job.customer?.fullName === item.fullName);
        setJobList(customerJobs)
    };

    const handleLoadMore = () => {
        if (!isCustomerLoading && hasMoreCustomer && customers.length >= 10) {
            fetchCustomers(pageNumber);
        }
    };

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
                console.log("API Response Data:", data?.jobs);
                setWorkOrdersRawData(data?.jobs?.vehicles);
                setSelectedJobEstimated(data?.jobs?.estimatedCost);
            } else {
                console.error("Error fetching job data:", data.error || "Unknown error");
            }
        } catch (error) {
            console.error("An error occurred while fetching job data:", error);
        }
    };

    const getStatusStyle = (status) => {
        if (status === true || status === "completed") return [styles.statusPill, styles.statusCompleted];
        if (status === false || status === "inprogress") return [styles.statusPill, styles.statusInProgress];
    };

    const getStatusText = (status) => {
        if (status === true || status === "completed") return 'Complete';
        if (status === false || status === "inprogress") return 'In Progress';
    };

    // const filteredVehicles = workOrdersRawData?.filter(vehicle => {
    //     if (statusFilter === 'all') return true;
    //     if (statusFilter === 'completed') return vehicle.vehicleStatus === true || vehicle.vehicleStatus === 'completed';
    //     if (statusFilter === 'inprogress') return vehicle.vehicleStatus === false || vehicle.vehicleStatus === 'inprogress';
    //     return true;
    // });
    const filteredVehicles = workOrdersRawData?.filter(vehicle => {
        // --- Status Filter ---
        const statusMatch =
            statusFilter === 'all' ||
            (statusFilter === 'completed' && (vehicle.vehicleStatus === true || vehicle.vehicleStatus === 'completed')) ||
            (statusFilter === 'inprogress' && (vehicle.vehicleStatus === false || vehicle.vehicleStatus === 'inprogress'));


        const lowerSearch = searchText.toLowerCase();

        const matchesSearch =
            vehicle?.vin?.toLowerCase().includes(lowerSearch) ||
            vehicle?.make?.toLowerCase().includes(lowerSearch) ||
            vehicle?.model?.toLowerCase().includes(lowerSearch);

        if (!isDateFilterActive) {
            // 🔄 Don't apply date filter if user hasn’t changed date
            return statusMatch && matchesSearch;
        }

        // --- Date Filter ---
        const vehicleStartDate = new Date(vehicle?.startDate);
        const vehicleEndDate = new Date(vehicle?.endDate);
        const start = new Date(startDate.setHours(0, 0, 0, 0));
        const end = new Date(endDate.setHours(23, 59, 59, 999));

        const isWithinDateRange =
            (!isNaN(vehicleStartDate) && !isNaN(vehicleEndDate)) &&
            (
                (vehicleStartDate >= start && vehicleStartDate <= end) ||
                (vehicleEndDate >= start && vehicleEndDate <= end) ||
                (vehicleStartDate <= start && vehicleEndDate >= end)
            );

        return statusMatch && matchesSearch && isWithinDateRange;
    });

    // const handleGenerateInvoice = async () => {
    //     const mappedVehicles = selectedVehicles.map((vehicle) => ({
    //         vehicleId: vehicle?.id,
    //         jobId: vehicle?.jobId,
    //         customerId:vehicle?.customerId
    //     }));

    //     console.log("🚗 Mapped Vehicles for API:", mappedVehicles);
    //     // const email = "shubhambase2bran@gmail.com";
    //     // const subject = "Invoice for Your Work Order";
    //     // const body = `Dear Customer,
    //     // Please find your invoice attached.
    //     // Regards,
    //     // Team XYZ`;

    //     // if (Platform.OS === 'android') {
    //     //     const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    //     //     try {
    //     //         await Linking.openURL(url);
    //     //     } catch (error) {
    //     //         // fallback to Gmail intent
    //     //         const gmailIntent = `intent://mail/#Intent;action=android.intent.action.SENDTO;data=mailto:${email};package=com.google.android.gm;end`;
    //     //         try {
    //     //             await Linking.openURL(gmailIntent);
    //     //         } catch (err) {
    //     //             Alert.alert("Could not open Gmail", "Please check your email app.");
    //     //         }
    //     //     }
    //     // } else {
    //     //     // iOS fallback
    //     //     const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    //     //     const canOpen = await Linking.canOpenURL(url);
    //     //     if (canOpen) {
    //     //         Linking.openURL(url);
    //     //     } else {
    //     //         Alert.alert("No mail app found", "Please install or configure a mail app.");
    //     //     }
    //     // }
    // };
    const handleGenerateInvoice = async () => {
        const mappedVehicles = selectedVehicles.map((vehicle) => ({
            vehicleId: vehicle?.id,
            jobId: vehicle?.jobId,
            customerId: vehicle?.customerId,
        }));

        console.log("🚗 Mapped Vehicles for API:", mappedVehicles);

        // setLoading(true); // Start loader

        // try {
        //     const token = await AsyncStorage.getItem("auth_token");

        //     const response = await axios.post(
        //         `${API_BASE_URL}/createInvoice`,
        //         {
        //             vehicles: mappedVehicles,
        //         },
        //         {
        //             headers: {
        //                 Authorization: `Bearer ${token}`,
        //                 "Content-Type": "application/json",
        //             },
        //         }
        //     );

        //     if (response.status === 200 || response.status === 201) {
        //         const invoiceUrl = response?.data?.invoice?.invoiceUrl;
        //         console.log("✅ Invoice Generated:", invoiceUrl);

        //         const email = "shubham@yopmail.com";
        //         const subject = "Invoice for Your Work Order";

        //         const bodyText = `Dear Customer,

        //         Please find your invoice here:
        //         ${invoiceUrl}

        //         Regards,
        //         Team Prorevv`;

        //         const body = encodeURIComponent(bodyText);
        //         const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;

        //         if (Platform.OS === 'android') {
        //             try {
        //                 await Linking.openURL(url);
        //             } catch (error) {
        //                 // fallback to Gmail
        //                 const gmailIntent = `intent://mail/#Intent;action=android.intent.action.SENDTO;data=mailto:${email};package=com.google.android.gm;end`;
        //                 try {
        //                     await Linking.openURL(gmailIntent);
        //                 } catch (err) {
        //                     Alert.alert("Could not open Gmail", "Please check your email app.");
        //                 }
        //             }
        //         } else {
        //             const canOpen = await Linking.canOpenURL(url);
        //             if (canOpen) {
        //                 Linking.openURL(url);
        //             } else {
        //                 Alert.alert("No mail app found", "Please install or configure a mail app.");
        //             }
        //         }
        //     } else {
        //         console.log("❌ Failed:", response.data);
        //     }
        // } catch (error) {
        //     console.error("Invoice Error:", error?.response || error?.message);
        // } finally {
        //     setLoading(false); // Stop loader
        // }
    };

    return (
        <View style={[flex, styles.container]}>
            {/* Header */}
            <Header title={"Invoice"} />

            <View style={{
                flexDirection: 'row', position: "absolute",
                top: Platform.OS === "android" ? isTablet ? hp(1) : 10 : isTablet ? 20 : 13,
                right: -10,
                justifyContent: "center",
                alignItems: "center",
            }}>

                <TouchableOpacity
                    onPress={() => setViewType('list')}
                    style={[styles.tabButton, { backgroundColor: viewType === 'list' ? blueColor : whiteColor, margin: 0, marginRight: 10, width: isTablet ? wp(8) : wp(12), height: hp(4.5) }]}>
                    <Ionicons name="list" size={isTablet ? 35 : 20} color={viewType === 'list' ? whiteColor : blackColor} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setViewType('grid')}
                    style={[styles.tabButton, { backgroundColor: viewType === 'grid' ? blueColor : whiteColor, width: isTablet ? wp(8) : wp(12), height: hp(4.5), marginRight: 10 }]}>
                    <Ionicons name="grid-sharp" size={isTablet ? 35 : 20} color={viewType === 'grid' ? whiteColor : blackColor} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        if (!customerDetails?.id && !selectedJobId) {
                            Toast.show("Please select customer and job first.");
                        } else if (customerDetails?.id && !selectedJobId) {
                            Toast.show("Please select a job first.");
                        } else {
                            setIsFilterModalVisible(true);
                        }
                    }} style={[{ backgroundColor: blueColor, width: isTablet ? wp(8) : wp(12), height: hp(4.5), marginRight: 20, borderRadius: 5, borderWidth: 1, alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ color: whiteColor }}>Filter</Text>
                    {/* <Image source={SORT_IMAGE} resizeMode='contain' style={{ width: isTablet ? wp(7) : wp(10), height: hp(3.2) }} /> */}
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ paddingHorizontal: spacings.large, width: "50%" }} >
                    <Text style={[styles.label, { fontSize: style.fontSizeMedium.fontSize, }]}>Select Customer <Text style={{ color: 'red' }}>*</Text></Text>
                    <CustomerDropdown
                        data={customers}
                        selectedValue={customerDetails}
                        onSelect={handleCustomerSelect}
                        showIcon={false}
                        rightIcon={true}
                        titleText="Select Customer"
                        handleLoadMore={handleLoadMore}
                        isLoading={isCustomerLoading}
                    />
                </View>

                <View style={{ width: "50%" }}>
                    <Text style={[styles.label, { fontSize: style.fontSizeMedium.fontSize, paddingLeft: spacings.large }]}>Select Job <Text style={{ color: 'red' }}>*</Text></Text>
                    <JobDropdown
                        jobs={jobList}
                        selectedJobId={selectedJobId}
                        setSelectedJobId={(id) => {
                            setSelectedJobId(id);
                            fetchJobData(id)
                        }}
                        getJobName={(item) => item?.jobName}
                    />
                </View>
            </View>

            <View style={{
                paddingHorizontal: spacings.large,
                paddingBottom: spacings.large,
                marginTop: spacings.large,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: blueColor,
                    borderRadius: 8,
                    backgroundColor: whiteColor,
                    paddingHorizontal: spacings.large,
                }}>
                    <TextInput
                        placeholder="Search VIN, Make or Model"
                        value={searchText}
                        onChangeText={(text) => setSearchText(text)}
                        style={{
                            flex: 1,
                            paddingVertical: spacings.large,
                            fontSize: 16,
                            color: blackColor,
                        }}
                        placeholderTextColor={grayColor}
                    />
                    <Feather name="search" size={20} color={blueColor} />
                </View>
            </View>


            {/* <View style={{ paddingHorizontal: spacings.large, paddingTop: spacings.large }}>
               
                <View style={styles.datePickerContainer}>
                    <View style={{ width: wp(38) }}>
                        <Text style={styles.dateText}>From</Text>
                    </View>
                    <View style={{ width: wp(38) }}>
                        <Text style={styles.dateText}>To</Text>
                    </View>
                </View>
                <View style={[styles.datePickerContainer]}>
                    <TouchableOpacity onPress={() => setIsStartPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
                        <Text style={styles.dateText}>
                            {startDate.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </Text>
                        <Feather name="calendar" size={20} color={blackColor} />

                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEndPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
                        <Text style={styles.dateText}>
                            {endDate.toLocaleDateString("en-US", {
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
                    mode="date"
                    onConfirm={(date) => {
                        setStartDate(date);
                        setIsStartPickerOpen(false);
                        setIsDateFilterActive(true); // activate filtering
                    }}
                    onCancel={() => setIsStartPickerOpen(false)}
                />

                <DatePicker
                    modal
                    open={isEndPickerOpen}
                    date={endDate}
                    mode="date"
                    minimumDate={startDate}
                    onConfirm={(date) => {
                        const newEndDate = date;
                        setEndDate(newEndDate);
                        setIsEndPickerOpen(false);
                        setIsDateFilterActive(true); // activate filtering
                    }}
                    onCancel={() => setIsEndPickerOpen(false)}
                />

            </View>

            <View style={{ flexDirection: 'row', marginTop: spacings.xxLarge, paddingHorizontal: spacings.large }}>
                <TouchableOpacity
                    onPress={() => setStatusFilter('all')}
                    style={{
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        backgroundColor: statusFilter === 'all' ? blueColor : lightGrayColor,
                        borderRadius: 10,
                        marginRight: 10
                    }}>
                    <Text style={{ color: statusFilter === 'all' ? whiteColor : blackColor }}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setStatusFilter('inprogress')}
                    style={{
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        backgroundColor: statusFilter === 'inprogress' ? blueColor : lightGrayColor,
                        borderRadius: 10,
                        marginRight: 10
                    }}>
                    <Text style={{ color: statusFilter === 'inprogress' ? whiteColor : blackColor }}>In Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setStatusFilter('completed')}
                    style={{
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        backgroundColor: statusFilter === 'completed' ? blueColor : lightGrayColor,
                        borderRadius: 10
                    }}>
                    <Text style={{ color: statusFilter === 'completed' ? whiteColor : blackColor }}>Completed</Text>
                </TouchableOpacity>
            </View> */}

            {viewType === 'list' && <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(79) : isIOSAndTablet ? hp(60) : hp(73), marginTop: spacings.large }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* Header Row */}
                        <View style={[styles.tableHeaderRow, { backgroundColor: blueColor }]}>
                            <Text style={[styles.tableHeader, { width: wp(15) }]}>Select</Text>
                            <Text style={[styles.tableHeader, { width: wp(45) }]}>VIN</Text>
                            <Text style={[styles.tableHeader, { width: wp(30) }]}>Make</Text>
                            <Text style={[styles.tableHeader, { width: wp(30) }]}>Model</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Labour Cost($)</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Estimated Cost($)</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Start Date</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>End Date</Text>
                            <Text style={[styles.tableHeader, { paddingRight: isTablet ? 30 : 0, width: isIOSAndTablet ? wp(8) : wp(35) }]}>Status</Text>

                        </View>

                        {/* Data Rows with vertical scroll */}
                        <ScrollView style={{ height: Platform.OS === "android" ? hp(42) : hp(39) }} showsVerticalScrollIndicator={false}>
                            <FlatList
                                data={filteredVehicles}
                                keyExtractor={(item, index) => index.toString()}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item, index }) => {
                                    const rowStyle = { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor };
                                    const isSelected = selectedVehicles.some(v => v.id === item.id);
                                    return (
                                        <Pressable key={index.toString()} style={[styles.listItem, rowStyle, { flexDirection: 'row' }]} onPress={() => navigation.navigate("VehicleDetailsScreen", { vehicleId: item?.id, from: "report" })}>
                                            <TouchableOpacity onPress={() => toggleSelection(item)} style={{ width: wp(15) }}>
                                                <MaterialIcons
                                                    name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                                    size={25}
                                                    color={isSelected ? blueColor : 'gray'}
                                                />
                                            </TouchableOpacity>
                                            <Text style={[styles.text, { width: wp(45) }]}>{item?.vin || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(30) }]}>{item?.make || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(30) }]}>{item?.model || '-'}</Text>


                                            <Text style={[styles.text, { width: wp(35) }]}>
                                                {item?.labourCost ? `$${item.labourCost}` : '-'}
                                            </Text>
                                            <Text style={[styles.text, { width: wp(35) }]}>
                                                {selectedJobEstimated ? `$${selectedJobEstimated}` : '-'}
                                            </Text>
                                            <Text style={[styles.text, { width: wp(35) }]}> {item?.startDate
                                                ? new Date(item?.startDate).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}</Text>
                                            <Text style={[styles.text, { width: wp(35) }]}> {item?.startDate
                                                ? new Date(item?.endDate).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}</Text>
                                            <View style={[getStatusStyle(item?.vehicleStatus), alignJustifyCenter, { height: hp(4) }]}>
                                                <Text
                                                    style={{
                                                        color: getStatusText(item?.vehicleStatus) === "Complete" ?
                                                            greenColor : getStatusText(item?.vehicleStatus) === "inprogress" ?
                                                                redColor :
                                                                goldColor
                                                    }}>
                                                    {getStatusText(item?.vehicleStatus)}
                                                </Text>
                                            </View>

                                        </Pressable>
                                    );
                                }}

                                ListEmptyComponent={() => {
                                    let message = '';
                                    if (!customerDetails?.id && !selectedJobId) {
                                        message = "Please select customer and job";
                                    } else if (customerDetails?.id && !selectedJobId) {
                                        message = "Please select a job";
                                    } else {
                                        message = "No vehicle list found";
                                    }

                                    return (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>{message}</Text>
                                        </View>
                                    );
                                }}

                            />
                        </ScrollView>
                    </View>
                </ScrollView>
            </View>}

            {viewType === 'grid' && (
                <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(79) : isIOSAndTablet ? hp(61) : hp(73), marginTop: spacings.large }}>
                    <FlatList
                        data={filteredVehicles}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 10 }}
                        renderItem={({ item, index }) => {
                            const isSelected = selectedVehicles.some(v => v.id === item.id);

                            return (
                                <Pressable style={{
                                    backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor,
                                    borderRadius: 10,
                                    padding: 10,
                                    marginBottom: 10,
                                    marginHorizontal: 10,
                                    borderWidth: 1,
                                    borderColor: blueColor
                                }}
                                    onPress={() => navigation.navigate("VehicleDetailsScreen", { vehicleId: item?.id, from: "report" })}>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                        <TouchableOpacity onPress={() => toggleSelection(item)} style={{ position: "absolute", right: -5, top: -10, zIndex: 999 }}>
                                            <MaterialIcons
                                                name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                                size={25}
                                                color={isSelected ? blueColor : 'gray'}
                                            />
                                        </TouchableOpacity>

                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>VIN</Text>
                                            <Text >{item?.vin}</Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Make</Text>
                                            <Text >{item?.make}</Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Model</Text>
                                            <Text >{item?.model}</Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Labour Cost($)</Text>
                                            <Text >{item?.labourCost ? `$${item.labourCost}` : '-'} </Text>
                                        </View>

                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Estimated Cost($)</Text>
                                            <Text >{selectedJobEstimated ? `$${selectedJobEstimated}` : '-'} </Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Start Date</Text>
                                            <Text >{item?.startDate
                                                ? new Date(item?.startDate).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"} </Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>End Date</Text>
                                            <Text >{item?.startDate
                                                ? new Date(item?.endDate).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"} </Text>
                                        </View>

                                        <View style={[{ width: '48%', marginBottom: 9 }]}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Status</Text>
                                            <Text
                                                style={{
                                                    color: getStatusText(item?.vehicleStatus) === "Complete" ?
                                                        greenColor : getStatusText(item?.vehicleStatus) === "inprogress" ?
                                                            redColor :
                                                            goldColor,
                                                }}>
                                                {getStatusText(item?.vehicleStatus)}
                                            </Text>
                                        </View>
                                    </View>

                                </Pressable>
                            )
                        }}


                        ListEmptyComponent={() => {
                            let message = '';
                            if (!customerDetails?.id && !selectedJobId) {
                                message = "Please select customer and job";
                            } else if (customerDetails?.id && !selectedJobId) {
                                message = "Please select a job";
                            } else {
                                message = "No vehicle list found";
                            }

                            return (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>{message}</Text>
                                </View>
                            );
                        }}
                    />

                </View>)}

            {selectedVehicles.length > 0 && <View style={{ position: "absolute", bottom: 0, backgroundColor: whiteColor, width: wp(100), flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacings.large }}>
                <CustomButton
                    title={"Print"}
                    onPress={handleExport}
                    style={{ width: "48%", marginBottom: 0 }}
                />

                <CustomButton
                    title="Generate Invoice"
                    loading={loading}
                    disabled={loading}
                    onPress={handleGenerateInvoice}
                    style={{ width: "48%", marginBottom: 0 }}
                />
            </View>}

            <Modal
                visible={isFilterModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                    activeOpacity={1}
                    onPressOut={() => setIsFilterModalVisible(false)}
                >
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            backgroundColor: 'white',
                            padding: 20,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20
                        }}
                    >
                        {/* Status Filter Buttons */}
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Work Order Status</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            {['all', 'inprogress', 'completed'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setStatusFilter(status)}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 20,
                                        backgroundColor: statusFilter === status ? blueColor : lightGrayColor,
                                        borderRadius: 10,
                                        marginRight: 10
                                    }}>
                                    <Text style={{ color: statusFilter === status ? whiteColor : blackColor }}>
                                        {status === 'all' ? 'All' : status === 'inprogress' ? 'In Progress' : 'Completed'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Date Pickers */}
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Date Range</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => setIsStartPickerOpen(true)}
                                style={[styles.datePicker, flexDirectionRow, alignItemsCenter, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.dateText}>
                                    {startDate.toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </Text>
                                <Feather name="calendar" size={20} color={blackColor} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsEndPickerOpen(true)}
                                style={[styles.datePicker, flexDirectionRow, alignItemsCenter, { flex: 1 }]}>
                                <Text style={styles.dateText}>
                                    {endDate.toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </Text>
                                <Feather name="calendar" size={20} color={blackColor} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Invoice Status</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            {['all', 'paid', 'unpaid'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setInvoiceStatusFilter(status)}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 20,
                                        backgroundColor: invoiceStatusFilter === status ? blueColor : lightGrayColor,
                                        borderRadius: 10,
                                        marginRight: 10
                                    }}>
                                    <Text style={{ color: invoiceStatusFilter === status ? whiteColor : blackColor }}>
                                        {status === 'all' ? 'All' : status === 'paid' ? 'Paid' : 'Unpaid'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Apply Button */}
                        <TouchableOpacity
                            onPress={() => {
                                setIsFilterModalVisible(false);
                            }}
                            style={{
                                backgroundColor: blueColor,
                                paddingVertical: 12,
                                borderRadius: 10,
                                alignItems: 'center'
                            }}>
                            <Text style={{ color: whiteColor, fontSize: 16 }}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <DatePicker
                modal
                open={isStartPickerOpen}
                date={startDate}
                mode="date"
                onConfirm={(date) => {
                    setStartDate(date);
                    setIsStartPickerOpen(false);
                    setIsDateFilterActive(true); // activate filtering
                }}
                onCancel={() => setIsStartPickerOpen(false)}
            />

            <DatePicker
                modal
                open={isEndPickerOpen}
                date={endDate}
                mode="date"
                minimumDate={startDate}
                onConfirm={(date) => {
                    const newEndDate = date;
                    setEndDate(newEndDate);
                    setIsEndPickerOpen(false);
                    setIsDateFilterActive(true); // activate filtering
                }}
                onCancel={() => setIsEndPickerOpen(false)}
            />


        </View >
    );
};

export default InvoiceScreen;

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
    },
    contentContainer: {
        paddingHorizontal: spacings.large,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: spacings.large,
    },
    box: {
        backgroundColor: lightBlueColor,
        padding: spacings.medium,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
    },
    boxTitle: {
        fontSize: style.fontSizeNormal.fontSize,
        color: blackColor,
    },
    boxValue: {
        fontSize: style.fontSizeNormal1x.fontSize,
        fontWeight: 'bold',
        color: blackColor,
    },
    tabButton: {
        marginRight: 20,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacings.large,
        paddingVertical: spacings.normal,
        borderRadius: 5
    },
    tableHeaderRow: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        padding: spacings.medium,
        borderBottomWidth: 1,
        borderColor: '#E6E6E6',
        backgroundColor: blueColor
    },
    tableHeader: {
        fontSize: style.fontSizeNormal.fontSize,
        color: whiteColor,
        fontWeight: style.fontWeightThin1x.fontWeight
    },
    listItem: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        padding: spacings.large,
        borderBottomWidth: 1,
        borderBottomColor: '#E6E6E6'
    },
    text: {
        color: blackColor,
        fontSize: style.fontSizeNormal.fontSize
    },
    datePickerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 10,
        // marginBottom: 15
    },
    datePicker: {
        width: wp(38),
        paddingVertical: spacings.large,
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: grayColor,
    },
    dateText: {
        color: blackColor,
        marginRight: spacings.small2x,
        fontSize: style.fontSizeNormal.fontSize,
    },
    label: {
        fontSize: style.fontSizeNormal2x.fontSize,
        fontWeight: style.fontWeightThin1x.fontWeight,
        paddingVertical: spacings.large,
        color: blackColor
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
    statusPill: {
        paddingHorizontal: spacings.xLarge,
        paddingVertical: 2,
        borderRadius: 20
    },
    statusCompleted: { backgroundColor: '#C8F8D6', borderWidth: 1, borderColor: greenColor, },
    statusInProgress: { backgroundColor: '#FFEFC3', borderWidth: 1, borderColor: goldColor },
});
