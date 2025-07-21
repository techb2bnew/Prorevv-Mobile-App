import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions, TouchableWithoutFeedback, ScrollView, Alert, Linking, PermissionsAndroid } from 'react-native';
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

const InvoiceHistoryScreen = ({ navigation,
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
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
    // const [viewType, setViewType] = useState('list');
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
    // const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [dateSortOrder, setDateSortOrder] = useState(null); // 'asc' | 'desc' | null
    const [nameSortOrder, setNameSortOrder] = useState(null);
    const [paidDates, setPaidDates] = useState({});
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [isPaidDatePickerOpen, setIsPaidDatePickerOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false); // for top refresh
    const [loadingMore, setLoadingMore] = useState(false); // for bottom loader
    // const [workOrdersRawData, setWorkOrdersRawData] = useState([
    //     {
    //         invoiceId: "458XYZ",
    //         customerName: "Barbie",
    //         jobName: "Dent Repair",
    //         grandTotal: "600",
    //         invoiceCreatedDate: "2025-07-15T00:00:00Z",
    //         invoiceStatus: false
    //     },
    //     {
    //         invoiceId: "123ABC",
    //         customerName: "John Doe",
    //         jobName: "Oil Change",
    //         grandTotal: "250",
    //         invoiceCreatedDate: "2025-07-10T00:00:00Z",
    //         invoiceStatus: true
    //     },
    //     {
    //         invoiceId: "456XYZ",
    //         customerName: "Alice",
    //         jobName: "Engine Repair",
    //         grandTotal: "600",
    //         invoiceCreatedDate: "2025-07-15T00:00:00Z",
    //         invoiceStatus: false
    //     }
    // ]);

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

    // useEffect(() => {
    //     fetchCustomers();
    // }, [technicianId])


    // useFocusEffect(
    //     useCallback(() => {
    //         const today = new Date();

    //         console.log("Focus effect ran on screen focus");
    //         console.log("endDate:", endDate.toISOString());
    //         console.log("today:", today.toISOString());

    //         if (endDate > today) {
    //             console.log("Resetting endDate to today");
    //             setEndDate(today);
    //         }

    //         const lastMonth = new Date();
    //         lastMonth.setMonth(today.getMonth() - 1);
    //         console.log("Resetting startDate to last month");
    //         setStartDate(lastMonth);

    //     }, []) // <-- keep this empty so it only runs on focus
    // );

    // Function to handle selection/deselection of vehicles
    const toggleSelection = (item) => {
        setSelectedVehicles(prevSelected => {
            const alreadySelected = prevSelected.some(v => v.id === item.id);

            if (alreadySelected) {
                // remove from selection
                return prevSelected.filter(v => v.id !== item.id);
            } else {
                // add to selection
                return [...prevSelected, item];
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
        const exportData = selectedVehicles.map((item, index) => ({
            InvoiceNumber: item?.invoiceNumber ?? '',
            CustomerName: item?.customer?.fullName ?? '',
            JobName: item?.job?.jobName ?? '',
            GrandTotal: `${item?.grandTotal}` ?? '',
            InvoiceCreatedDate: formatDate(item?.createdAt),
            Status: getStatusText(item?.status),
        }));
        const filePath = await exportToCSV(
            exportData,
            ['InvoiceNumber', 'JobName', 'CustomerName', 'GrandTotal', 'InvoiceCreatedDate', 'Status'],
            'Sent_invoice.csv'
        );
        console.log("file::", filePath);

        if (filePath && Platform.OS === 'ios') {
            shareCSVFile(filePath); // ✅ Only iOS will share
        } else if (filePath && Platform.OS === 'android') {
            console.log("✅ File exported to:", filePath);
            Alert.alert("Export Successful", `CSV saved to:\n${filePath}`);
        }
    };

    // const fetchCustomers = async (page) => {
    //     if (!hasMoreCustomer) return;

    //     setIsCustomerLoading(true);
    //     try {
    //         const token = await AsyncStorage.getItem("auth_token");

    //         if (!token) {
    //             console.error("Token not found!");
    //             return;
    //         }

    //         // const apiUrl = `${API_BASE_URL}/fetchAllTechnicianCustomer?userId=${technicianId}&page=${page}`;
    //         const apiUrl = technicianType === "manager"
    //             ? `${API_BASE_URL}/fetchAllTechnicianCustomer?roleType=${technicianType}&page=${page}`
    //             : `${API_BASE_URL}/fetchAllTechnicianCustomer?userId=${technicianId}&page=${page}`;

    //         console.log("technicianId", technicianId, token);

    //         const response = await fetch(apiUrl, {
    //             method: 'GET',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });

    //         const data = await response.json();
    //         console.log("data.jobs", data.jobs);

    //         let uniqueCustomers = [];

    //         if (data.status && data.jobs?.jobs?.length > 0) {
    //             setAllJobList(data.jobs?.jobs);

    //             const newCustomers = data.jobs.jobs
    //                 .map(job => {
    //                     if (job.customer && job.customer.id) {
    //                         return {
    //                             ...job.customer,
    //                             jobName: job.jobName,
    //                             jobId: job.id
    //                         };
    //                     }
    //                     return null;
    //                 })
    //                 .filter(cust => cust);

    //             uniqueCustomers = [...customers, ...newCustomers].filter(
    //                 (cust, index, self) => index === self.findIndex(c => c.id === cust.id)
    //             );

    //             setCustomers(uniqueCustomers);

    //             if (data.jobs.jobs.length >= 10) {
    //                 setPageNumber(prevPage => prevPage + 1);
    //             } else {
    //                 setHasMoreCustomer(false);
    //             }
    //         } else {
    //             setHasMoreCustomer(false);
    //             setAllJobList([]);
    //             setCustomers([]);
    //         }

    //     } catch (error) {
    //         console.error('Network error:', error);
    //     } finally {
    //         setIsCustomerLoading(false);
    //     }
    // };

    // const fetchSingleCustomerDetails = async (customerId) => {
    //     try {
    //         console.log("customerId", customerId);

    //         setCustomerDetails(null);

    //         const token = await AsyncStorage.getItem("auth_token");
    //         if (!token) {
    //             console.error("Token not found!");
    //             return;
    //         }

    //         if (!customerId) {
    //             console.error("Invalid customerId");
    //             return;
    //         }

    //         const url = `${API_BASE_URL}/fetchSingleCustomer?customerId=${customerId}`;

    //         const response = await fetch(url, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/x-www-form-urlencoded',
    //                 'Authorization': `Bearer ${token}`,
    //             },
    //         });

    //         const data = await response.json();
    //         // console.log("API Response Data:", data);

    //         if (response.ok) {
    //             const customerData = data?.customers?.customer;
    //             setCustomerDetails(customerData);
    //         } else {
    //             console.error("Error fetching customer details. Status:", response.status);
    //             setCustomerDetails(null);
    //         }
    //     } catch (error) {
    //         console.error("Network error:", error);
    //         setCustomerDetails(null);
    //     }
    // };

    // const handleCustomerSelect = async (item) => {
    //     fetchSingleCustomerDetails(item.id);
    //     setJobList([]);
    //     pageRef.current = 1;
    //     const customerJobs = allJobList.filter(job => job.customer?.fullName === item.fullName);
    //     setJobList(customerJobs)
    // };

    // const handleLoadMore = () => {
    //     if (!isCustomerLoading && hasMoreCustomer && customers.length >= 10) {
    //         fetchCustomers(pageNumber);
    //     }
    // };

    // const fetchJobData = async (jobId) => {
    //     try {
    //         const apiUrl = `${API_BASE_URL}`;
    //         const token = await AsyncStorage.getItem("auth_token");

    //         const headers = { "Content-Type": "application/json" };
    //         if (token) {
    //             headers["Authorization"] = `Bearer ${token}`;
    //         }

    //         const response = await fetch(`${apiUrl}/fetchSingleJobs?jobid=${jobId}`, {
    //             method: "POST",
    //             headers,
    //         });

    //         const data = await response.json();
    //         if (response.ok && data.jobs) {
    //             console.log("API Response Data:", data?.jobs);
    //             setWorkOrdersRawData(data?.jobs?.vehicles);
    //             setSelectedJobEstimated(data?.jobs?.estimatedCost);
    //         } else {
    //             console.error("Error fetching job data:", data.error || "Unknown error");
    //         }
    //     } catch (error) {
    //         console.error("An error occurred while fetching job data:", error);
    //     }
    // };

    const getStatusStyle = (status) => {
        if (status === true || status === "completed") return [styles.statusPill, styles.statusCompleted];
        if (status === false || status === "inprogress") return [styles.statusPill, styles.statusInProgress];
    };

    const getStatusText = (status) => {
        if (status === true || status === "Paid") return 'Paid';
        if (status === false || status === "UnPaid") return 'UnPaid';
    };

    const filteredVehicles = workOrdersRawData?.filter(vehicle => {
        console.log(`🚗 Vehicle:`, vehicle); // 👈 Log each vehicle object

        // --- Status Filter ---
        const statusMatch =
            invoiceStatusFilter === 'all' ||
            (invoiceStatusFilter.toLowerCase() === 'paid' && (vehicle?.status === true || vehicle?.status === 'Paid')) ||
            (invoiceStatusFilter.toLowerCase() === 'unpaid' && (vehicle?.status === false || vehicle?.status === 'UnPaid'));


        const lowerSearch = searchText.toLowerCase();

        const matchesSearch =
            vehicle?.invoiceNumber?.toLowerCase().includes(lowerSearch) ||
            vehicle?.customer?.fullName?.toLowerCase().includes(lowerSearch) ||
            vehicle?.job?.jobName?.toLowerCase().includes(lowerSearch);

        return statusMatch && matchesSearch;
    })?.sort((a, b) => {
        let result = 0;

        // 🕒 Sort by Date (if selected)
        if (dateSortOrder) {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);

            result = dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // 🔤 If date is equal or no date sort, sort by name
        if (result === 0 && nameSortOrder) {
            const nameA = a.customer?.fullName?.toLowerCase() || '';
            const nameB = b.customer?.fullName?.toLowerCase() || '';

            result = nameSortOrder === 'asc'
                ? nameA.localeCompare(nameB)
                : nameB.localeCompare(nameA);
        }

        return result;
    });

    const openPaidDatePicker = (invoiceId) => {
        setSelectedInvoiceId(invoiceId);
        setIsPaidDatePickerOpen(true);
    };

    useEffect(() => {
        if (technicianId && technicianType) fetchInvoices(1);
    }, [technicianId, technicianType]);

    const fetchInvoices = async (page = 1, isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const token = await AsyncStorage.getItem("auth_token");
            const url = `${API_BASE_URL}/fetchInvoice?page=${page}&roleType=${technicianType}&userId=${technicianId}&limit=15`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response?.data?.response) {
                const newInvoices = response.data?.response?.invoice;

                setWorkOrdersRawData(prev =>
                    page === 1 ? newInvoices : [...prev, ...newInvoices]
                );
                setPageNumber(page + 1);
                console.log(newInvoices?.length);

                setHasMoreCustomer(newInvoices?.length > 0);
            } else {
                setHasMoreCustomer(false);
            }
        } catch (err) {
            console.error("API fetch error:", err);
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoadingMore(false);
            }
        }
    };

    const handleRefresh = () => {
        setPageNumber(1);
        fetchInvoices(1, true); // true = isRefresh
    };

    return (
        <View style={[flex, styles.container]}>
            {/* Header */}
            {/* <Header title={"Invoice History"} />

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
                        setIsFilterModalVisible(true);
                    }} style={[{ backgroundColor: blueColor, width: isTablet ? wp(8) : wp(12), height: hp(4.5), marginRight: 20, borderRadius: 5, borderWidth: 1, alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ color: whiteColor }}>Filter</Text>
                </TouchableOpacity>
            </View> */}

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
                        placeholder="Search by Customer or Job Name"
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

            {viewType === 'list' && <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(77) : isIOSAndTablet ? hp(60) : hp(73) }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* Header Row */}
                        <View style={[styles.tableHeaderRow, { backgroundColor: blueColor }]}>
                            <Text style={[styles.tableHeader, { width: wp(15) }]}>Select</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Invoice Id</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Customer Name</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Job Name</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Grand Total</Text>
                            <Text style={[styles.tableHeader, { width: wp(45) }]}>Invoice Created Date</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Add Paid Date</Text>
                            <Text style={[styles.tableHeader, { paddingRight: isTablet ? 30 : 0, width: isIOSAndTablet ? wp(8) : wp(35) }]}>Status</Text>
                        </View>

                        {/* Data Rows with vertical scroll */}
                        <ScrollView style={{ height: Platform.OS === "android" ? hp(42) : hp(39) }} showsVerticalScrollIndicator={false}>
                            <FlatList
                                data={filteredVehicles}
                                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item, index }) => {
                                    const rowStyle = { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor };
                                    const isSelected = selectedVehicles.some(v => v.id === item.id);
                                    // console.log("📦 Rendering item:", item);

                                    return (
                                        <Pressable key={index.toString()} style={[styles.listItem, rowStyle, { flexDirection: 'row' }]}
                                            onPress={() => navigation.navigate("InvoiceDetailsScreen", { invoiceId: item?.id })}
                                        >
                                            <TouchableOpacity onPress={() => toggleSelection(item)} style={{ width: wp(15) }}>
                                                <MaterialIcons
                                                    name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                                    size={25}
                                                    color={isSelected ? blueColor : 'gray'}
                                                />
                                            </TouchableOpacity>
                                            <Text style={[styles.text, { width: wp(35) }]}>{item?.invoiceNumber || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(35) }]}>{item?.customer?.fullName || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(35) }]}>{item?.job?.jobName || '-'}</Text>


                                            <Text style={[styles.text, { width: wp(35) }]}>
                                                {item?.grandTotal ? `$${item.grandTotal}` : '-'}
                                            </Text>

                                            <Text style={[styles.text, { width: wp(45) }]}> {item?.createdAt
                                                ? new Date(item?.createdAt).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}</Text>
                                            <TouchableOpacity
                                                onPress={() => openPaidDatePicker(item?.id)}
                                                style={{
                                                    width: wp(35),
                                                    paddingRight: spacings.xxxxLarge
                                                }}
                                            >
                                                <Text style={{
                                                    color: blackColor, fontSize: 14,
                                                    paddingVertical: 4,
                                                    paddingHorizontal: 8,
                                                    borderWidth: 1,
                                                    borderColor: blueColor, // use your defined color or "#ccc"
                                                    borderRadius: 8,
                                                    backgroundColor: whiteColor,
                                                    justifyContent: 'center'
                                                }}>
                                                    {paidDates[item.id]
                                                        ? new Date(paidDates[item.id]).toLocaleDateString("en-US", {
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : "Select Date"}
                                                </Text>
                                            </TouchableOpacity>

                                            <View style={[getStatusStyle(item?.status), alignJustifyCenter, { height: hp(4) }]}>
                                                <Text
                                                    style={{
                                                        color: item?.status
                                                            ? getStatusText(item?.status) === "Paid"
                                                                ? greenColor
                                                                : getStatusText(item?.status) === "UnPaid"
                                                                    ? goldColor
                                                                    : redColor
                                                            : grayColor
                                                    }}>
                                                    {item?.status ? getStatusText(item?.status) : "-"}
                                                </Text>
                                            </View>

                                        </Pressable>
                                    );
                                }}

                                ListEmptyComponent={() => {
                                    return (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>No Invoice list found</Text>
                                        </View>
                                    );
                                }}

                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                onEndReached={() => {
                                    if (hasMoreCustomer && !loadingMore) {
                                        fetchInvoices(pageNumber);
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={
                                    loadingMore ? (
                                        <ActivityIndicator size="small" color={blueColor} style={{ marginVertical: 10 }} />
                                    ) : null
                                }
                            />
                        </ScrollView>
                    </View>
                </ScrollView>

            </View>}

            <DatePicker
                modal
                mode="date"
                open={isPaidDatePickerOpen}
                date={
                    paidDates[selectedInvoiceId]
                        ? new Date(paidDates[selectedInvoiceId])
                        : new Date() // fallback if no date
                }
                onConfirm={(date) => {
                    setPaidDates((prev) => ({
                        ...prev,
                        [selectedInvoiceId]: date,
                    }));
                    setIsPaidDatePickerOpen(false);
                }}
                onCancel={() => setIsPaidDatePickerOpen(false)}
            />

            {viewType === 'grid' && (
                <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(79) : isIOSAndTablet ? hp(61) : hp(73) }}>
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
                                    onPress={() => navigation.navigate("InvoiceDetailsScreen", { invoiceId: item?.id })}
                                >
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                        <TouchableOpacity onPress={() => toggleSelection(item)} style={{ position: "absolute", right: -5, top: -10, zIndex: 999 }}>
                                            <MaterialIcons
                                                name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                                size={25}
                                                color={isSelected ? blueColor : 'gray'}
                                            />
                                        </TouchableOpacity>

                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Invoice Number</Text>
                                            <Text >{item?.invoiceNumber}</Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Customer Name</Text>
                                            <Text >{item?.customer?.fullName}</Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Job Name</Text>
                                            <Text >{item?.job?.jobName}</Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Grand Total($)</Text>
                                            <Text >{item?.grandTotal ? `$${item.grandTotal}` : '-'} </Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Invoice Created Date</Text>
                                            <Text >{item?.createdAt
                                                ? new Date(item?.createdAt).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"} </Text>
                                        </View>
                                        <View style={{ width: '48%', marginBottom: 9 }}>
                                            <Text style={{ color: '#555', fontSize: 10, marginBottom: 3 }}>Add Paid Date</Text>
                                            <TouchableOpacity
                                                onPress={() => openPaidDatePicker(item.invoiceId)}
                                                style={{
                                                    width: "100%",
                                                    paddingRight: spacings.xxxxLarge
                                                }}
                                            >
                                                <Text style={{
                                                    color: blackColor, fontSize: 14,
                                                    paddingVertical: 4,
                                                    paddingHorizontal: 8,
                                                    borderWidth: 1,
                                                    borderColor: blueColor,
                                                    borderRadius: 8,
                                                    backgroundColor: whiteColor,
                                                    justifyContent: 'center'
                                                }}>
                                                    {paidDates[item.invoiceId]
                                                        ? new Date(paidDates[item.invoiceId]).toLocaleDateString("en-US", {
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : "Select Date"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={[{ width: '48%', marginBottom: 9 }]}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Status</Text>
                                            <Text
                                                style={{
                                                    color: getStatusText(item?.invoiceStatus) === "Paid" ?
                                                        greenColor : getStatusText(item?.invoiceStatus) === "UnPaid" ?
                                                            goldColor :
                                                            redColor,
                                                }}>
                                                {getStatusText(item?.invoiceStatus)}
                                            </Text>
                                        </View>
                                    </View>

                                </Pressable>
                            )
                        }}
                        ListEmptyComponent={() => {
                            return (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No Invoice list found</Text>
                                </View>
                            );
                        }}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        onEndReached={() => {
                            if (hasMoreCustomer && !loadingMore) {
                                fetchInvoices(pageNumber);
                            }
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            loadingMore ? (
                                <ActivityIndicator size="small" color={blueColor} style={{ marginVertical: 10 }} />
                            ) : null
                        }
                    />

                </View>)}

            {/* <TouchableOpacity
                onPress={() => navigation.navigate("GenerateInvoiceScreen")}
                style={{
                    position: 'absolute',
                    bottom: hp(10),
                    right: wp(8),
                    backgroundColor: blueColor,
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
                <MaterialIcons name="post-add" size={28} color={whiteColor} />
            </TouchableOpacity> */}

            {selectedVehicles.length > 0 && <View style={{ position: "absolute", bottom: 0, backgroundColor: whiteColor, width: wp(100), flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacings.large }}>
                <CustomButton
                    title={"Download"}
                    onPress={handleExport}
                    style={{ width: "100%", marginBottom: 0 }}
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
                        {/* Date Pickers */}
                        {/* <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Date Range</Text>
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
                        </View> */}
                        {/* Sort by Date Block */}
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Sort by Date</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => setDateSortOrder('desc')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    backgroundColor: dateSortOrder === 'desc' ? blueColor : lightGrayColor,
                                    borderRadius: 10,
                                    marginRight: 10,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: dateSortOrder === 'desc' ? whiteColor : blackColor }}>Newest</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setDateSortOrder('asc')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    backgroundColor: dateSortOrder === 'asc' ? blueColor : lightGrayColor,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: dateSortOrder === 'asc' ? whiteColor : blackColor }}>Oldest</Text>
                            </TouchableOpacity>
                        </View>
                        {/* Sort by Customer Name Block */}
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Sort by Customer Name</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => setNameSortOrder('asc')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    backgroundColor: nameSortOrder === 'asc' ? blueColor : lightGrayColor,
                                    borderRadius: 10,
                                    marginRight: 10,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: nameSortOrder === 'asc' ? whiteColor : blackColor }}>A - Z</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setNameSortOrder('desc')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    backgroundColor: nameSortOrder === 'desc' ? blueColor : lightGrayColor,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: nameSortOrder === 'desc' ? whiteColor : blackColor }}>Z - A</Text>
                            </TouchableOpacity>
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

            {/* <DatePicker
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
            /> */}


        </View >
    );
};

export default InvoiceHistoryScreen;

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
