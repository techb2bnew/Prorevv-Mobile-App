import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, Platform, Dimensions, Modal, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { whiteColor, lightGrayColor, blueColor, redColor, goldColor, greenColor, verylightGrayColor, grayColor, blackColor, orangeColor, mediumGray } from '../constans/Color'
import Header from '../componets/Header';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SORT_IMAGE } from '../assests/images';
import Feather from 'react-native-vector-icons/Feather';
import { API_BASE_URL } from '../constans/Constants';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DatePicker from "react-native-date-picker";


const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;


const VinListScreen = ({ navigation, route }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;
    const [activeTab, setActiveTab] = useState('workOrder');
    const [isModalVisible, setModalVisible] = useState(false);
    const [sortType, setSortType] = useState("");
    const [searchVin, setSearchVin] = useState('');
    const [showVinModal, setShowVinModal] = useState(false); // Control modal
    const [vehicleData, setVehicleData] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [technicianType, setTechnicianType] = useState();
    const [technicianId, setTechnicianId] = useState();
    const [viewType, setViewType] = useState('list');
    const [refreshing, setRefreshing] = useState(false);
    const [sortOrder, setSortOrder] = useState("newest");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
    const [selectedJobName, setSelectedJobName] = useState("");

    const sortedData = React.useMemo(() => {
        let data = [...vehicleData];

        if (sortType === "date") {
            data.sort((a, b) => sortOrder === "oldest"
                ? new Date(a.createdAt) - new Date(b.createdAt)
                : new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortType === "modified") {
            data.sort((a, b) => sortOrder === "oldest"
                ? new Date(a.updatedAt) - new Date(b.updatedAt)
                : new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        return data;
    }, [vehicleData, sortType, sortOrder]);

    useFocusEffect(
        React.useCallback(() => {
            const loadSelectedJob = async () => {
                const savedJob = await AsyncStorage.getItem("current_Job");
                console.log("savedJob", savedJob);

                if (savedJob) {
                    const parsed = JSON.parse(savedJob);
                    setSelectedJobName(parsed.jobName);

                }
            };

            loadSelectedJob();

            // cleanup if needed
            return () => { };
        }, [])
    );

    const filteredData = sortedData.filter(item => {
        // Search filter
        const matchesSearch = searchVin
            ? (
                item.vin?.toLowerCase().includes(searchVin.toLowerCase()) ||
                item.make?.toLowerCase().includes(searchVin.toLowerCase()) ||
                item.model?.toLowerCase().includes(searchVin.toLowerCase()) ||
                item.jobName?.toLowerCase().includes(searchVin.toLowerCase())
            )
            : true;

        if (!matchesSearch) return false;

        const hasPartner = (item?.assignedTechnicians || []).some(tech => tech?.id !== technicianId);

        if (activeTab === 'partnerOrder') {
            // Show only those with partners
            return hasPartner;
        }

        // For 'workOrder' tab, show everything
        return true;
    });

    // useEffect(() => {
    //     const today = new Date();
    //     const lastMonth = new Date();
    //     lastMonth.setMonth(today.getMonth() - 1); // 👈 1 month before today
    //     setStartDate(lastMonth);
    // }, []);
    useFocusEffect(
        useCallback(() => {
            const today = new Date();

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

    useEffect(() => {
        const vinNumber = route?.params?.vinNumber;

        // 🔒 Only run logic if BOTH are available
        if (!vinNumber || !vehicleData || vehicleData.length === 0) return;

        console.log("vin::::", vinNumber, vehicleData);

        const match = vehicleData.find(item => item?.vin?.toLowerCase() === vinNumber.toLowerCase());

        if (match) {
            setSearchVin(vinNumber);
            setShowVinModal(false);
        } else {
            setTimeout(() => {
                setShowVinModal(true);
            }, 500);
        }
    }, [vehicleData, route?.params?.vinNumber]);

    useFocusEffect(
        useCallback(() => {
            const getTechnicianDetail = async () => {
                try {
                    const storedData = await AsyncStorage.getItem('userDeatils');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        const type = parsedData?.types;
                        setTechnicianType(type);
                        setTechnicianId(parsedData.id);

                    }
                } catch (error) {
                    console.error("Error fetching stored user:", error);
                }
            };

            getTechnicianDetail();
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            if (technicianType) {
                fetchVehicalInfo(1);
            }
        }, [technicianType])
    );

    const fetchVehicalInfo = async (pageNumber = 1) => {
        if (!hasMore && pageNumber !== 1) return;

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }
            console.log(technicianId);

            const apiUrl = technicianType === "manager"
                ? `${API_BASE_URL}/fetchVehicalInfo?page=${pageNumber}&roleType=${technicianType}`
                : technicianType === "ifs"
                    ? `${API_BASE_URL}/fetchtechVehicleInfo?page=${pageNumber}&userId=${technicianId}`
                    : `${API_BASE_URL}/fetchVehicalInfo?page=${pageNumber}&roleType=${technicianType}&userId=${technicianId}`;

            const response = await axios.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const { response: resData } = response?.data?.jobs || response.data?.response;

            const newVehicles = response?.data?.jobs?.vehicles || response.data?.response?.vehicles || [];

            // Update vehicle data
            if (pageNumber === 1) {
                setVehicleData(newVehicles);
            } else {
                setVehicleData(prev => [...prev, ...newVehicles]);
            }

            // Handle pagination
            const morePagesAvailable = pageNumber < response?.data?.jobs?.totalPages || response?.data?.response?.totalPages; // Check if currentPage < totalPages
            console.log("More Pages Available:", morePagesAvailable);

            // Update the `hasMore` state based on the response
            setHasMore(morePagesAvailable);

            // Update the current page number
            setPage(pageNumber);
        } catch (error) {
            console.error("Failed to fetch vehicle info:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredData = async (start, end) => {
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

            console.log("Start:", formattedStartDate, "End:", formattedEndDate, technicianId);
            let bodyData;

            if (technicianType === 'manager') {
                bodyData = `startDate=${formattedStartDate}&endDate=${formattedEndDate}&roleType=${technicianType}`;
            } else {
                bodyData = `startDate=${formattedStartDate}&endDate=${formattedEndDate}&roleType=${technicianType}&technicianId=${technicianId}`;
            }
            const response = await axios.post(
                `${API_BASE_URL}/vehicleFilter`,
                bodyData,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("response?.data", response?.data?.vehicles);

            const vehicles = response?.data?.vehicles?.updatedVehicles || [];
            setVehicleData(vehicles);

        } catch (error) {
            console.error("Error fetching filtered data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchVehicalInfo(1); // Page reset to 1
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const handleSort = (order, type) => {
        let sortedData = [...vehicleData];

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
        } else if (type === "startDate") {
            sortedData.sort((a, b) => {
                return order === "oldest"
                    ? new Date(a?.startDate) - new Date(b?.startDate)
                    : new Date(b?.startDate) - new Date(a?.startDate);
            });
        } else if (type === "endDate") {
            sortedData.sort((a, b) => {
                return order === "oldest"
                    ? new Date(a?.endDate) - new Date(b?.endDate)
                    : new Date(b?.endDate) - new Date(a?.endDate);
            });
        } else if (type === "name") {
            sortedData.sort((a, b) => {
                return order === "asc"
                    ? a?.jobName?.localeCompare(b?.jobName)
                    : b?.jobName?.localeCompare(a?.jobName);
            });
        } else if (type === "status") {
            sortedData.sort((a, b) => {
                const statusA = a?.jobStatus ? "Complete" : "InProgress";
                const statusB = b?.jobStatus ? "Complete" : "InProgress";
                return order === "asc"
                    ? statusA.localeCompare(statusB)
                    : statusB.localeCompare(statusA);
            });
        }

        setVehicleData(sortedData);
        setSortOrder(order);
        setSortType(type);
        setModalVisible(false);
    };

    // const getStatusStyle = (status) => {
    //     if (status === true || status === "completed") return [styles.statusPill, styles.statusCompleted];
    //     if (status === false || status === "inprogress") return [styles.statusPill, styles.statusInProgress];
    // };

    // const getStatusText = (status) => {
    //     if (status === true || status === "completed") return 'Complete';
    //     if (status === false || status === "inprogress") return 'In Progress';
    // };

    return (
        <View style={{ width: wp(100), height: hp(100), backgroundColor: whiteColor }}>
            {/* Header */}
            <Header title={"Vin List"} onBack={() => navigation.navigate("Home")} />
            <View style={{
                flexDirection: 'row',
                position: "absolute",
                top: Platform.OS === "android" ? isTablet ? hp(1) : 10 : isTablet ? 20 : 13,
                right: 10,
                zIndex: 10
            }}>
                <TouchableOpacity
                    onPress={() => setViewType('list')}
                    style={[styles.tabButton, {
                        backgroundColor: viewType === 'list' ? blueColor : whiteColor,
                        width: isTablet ? wp(8) : wp(12),
                        height: hp(4.5),
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 5,
                        marginRight: 10,

                    }]}>
                    <Ionicons name="list" size={isTablet ? 35 : 20} color={viewType === 'list' ? whiteColor : blackColor} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setViewType('grid')}
                    style={[styles.tabButton, {
                        backgroundColor: viewType === 'grid' ? blueColor : whiteColor,
                        width: isTablet ? wp(8) : wp(12),
                        height: hp(4.5),
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 5,
                    }]}>
                    <Ionicons name="grid-sharp" size={isTablet ? 35 : 20} color={viewType === 'grid' ? whiteColor : blackColor} />
                </TouchableOpacity>

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
                    // maximumDate={new Date()} // ⛔ prevents selecting future dates
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
                    // minimumDate={startDate}       // ✅ StartDate se pehle ki date disable
                    // maximumDate={new Date()} // ⛔ prevents selecting future dates
                    onConfirm={(date) => {
                        const newEndDate = date;
                        setEndDate(newEndDate);
                        setIsEndPickerOpen(false);
                        fetchFilteredData(startDate, newEndDate, activeTab); // Use new end date
                    }}
                    onCancel={() => setIsEndPickerOpen(false)}
                />

            </View>
            {/* Tabs */}
            {/* <View style={[styles.tabContainer, flexDirectionRow]}>
                <TouchableOpacity style={[styles.tab, activeTab === 'workOrder' && styles.activeTab, alignJustifyCenter]} onPress={() => setActiveTab('workOrder')}>
                    <Text style={[styles.tabText, { color: activeTab === 'workOrder' ? whiteColor : blackColor, textAlign: "center" }]}>Work Order</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'partnerOrder' && styles.activeTab, alignJustifyCenter]}
                // onPress={() => setActiveTab('partnerOrder')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'partnerOrder' ? whiteColor : blackColor, fontSize: 11, textAlign: "center" }]}>W.O With Partner(coming soon)</Text>
                </TouchableOpacity>
            </View> */}

            {/* Search */}
            <View style={[flexDirectionRow]}>
                <View style={[styles.searchTextInput, flexDirectionRow, { height: isTablet ? hp(4) : hp(5.5), width: isTablet ? wp(87) : wp(75) }]}>
                    <TextInput
                        placeholder="Search Vin Make Model/Scan"
                        placeholderTextColor={grayColor}
                        style={[styles.input]}
                        value={searchVin}
                        onChangeText={text => setSearchVin(text)}
                    />
                    <TouchableOpacity style={styles.iconContainer} onPress={() => {
                        navigation.navigate("ScannerScreen", {
                            from: "VinList"
                        })
                    }}>
                        <AntDesign name="scan1" size={24} color="#252837" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.filterButton, { top: Platform.OS === "android" ? isTablet ? hp(1.2) : hp(2.8) : isIOSAndTablet ? hp(1.5) : hp(2.7), right: Platform.OS === "android" ? isTablet ? 10 : 10 : isIOSAndTablet ? 10 : 10 }]}
                    onPress={toggleModal}
                >
                    <Image source={SORT_IMAGE} resizeMode='contain' style={{ width: isTablet ? wp(7) : wp(10), height: hp(3) }} />
                </TouchableOpacity>
            </View>

            {viewType === "list" && <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    <View style={[styles.tableHeader, flexDirectionRow]}>
                        {/* <Text style={[styles.tableHeaderText, { width: wp(30) }]}>JobName</Text> */}
                        <Text style={[styles.tableHeaderText, { width: wp(50) }]}>VIN No.</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(35) }]}>Make</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(35) }]}>Model</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(35) }]}>Start Date</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(35) }]}>End Date</Text>

                        {technicianType === "manager" && (
                            <Text style={[styles.tableHeaderText, { width: wp(50) }]}>Assigned Technicians</Text>
                        )}
                        {/* <Text style={[styles.tableHeaderText, { width: wp(35) }]}>Status</Text> */}

                        {/* <Text style={[styles.tableHeaderText, { width: wp(45) }]}>Cost Estimate</Text> */}
                        <Text style={[styles.tableHeaderText, { width: wp(45), }]}>Action</Text>

                    </View>

                    <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(68.5) : hp(55) : isIOSAndTablet ? hp(67) : hp(52) }}>
                        <FlatList
                            data={filteredData}
                            keyExtractor={(item, index) => index.toString()}
                            showsVerticalScrollIndicator={false}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            renderItem={({ item, index }) => {
                                return (
                                    <View
                                        style={[
                                            styles.tableRow,
                                            flexDirectionRow,
                                            { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor },
                                        ]}
                                    >
                                        {/* <Text style={[styles.tableText, { width: wp(30), paddingLeft: spacings.small }]}>{item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}</Text> */}
                                        <Text style={[styles.tableText, { width: wp(50) }]}>{item?.vin}</Text>
                                        <Text style={[styles.tableText, { width: wp(35) }]}>{item?.make}</Text>
                                        <Text style={[styles.tableText, { width: wp(35) }]}>{item?.model}</Text>
                                        <Text style={[styles.tableText, { width: wp(35) }]}>
                                            {item?.startDate
                                                ? new Date(item.startDate).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}
                                        </Text>

                                        <Text style={[styles.tableText, { width: wp(35) }]}>
                                            {item?.endDate
                                                ? new Date(item.endDate).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}
                                        </Text>
                                        {technicianType === "manager" && (
                                            <Text style={[styles.tableText, { width: wp(50), paddingRight: 10 }]}>
                                                {item?.assignedTechnicians
                                                    // ?.filter(tech => tech?.id !== technicianId)
                                                    ?.map(tech => {
                                                        const firstName = tech?.firstName || '';
                                                        const lastName = tech?.lastName || '';

                                                        const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

                                                        return `${capitalize(firstName)} ${capitalize(lastName)}`.trim();
                                                    })
                                                    .join(', ') || '—'}
                                            </Text>
                                        )}

                                        {/* <View style={[getStatusStyle(item?.vehicleStatus), alignJustifyCenter, { height: hp(4), }]}>
                                            <Text
                                                style={{
                                                    color: getStatusText(item?.vehicleStatus) === "Complete" ?
                                                        greenColor : getStatusText(item?.vehicleStatus) === "inprogress" ?
                                                            redColor :
                                                            goldColor
                                                }}>
                                                {getStatusText(item?.vehicleStatus)}
                                            </Text>
                                        </View> */}
                                        <View style={{ flexDirection: "row", alignItems: "center", width: wp(45) }} >
                                            <Pressable onPress={() => navigation.navigate("VehicleDetailsScreen", {
                                                vehicleId: item.id,
                                                from: activeTab === "partnerOrder" ? "partner" : "workOrder"
                                            })}>
                                                <Text style={styles.viewText}>View</Text>
                                            </Pressable>
                                            {item.vehicleStatus !== true && (
                                                <Pressable
                                                    onPress={() =>
                                                        navigation.navigate("WorkOrderScreenTwo", {
                                                            vehicleId: item.id,
                                                        })
                                                    }>
                                                    <Text style={styles.viewText}>Edit</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    </View>
                                );
                            }}
                            ListFooterComponent={() =>
                                loading ? (
                                    <View style={{ paddingVertical: 10, alignItems: "center", width: wp(130), height: hp(50), justifyContent: "center" }}>
                                        <ActivityIndicator size="small" color="#0000ff" />
                                    </View>
                                ) : null
                            }
                            ListEmptyComponent={() => {
                                if (loading) return null;
                                return (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>No Vehicle List found</Text>
                                    </View>
                                );
                            }}
                            onEndReached={() => {
                                if (!loading && hasMore) {
                                    console.log("Fetching page:", page + 1);  // Log the page number being fetched
                                    fetchVehicalInfo(page + 1);  // Fetch the next page
                                } else {
                                    console.log("No more pages to fetch.");
                                }
                            }}
                            onEndReachedThreshold={0.5}
                        />
                    </View>
                </View>
            </ScrollView>}

            {viewType === "grid" && <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(72) : hp(61) : isIOSAndTablet ? hp(70) : hp(56) }}>
                <FlatList
                    data={filteredData}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 10 }}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
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
                            onPress={() => navigation.navigate("VehicleDetailsScreen", {
                                vehicleId: item.id,
                                from: activeTab === "partnerOrder" ? "partner" : "workOrder"
                            })}
                        >
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {item.vehicleStatus !== true && (<Pressable
                                    onPress={() => navigation.navigate("WorkOrderScreenTwo", {
                                        vehicleId: item.id,
                                    })}
                                    style={{ position: "absolute", right: -5, top: -10, zIndex: 999 }}>
                                    {/* <Text style={styles.viewText}>Edit</Text> */}
                                    <AntDesign name="edit" size={20} color={blackColor} />

                                </Pressable>)}
                                <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>JobName</Text>
                                    <Text>{item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}</Text>
                                </View>
                                <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>VIN</Text>
                                    <Text >{item?.vin}</Text>
                                </View>
                                <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>Make</Text>
                                    <Text >{item?.make}</Text>
                                </View>
                                <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>Model</Text>
                                    <Text >{item?.model}</Text>
                                </View>
                                <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>Start Date</Text>
                                    <Text style={[styles.tableText, { width: wp(35) }]}>
                                        {item?.startDate
                                            ? new Date(item.startDate).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                            : "-"}
                                    </Text>
                                </View>
                                <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>End Date</Text>
                                    <Text style={[styles.tableText, { width: wp(35) }]}>
                                        {item?.endDate
                                            ? new Date(item.endDate).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                            : "-"}
                                    </Text>
                                </View>
                                {activeTab === 'partnerOrder' && (<View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>Partner</Text>
                                    <Text >{item?.assignedTechnicians
                                        ?.filter(tech => tech?.id !== technicianId)
                                        ?.map(tech => {
                                            const firstName = tech?.firstName || '';
                                            const lastName = tech?.lastName || '';

                                            const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

                                            return `${capitalize(firstName)} ${capitalize(lastName)}`.trim();
                                        })
                                        .join(', ') || '—'}
                                    </Text>
                                </View>)}
                                {/* <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>Cost Estimate</Text>
                                    <Text >${Array.isArray(item?.jobDescription) && item?.jobDescription?.length > 0
                                        ? item?.jobDescription?.reduce((total, job) => total + Number(job?.cost || 0), 0)
                                        : '0'}
                                    </Text>
                                </View> */}
                            </View>

                        </Pressable>
                    )}
                    onEndReached={() => {
                        if (!loading && hasMore) {
                            console.log("Fetching page:", page + 1);  // Log the page number being fetched
                            fetchVehicalInfo(page + 1);  // Fetch the next page
                        } else {
                            console.log("No more pages to fetch.");
                        }
                    }}
                    onEndReachedThreshold={0.5}
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

            </View>}


            {isModalVisible && <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={toggleModal}>
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
                            <TouchableOpacity
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
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleSort(
                                    sortType === "startDate" && sortOrder === "newest" ? "oldest" : "newest",
                                    "startDate"
                                )}
                                style={styles.sortOption}
                            >
                                <Text style={[styles.sortText, { color: sortType === "startDate" ? blackColor : 'gray' }]}>
                                    Start Date
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "startDate" ? blackColor : 'gray' }]}>
                                    {sortType === "startDate" ? (sortOrder === "newest" ? "New to Old" : "Old to New") : "New to Old"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleSort(
                                    sortType === "endDate" && sortOrder === "newest" ? "oldest" : "newest",
                                    "endDate"
                                )}
                                style={styles.sortOption}
                            >
                                <Text style={[styles.sortText, { color: sortType === "endDate" ? blackColor : 'gray' }]}>
                                    End Date
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "endDate" ? blackColor : 'gray' }]}>
                                    {sortType === "endDate" ? (sortOrder === "newest" ? "New to Old" : "Old to New") : "New to Old"}
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
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>}


            {showVinModal && <Modal visible={showVinModal} transparent animationType="fade">
                <View style={styles.vinModalOverlay}>
                    <View style={styles.vinModalContainer}>
                        <TouchableOpacity style={styles.vinModalClose} onPress={() => {
                            setShowVinModal(false);
                            setTimeout(() => {
                                navigation.setParams({ vinNumber: undefined });
                            }, 300);
                        }}>
                            <Ionicons name="close-circle-sharp" size={40} color={blackColor} />
                        </TouchableOpacity>

                        <Text style={styles.vinModalSubtitle}>
                            This vehicle is not found in the assigned work orders.
                        </Text>
                        <Text style={styles.vinModalTitle}>
                            Do you still want to add this in the {selectedJobName}?
                        </Text>
                        <Text style={styles.vinModalNote}>NOTE : Admin will be notified !</Text>

                        <View style={styles.vinModalButtons}>
                            <TouchableOpacity onPress={() => {
                                setShowVinModal(false);
                                setTimeout(() => {
                                    navigation.setParams({ vinNumber: undefined });
                                }, 300);
                            }} style={styles.vinButtonNo}>
                                <Text style={{ color: "#252837" }}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    // 👇 Handle YES logic here (e.g., add to list or navigate)
                                    navigation.navigate("WorkOrderScreenTwo", {
                                        vinNumber: route?.params?.vinNumber
                                    })
                                    setShowVinModal(false);
                                    setTimeout(() => {
                                        navigation.setParams({ vinNumber: undefined }); // ✅ Clear after navigating
                                    }, 500)
                                }}
                                style={styles.vinButtonYes}
                            >
                                <Text style={{ color: "#fff" }}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>}

        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        marginHorizontal: spacings.large,
        marginTop: spacings.xxxxLarge,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1
    },
    tab: {
        flex: 1,
        padding: spacings.xLarge,
        alignItems: 'center'
    },
    activeTab: {
        backgroundColor: blueColor
    },
    tabText: {
        fontSize: style.fontSizeNormal.fontSize,
        fontWeight: style.fontWeightThin1x.fontWeight
    },
    searchTextInput: {
        backgroundColor: whiteColor,
        borderRadius: 8,
        paddingHorizontal: spacings.xxLarge,
        alignItems: 'center',
        // height: hp(5.5),
        marginVertical: spacings.Large1x,
        borderWidth: 1,
        // width: wp(75),
        marginLeft: spacings.large
    },
    input: {
        flex: 1,
        fontSize: style.fontSizeNormal1x.fontSize,
        color: blackColor,
        alignItems: "center",
        justifyContent: "center"
    },
    iconContainer: {
        paddingLeft: spacings.large,
    },
    filterButton: {
        backgroundColor: blueColor,
        padding: spacings.large,
        borderRadius: 5,
        alignItems: "center",
        position: "absolute",
        zIndex: 999
    },
    tableHeader: {
        padding: spacings.xxLarge,
        backgroundColor: whiteColor,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        backgroundColor: blueColor
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
    tableText: {
        textAlign: 'left'
    },
    statusPill: {
        paddingHorizontal: spacings.large,
        paddingVertical: spacings.small,
        borderRadius: 20,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    modalOverlay: {
        height: hp(100),
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
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
        // borderBottomWidth: 1,
        // borderBottomColor: '#ddd',
    },
    sortText: {
        fontSize: 16,
    },
    closeButton: {
        marginTop: 15,
        paddingVertical: 10,
        width: '100%',
        backgroundColor: orangeColor,
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        color: whiteColor,
        fontWeight: 'bold',
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
    vinModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vinModalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        position: 'relative',
    },
    vinModalClose: {
        position: 'absolute',
        top: -15,
        right: -10,
    },
    vinModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#252837',
        textAlign: 'center',
        marginBottom: 10,
    },
    vinModalSubtitle: {
        fontSize: 15,
        color: '#252837',
        textAlign: 'center',
        marginBottom: 5,
    },
    vinModalNote: {
        color: redColor,
        fontSize: 13,
        marginTop: 5,
        marginBottom: 20,
    },
    vinModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    vinButtonNo: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    vinButtonYes: {
        flex: 1,
        backgroundColor: blueColor,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
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

});

export default VinListScreen;
