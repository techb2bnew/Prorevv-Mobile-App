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
    const route = useRoute();
    const { jobCompleted } = route.params || {};
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
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const [activeTab, setActiveTab] = useState("WorkOrders");
    const [activeStatus, setActiveStatus] = useState("Completed");
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [filteredWorkOrders, setFilteredWorkOrders] = useState([]);
    const [viewType, setViewType] = useState('list');


    const [jobsRawData, setJobsRawData] = useState([
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: false },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: true },
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: false },
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: false },
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: true },
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: false },
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: true },
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: false },
        { jobName: "Ron’s Chevvy (2020)", workOrderCount: 10, status: true },
        { jobName: "Ron’s Dodge (2022)", workOrderCount: 20, status: false },
    ]);

    const [workOrdersRawData, setWorkOrdersRawData] = useState([
        {
            vin: "1FAHP2E81DG123456",
            make: "AUDI",
            model: "Q5",
            technician: "Ravi Kumar",
            price: 2500,
            date: "2024-08-01",
            status: true
        },
        {
            vin: "2FTRX18W1XCA12345",
            make: "RAM",
            model: "1500",
            technician: "Amit Verma",
            price: 3200,
            date: "2024-08-02",
            status: true
        },
        {
            vin: "3HGCM56497G123456",
            make: "TOYOTA",
            model: "Corolla",
            technician: "Suman Joshi",
            price: 1800,
            date: "2024-08-03",
            status: true
        },
        {
            vin: "4T1BE46KX7U123456",
            make: "AUDI",
            model: "A4",
            technician: "Ravi Kumar",
            price: 2800,
            date: "2024-08-04",
            status: true
        },
        {
            vin: "5NPEB4AC8BH123456",
            make: "RAM",
            model: "2500",
            technician: "Neha Yadav",
            price: 3500,
            date: "2024-08-05",
            status: "pending"
        },
        {
            vin: "1FAHP2E81DG654321",
            make: "TOYOTA",
            model: "Camry",
            technician: "Suman Joshi",
            price: 2100,
            date: "2024-08-06",
            status: true
        },
        {
            vin: "2C3KA53G56H123456",
            make: "AUDI",
            model: "Q7",
            technician: "Ravi Kumar",
            price: 4000,
            date: "2024-08-07",
            status: false
        },
        {
            vin: "3VWFE21C04M123456",
            make: "RAM",
            model: "Rebel",
            technician: "Amit Verma",
            price: 2900,
            date: "2024-08-08",
            status: true
        },
        {
            vin: "1HGCM82633A765432",
            make: "TOYOTA",
            model: "Fortuner",
            technician: "Neha Yadav",
            price: 3300,
            date: "2024-08-09",
            status: false
        },
        {
            vin: "1FAHP2E81DG123456",
            make: "AUDI",
            model: "Q5",
            technician: "Ravi Kumar",
            price: 2500,
            date: "2024-08-01",
            status: false
        },
        {
            vin: "2FTRX18W1XCA12345",
            make: "RAM",
            model: "1500",
            technician: "Amit Verma",
            price: 3200,
            date: "2024-08-02",
            status: true
        },
        {
            vin: "3HGCM56497G123456",
            make: "TOYOTA",
            model: "Corolla",
            technician: "Suman Joshi",
            price: 1800,
            date: "2024-08-03",
            status: false
        },
        {
            vin: "4T1BE46KX7U123456",
            make: "AUDI",
            model: "A4",
            technician: "Ravi Kumar",
            price: 2800,
            date: "2024-08-04",
            status: "pending"
        },
        {
            vin: "5NPEB4AC8BH123456",
            make: "RAM",
            model: "2500",
            technician: "Neha Yadav",
            price: 3500,
            date: "2024-08-05",
            status: "pending"
        },
        {
            vin: "1FAHP2E81DG654321",
            make: "TOYOTA",
            model: "Camry",
            technician: "Suman Joshi",
            price: 2100,
            date: "2024-08-06",
            status: true
        },
    ]);

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const handleSort = (order, type) => {
        let sortedData = [...jobHistoryData];

        if (type === "name") {
            sortedData.sort((a, b) => {
                return order === "asc"
                    ? a?.customer?.firstName.localeCompare(b?.customer?.firstName)
                    : b?.customer?.firstName.localeCompare(a?.customer?.firstName);
            });
        } else if (type === "date") {
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
        } else if (type === "status") {
            sortedData.sort((a, b) => {
                const statusA = a?.jobStatus ? "Complete" : "InProgress";
                const statusB = b?.jobStatus ? "Complete" : "InProgress";

                return order === "asc"
                    ? statusA.localeCompare(statusB) // InProgress → Complete
                    : statusB.localeCompare(statusA); // Complete → InProgress
            });
        }

        // ✅ Pehle se select kiya hua item sabse upar rahe
        const selectedItem = sortedData.find(item => item.sortType === type);
        sortedData = sortedData.filter(item => item.sortType !== type);
        if (selectedItem) sortedData.unshift(selectedItem);

        setjobHistoryData(sortedData);
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

    useEffect(() => {
        const getTechnicianDetail = async () => {
            try {
                const storedData = await AsyncStorage.getItem("userDeatils");
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    setTechnicianId(parsedData?.id);
                    setTechnicianType(parsedData?.types)
                }
            } catch (error) {
                console.error("Error fetching stored user:", error);
            }
        };

        getTechnicianDetail();
    }, []);

    useEffect(() => {
        if (technicianId) {
            checkFirstLaunch();
        }
    }, [technicianId]);


    const checkFirstLaunch = async () => {
        try {
            const storedData = await AsyncStorage.getItem("jobHistoryData");

            if (storedData) {
                setjobHistoryData(JSON.parse(storedData));
                setLoading(false);
            }

            const isFetched = await AsyncStorage.getItem("jobHistoryFetched");
            if (!isFetched) {
                console.log("wokring");
                await fetchJobHistory();
                await AsyncStorage.setItem("jobHistoryFetched", "true");
            }
        } catch (error) {
            console.error("Error checking first launch:", error);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const getTechnicianDetailAndFetchJobs = async () => {
            try {
                const storedData = await AsyncStorage.getItem("userDeatils");
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    const id = parsedData?.id;
                    setTechnicianId(id);

                    if (id) {
                        setTimeout(() => {
                            fetchJobHistory(); // Ab ye technicianId update hone ke baad chalega
                        }, 100);
                    }
                }
            } catch (error) {
                console.error("Error fetching stored user:", error);
            }
        };

        getTechnicianDetailAndFetchJobs();
    }, [jobCompleted, technicianId]);


    const fetchJobHistory = async (newPage = 1, isPagination = false) => {
        if (!technicianId) {
            console.warn("No Technician ID found. Exiting function.");
            return;
        }

        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            console.warn("No internet connection. Loading cached data...");

            // Load cached data if offline
            const cachedData = await AsyncStorage.getItem("jobHistoryData");
            if (cachedData) {
                setjobHistoryData(JSON.parse(cachedData));
            }
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

            const response = await axios.get(
                `${API_BASE_URL}/fetchJobHistory?technicianId=${technicianId}&roleType=${technicianType}&page=${newPage}&limit=10`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newJobs = response?.data?.jobs?.jobs || [];

            const updatedJobs = newPage === 1 ? newJobs : [...jobHistoryData, ...newJobs];

            setjobHistoryData(updatedJobs);
            await AsyncStorage.setItem("jobHistoryData", JSON.stringify(updatedJobs));
            console.log("working", updatedJobs);

            setHasMore(newJobs.length > 0);
            setPage(newPage);
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

    const fetchFilteredJobHistory = async (start, end) => {
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

            console.log("Start date:", formattedStartDate, "End date:", formattedEndDate, "technicianid", technicianId, token);

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

            console.log("Response:", response?.data?.jobs);
            setjobHistoryData(response?.data?.jobs || []);
        } catch (error) {
            console.error("Error fetching filtered job history:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterByStatus = useCallback((data, status) => {
        if (status === "Completed") return data.filter(item => item.status === true || item.status === "completed");
        if (status === "InProgress") return data.filter(item => item.status === false || item.status === "inprogress");
        if (status === "Pending") return data.filter(item => item.status === "pending");
        return data;
    }, []);

    useEffect(() => {
        const filteredJob = filterByStatus(jobsRawData, activeStatus);
        const filteredWork = filterByStatus(workOrdersRawData, activeStatus);
        setFilteredJobs(filteredJob);
        setFilteredWorkOrders(filteredWork);
    }, [activeStatus, jobsRawData, workOrdersRawData]);

    const getStatusStyle = (status) => {
        if (status === true || status === "completed") return [styles.statusPill, styles.statusCompleted];
        if (status === false || status === "inprogress") return [styles.statusPill, styles.statusInProgress];
        return [styles.statusPill, styles.statusPending];
    };

    const getStatusText = (status) => {
        if (status === true || status === "completed") return 'Complete';
        if (status === false || status === "inprogress") return 'In Progress';
        return 'Pending';
    };

    useEffect(() => {
        const jobFiltered = filterByStatus(jobsRawData, activeStatus);
        const workOrderFiltered = filterByStatus(workOrdersRawData, activeStatus);

        const searchLower = search.toLowerCase();

        const filteredJob = jobFiltered.filter(item =>
            item?.jobName?.toLowerCase().includes(searchLower)
        );

        const filteredWork = workOrderFiltered.filter(item =>
            item?.vin?.toLowerCase().includes(searchLower) ||
            item?.make?.toLowerCase().includes(searchLower)
        );

        setFilteredJobs(filteredJob);
        setFilteredWorkOrders(filteredWork);
    }, [activeStatus, jobsRawData, workOrdersRawData, search]);

    return (
        <View style={[flex, styles.container]}>
            {/* Header */}
            <Header title={"Reports"} onBack={() => navigation.navigate("Home")} />

            {activeTab === 'WorkOrders' &&
                <View style={{
                    flexDirection: 'row', position: "absolute",
                    top: Platform.OS === "android" ? isTablet ? 20 : 10 : isTablet ? 20 : 13,
                    right: -10,
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <TouchableOpacity
                        onPress={() => setViewType('grid')}
                        style={[styles.tabButton, { backgroundColor: viewType === 'grid' ? blueColor : whiteColor, marginRight: 10 }]}>
                        <Ionicons name="list" size={20} color={viewType === 'grid' ? whiteColor : blackColor} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setViewType('list')}
                        style={[styles.tabButton, { backgroundColor: viewType === 'list' ? blueColor : whiteColor, margin: 0 }]}>
                        <Ionicons name="grid-sharp" size={20} color={viewType === 'list' ? whiteColor : blackColor} />
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
                    onConfirm={(date) => {
                        setStartDate(date);
                        setIsStartPickerOpen(false);
                        fetchFilteredJobHistory(date, endDate);
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
                        fetchFilteredJobHistory(startDate, newEndDate); // Use new end date
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

                    <TouchableOpacity style={[styles.filterButton, { top: isTablet ? Platform.OS === "android" ? hp(0.5) : hp(1) : hp(0.5), right: isTablet ? Platform.OS === "android" ? -80 : -100 : -60 }]}
                        onPress={toggleModal}
                    >
                        <Image source={SORT_IMAGE} resizeMode='contain' style={{ width: isTablet ? wp(7) : wp(10), height: hp(3.2) }} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity onPress={() => setActiveTab("WorkOrders")} style={[styles.tabButton, activeTab === 'WorkOrders' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'WorkOrders' && styles.activeTabText]}>Work Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setActiveTab("Jobs"), setActiveStatus("Completed") }} style={[styles.tabButton, activeTab === 'Jobs' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'Jobs' && styles.activeTabText]}>Jobs</Text>
                    </TouchableOpacity>
                </View>

                {/* Status Filters */}
                <View style={styles.statusFilterContainer}>
                    {['Completed', 'InProgress'].map(status => {
                        if (activeTab === 'Jobs' && status === 'Pending') return null;

                        const dataList = activeTab === "Jobs" ? jobsRawData : workOrdersRawData;
                        const count = filterByStatus(dataList, status).length;

                        if (count === 0) return null;

                        return (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setActiveStatus(status)}
                                style={[styles.statusButton, activeStatus === status && styles.activeStatus]}
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
                        <Text style={styles.tableHeader}>Job Name</Text>
                        <Text style={styles.tableHeader}>Number of W.O</Text>
                    </View>

                    {/* FlatList for Jobs only */}
                    <View style={{ width: "100%", height: Platform.OS === "android" ? hp(47) : hp(44.5) }}>
                        <FlatList
                            data={filteredJobs}
                            keyExtractor={(item, index) => item?.jobName || index.toString()}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }) => {
                                const rowStyle = {
                                    backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor,
                                };
                                return (
                                    <View style={[styles.listItem, rowStyle]}>
                                        <Text style={styles.text}>{item?.jobName}</Text>
                                        <Text style={styles.text}>
                                            {item?.workOrderCount?.toString().padStart(2, '0')}
                                        </Text>
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
                <View style={{ width: "100%", height: Platform.OS === "android" ? hp(52) : hp(49) }}>
                    <FlatList
                        data={filteredWorkOrders}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 10 }}
                        renderItem={({ item, index }) => (
                            <View style={{
                                backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor,
                                borderRadius: 10,
                                padding: 10,
                                marginBottom: 10,
                                marginHorizontal: 10,
                                borderWidth: 1,
                                borderColor: blueColor
                            }}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <Text style={{ color: '#555', fontSize: 11 }}>VIN</Text>
                                        <Text >{item.vin}</Text>
                                    </View>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <Text style={{ color: '#555', fontSize: 11 }}>Make</Text>
                                        <Text >{item.make}</Text>
                                    </View>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <Text style={{ color: '#555', fontSize: 11 }}>Model</Text>
                                        <Text >{item.model}</Text>
                                    </View>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <Text style={{ color: '#555', fontSize: 11 }}>Date</Text>
                                        <Text >{item.date || '-'}</Text>
                                    </View>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <Text style={{ color: '#555', fontSize: 11 }}>Technician</Text>
                                        <Text >{item.technician}</Text>
                                    </View>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <Text style={{ color: '#555', fontSize: 11 }}>Price</Text>
                                        <Text >${item.price || '-'}</Text>
                                    </View>
                                    {/* <View style={{ position:"absolute",right:-10,bottom:1}}>
                                       
                                        <Text style={[{ fontSize: 15, fontWeight: '700' }, getStatusStyle(item?.status)]}>
                                            {getStatusText(item.status)}
                                        </Text>
                                    </View> */}

                                </View>

                            </View>
                        )}
                    />

                </View>
            ) : activeTab === 'WorkOrders' && viewType === 'list' ? (
                <View style={{ width: "100%", height: Platform.OS === "android" ? hp(53) : hp(59) }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View>
                            {/* Header Row */}
                            <View style={[styles.tableHeaderRow, { backgroundColor: blueColor }]}>
                                <Text style={[styles.tableHeader, { width: wp(50) }]}>VIN</Text>
                                <Text style={[styles.tableHeader, { width: wp(27) }]}>Make</Text>
                                <Text style={[styles.tableHeader, { width: wp(27) }]}>Model</Text>
                                {/* <Text style={[styles.tableHeader, { width: wp(40) }]}>Technician</Text> */}
                                <Text style={[styles.tableHeader, { width: wp(30) }]}>Date</Text>
                                <Text style={[styles.tableHeader, { width: wp(27) }]}>Price</Text>
                                <Text style={[styles.tableHeader, { width: wp(27) }]}>Status</Text>
                            </View>

                            {/* Data Rows with vertical scroll */}
                            <ScrollView style={{ height: Platform.OS === "android" ? hp(42) : hp(39) }} showsVerticalScrollIndicator={false}>
                                {filteredWorkOrders.map((item, index) => {
                                    const rowStyle = { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor };
                                    return (
                                        <View key={index.toString()} style={[styles.listItem, rowStyle, { flexDirection: 'row' }]}>
                                            <Text style={[styles.text, { width: wp(50) }]}>{item?.vin || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(27) }]}>{item?.make || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(27) }]}>{item?.model || '-'}</Text>
                                            {/* <Text style={[styles.text, { width: wp(40) }]}>{item?.technician || '-'}</Text> */}
                                            <Text style={[styles.text, { width: wp(30) }]}>{item?.date || '-'}</Text>
                                            <Text style={[styles.text, { width: wp(27) }]}>{item?.price ? `$${item?.price}` : '-'}</Text>
                                            <View style={[getStatusStyle(item?.status), { width: wp(27), alignItems: "center" }]}>
                                                <Text
                                                    style={{
                                                        color: getStatusText(item?.status) === "Complete" ?
                                                            greenColor : getStatusText(item?.status) === "Pending" ?
                                                                redColor :
                                                                goldColor
                                                    }}>{getStatusText(item?.status)}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            ) : null}

            {/* Sorting Modal */}
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
                            {/* <TouchableOpacity
                                onPress={() => handleSort(sortType === "name" && sortOrder === "asc" ? "desc" : "asc", "name")}
                                style={styles.sortOption}
                            >
                                <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "name" ? blackColor : 'gray' }]}>
                                    Customer Name
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "name" ? blackColor : 'gray' }]}>
                                    {sortType === "name" ? (sortOrder === "asc" ? "A to Z" : "Z to A") : "A to Z"}
                                </Text>
                            </TouchableOpacity> */}

                            <TouchableOpacity
                                onPress={() => handleSort(sortType === "date" && sortOrder === "newest" ? "oldest" : "newest", "date")}
                                style={styles.sortOption}
                            >
                                <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "date" ? blackColor : 'gray' }]}>
                                    Date Created
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "date" ? blackColor : 'gray' }]}>
                                    {sortType === "date" ? (sortOrder === "newest" ? "New to Old" : "Old to New") : "New to Old"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleSort(sortType === "modified" && sortOrder === "latest" ? "oldest" : "latest", "modified")}
                                style={styles.sortOption}
                            >
                                <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "modified" ? blackColor : 'gray' }]}>
                                    Last Modified
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "modified" ? blackColor : 'gray' }]}>
                                    {sortType === "modified" ? (sortOrder === "latest" ? "Latest to Oldest" : "Oldest to Latest") : "Latest to Oldest"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleSort(sortType === "status" && sortOrder === "asc" ? "desc" : "asc", "status")}
                                style={styles.sortOption}
                            >
                                <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "status" ? blackColor : 'gray' }]}>
                                    {activeTab === 'WorkOrders' ? "Work Order" : "Job Status"}
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "status" ? blackColor : 'gray' }]}>
                                    {sortType === "status" ? (sortOrder === "asc" ? "InProgress → Complete" : "Complete → In Progress") : "In Progress → Complete"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
        paddingVertical: spacings.medium,
        marginRight: spacings.large
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
        justifyContent: 'space-between',
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
        justifyContent: 'space-between',
        padding: spacings.large,
        borderBottomWidth: 1,
        borderBottomColor: '#E6E6E6'
    },
    text: {
        color: blackColor,
        fontSize: style.fontSizeNormal1x.fontSize
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
    }
});
