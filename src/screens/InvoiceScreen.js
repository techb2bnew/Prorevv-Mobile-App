import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions, TouchableWithoutFeedback, ScrollView, Alert } from 'react-native';
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
const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter, justifyContentSpaceEvenly } = BaseStyle;

const InvoiceScreen = ({ navigation }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;
    const [technicianId, setTechnicianId] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [selectedVehicles, setSelectedVehicles] = useState([]);  // Array to store selected vehicles
    const [workOrdersRawData, setWorkOrdersRawData] = useState([]);
    const [loading, setLoading] = useState(true);
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
    const [selectedJobId, setSelectedJobId] = useState(null); // selected value


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
            fetchCustomers();
        }, [technicianId])
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

    const handleExport = async () => {
        if (selectedVehicles.length === 0) {
            Alert.alert("No Selection", "Please select at least one vehicle to export.");
            return;
        }
        const exportData = selectedVehicles.map((item, index) => ({
            No: index + 1,
            vin: item?.vin ?? '',
            make: item?.make ?? '',
            model: item?.model ?? '',
        }));
        const filePath = await exportToCSV(
            exportData,
            ['No', 'vin', 'make', 'model'],
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
            if (response.ok && data.jobs) {
                console.log("API Response Data:", data?.jobs?.vehicles);
                setWorkOrdersRawData(data?.jobs?.vehicles)
            } else {
                console.error("Error fetching job data:", data.error || "Unknown error");
            }
        } catch (error) {
            console.error("An error occurred while fetching job data:", error);
        } finally {
            setLoading(false); 
        }
    };

    return (
        <View style={[flex, styles.container]}>
            {/* Header */}
            <Header title={"InvoiceScreen"} />

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
                    onPress={handleExport}
                    style={[{ backgroundColor: blueColor, width: isTablet ? wp(8) : wp(12), height: hp(4.5), marginRight: 20, borderRadius: 5, borderWidth: 1, alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ color: whiteColor }}>Print</Text>
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: spacings.large }} >
                <Text style={[styles.label, { fontSize: style.fontSizeLarge.fontSize, }]}>Select Customer <Text style={{ color: 'red' }}>*</Text></Text>
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
            </View>

            <View>
                <Text style={[styles.label, { fontSize: style.fontSizeLarge.fontSize, paddingLeft: spacings.large }]}>Select Job <Text style={{ color: 'red' }}>*</Text></Text>
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


            <View style={{ paddingHorizontal: spacings.large, paddingTop: spacings.large }}>
                {/* Filter & Date Picker */}
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
                        fetchFilteredData(date, endDate);
                    }}
                    onCancel={() => setIsStartPickerOpen(false)}
                />

                <DatePicker
                    modal
                    open={isEndPickerOpen}
                    date={endDate}
                    mode="date"

                    onConfirm={(date) => {
                        const newEndDate = date;
                        setEndDate(newEndDate);
                        setIsEndPickerOpen(false);
                        fetchFilteredData(startDate, newEndDate); // Use new end date
                    }}
                    onCancel={() => setIsEndPickerOpen(false)}
                />

            </View>

            {viewType === 'list' && <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(58) : isIOSAndTablet ? hp(60) : hp(54), marginTop: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* Header Row */}
                        <View style={[styles.tableHeaderRow, { backgroundColor: blueColor }]}>
                            <Text style={[styles.tableHeader, { width: wp(15) }]}>Select</Text>
                            <Text style={[styles.tableHeader, { width: wp(55) }]}>VIN</Text>
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Make</Text>
                            <Text style={[styles.tableHeader, { width: wp(30) }]}>Model</Text>
                            {/* <Text style={[styles.tableHeader, { width: wp(35) }]}>Job Estimate($)</Text> */}
                            <Text style={[styles.tableHeader, { width: wp(35) }]}>Labour Cost($)</Text>
                        </View>

                        {/* Data Rows with vertical scroll */}
                        <ScrollView style={{ height: Platform.OS === "android" ? hp(42) : hp(39) }} showsVerticalScrollIndicator={false}>
                            <FlatList
                                data={workOrdersRawData}
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
                                            <Text style={[styles.text, { width: wp(55) }]}>{item?.vin || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(35) }]}>{item?.make || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(30) }]}>{item?.model || '-'}</Text>
                                            {/* <Text style={[styles.text, { width: wp(35) }]}>
                                                {item?.jobestimate ? `$${item.jobestimate}` : '-'}
                                            </Text> */}

                                            <Text style={[styles.text, { width: wp(35) }]}>
                                                {item?.labourCost ? `$${item.labourCost}` : '-'}
                                            </Text>
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
                <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(59) : isIOSAndTablet ? hp(61) : hp(54) }}>
                    <FlatList
                        data={workOrdersRawData}
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
});
