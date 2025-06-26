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

    // const filteredData = searchVin
    //     ? sortedData.filter(item =>
    //         item.vin?.toLowerCase().includes(searchVin.toLowerCase()) ||
    //         item.make?.toLowerCase().includes(searchVin.toLowerCase()) ||
    //         item.model?.toLowerCase().includes(searchVin.toLowerCase()) ||
    //         item.jobName?.toLowerCase().includes(searchVin.toLowerCase()))
    //     : sortedData;

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


    useEffect(() => {
        if (!vehicleData || vehicleData.length === 0) return;
        const vinNumber = route?.params?.vinNumber;
        if (!vinNumber) return;

        const match = vehicleData.find(item => item?.vin?.toLowerCase() === vinNumber.toLowerCase());

        if (match) {
            setSearchVin(vinNumber);
            setShowVinModal(false);
        } else {
            setShowVinModal(true);
        }
    }, [route?.params?.vinNumber, vehicleData]);


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

    useEffect(() => {
        if (technicianType) {
            fetchVehicalInfo(1);
        }
    }, [technicianType]);

    const fetchVehicalInfo = async (pageNumber = 1) => {
        if (!hasMore && pageNumber !== 1) return;

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("auth_token");
            if (!token) {
                console.error("Token not found!");
                return;
            }
            const apiUrl = technicianType === "ifs"
                ? `${API_BASE_URL}/fetchtechVehicleInfo?page=${pageNumber}&userId=${technicianId}`
                : `${API_BASE_URL}/fetchVehicleInfo?page=${pageNumber}&roleType=${technicianType}`;

            const response = await axios.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const { response: resData } = response.data;
            const newVehicles = resData?.vehicles || [];
            console.log("resss", newVehicles);

            // Update vehicle data
            if (pageNumber === 1) {
                setVehicleData(newVehicles);
            } else {
                setVehicleData(prev => [...prev, ...newVehicles]);
            }

            // Handle pagination
            const morePagesAvailable = pageNumber < resData?.totalPages;
            setHasMore(morePagesAvailable);
            setPage(pageNumber);
        } catch (error) {
            console.error("Failed to fetch vehicle info:", error);
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
        } else if (type === "name") {
            sortedData.sort((a, b) => {
                return order === "asc"
                    ? a?.jobName?.localeCompare(b?.jobName)
                    : b?.jobName?.localeCompare(a?.jobName);
            });
        }

        setVehicleData(sortedData);
        setSortOrder(order);
        setSortType(type);
        setModalVisible(false);
    };


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

            {/* Tabs */}
            <View style={[styles.tabContainer, flexDirectionRow]}>
                <TouchableOpacity style={[styles.tab, activeTab === 'workOrder' && styles.activeTab]} onPress={() => setActiveTab('workOrder')}>
                    <Text style={[styles.tabText, { color: activeTab === 'workOrder' ? whiteColor : blackColor }]}>Work Order</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'partnerOrder' && styles.activeTab]} onPress={() => setActiveTab('partnerOrder')}>
                    <Text style={[styles.tabText, { color: activeTab === 'partnerOrder' ? whiteColor : blackColor }]}>W.O With Partner</Text>
                </TouchableOpacity>
            </View>

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
                        <Text style={[styles.tableHeaderText, { width: wp(35) }]}>Date</Text>
                        {activeTab === 'partnerOrder' && (
                            <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Partner</Text>
                        )}
                        <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Cost Estimate</Text>

                    </View>

                    <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(69) : hp(56) : isIOSAndTablet ? hp(67) : hp(51) }}>
                        <FlatList
                            data={filteredData}
                            keyExtractor={(item, index) => index.toString()}
                            showsVerticalScrollIndicator={false}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            renderItem={({ item, index }) => {
                                return (
                                    <Pressable
                                        style={[
                                            styles.tableRow,
                                            flexDirectionRow,
                                            { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor },
                                        ]}
                                        onPress={() => navigation.navigate("VehicleDetailsScreen", {
                                            vehicleId: item.id,
                                            from: activeTab === "partnerOrder" ? "partner" : "workOrder"
                                        })}

                                    >
                                        {/* <Text style={[styles.tableText, { width: wp(30), paddingLeft: spacings.small }]}>{item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}</Text> */}
                                        <Text style={[styles.tableText, { width: wp(50) }]}>{item?.vin}</Text>
                                        <Text style={[styles.tableText, { width: wp(35) }]}>{item?.make}</Text>
                                        <Text style={[styles.tableText, { width: wp(35) }]}>{item?.model}</Text>
                                        <Text style={[styles.tableText, { width: wp(35) }]}> {new Date(item?.createdAt).toLocaleDateString("en-US", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                        </Text>
                                        {activeTab === 'partnerOrder' && (
                                            <Text style={[styles.tableText, { width: wp(25) }]}>
                                                {item?.assignedTechnicians
                                                    ?.filter(tech => tech?.id !== technicianId)
                                                    ?.map(tech => {
                                                        const firstName = tech?.firstName || '';
                                                        const lastName = tech?.lastName || '';

                                                        const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

                                                        return `${capitalize(firstName)} ${capitalize(lastName)}`.trim();
                                                    })
                                                    .join(', ') || '—'}
                                            </Text>
                                        )}

                                        <Text style={[styles.tableText, { width: wp(15) }]}>
                                            ${Array.isArray(item?.jobDescription) && item?.jobDescription?.length > 0
                                                ? item?.jobDescription?.reduce((total, job) => total + Number(job?.cost || 0), 0)
                                                : '0'}
                                        </Text>
                                    </Pressable>
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
                            onEndReachedThreshold={0.5}
                        />
                    </View>
                </View>
            </ScrollView>}

            {viewType === "grid" && <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(69) : hp(63) : isIOSAndTablet ? hp(67) : hp(58) }}>
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
                                    <Text style={{ color: '#555', fontSize: 11 }}>Date</Text>
                                    <Text >{new Date(item?.createdAt).toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric"
                                    })}
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
                                <View style={{ width: '48%', marginBottom: 10 }}>
                                    <Text style={{ color: '#555', fontSize: 11 }}>Cost Estimate</Text>
                                    <Text >${Array.isArray(item?.jobDescription) && item?.jobDescription?.length > 0
                                        ? item?.jobDescription?.reduce((total, job) => total + Number(job?.cost || 0), 0)
                                        : '0'}
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

                            {/* <TouchableOpacity
                                onPress={() => handleSort(
                                    sortType === "name" && sortOrder === "asc" ? "desc" : "asc",
                                    "name"
                                )}
                                style={styles.sortOption}
                            >
                                <Text style={[styles.sortText, { fontWeight: style.fontWeightThin?.fontWeight || '400', color: sortType === "name" ? blackColor : 'gray' }]}>
                                    Job Name
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "name" ? blackColor : 'gray' }]}>
                                    {sortType === "name" ? (sortOrder === "asc" ? "A to Z" : "Z to A") : "A to Z"}
                                </Text>
                            </TouchableOpacity> */}

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
                        <TouchableOpacity style={styles.vinModalClose} onPress={() => setShowVinModal(false)}>
                            <Ionicons name="close-circle-sharp" size={40} color={blackColor} />
                        </TouchableOpacity>

                        <Text style={styles.vinModalSubtitle}>
                            This vehicle is not found in the assigned work orders.
                        </Text>
                        <Text style={styles.vinModalTitle}>
                            Do you still want to add this in the Ron’s Audi?
                        </Text>
                        <Text style={styles.vinModalNote}>NOTE : Admin will be notified !</Text>

                        <View style={styles.vinModalButtons}>
                            <TouchableOpacity onPress={() => setShowVinModal(false)} style={styles.vinButtonNo}>
                                <Text style={{ color: "#252837" }}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    // 👇 Handle YES logic here (e.g., add to list or navigate)
                                    navigation.navigate("WorkOrderScreenTwo", {
                                        vinNumber: route?.params?.vinNumber
                                    })
                                    setShowVinModal(false);
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

});

export default VinListScreen;
