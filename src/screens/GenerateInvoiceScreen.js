import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions, TouchableWithoutFeedback, ScrollView, Alert, Linking, Keyboard, KeyboardAvoidingView } from 'react-native';
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
import Header from '../componets/Header';
import { API_BASE_URL } from '../constans/Constants';
import Share from 'react-native-share';
import Feather from 'react-native-vector-icons/Feather';
import CustomerDropdown from '../componets/CustomerDropdown';
import JobDropdown from '../componets/jobDropdown';
import CustomButton from '../componets/CustomButton';
import Toast from 'react-native-simple-toast';
import RNFS from 'react-native-fs';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter, justifyContentSpaceEvenly } = BaseStyle;

const GenerateInvoiceScreen = ({ navigation,
    viewType,
    setViewType,
    isFilterModalVisible,
    setIsFilterModalVisible }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;
    const [technicianId, setTechnicianId] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [workOrdersRawData, setWorkOrdersRawData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLoading, setisLoading] = useState(false);
    const [isExportLoading, setIsExportLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
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
    const [searchText, setSearchText] = useState('');
    const [showDateModal, setShowDateModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [invoiceRates, setInvoiceRates] = useState({});
    const inputRefs = useRef({});
    const [selectAll, setSelectAll] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setCustomerDetails(null);
            setSelectedJobId(null);
            setJobList([]);
            setSelectedVehicles([]);
            setSelectAll(false);
            setWorkOrdersRawData([])
            fetchCustomers(1); // fresh customers + jobs fetch
        }, [])
    );
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

    useFocusEffect(
        useCallback(() => {
            fetchCustomers();   // ✅ jab bhi screen focus hogi tab chalega
        }, [technicianId])
    );

    useFocusEffect(
        useCallback(() => {
            console.log("🔄 GenerateInvoiceScreen Focused, refreshing data...")
            fetchCustomers();
            if (selectedJobId) {
                fetchJobData(selectedJobId);
            }
            return () => {
                console.log("🔙 Screen unfocused");
            };
        }, [selectedJobId])
    );


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
        if (selectAll) {
            // If "Select All" is active, deselect all
            setSelectedVehicles([]);
            setSelectAll(false);
        } else {
            // If "Select All" is not active, select or deselect individual vehicle
            setSelectedVehicles(prevState => {
                const exists = prevState.find(v => v.id === vehicleItem.id);
                if (exists) {
                    return prevState.filter(v => v.id !== vehicleItem.id);
                } else {
                    return [...prevState, vehicleItem];
                }
            });
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedVehicles([]);
        } else {
            setSelectedVehicles(workOrdersRawData);
        }
        setSelectAll(!selectAll);
    };

    const handleExport = async () => {
        if (selectedVehicles.length === 0) {
            Alert.alert("No Selection", "Please select at least one vehicle to export.");
            return;
        }

        const mappedVehicles = selectedVehicles.map((vehicle) => ({
            vehicleId: vehicle?.id,
            jobId: vehicle?.jobId,
            customerId: vehicle?.customerId,
            generateInvoiceDate: selectedDate?.toString() || new Date()?.toString(),
            userId: technicianId,
            roleType: technicianType,
            print: "print",
            generatedInvoiceStatus: false
        }));
        console.log("mappedVehicles", mappedVehicles);

        setisLoading(true);

        try {
            const token = await AsyncStorage.getItem("auth_token");

            const response = await axios.post(
                `${API_BASE_URL}/createInvoice`,
                { vehicles: mappedVehicles },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200 || response.status === 201) {
                const invoiceUrl = response?.data?.invoice?.invoiceUrl;

                // ✅ Get filename from the URL
                const urlParts = invoiceUrl.split('/');
                const fileName = urlParts[urlParts.length - 1]; // e.g., 'INV-2025-5310.pdf'
                const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
                setSelectedVehicles([]);

                // 🔽 Download PDF to local file
                const downloadResult = await RNFS.downloadFile({
                    fromUrl: invoiceUrl,
                    toFile: filePath,
                }).promise;

                if (downloadResult.statusCode === 200) {
                    console.log("✅ PDF downloaded at:", filePath);

                    // 3. Share the file
                    await Share.open({
                        url: `file://${filePath}`,
                        type: 'application/pdf',
                        title: 'Invoice PDF',
                    });
                } else {
                    console.log("Download Failed", "Could not download the invoice PDF.");
                }
            } else {
                console.log("Error", "Failed to generate invoice.");
            }
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setisLoading(false);
        }
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

    const handleExportCSV = async () => {
        if (selectedVehicles.length === 0) {
            Alert.alert("No Selection", "Please select at least one vehicle to export.");
            return;
        }
        console.log("selectedVehicles", selectedJobEstimated);

        const mappedVehicles = selectedVehicles.map((vehicle) => ({
            jobName: vehicle?.jobName,
            vin: vehicle?.vin,
            make: vehicle?.make,
            model: vehicle?.model,
            estimatedBy: vehicle?.estimatedBy || "-",
            estimatedCost: selectedJobEstimated,
            status: getStatusText(vehicle?.vehicleStatus),
            assignedTechnicians:
                vehicle?.assignedTechnicians?.length > 0
                    ? vehicle.assignedTechnicians
                        .map((tech) => `${tech.firstName} ${tech.lastName}`)
                        .join(", ")
                    : "-",
            generateInvoiceDate: selectedDate?.toString() || new Date()?.toString(),
        }));

        setIsExportLoading(true);

        // console.log("mappedVehicles", mappedVehicles);

        const filePath = await exportToCSV(
            mappedVehicles,
            [
                "jobName",
                "vin",
                "make",
                "model",
                "status",
                "estimatedCost",
                "estimatedBy",
                "assignedTechnicians"
            ],
            "invoice.csv"
        );

        if (filePath && Platform.OS === "ios") {
            shareCSVFile(filePath); // ✅ Only iOS will share
        } else if (filePath && Platform.OS === "android") {
            console.log("✅ File exported to:", filePath);
            Alert.alert("Export Successful", `CSV saved to:\n${filePath}`);
        }
        setIsExportLoading(false);
        setSelectedVehicles([]);
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

    const getStatusStyle = (status, type = "") => {
        if (type === "invoice") {
            return status === true
                ? [styles.statusPill, styles.statusCompleted] // green
                : [styles.statusPill, styles.statusInProgress]; // red
        }

        // default for other statuses
        if (status === true || status === "completed") return [styles.statusPill, styles.statusCompleted];
        if (status === false || status === "inprogress") return [styles.statusPill, styles.statusInProgress];

        return [styles.statusPill];
    };

    const getStatusText = (status, type = "") => {
        if (type === "invoice") {
            return status === true ? 'Generated' : 'Pending';
        } else {
            if (status === true || status === "completed") return 'Complete';
            if (status === false || status === "inprogress") return 'In Progress';
        }
        return 'Unknown';
    };

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

    const handleGenerateInvoice = async (date) => {
        console.log("📅 Selected Invoice Date:", date?.toString());
        const mappedVehicles = selectedVehicles.map((vehicle) => ({
            vehicleId: vehicle?.id,
            jobId: vehicle?.jobId,
            customerId: vehicle?.customerId,
            generateInvoiceDate: date?.toString(),
            userId: technicianId,
            roleType: technicianType,
            generatedInvoiceStatus: true
        }));

        console.log("🚗 Mapped Vehicles for API:", mappedVehicles);

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("auth_token");

            const response = await axios.post(
                `${API_BASE_URL}/createInvoice?roleType=${technicianType}`,
                {
                    vehicles: mappedVehicles,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200 || response.status === 201) {
                const invoiceUrl = response?.data?.invoice?.invoiceUrl;
                console.log("✅ Invoice Generated:", response?.data);
                const email = "";
                const subject = "Invoice for Your Work Order";

                const bodyText = `Dear Customer,\n\nPlease find your invoice here:\n${invoiceUrl}\n\nThank you for choosing our services. If you have any questions or need further assistance, feel free to reach out.\n\nThank you for your trust,\nProrevv`;

                const body = encodeURIComponent(bodyText);
                const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
                setSelectedVehicles([]);
                fetchJobData(selectedJobId);
                if (Platform.OS === 'android') {
                    try {
                        await Linking.openURL(url);
                    } catch (error) {
                        // fallback to Gmail
                        const gmailIntent = `intent://mail/#Intent;action=android.intent.action.SENDTO;data=mailto:${email};package=com.google.android.gm;end`;
                        try {
                            await Linking.openURL(gmailIntent);
                        } catch (err) {
                            Alert.alert("Could not open Gmail", "Please check your email app.");
                        }
                    }
                } else {
                    const canOpen = await Linking.canOpenURL(url);
                    if (canOpen) {
                        Linking.openURL(url);
                    } else {
                        Alert.alert("No mail app found", "Please install or configure a mail app.");
                    }
                }
            } else {
                console.log("❌ Failed:", response.data);
            }
        } catch (error) {
            console.error("Invoice Error:", error?.response || error?.message);
        } finally {
            setLoading(false); // Stop loader
        }
    };

    const handleSubmitDate = async () => {
        try {
            setSubmitLoading(true);
            const dateToUse = selectedDate || new Date();
            await handleGenerateInvoice(dateToUse);
            setShowDateModal(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCancelDate = async () => {
        try {
            setCancelLoading(true);
            const today = new Date();
            await handleGenerateInvoice(today);
            setShowDateModal(false);
        } catch (error) {
            console.error(error);
        } finally {
            setCancelLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (selectedJobId) {
                fetchJobData(selectedJobId);
            }
        }, [selectedJobId])
    );

    const handleInvoiceChange = (vehicleId, value) => {
        setInvoiceRates(prev => ({
            ...prev,
            [vehicleId]: value
        }));
    };

    const handleSaveInvoice = async (vehicle) => {
        const vehicleId = vehicle.id;
        const rate = invoiceRates[vehicleId];

        // Step 1: Empty check
        if (!rate || rate.toString().trim().length === 0) {
            Toast.show("Please enter a valid invoice rate before saving.");
            return;
        }

        const parsedRate = Number(rate);
        const existingPdr = Number(vehicle?.pdr);

        // Step 2: If same as existing, silently skip
        if (!isNaN(existingPdr) && parsedRate === existingPdr) {
            return;
        }

        const token = await AsyncStorage.getItem("auth_token");

        try {
            const dateToUse = new Date().toISOString().split('T')[0];
            const payload = [{
                vehicleId: vehicleId,
                pdr: parsedRate,
                generatedInvoiceDate: dateToUse,
                roleType: technicianType,
                userId: technicianId,
            }];

            const response = await fetch(`${API_BASE_URL}/updateVehiclePdr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to update PDR');

            const data = await response.json();
            console.log("✅ PDR updated:", data);

            if (inputRefs.current[vehicleId]) {
                inputRefs.current[vehicleId].blur();
            }

            // Sync state so Save hides if you conditionally want it later
            setInvoiceRates(prev => ({
                ...prev,
                [vehicleId]: parsedRate.toString()
            }));

            Toast.show("Invoice rate saved successfully.");
        } catch (error) {
            console.error('❌ Error saving invoice:', error);
            Toast.show("Failed to save invoice rate.");
        }
    };

    return (
        <View style={[flex, styles.container]}>
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
                            fetchJobData(id);
                            setSelectedVehicles([]);
                            setSelectAll(false);
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
            {/* {technicianType === 'single-technician' && <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: spacings.large }}>
                <Text style={[styles.label, { fontSize: style.fontSizeNormal1x.fontSize }]}>Total Job Cost($)</Text>
                <Text style={[styles.label, { fontSize: style.fontSizeNormal.fontSize }]}>5000</Text>
            </View>}
            */}

            {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacings.large }}>
                <TouchableOpacity
                    onPress={handleSelectAll}
                    style={{
                        backgroundColor: blueColor,
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 10,
                    }}
                >
                    <Text style={{ color: whiteColor }}>{selectAll ? "Deselect All" : "Select All"}</Text>
                </TouchableOpacity>
            </View> */}
            {viewType === 'list' && <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(75) : hp(62) : isIOSAndTablet ? hp(75) : hp(62), marginTop: spacings.large, paddingBottom: selectedVehicles?.length > 0 ? hp(8) : 0 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* Header Row */}
                        <View style={[styles.tableHeaderRow, { backgroundColor: blueColor }]}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectAll) {
                                        setSelectAll(false);
                                        setSelectedVehicles([]);
                                    } else {
                                        setSelectAll(true);
                                        setSelectedVehicles(filteredVehicles); // or filteredVehicles.map(v => v.id) depending on your structure
                                    }
                                }}
                                style={{ width: isTablet ? wp(8) : wp(15), flexDirection: 'row', alignItems: 'center' }}
                            >
                                <MaterialIcons
                                    name={selectAll ? 'check-box' : 'check-box-outline-blank'}
                                    size={25}
                                    color={'white'}
                                />
                                {/* <Text style={[styles.tableHeader, { marginLeft: 5 }]}>Select</Text> */}
                            </TouchableOpacity>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(25) : wp(43) }]}>VIN</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(15) : wp(25) }]}>Make</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(15) : wp(30) }]}>Model</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(15) : wp(35) }]}>Extra Cost($)</Text>
                            {/* <Text style={[styles.tableHeader, { width: wp(25) }]}>Est Cost($)</Text> */}
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(15) : wp(35) }]}>Start Date</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(15) : wp(35) }]}>End Date</Text>
                            <Text style={[styles.tableHeader, { width: isIOSAndTablet ? wp(35) : isTablet ? wp(42) : wp(55) }]}>Invoice Rate($)</Text>
                            <Text style={[styles.tableHeader, { width: isIOSAndTablet ? wp(20) : isTablet ? wp(20) : wp(35), }]}>W O Status</Text>
                            <Text style={[styles.tableHeader, { width: isIOSAndTablet ? wp(20) : isTablet ? wp(20) : wp(35) }]}>Invoice Status</Text>
                        </View>

                        {/* Data Rows with vertical scroll */}
                        <ScrollView style={{ height: Platform.OS === "android" ? hp(42) : hp(39) }} showsVerticalScrollIndicator={false}>
                            <FlatList
                                data={filteredVehicles}
                                keyExtractor={(item, index) => index.toString()}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item, index }) => {
                                    console.log(item);
                                    const rowStyle = { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor };
                                    const isSelected = selectAll || selectedVehicles.some(v => v.id === item.id);
                                    return (
                                        <Pressable key={index.toString()} style={[styles.listItem, rowStyle, { flexDirection: 'row', alignItems: "center" }]} onPress={() => navigation.navigate("VehicleDetailsScreen", { vehicleId: item?.id, from: "report" })}>
                                            <TouchableOpacity onPress={() => toggleSelection(item)} style={{ width: isTablet ? wp(8) : wp(15) }}>
                                                <MaterialIcons
                                                    name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                                    size={25}
                                                    color={isSelected ? blueColor : 'gray'}
                                                />
                                            </TouchableOpacity>
                                            <Text style={[styles.text, { width: isTablet ? wp(25) : wp(43) }]}>{item?.vin || '-'}</Text>
                                            <Text style={[styles.text, { width: isTablet ? wp(15) : wp(25) }]}>{item?.make || '-'}</Text>
                                            <Text style={[styles.text, { width: isTablet ? wp(15) : wp(28), paddingRight: spacings.large }]}>{item?.model || '-'}</Text>
                                            <Text style={[styles.text, { width: isTablet ? wp(15) : wp(35) }]}>
                                                {item?.labourCost ? `$${item.labourCost}` : '-'}
                                            </Text>
                                            {/* <Text style={[styles.text, { width: wp(25) }]}>
                                                {selectedJobEstimated ? `$${selectedJobEstimated}` : '-'}
                                            </Text> */}
                                            <Text style={[styles.text, { width: isTablet ? wp(15) : wp(35) }]}> {item?.startDate
                                                ? new Date(item?.startDate).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}</Text>
                                            <Text style={[styles.text, { width: isTablet ? wp(15) : wp(35) }]}> {item?.startDate
                                                ? new Date(item?.endDate).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}</Text>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, width: isIOSAndTablet ? wp(35) : isTablet ? wp(42) : wp(55) }}>
                                                <TextInput
                                                    ref={(ref) => {
                                                        if (ref) inputRefs.current[item.id] = ref;
                                                    }}
                                                    style={{
                                                        borderWidth: 1,
                                                        borderColor: 'gray',
                                                        padding: 8,
                                                        borderRadius: 5,
                                                        width: isIOSAndTablet ? wp(23) : wp(30),
                                                        marginRight: 10,
                                                    }}
                                                    keyboardType="numeric"
                                                    placeholder="Enter rate"
                                                    value={
                                                        invoiceRates[item.id] !== undefined
                                                            ? invoiceRates[item.id]
                                                            : item?.pdr?.toString() || ''
                                                    }
                                                    onChangeText={(value) => handleInvoiceChange(item.id, value)}
                                                />
                                                <TouchableOpacity
                                                    onPress={() => handleSaveInvoice(item)}
                                                    style={{
                                                        backgroundColor: blueColor,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 10,
                                                        borderRadius: 5
                                                    }}
                                                >
                                                    <Text style={{ color: 'white' }}>Save</Text>
                                                </TouchableOpacity>

                                            </View>


                                            <View style={[getStatusStyle(item?.vehicleStatus), alignJustifyCenter, { height: isTablet ? hp(2) : hp(4)  }]}>
                                                <Text
                                                    style={{
                                                        color: getStatusText(item?.vehicleStatus) === "Complete" ? greenColor : goldColor
                                                    }}>
                                                    {getStatusText(item?.vehicleStatus)}
                                                </Text>
                                            </View>

                                            {/* Invoice Status */}
                                            <View style={[getStatusStyle(item?.generatedInvoiceStatus, "invoice"), alignJustifyCenter, { height: isTablet ? hp(2) : hp(4), marginLeft: isTablet ? wp(10) : wp(10) }]}>
                                                <Text
                                                    style={{
                                                        color: getStatusText(item?.generatedInvoiceStatus, "invoice") === "Generated" ? greenColor : goldColor
                                                    }}>
                                                    {getStatusText(item?.generatedInvoiceStatus, "invoice")}
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
                <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(75) : hp(65) : isIOSAndTablet ? hp(75) : hp(60), marginTop: spacings.large, paddingBottom: selectedVehicles?.length > 0 ? hp(8) : 0 }}>
                    {filteredVehicles.length > 0 && <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacings.large }}>
                        <TouchableOpacity
                            onPress={handleSelectAll}
                            style={{
                                backgroundColor: blueColor,
                                paddingVertical: 4,
                                paddingHorizontal: 4,
                                borderRadius: 10,
                                position: "absolute",
                                right: 10,
                                bottom: -15
                            }}
                        >
                            <Text style={{ color: whiteColor }}>{selectAll ? "Deselect All" : "Select All"}</Text>
                        </TouchableOpacity>
                    </View>}
                    <FlatList
                        data={filteredVehicles}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 10 }}
                        renderItem={({ item, index }) => {
                            const isSelected = selectAll || selectedVehicles.some(v => v.id === item.id);

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
                                            <Text style={{ color: '#555', fontSize: 10 }}>Extra Cost($)</Text>
                                            <Text >{item?.labourCost ? `$${item.labourCost}` : '-'} </Text>
                                        </View>

                                        {/* <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Estimated Cost($)</Text>
                                            <Text >{selectedJobEstimated ? `$${selectedJobEstimated}` : '-'} </Text>
                                        </View> */}
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
                                        <View style={[{ width: '100%', marginBottom: 9 }]}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Invoice Rate ($)</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
                                                <TextInput
                                                    ref={(ref) => {
                                                        if (ref) inputRefs.current[item.id] = ref;
                                                    }}
                                                    style={{
                                                        borderWidth: 1,
                                                        borderColor: 'gray',
                                                        padding: 8,
                                                        borderRadius: 5,
                                                        width: "50%",
                                                        marginRight: 10,
                                                    }}
                                                    keyboardType="numeric"
                                                    placeholder="Enter rate"
                                                    value={
                                                        invoiceRates[item.id] !== undefined
                                                            ? invoiceRates[item.id]
                                                            : item?.pdr?.toString() || ''
                                                    }
                                                    onChangeText={(value) => handleInvoiceChange(item.id, value)}
                                                />


                                                <TouchableOpacity
                                                    onPress={() => handleSaveInvoice(item)}
                                                    style={{
                                                        backgroundColor: blueColor,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 10,
                                                        borderRadius: 5
                                                    }}
                                                >
                                                    <Text style={{ color: 'white' }}>Save</Text>
                                                </TouchableOpacity>

                                            </View>
                                        </View>
                                        <View style={[{ width: '48%', marginBottom: 9 }]}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>W O Status</Text>
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

                                        <View style={[{ width: '48%', marginBottom: 9 }]}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Incoice Status</Text>
                                            <Text
                                                style={{
                                                    color: getStatusText(item?.generatedInvoiceStatus) === "Complete" ?
                                                        greenColor : getStatusText(item?.generatedInvoiceStatus) === "inprogress" ?
                                                            redColor :
                                                            goldColor,
                                                }}>
                                                {getStatusText(item?.generatedInvoiceStatus, "invoice")}
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
                    title={"Export"}
                    loading={isExportLoading}
                    disabled={isExportLoading}
                    onPress={handleExportCSV}
                    style={{ width: "28%", marginBottom: 0 }}
                />
                <CustomButton
                    title={"Print"}
                    loading={isLoading}
                    disabled={isLoading}
                    onPress={handleExport}
                    style={{ width: "28%", marginBottom: 0 }}
                />

                <CustomButton
                    title="Generate Invoice"
                    loading={loading}
                    disabled={loading}
                    onPress={() => {
                        console.log("selectedVehicles", selectedVehicles);

                        const missingPdrVehicles = selectedVehicles.filter(vehicle => {
                            const rate = invoiceRates[vehicle.id] ?? vehicle?.pdr; // ✅ fallback to vehicle.pdr
                            return !rate || rate.toString().trim().length === 0;
                        });

                        if (missingPdrVehicles.length > 0) {
                            Toast.show("Please add invoice cost first for all selected vehicles.");
                            return;
                        }

                        // ✅ All good, open modal
                        setSelectedDate(null);
                        setShowDateModal(true);
                    }}
                    style={{ width: "40%", marginBottom: 0 }}
                />
            </View>}

            {showDateModal && (
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 999,
                    }}
                >
                    <View
                        style={{
                            width: "88%",
                            backgroundColor: whiteColor,
                            borderRadius: 20,
                            padding: spacings.xxxxLarge,
                            elevation: 6,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.2,
                            shadowRadius: 6,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: style.fontSizeMedium.fontSize,
                                fontWeight: style.fontWeightThin1x.fontWeight,
                                textAlign: "center",
                                marginBottom: 24,
                                color: blackColor,
                            }}
                        >
                            Please select the date you want to send for invoice generation
                        </Text>

                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={{
                                paddingVertical: spacings.xLarge,
                                borderRadius: 10,
                                backgroundColor: verylightGrayColor,
                                borderWidth: 1,
                                borderColor: lightGrayColor,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Text style={{ fontSize: style.fontSizeNormal2x.fontSize, color: blackColor }}>
                                {selectedDate
                                    ? selectedDate.toLocaleDateString("en-GB", {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })
                                    : "Select Date"}
                            </Text>
                        </TouchableOpacity>

                        <DatePicker
                            modal
                            open={showDatePicker}
                            date={selectedDate || new Date()}
                            mode="date"
                            onConfirm={(date) => {
                                setShowDatePicker(false);
                                setSelectedDate(date);
                            }}
                            onCancel={() => setShowDatePicker(false)}
                        />

                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                            <CustomButton
                                title="Today Date"
                                onPress={handleCancelDate}
                                style={{
                                    width: "48%",
                                    backgroundColor: lightGrayColor,
                                    borderRadius: 10,
                                    marginBottom: 0
                                }}
                                loading={cancelLoading}
                                disabled={cancelLoading}
                                textStyle={{ color: blackColor }}
                            />

                            <CustomButton
                                title="Submit"
                                onPress={handleSubmitDate}
                                style={{
                                    width: "48%",
                                    backgroundColor: blueColor,
                                    borderRadius: 10,
                                    marginBottom: 0
                                }}
                                loading={submitLoading}
                                disabled={submitLoading}
                                textStyle={{ color: whiteColor }}
                            />
                        </View>
                    </View>
                </View>
            )}

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

                        {/* <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Invoice Status</Text>
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
                        </View> */}

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

export default GenerateInvoiceScreen;

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
        backgroundColor: blueColor,
        alignItems: "center"
    },
    tableHeader: {
        fontSize: style.fontSizeNormal.fontSize,
        color: whiteColor,
        fontWeight: style.fontWeightThin1x.fontWeight,

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
