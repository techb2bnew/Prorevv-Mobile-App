import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, Platform, Dimensions, Modal, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { whiteColor, lightGrayColor, blueColor, redColor, goldColor, greenColor, verylightGrayColor, grayColor, blackColor, orangeColor, mediumGray } from '../constans/Color'
import Header from '../componets/Header';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SORT_IMAGE } from '../assests/images';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

// const workOrderData = [
//     { vin: '1HGCM82633A004352', make: 'AUDI', status: 'Complete' },
//     { vin: '1N4AL11D75C109151', make: 'RAM', status: 'Pending' },
//     { vin: '1GYS4HEF7BR279657', make: 'Nissan', status: 'Complete' },
//     { vin: 'WP0ZZZ99ZTS392124', make: 'Porsche', status: 'Complete' },
//     { vin: 'WDBUF56X88B123456', make: 'Mercedes', status: 'Complete' },
//     { vin: 'WBA8D9C52HK477369', make: 'BMW', status: 'In Progress' },
//     { vin: '1G6KD57Y66U123456', make: 'Cadillac', status: 'Complete' },
//     { vin: '1FAHP2E81DG123456', make: 'Ford', status: 'Complete' },
//     { vin: '1G6KD57Y66U123457', make: 'Cadillac', status: 'Complete' },
//     { vin: 'SAJWA4DC8DM123456', make: 'Jaguar', status: 'Complete' },
// ];

// const partnerOrderData = [
//     { vin: '1FAHP2E81DG123456', make: 'Ford', status: 'Complete', partner: 'John Doe' },
//     { vin: 'SAJWA4DC8DM123456', make: 'Jaguar', status: 'Pending', partner: 'Jane Smith' },
// ];
const workOrderData = [
    { vin: '1HGCM82633A004352', make: 'AUDI', status: 'Complete', model: 'A4', date: '2024-06-01', technician: 'Ravi', price: '₹12,000' },
    { vin: '1N4AL11D75C109151', make: 'RAM', status: 'In Progress', model: '1500', date: '2024-06-05', technician: 'Amit', price: '₹8,500' },
    { vin: '1GYS4HEF7BR279657', make: 'Nissan', status: 'Complete', model: 'Altima', date: '2024-06-12', technician: 'Sunil', price: '₹9,000' },
    { vin: 'WP0ZZZ99ZTS392124', make: 'Porsche', status: 'Complete', model: 'Cayenne', date: '2024-06-20', technician: 'Raj', price: '₹15,000' },
    { vin: 'WDBUF56X88B123456', make: 'Mercedes', status: 'Complete', model: 'C-Class', date: '2024-06-21', technician: 'Deepak', price: '₹13,500' },
    { vin: 'WBA8D9C52HK477369', make: 'BMW', status: 'In Progress', model: '320i', date: '2024-06-25', technician: 'Karan', price: '₹10,500' },
    { vin: '1G6KD57Y66U123456', make: 'Cadillac', status: 'Complete', model: 'CTS', date: '2024-06-26', technician: 'Nikhil', price: '₹14,000' },
    { vin: '1FAHP2E81DG123456', make: 'Ford', status: 'Complete', model: 'Fusion', date: '2024-06-28', technician: 'Ajay', price: '₹9,700' },
    { vin: '1G6KD57Y66U123457', make: 'Cadillac', status: 'Complete', model: 'Escalade', date: '2024-06-30', technician: 'Suresh', price: '₹16,200' },
    { vin: 'SAJWA4DC8DM123456', make: 'Jaguar', status: 'Complete', model: 'XF', date: '2024-07-01', technician: 'Rohan', price: '₹17,000' },
];

const partnerOrderData = [
    {
        vin: '1FAHP2E81DG123456',
        make: 'Ford',
        status: 'Complete',
        partner: 'John Doe',
        model: 'Fusion',
        date: '2024-07-02',
        technician: 'Ajay',
        price: '₹9,700',
    },
    {
        vin: 'SAJWA4DC8DM123456',
        make: 'Jaguar',
        status: 'In Progress',
        partner: 'Jane Smith',
        model: 'XF',
        date: '2024-07-03',
        technician: 'Rohan',
        price: '₹17,000',
    },
];

const getStatusStyle = (status) => {
    switch (status) {
        case 'Complete':
            return { backgroundColor: '#e6ffe6', borderColor: greenColor, textColor: greenColor };
        case 'Pending':
            return { backgroundColor: '#ffe6e6', borderColor: redColor, textColor: redColor };
        case 'In Progress':
            return { backgroundColor: '#fff5e6', borderColor: goldColor, textColor: goldColor };
        default:
            return { backgroundColor: '#eee', borderColor: '#ccc', textColor: '#000' };
    }
};

const VinListScreen = ({ navigation, route }) => {
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const [activeTab, setActiveTab] = useState('workOrder');
    const [isModalVisible, setModalVisible] = useState(false);
    const [sortType, setSortType] = useState("");
    const [searchVin, setSearchVin] = useState('');
    const [unmatchedVin, setUnmatchedVin] = useState(null); // Store unmatched VIN
    const [showVinModal, setShowVinModal] = useState(false); // Control modal
    const baseData = activeTab === 'workOrder' ? workOrderData : partnerOrderData;

    const filteredData = searchVin
        ? baseData.filter(item => item.vin.toLowerCase().includes(searchVin.toLowerCase()))
        : baseData;

    useEffect(() => {
        const { vinNumber } = route.params || {};
        if (vinNumber) {
            const match = baseData.find(item => item.vin.toLowerCase() === vinNumber.toLowerCase());
            if (match) {
                setSearchVin(vinNumber); // Show matched item
            } else {
                setUnmatchedVin(vinNumber); // Store for modal
                setShowVinModal(true);
            }
        }
    }, [route.params?.vinNumber]);

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const handleSort = (order, type) => {
        // let sortedData = [...jobHistoryData];

        // if (type === "name") {
        //     sortedData.sort((a, b) => {
        //         return order === "asc"
        //             ? a?.customer?.firstName.localeCompare(b?.customer?.firstName)
        //             : b?.customer?.firstName.localeCompare(a?.customer?.firstName);
        //     });
        // } else if (type === "date") {
        //     sortedData.sort((a, b) => {
        //         return order === "oldest"
        //             ? new Date(a?.createdAt) - new Date(b?.createdAt)
        //             : new Date(b?.createdAt) - new Date(a?.createdAt);
        //     });
        // } else if (type === "modified") {
        //     sortedData.sort((a, b) => {
        //         return order === "oldest"
        //             ? new Date(a?.updatedAt) - new Date(b?.updatedAt)
        //             : new Date(b?.updatedAt) - new Date(a?.updatedAt);
        //     });
        // } else if (type === "status") {
        //     sortedData.sort((a, b) => {
        //         const statusA = a?.jobStatus ? "Complete" : "InProgress";
        //         const statusB = b?.jobStatus ? "Complete" : "InProgress";

        //         return order === "asc"
        //             ? statusA.localeCompare(statusB) // InProgress → Complete
        //             : statusB.localeCompare(statusA); // Complete → InProgress
        //     });
        // }

        // // ✅ Pehle se select kiya hua item sabse upar rahe
        // const selectedItem = sortedData.find(item => item.sortType === type);
        // sortedData = sortedData.filter(item => item.sortType !== type);
        // if (selectedItem) sortedData.unshift(selectedItem);

        // setjobHistoryData(sortedData);
        // setSortOrder(order);
        // setSortType(type);
        setModalVisible(false);
    };

    return (
        <View style={{ width: wp(100), height: hp(100), backgroundColor: whiteColor }}>
            {/* Header */}
            <Header title={"Vin List"} onBack={() => navigation.navigate("Home")} />

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
                        placeholder="Scan/Search Job"
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
                <TouchableOpacity style={[styles.filterButton, { top: isTablet ? Platform.OS === "android" ? hp(1.2) : hp(1) : hp(2.7), right: isTablet ? Platform.OS === "android" ? 10 : -100 : 10 }]}
                    onPress={toggleModal}
                >
                    <Image source={SORT_IMAGE} resizeMode='contain' style={{ width: isTablet ? wp(7) : wp(10), height: hp(3) }} />
                </TouchableOpacity>
            </View>
            {/* Table Header */}
            {/* <View style={[styles.tableHeader, flexDirectionRow]}>
                <Text style={[styles.tableHeaderText, { width: wp(48) }]}>VIN No.</Text>
                <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Make</Text>
                {activeTab === 'partnerOrder' && (
                    <Text style={[styles.tableHeaderText, { width: wp(20) }]}>Partner</Text>
                )}
                {activeTab === 'workOrder' && (
                    <Text style={[styles.tableHeaderText, { width: wp(20) }]}>Status</Text>)}
            </View>


            <View style={{ width: "100%", height: Platform.OS === "android" ? hp(56) : hp(51) }}>
                <FlatList
                    data={filteredData}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                        const { backgroundColor, borderColor, textColor } = getStatusStyle(item.status);
                        return (
                            <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor }, flexDirectionRow]}>
                                <Text style={[styles.tableText, { width: wp(48) }]}>{item.vin}</Text>
                                <Text style={[styles.tableText, { width: wp(25) }]}>{item.make}</Text>
                                {activeTab === 'partnerOrder' && (
                                    <Text style={[styles.tableText, { width: wp(20) }]}>{item.partner}</Text>
                                )}
                                {activeTab === 'workOrder' && (
                                    <View style={[styles.statusPill, { backgroundColor, borderColor }]}>
                                        <Text style={{ color: textColor, fontSize: 12 }}>{item.status}</Text>
                                    </View>)}
                            </View>
                        );
                    }}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No results found</Text>
                        </View>
                    )}
                />
            </View> */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    <View style={[styles.tableHeader, flexDirectionRow]}>
                        <Text style={[styles.tableHeaderText, { width: wp(50) }]}>VIN No.</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Make</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Model</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(28) }]}>Date</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(30) }]}>Technician</Text>
                        <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Price</Text>
                        {activeTab === 'partnerOrder' && (
                            <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Partner</Text>
                        )}
                        {activeTab === 'workOrder' && (
                            <Text style={[styles.tableHeaderText, { width: wp(25) }]}>Status</Text>
                        )}
                    </View>

                    <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(69) : hp(56) : hp(51) }}>
                        <FlatList
                            data={filteredData}
                            keyExtractor={(item, index) => index.toString()}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }) => {
                                const { backgroundColor, borderColor, textColor } = getStatusStyle(item.status);
                                return (
                                    <View
                                        style={[
                                            styles.tableRow,
                                            flexDirectionRow,
                                            { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor },
                                        ]}
                                    >
                                        <Text style={[styles.tableText, { width: wp(50) }]}>{item.vin}</Text>
                                        <Text style={[styles.tableText, { width: wp(25) }]}>{item.make}</Text>
                                        <Text style={[styles.tableText, { width: wp(25) }]}>{item.model}</Text>
                                        <Text style={[styles.tableText, { width: wp(33) }]}>{item.date}</Text>
                                        <Text style={[styles.tableText, { width: wp(25) }]}>{item.technician}</Text>
                                        <Text style={[styles.tableText, { width: wp(25) }]}>{item.price}</Text>
                                        {activeTab === 'workOrder' && (
                                            <View style={[styles.statusPill, { backgroundColor, borderColor }]}>
                                                <Text style={{ color: textColor, fontSize: 12 }}>{item.status}</Text>
                                            </View>
                                        )}
                                        {activeTab === 'partnerOrder' && (
                                            <Text style={[styles.tableText, { width: wp(20) }]}>{item.partner}</Text>
                                        )}
                                    </View>
                                );
                            }}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No results found</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </ScrollView>


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
                                    Work Order
                                </Text>
                                <Text style={[styles.sortText, { color: sortType === "status" ? blackColor : 'gray' }]}>
                                    {sortType === "status" ? (sortOrder === "asc" ? "In Progress → Complete" : "Complete → In Progress") : "In Progress → Complete"}
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
        fontSize: style.fontSizeNormal2x.fontSize,
        color: blueColor,
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
