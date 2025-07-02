import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions, TouchableWithoutFeedback, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Feather from 'react-native-vector-icons/Feather';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
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

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter, justifyContentSpaceEvenly } = BaseStyle;

const Reports = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [jobHistoryData, setjobHistoryData] = useState([])
    const [technicianId, setTechnicianId] = useState();
    const [technicianType, setTechnicianType] = useState();
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [sortOrder, setSortOrder] = useState("asc");
    const [sortType, setSortType] = useState("");
    const [page, setPage] = useState(1);
    const [jobPage, setJobPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;
    const [activeTab, setActiveTab] = useState("WorkOrders");
    const [activeStatus, setActiveStatus] = useState("InProgress");
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [filteredWorkOrders, setFilteredWorkOrders] = useState([]);
    const [viewType, setViewType] = useState('list');
    const [jobsRawData, setJobsRawData] = useState([])
    const [workOrdersRawData, setWorkOrdersRawData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshingJob, setRefreshingJob] = useState(false);
    const [customerJobs, setCustomerJobs] = useState([]);
    const [filteredCustomer, setFilteredCustomer] = useState([]);
    const [customerJobPage, setCustomerJobPage] = useState(1);
    const [customerHasMore, setCustomerHasMore] = useState(true);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [customerLoadingMore, setCustomerLoadingMore] = useState(false);


    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const handleSort = (order, type) => {
        let sortedData;

        if (activeTab === 'Jobs') {
            sortedData = [...filteredJobs];
        } else if (activeTab === 'WorkOrders') {
            sortedData = [...filteredWorkOrders];
        } else if (activeTab === 'Customers') {
            sortedData = [...filteredCustomer];
        }

        if (activeTab === 'Customers') {
            sortedData = [...customerJobs];

            if (type === "name") {
                sortedData.sort((a, b) => {
                    const nameA = a?.fullName?.toLowerCase() || '';
                    const nameB = b?.fullName?.toLowerCase() || '';
                    return order === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                });
            }

            else if (type === "date") {
                sortedData.sort((a, b) => {
                    const aDate = a.jobs?.[0]?.createdAt ? new Date(a.jobs[0].createdAt) : new Date(0);
                    const bDate = b.jobs?.[0]?.createdAt ? new Date(b.jobs[0].createdAt) : new Date(0);
                    return order === "oldest" ? aDate - bDate : bDate - aDate;
                });
            }

            else if (type === "modified") {
                sortedData.sort((a, b) => {
                    const aUpdated = a.jobs?.length
                        ? Math.max(...a.jobs.map(j => new Date(j.updatedAt)))
                        : 0;
                    const bUpdated = b.jobs?.length
                        ? Math.max(...b.jobs.map(j => new Date(j.updatedAt)))
                        : 0;
                    return order === "oldest" ? aUpdated - bUpdated : bUpdated - aUpdated;
                });
            }

            else if (type === "count") {
                sortedData.sort((a, b) =>
                    order === "asc"
                        ? (a.jobs?.length || 0) - (b.jobs?.length || 0)
                        : (b.jobs?.length || 0) - (a.jobs?.length || 0)
                );
            }

            setCustomerJobs(sortedData); // 👈 Apply sorted result
        } else {
            if (type === "date") {
                sortedData.sort((a, b) => {
                    return order === "oldest"
                        ? new Date(a?.createdAt) - new Date(b?.createdAt)
                        : new Date(b?.createdAt) - new Date(a?.createdAt);
                });
            } else if (type === "modified") {
                sortedData.sort((a, b) => {
                    return order === "oldest"
                        ? new Date(a?.updatedAt) - new Date(b?.updatedAt)
                        : new Date(b?.updatedAt) - new Date(a?.updatedAt);
                });
            } else if (type === "name") {
                sortedData.sort((a, b) => {
                    return order === "asc"
                        ? a?.jobName?.localeCompare(b?.jobName)
                        : b?.jobName?.localeCompare(a?.jobName);
                });
            } else if (type === "status") {
                sortedData.sort((a, b) => {
                    const statusA = a?.jobStatus || a?.vehicleStatus ? "Complete" : "InProgress";
                    const statusB = b?.jobStatus || b?.vehicleStatus ? "Complete" : "InProgress";

                    return order === "asc"
                        ? statusA.localeCompare(statusB)
                        : statusB.localeCompare(statusA);
                });
            }

            if (activeTab === 'Jobs') {
                setFilteredJobs(sortedData);
            } else {
                setFilteredWorkOrders(sortedData);
            }
        }

        setSortOrder(order);
        setSortType(type);
        setModalVisible(false);
    };


    useEffect(() => {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1); // 👈 1 month before today
        setStartDate(lastMonth);
    }, []);

    //fetch tech details
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
        if (activeTab === "Jobs") {
            fetchJobHistory();
        } else if (activeTab === "Customers") {
            setCustomerJobs([]);
            fetchCustomerJobHistory(1, false);
        } else {
            fetchVehicalInfo(page);
        }
    }, [activeTab, technicianId, activeStatus]);

    const fetchJobHistory = async (newPage = 1, isPagination = false) => {
        if (!technicianId) {
            console.warn("No Technician ID found. Exiting function.");
            return;
        }

        // Show loading indicators based on request type
        if (isPagination) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("No token found");
                return;
            }
            // console.log("token", token);
            const apiUrl = technicianType === "manager"
                ? `${API_BASE_URL}/fetchAllJobs?roleType=${technicianType}&page=${newPage}&limit=10`
                : technicianType === "single-technician"
                    ? `${API_BASE_URL}/fetchAllJobs?userId=${technicianId}&roleType=${technicianType}&page=${newPage}&limit=10`
                    : `${API_BASE_URL}/fetchAllJobs?userId=${technicianId}&page=${newPage}&limit=10`;
            const response = await axios.get(
                apiUrl,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newJobs = (technicianType === "manager") ? (response?.data?.jobs?.jobs) : (response?.data?.jobs?.jobs) || [];
            console.log("fetchJobHistory", response?.data);

            const updatedJobs = newPage === 1 ? newJobs : [...jobsRawData, ...newJobs];

            setJobsRawData(updatedJobs);
            // await AsyncStorage.setItem("jobHistoryData", JSON.stringify(updatedJobs));
            // console.log("fetchJobHistory", updatedJobs);

            setHasMore(newJobs.length > 0);
            setJobPage(newPage);
        } catch (error) {
            console.error("Error fetching job history:", error);
        } finally {
            if (isPagination) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    const fetchFilteredData = async (start, end, tab) => {
        if (!technicianId) return;
        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("No token found");
                return;
            }

            const formattedStartDate = start
                ? new Date(start).toISOString().split("T")[0].split("-").reverse().join("-")
                : "";

            const formattedEndDate = end
                ? new Date(end).toISOString().split("T")[0].split("-").reverse().join("-")
                : "";

            console.log("Start:", formattedStartDate, "End:", formattedEndDate, "Tab:", tab);

            if (tab === "Jobs") {
                const response = await axios.post(
                    `${API_BASE_URL}/jobFilter`,
                    `startDate=${formattedStartDate}&endDate=${formattedEndDate}&technicianId=${technicianId}`,
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log("joresponse?.databs", response?.data);

                const jobs = response?.data?.jobs;
                console.log("jobs", jobs);
                setJobsRawData(jobs);
            } else if (tab === "WorkOrders") {
                const response = await axios.post(
                    `${API_BASE_URL}/vehicleFilter`,
                    `startDate=${formattedStartDate}&endDate=${formattedEndDate}&technicianId=${technicianId}`,
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log("response?.data", response?.data);

                const vehicles = response?.data?.vehicles || [];
                setWorkOrdersRawData(vehicles);
            }
        } catch (error) {
            console.error("Error fetching filtered data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicalInfo = async (pageNumber = 1) => {
        if (!hasMore && pageNumber !== 1) return;

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }
            // const apiUrl = technicianType === "manager"
            //     ? `${API_BASE_URL}/fetchVehicleInfo?page=${pageNumber}&roleType=${technicianType}`
            //     : `${API_BASE_URL}/fetchtechVehicleInfo?page=${pageNumber}&userId=${technicianId}`;
            const apiUrl = technicianType === "manager"
                ? `${API_BASE_URL}/fetchVehicalInfo?page=${pageNumber}&roleType=${technicianType}`
                : `${API_BASE_URL}/fetchVehicalInfo?page=${pageNumber}&roleType=${technicianType}&userId=${technicianId}`;

            const response = await axios.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const { response: resData } = response.data;
            const newVehicles = response?.data?.jobs?.vehicles || [];
            console.log("fetchVehicalInfo::::", newVehicles);

            // Update vehicle data
            if (pageNumber === 1) {
                setWorkOrdersRawData(newVehicles);
            } else {
                setWorkOrdersRawData(prev => [...prev, ...newVehicles]);
            }

            // Handle pagination
            const morePagesAvailable = pageNumber < resData?.totalPages;
            setHasMore(morePagesAvailable);
            setPage(pageNumber);
            // console.log("work::", workOrdersRawData);

        } catch (error) {
            console.error("Failed to fetch vehicle info:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerJobHistory = async (newPage = 1, isPagination = false) => {
        if (isPagination) {
            setCustomerLoadingMore(true);
        } else {
            setCustomerLoading(true);
        }

        try {
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("No token found");
                setCustomerHasMore(false);
                return;
            }

            //             let apiUrl = "";
            //             if (technicianType === "manager") {
            //                 apiUrl = `${API_BASE_URL}/fetchCustomer?roleType=${technicianType}&page=${newPage}&limit=10`;
            //             } else if (technicianType === "single-technician") {
            //                 apiUrl = `${API_BASE_URL}/fetchCustomer?userId=${technicianId}&roleType=${technicianType}&page=${newPage}&limit=10`;
            //             } else {
            //                 apiUrl = `${API_BASE_URL}/fetchAllJobs?userId=${technicianId}&page=${newPage}&limit=10`;
            //             }
            // console.log(apiUrl,technicianId);

            const response = await axios.get(`${API_BASE_URL}/fetchCustomer?userId=${technicianId}&roleType=${technicianType}&page=${newPage}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newJobs = response?.data?.customers?.customers || [];
            console.log("Customer Jobs Fetched:", response?.data?.customers?.customers);

            const updatedJobs = newPage === 1 ? newJobs : [...customerJobs, ...newJobs];

            setCustomerJobs(updatedJobs);
            setCustomerHasMore(newJobs.length > 0);
            setCustomerJobPage(newPage);
        } catch (error) {
            console.error("Error fetching customer job history:", error);
            setCustomerHasMore(false);
        } finally {
            if (isPagination) {
                setCustomerLoadingMore(false);
            } else {
                setCustomerLoading(false);
            }
        }
    };

    const filterByStatus = useCallback((data, status, tab) => {
        return data?.filter(item => {
            const field =
                tab === "Jobs"
                    ? (item?.jobStatus)
                    : tab === "Customers" ? (item?.jobStatus) : (item?.vehicleStatus);

            if (status === "Completed") return field === true || field === "completed";
            if (status === "InProgress") return field === false || field === "inprogress";
            return true;
        });
    }, []);

    useEffect(() => {
        const filteredJob = filterByStatus(jobsRawData, activeStatus, 'Jobs');
        const filteredWork = filterByStatus(workOrdersRawData, activeStatus, 'WorkOrders');
        const customerFiltered = filterByStatus(customerJobs, activeStatus, 'Customers');
        setFilteredJobs(filteredJob);
        setFilteredWorkOrders(filteredWork);
        // console.log("customerFiltered", customerFiltered);

        setFilteredCustomer(customerFiltered);

    }, [activeStatus, jobsRawData, workOrdersRawData, customerJobs]);

    const getStatusStyle = (status) => {
        if (status === true || status === "completed") return [styles.statusPill, styles.statusCompleted];
        if (status === false || status === "inprogress") return [styles.statusPill, styles.statusInProgress];
    };

    const getStatusText = (status) => {
        if (status === true || status === "completed") return 'Complete';
        if (status === false || status === "inprogress") return 'In Progress';
    };

    useEffect(() => {
        const jobFiltered = filterByStatus(jobsRawData, activeStatus, 'Jobs');
        const workOrderFiltered = filterByStatus(workOrdersRawData, activeStatus, 'WorkOrders');
        const customerFiltered = filterByStatus(customerJobs, activeStatus, 'Customers');

        const searchLower = search.toLowerCase();

        const filteredJob = jobFiltered.filter(item =>
            item?.jobName?.toLowerCase().includes(searchLower)
        );

        const filteredWork = workOrderFiltered.filter(item =>
            item?.vin?.toLowerCase().includes(searchLower) ||
            item?.make?.toLowerCase().includes(searchLower) ||
            item?.jobName?.toLowerCase().includes(searchLower)
        );

        const filteredCustomer = customerFiltered.filter(item =>
            item?.customer?.fullName?.toLowerCase().includes(searchLower)
        );
        setFilteredJobs(filteredJob);
        setFilteredWorkOrders(filteredWork);
        setFilteredCustomer(filteredCustomer);
    }, [activeStatus, jobsRawData, workOrdersRawData, search, customerJobs]);

    const handleRefreshVehicle = async () => {
        try {
            setRefreshing(true);
            await fetchVehicalInfo(1);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleRefreshJob = async () => {
        try {
            setRefreshingJob(true);
            await fetchJobHistory(jobPage);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setRefreshingJob(false);
        }
    };

    // const groupJobsByCustomer = (jobs = []) => {
    //     const grouped = {};
    //     jobs.forEach(job => {
    //         const customerId = job?.assignCustomer;
    //         if (!customerId) return;

    //         if (!grouped[customerId]) {
    //             grouped[customerId] = {
    //                 customer: job.customer,
    //                 jobs: [],
    //             };
    //         }

    //         grouped[customerId].jobs.push(job);
    //     });

    //     return Object.values(grouped);
    // };

    // const groupedCustomers = groupJobsByCustomer(filteredCustomer);

    return (
        <View style={[flex, styles.container]}>
            {/* Header */}
            <Header title={"Reports"} onBack={() => navigation.navigate("Home")} />

            {activeTab === 'WorkOrders' &&
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
                        style={[styles.tabButton, { backgroundColor: viewType === 'grid' ? blueColor : whiteColor, width: isTablet ? wp(8) : wp(12), height: hp(4.5) }]}>
                        <Ionicons name="grid-sharp" size={isTablet ? 35 : 20} color={viewType === 'grid' ? whiteColor : blackColor} />
                    </TouchableOpacity>
                </View>
            }

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
                <View style={[styles.datePickerContainer, { marginBottom: 15 }]}>
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
                    maximumDate={new Date()} // ⛔ prevents selecting future dates
                    onConfirm={(date) => {
                        setStartDate(date);
                        setIsStartPickerOpen(false);
                        fetchFilteredData(date, endDate, activeTab);
                    }}
                    onCancel={() => setIsStartPickerOpen(false)}
                />

                <DatePicker
                    modal
                    open={isEndPickerOpen}
                    date={endDate}
                    mode="date"
                    minimumDate={startDate}       // ✅ StartDate se pehle ki date disable
                    maximumDate={new Date()} // ⛔ prevents selecting future dates
                    onConfirm={(date) => {
                        const newEndDate = date;
                        setEndDate(newEndDate);
                        setIsEndPickerOpen(false);
                        fetchFilteredData(startDate, newEndDate, activeTab); // Use new end date
                    }}
                    onCancel={() => setIsEndPickerOpen(false)}
                />

                {/* Search Bar */}
                <View style={[styles.searchBar, flexDirectionRow, alignItemsCenter, {
                    width:
                        Platform.OS === "android"
                            ? isTablet
                                ? wp(87) // Android tablet
                                : wp(78) // Android phone
                            : isTablet
                                ? wp(88) // iOS tablet
                                : wp(80), // iOS phone
                }]}>
                    <TextInput
                        style={[styles.searchInput, flex]}
                        placeholder="Search.."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor={blackColor}
                    />
                    <Feather name="search" size={20} color={blackColor} />

                    <TouchableOpacity style={[styles.filterButton, { top: isTablet ? Platform.OS === "android" ? hp(1) : hp(1) : hp(0.5), right: isTablet ? Platform.OS === "android" ? -80 : -100 : -60 }]}
                        onPress={toggleModal}
                    >
                        <Image source={SORT_IMAGE} resizeMode='contain' style={{ width: isTablet ? wp(7) : wp(10), height: hp(3.2) }} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity onPress={() => setActiveTab("WorkOrders")} style={[styles.tabButton, activeTab === 'WorkOrders' && styles.activeTab, { width: isTablet ? wp(12) : wp(30), height: hp(4) }]}>
                        <Text style={[styles.tabText, activeTab === 'WorkOrders' && styles.activeTabText]}>Work Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setActiveTab("Jobs"), setActiveStatus("InProgress") }} style={[styles.tabButton, activeTab === 'Jobs' && styles.activeTab, { width: isTablet ? wp(12) : wp(20), height: hp(4) }]}>
                        <Text style={[styles.tabText, activeTab === 'Jobs' && styles.activeTabText]}>Jobs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setActiveTab("Customers"), setActiveStatus("InProgress") }} style={[styles.tabButton, activeTab === 'Customers' && styles.activeTab, { width: isTablet ? wp(12) : wp(30), height: hp(4) }]}>
                        <Text style={[styles.tabText, activeTab === 'Customers' && styles.activeTabText]}>Customers</Text>
                    </TouchableOpacity>
                </View>

                {/* Status Filters */}
                <View style={styles.statusFilterContainer}>
                    {['Completed', 'InProgress'].map(status => {
                        if (activeTab === "Customers") {
                            return
                        }
                        const dataList = activeTab === "Jobs" ? jobsRawData : activeTab === "Customers" ? customerJobs : workOrdersRawData;
                        const count = filterByStatus(dataList, status, activeTab).length;

                        return (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setActiveStatus(status)}
                                style={[
                                    styles.statusButton,
                                    activeStatus === status && styles.activeStatus,
                                    { width: isTablet ? wp(20) : wp(35), height: hp(4) },
                                    alignJustifyCenter
                                ]}
                            >
                                <Text style={[styles.statusText, activeStatus === status && styles.activeStatusText]}>
                                    {status === 'InProgress' ? 'In Progress' : status} ({count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Jobs */}
            {activeTab === 'Jobs' && (
                <>
                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeader, { width: "40%" }]}>Job Name</Text>
                        <Text style={[styles.tableHeader, { width: "35%" }]}>Number of W.O</Text>
                        <Text style={[styles.tableHeader, { width: "20%", textAlign: "center" }]}>Action</Text>

                    </View>

                    {/* FlatList for Jobs only */}
                    <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(63) : hp(47) : isIOSAndTablet ? hp(58) : hp(44.5) }}>
                        <FlatList
                            data={filteredJobs}
                            keyExtractor={(item, index) => item?.jobName || index.toString()}
                            showsVerticalScrollIndicator={false}
                            refreshing={refreshingJob}
                            onRefresh={handleRefreshJob}
                            renderItem={({ item, index }) => {
                                const rowStyle = {
                                    backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor,
                                };

                                return (
                                    <View style={[styles.listItem, rowStyle]}

                                    >
                                        <Text style={[styles.text, { width: "49%" }]}>
                                            {item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}
                                        </Text>
                                        <Text style={[styles.text, { width: "30%" }]}>
                                            {item?.vehicles?.length}
                                        </Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", width: "20%" }} >
                                            <Pressable onPress={() => navigation.navigate("NewJobDetailsScreen", {
                                                jobId: item?.id
                                            })}>
                                                <Text style={styles.viewText}>View</Text>
                                            </Pressable>
                                            <Pressable onPress={() => navigation.navigate("CreateJobScreen", {
                                                jobId: item?.id
                                            })}>
                                                <Text style={styles.viewText}>Edit</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={() => (
                                <Text style={[styles.text, textAlign, { margin: hp(10), fontWeight: "500", color: grayColor }]}>
                                    No data found.
                                </Text>
                            )}
                        />
                    </View>
                </>
            )}

            {/* WorkOrders */}
            {activeTab === 'WorkOrders' && viewType === 'grid' ? (
                <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(53) : isIOSAndTablet ? hp(61) : hp(49) }}>
                    <FlatList
                        data={filteredWorkOrders}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 10 }}
                        refreshing={refreshing}
                        onRefresh={handleRefreshVehicle}
                        renderItem={({ item, index }) => (
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
                                    <View style={{ width: '48%', marginBottom: 9 }}>
                                        <Text style={{ color: '#555', fontSize: 10 }}>JobName</Text>
                                        <Text >{item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}</Text>
                                    </View>
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
                                        <Text style={{ color: '#555', fontSize: 10 }}>Date</Text>
                                        <Text >{new Date(item?.createdAt).toLocaleDateString("en-US", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric"
                                        })}</Text>
                                    </View>

                                    {/* <View style={{ width: '48%', marginBottom: 9 }}>
                                        <Text style={{ color: '#555', fontSize: 10 }}>Cost Estimate</Text>
                                        <Text > ${Array.isArray(item?.jobDescription) && item?.jobDescription?.length > 0
                                            ? item?.jobDescription?.reduce((total, job) => total + Number(job?.cost || 0), 0)
                                            : '0'}</Text>
                                    </View> */}
                                    <View style={{ width: '48%', marginBottom: 9 }}>
                                        <Text style={{ color: '#555', fontSize: 10 }}>Status</Text>

                                        <Text style={[{ fontSize: 15, fontWeight: '700', color: item?.vehicleStatus === true ? greenColor : redColor }]}>
                                            {getStatusText(item?.vehicleStatus)}
                                        </Text>
                                    </View>

                                </View>

                            </Pressable>
                        )}
                        onEndReached={() => {
                            if (!loading && hasMore) {
                                fetchVehicalInfo(page + 1);
                            }
                        }}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={() =>
                            loading ? (
                                <View style={{ paddingVertical: 10, alignItems: "center", width: "100%", height: hp(50), justifyContent: "center" }}>
                                    <ActivityIndicator size="small" color="#0000ff" />
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={() => {
                            if (loading) return null; // 👈 Loading ke time kuch mat dikhao
                            return (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No Vehicle List found</Text>
                                </View>
                            );
                        }}
                    />

                </View>
            ) : activeTab === 'WorkOrders' && viewType === 'list' ? (
                <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(62.5) : hp(53) : isIOSAndTablet ? hp(61) : hp(49) }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View>
                            {/* Header Row */}
                            <View style={[styles.tableHeaderRow, { backgroundColor: blueColor }]}>
                                <Text style={[styles.tableHeader, { width: wp(30) }]}>JobName</Text>
                                <Text style={[styles.tableHeader, { width: wp(55) }]}>VIN</Text>
                                <Text style={[styles.tableHeader, { width: wp(35) }]}>Make</Text>
                                <Text style={[styles.tableHeader, { width: wp(25) }]}>Model</Text>
                                <Text style={[styles.tableHeader, { width: wp(35) }]}>Date</Text>
                                {/* <Text style={[styles.tableHeader, { width: wp(30) }]}>Cost Estimate</Text> */}
                                <Text style={[styles.tableHeader, { paddingRight: isTablet ? 30 : 0, width: isIOSAndTablet ? wp(8) : wp(20) }]}>Status</Text>
                            </View>

                            {/* Data Rows with vertical scroll */}
                            <ScrollView style={{ height: Platform.OS === "android" ? hp(42) : hp(39) }} showsVerticalScrollIndicator={false}>
                                <FlatList
                                    data={filteredWorkOrders}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsVerticalScrollIndicator={false}
                                    refreshing={refreshing}
                                    onRefresh={handleRefreshVehicle}
                                    renderItem={({ item, index }) => {
                                        const rowStyle = { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor };
                                        return (
                                            <Pressable key={index.toString()} style={[styles.listItem, rowStyle, { flexDirection: 'row' }]} onPress={() => navigation.navigate("VehicleDetailsScreen", { vehicleId: item?.id, from: "report" })}>
                                                <Text style={[styles.text, { width: wp(30), paddingLeft: spacings.small }]}>{item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}</Text>
                                                <Text style={[styles.text, { width: wp(55) }]}>{item?.vin || '-'}</Text>
                                                <Text style={[styles.text, { width: wp(35) }]}>{item?.make || '-'}</Text>
                                                <Text style={[styles.text, { width: wp(25) }]}>{item?.model || '-'}</Text>
                                                <Text style={[styles.text, { width: wp(35) }]}>{new Date(item?.createdAt).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric"
                                                })}</Text>
                                                {/* <Text style={[styles.text, { width: wp(30) }]}> ${Array.isArray(item?.jobDescription) && item?.jobDescription?.length > 0
                                                    ? item?.jobDescription?.reduce((total, job) => total + Number(job?.cost || 0), 0)
                                                    : '0'}</Text> */}
                                                <View style={[getStatusStyle(item?.vehicleStatus), alignJustifyCenter]}>
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
                                    ListFooterComponent={() =>
                                        loading ? (
                                            <View style={{ paddingVertical: 10, alignItems: "center", width: wp(100), height: hp(50), justifyContent: "center" }}>
                                                <ActivityIndicator size="small" color="#0000ff" />
                                            </View>
                                        ) : null
                                    }
                                    ListEmptyComponent={() => {
                                        if (loading) return null; // 👈 Loading ke time kuch mat dikhao
                                        return (
                                            <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>No Vehicle List found</Text>
                                            </View>
                                        );
                                    }}
                                    onEndReached={() => {
                                        if (!loading && hasMore) {
                                            fetchVehicalInfo(page + 1);
                                        }
                                    }}
                                    onEndReachedThreshold={0.3}
                                />
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            ) : null}


            {activeTab === 'Customers' && (
                <>
                    <View style={[styles.tableHeaderRow]}>
                        <Text style={[styles.tableHeader, { width: "40%" }]}>Customer Name</Text>
                        <Text style={[styles.tableHeader, { width: "40%" }]}>Number of Jobs</Text>
                        <Text style={[styles.tableHeader, { width: "20%", textAlign: "center" }]}>Action</Text>

                    </View>

                    <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(63) : hp(47) : isIOSAndTablet ? hp(58) : hp(44.5) }}>
                        <FlatList
                            data={customerJobs}
                            keyExtractor={(item, index) => item?.vin || index.toString()}
                            showsVerticalScrollIndicator={false}
                            refreshing={customerLoading}
                            onRefresh={() => fetchCustomerJobHistory(1, false)}
                            onEndReached={() => {
                                if (customerHasMore && !customerLoadingMore) {
                                    fetchCustomerJobHistory(customerJobPage + 1, true);
                                }
                            }}
                            onEndReachedThreshold={0.3}
                            renderItem={({ item, index }) => {
                                const rowStyle = {
                                    backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor,
                                };

                                return (
                                    <View style={[styles.listItem, rowStyle]}>
                                        <Text style={[styles.text, { width: "49%" }]}>
                                            {item?.fullName?.charAt(0).toUpperCase() + item?.fullName?.slice(1)}
                                        </Text>
                                        <Text style={[styles.text, { width: "35%" }]}>
                                            {item?.jobs?.length}
                                        </Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", width: "20%" }} >
                                            <Pressable onPress={() => navigation.navigate("NewJobDetailsScreen", {
                                                customerId: item?.id,
                                                from: "customer"
                                            })}>
                                                <Text style={styles.viewText}>View</Text>
                                            </Pressable>
                                            {/* <Pressable onPress={() => navigation.navigate("CreateJobScreen", {
                                                jobId: item?.id
                                            })}>
                                                <Text style={styles.viewText}>Edit</Text>
                                            </Pressable> */}
                                        </View>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={() => {
                                if (customerLoading) return null; // 👈 Loading ke time kuch mat dikhao
                                return (
                                    <Text style={[styles.text, textAlign, { margin: hp(10), fontWeight: "500", color: grayColor }]}>
                                        No data found.
                                    </Text>
                                );
                            }}
                            ListFooterComponent={
                                customerLoadingMore ? (
                                    <ActivityIndicator size="small" color={blueColor} style={{ marginTop: 10 }} />
                                ) : null
                            }
                        />
                    </View>
                </>
            )}


            {/* Sorting Modal */}
            {isModalVisible && (
                <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={toggleModal}>
                    <TouchableWithoutFeedback onPress={toggleModal}>
                        <View style={styles.modalOverlay}>
                            <Feather name="chevron-down" size={55} color={blackColor} />
                            <View style={styles.modalContainer}>
                                <View style={{
                                    width: "100%",
                                    justifyContent: "space-between",
                                    flexDirection: "row",
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#ddd'
                                }}>
                                    <Text style={styles.modalTitle}>Sort By</Text>
                                    <Feather name="sliders" size={20} color={grayColor} />
                                </View>
                                {/* Only show for Jobs tab */}
                                {activeTab === "Jobs" && (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => handleSort(
                                                sortType === "name" && sortOrder === "asc" ? "desc" : "asc",
                                                "name"
                                            )}
                                            style={styles.sortOption}
                                        >
                                            <Text style={[styles.sortText, { color: sortType === "name" ? blackColor : 'gray' }]}>
                                                Job Name
                                            </Text>
                                            <Text style={[styles.sortText, { color: sortType === "name" ? blackColor : 'gray' }]}>
                                                {sortType === "name" ? (sortOrder === "asc" ? "A to Z" : "Z to A") : "A to Z"}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {activeTab === "Customers" && (
                                    <>
                                        <TouchableOpacity
                                            onPress={() =>
                                                handleSort(sortType === "name" && sortOrder === "asc" ? "desc" : "asc", "name")
                                            }
                                            style={styles.sortOption}
                                        >
                                            <Text style={[styles.sortText, { color: sortType === "name" ? blackColor : 'gray' }]}>
                                                Customer Name
                                            </Text>
                                            <Text style={[styles.sortText, { color: sortType === "name" ? blackColor : 'gray' }]}>
                                                {sortOrder === "asc" ? "A to Z" : "Z to A"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() =>
                                                handleSort(sortType === "date" && sortOrder === "newest" ? "oldest" : "newest", "date")
                                            }
                                            style={styles.sortOption}
                                        >
                                            <Text style={[styles.sortText, { color: sortType === "date" ? blackColor : 'gray' }]}>
                                                Created Date
                                            </Text>
                                            <Text style={[styles.sortText, { color: sortType === "date" ? blackColor : 'gray' }]}>
                                                {sortOrder === "newest" ? "New to Old" : "Old to New"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() =>
                                                handleSort(sortType === "modified" && sortOrder === "latest" ? "oldest" : "latest", "modified")
                                            }
                                            style={styles.sortOption}
                                        >
                                            <Text style={[styles.sortText, { color: sortType === "modified" ? blackColor : 'gray' }]}>
                                                Last Modified
                                            </Text>
                                            <Text style={[styles.sortText, { color: sortType === "modified" ? blackColor : 'gray' }]}>
                                                {sortOrder === "latest" ? "Latest to Oldest" : "Oldest to Latest"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() =>
                                                handleSort(sortType === "count" && sortOrder === "asc" ? "desc" : "asc", "count")
                                            }
                                            style={styles.sortOption}
                                        >
                                            <Text style={[styles.sortText, { color: sortType === "count" ? blackColor : 'gray' }]}>
                                                Number of Jobs
                                            </Text>
                                            <Text style={[styles.sortText, { color: sortType === "count" ? blackColor : 'gray' }]}>
                                                {sortOrder === "asc" ? "Lowest to Highest" : "Highest to Lowest"}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                {/* Common Sort: Date Created */}
                                {activeTab != "Customers" && <TouchableOpacity
                                    onPress={() => handleSort(
                                        sortType === "date" && sortOrder === "newest" ? "oldest" : "newest",
                                        "date"
                                    )}
                                    style={styles.sortOption}
                                >
                                    <Text style={[styles.sortText, { color: sortType === "date" ? blackColor : 'gray' }]}>
                                        Date Created
                                    </Text>
                                    <Text style={[styles.sortText, { color: sortType === "date" ? blackColor : 'gray' }]}>
                                        {sortType === "date" ? (sortOrder === "newest" ? "New to Old" : "Old to New") : "New to Old"}
                                    </Text>
                                </TouchableOpacity>}

                                {/* Common Sort: Last Modified */}
                                {activeTab != "Customers" && <TouchableOpacity
                                    onPress={() => handleSort(
                                        sortType === "modified" && sortOrder === "latest" ? "oldest" : "latest",
                                        "modified"
                                    )}
                                    style={styles.sortOption}
                                >
                                    <Text style={[styles.sortText, { color: sortType === "modified" ? blackColor : 'gray' }]}>
                                        Last Modified
                                    </Text>
                                    <Text style={[styles.sortText, { color: sortType === "modified" ? blackColor : 'gray' }]}>
                                        {sortType === "modified" ? (sortOrder === "latest" ? "Latest to Oldest" : "Oldest to Latest") : "Latest to Oldest"}
                                    </Text>
                                </TouchableOpacity>}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}

        </View >
    );
};

export default Reports;

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
    },
    header: {
        marginBottom: spacings.medium,
    },
    title: {
        fontSize: style.fontSizeLargeX.fontSize,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: blackColor,
    },
    subtitle: {
        fontSize: style.fontSizeNormal.fontSize,
        color: mediumGray,
        marginVertical: spacings.small2x,
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
    searchBar: {
        backgroundColor: whiteColor,
        paddingHorizontal: spacings.large,
        borderRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: grayColor
    },
    searchInput: {
        height: hp(5),
        color: blackColor
    },

    value: {
        fontSize: style.fontSizeSmall1x.fontSize,
        color: blackColor,
    },

    datePickerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 10,
        // marginBottom: 15
    },
    filterButton: {
        backgroundColor: blueColor,
        padding: 6,
        borderRadius: 5,
        alignItems: "center",
        position: "absolute",
        zIndex: 999
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: whiteColor,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        // paddingBottom: 10,
        padding: 20,

        // alignItems: 'center',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        // fontWeight: 'bold',
        color: grayColor,
        marginBottom: 15,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 12,
    },
    sortText: {
        fontSize: 16,
    },
    closeButton: {
        marginTop: 15,
        paddingVertical: spacings.xLarge,
        width: '100%',
        backgroundColor: orangeColor,
        borderRadius: 5,
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: spacings.xxLarge
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
    activeTab: {
        backgroundColor: blueColor,
        paddingHorizontal: spacings.large,
        borderRadius: 5
    },
    tabText: {
        fontSize: style.fontSizeNormal.fontSize,
        color: blackColor
    },
    activeTabText: {
        fontWeight: style.fontWeightThin1x.fontWeight,
        fontSize: style.fontSizeNormal.fontSize,
        color: whiteColor
    },

    statusFilterContainer: {
        flexDirection: 'row',
        marginVertical: spacings.large
    },
    statusButton: {
        paddingHorizontal: spacings.xLarge,
        // paddingVertical: spacings.medium,
        // marginRight: spacings.large
    },
    activeStatus: {
        borderBottomWidth: 3,
        borderBottomColor: blackColor
    },
    statusText: {
        fontSize: style.fontSizeNormal.fontSize,
        color: blackColor
    },
    activeStatusText: {
        color: blackColor,
        fontWeight: style.fontWeightThin1x.fontWeight
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
    statusPill: {
        paddingHorizontal: spacings.xLarge,
        paddingVertical: 2,
        borderRadius: 20
    },
    statusCompleted: { backgroundColor: '#C8F8D6', borderWidth: 1, borderColor: greenColor, },
    statusInProgress: { backgroundColor: '#FFEFC3', borderWidth: 1, borderColor: goldColor },
    statusPending: { backgroundColor: '#FDE2E2', borderWidth: 1, borderColor: redColor },
    gridItem: {
        padding: 16,
        marginHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: lightGrayColor,
        // minWidth: 600
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
