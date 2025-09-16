import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions, TouchableWithoutFeedback, ScrollView, Alert, Linking, PermissionsAndroid } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { blackColor, whiteColor, grayColor, mediumGray, orangeColor, greenColor, redColor, lightGrayColor, blueColor, lightBlueColor, verylightGrayColor, goldColor, lightGrayOpacityColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { spacings, style } from '../constans/Fonts';
import DatePicker from "react-native-date-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../componets/Header';
import { API_BASE_URL } from '../constans/Constants';
import Share from 'react-native-share';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-simple-toast';
import RNFS from 'react-native-fs';

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
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMoreCustomer, setHasMoreCustomer] = useState(true);
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [dateSortOrder, setDateSortOrder] = useState(null); // 'asc' | 'desc' | null
    const [nameSortOrder, setNameSortOrder] = useState(null);
    const [paidDates, setPaidDates] = useState({});
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState(null);
    const [exportingId, setExportingId] = useState(null);
    const [isPaidDatePickerOpen, setIsPaidDatePickerOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false); // for top refresh
    const [loadingMore, setLoadingMore] = useState(false); // for bottom loader


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

    const handleExport = async (invoiceUrl, itemId) => {
        if (!invoiceUrl) {
            console.log("No Link", "Invoice URL not available.");
            return;
        }
        setExportingId(itemId);
        try {
            const urlParts = invoiceUrl.split('/');
            const fileName = urlParts[urlParts.length - 1]; // e.g., INV-2025-5310.pdf
            const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

            // Step 1: Download the file
            const downloadResult = await RNFS.downloadFile({
                fromUrl: invoiceUrl,
                toFile: filePath,
            }).promise;

            if (downloadResult.statusCode === 200) {
                console.log("✅ PDF downloaded at:", filePath);

                // Step 2: Share
                await Share.open({
                    url: `file://${filePath}`,
                    type: 'application/pdf',
                    title: 'Invoice PDF',
                });
            } else {
                console.log("❌ PDF Download Failed");
            }

        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setExportingId(null); // Reset loading
        }
    };


    const getStatusStyle = (status) => {
        if (status === true || status === "paid") return [styles.statusPill, styles.statusCompleted];
        if (status === false || status === "unPaid") return [styles.statusPill, styles.statusInProgress];
    };

    const getStatusText = (status) => {
        if (status === true || status === "paid") return 'Paid';
        if (status === false || status === "unPaid") return 'UnPaid';
    };

    const filteredVehicles = workOrdersRawData?.filter(vehicle => {
        // console.log(`🚗 Vehicle:`, vehicle); // 👈 Log each vehicle object

        // --- Status Filter ---
        const statusMatch =
            invoiceStatusFilter === 'all' ||
            (invoiceStatusFilter.toLowerCase() === 'paid' && (vehicle?.status === true || vehicle?.status === 'paid')) ||
            (invoiceStatusFilter.toLowerCase() === 'unpaid' && (vehicle?.status === false || vehicle?.status === 'unPaid'));


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

    const openPaidDatePicker = (invoiceId, invoiceNumber) => {
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNumber(invoiceNumber)
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
                // console.log("newww::::::::::", newInvoices);
                const filteredInvoices = newInvoices.filter(item => item.print !== "print");

                console.log("filteredInvoices", filteredInvoices);

                setWorkOrdersRawData(prev =>
                    page === 1 ? filteredInvoices : [...prev, ...filteredInvoices]
                );
                setPageNumber(page + 1);
                setHasMoreCustomer(filteredInvoices?.length > 0);
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

    const updateInvoiceStatus = async ({ invoiceNumber, status, paidDate }) => {
        const token = await AsyncStorage.getItem("auth_token");
        try {
            const params = new URLSearchParams();
            params.append('invoiceNumber', invoiceNumber);
            params.append('status', status);
            params.append('paidDate', paidDate);

            const response = await axios.post(
                `${API_BASE_URL}/updateInvoiceStatus`,
                params.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log('✅ Invoice updated successfully:', response.data);
            fetchInvoices(1);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating invoice:', error?.response?.data || error.message);
            throw error;
        }
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

            {viewType === 'list' && <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(82.5) : hp(77) : isIOSAndTablet ? hp(82) : hp(73), paddingBottom: selectedVehicles?.length > 0 ? hp(8) : 0 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* Header Row */}
                        <View style={[styles.tableHeaderRow, { backgroundColor: blueColor }]}>
                            {/* <Text style={[styles.tableHeader, { width: wp(15) }]}>Select</Text> */}
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(20) : wp(35) }]}>Invoice Number</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(20) :wp(35) }]}>Customer Name</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(20) :wp(35) }]}>Job Name</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(20) :wp(35) }]}>Grand Total</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(24) :wp(45) }]}>Invoice Created Date</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(20) :wp(40) }]}>Add Paid Date</Text>
                            <Text style={[styles.tableHeader, { width: isTablet ? wp(20) :wp(25) }]}>Action</Text>

                            <Text style={[styles.tableHeader, { paddingRight: isTablet ? 30 : 0, width: isIOSAndTablet ? wp(8) : wp(30) }]}>Status</Text>

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
                                        <Pressable key={index.toString()} style={[styles.listItem, rowStyle, { flexDirection: 'row', alignItems: "center" }]}
                                            onPress={() => navigation.navigate("InvoiceDetailsScreen", { invoiceId: item?.invoiceNumber })}
                                        >
                                            {/* <TouchableOpacity onPress={() => toggleSelection(item)} style={{ width: wp(15) }}>
                                                <MaterialIcons
                                                    name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                                    size={25}
                                                    color={isSelected ? blueColor : 'gray'}
                                                />
                                            </TouchableOpacity> */}
                                            <Text style={[styles.text, { width: isTablet ? wp(20) :wp(35) }]}>{item?.invoiceNumber || '-'}</Text>
                                            <Text style={[styles.text, { width: isTablet ? wp(20) :wp(35) }]}>{item?.customer?.fullName || '-'}</Text>
                                            <Text style={[styles.text, { width: isTablet ? wp(20) :wp(35) }]}>{item?.job?.jobName || '-'}</Text>


                                            <Text style={[styles.text, { width: isTablet ? wp(20) :wp(35) }]}>
                                                {item?.grandTotal ? `$${item.grandTotal}` : '-'}
                                            </Text>

                                            <Text style={[styles.text, { width: isTablet ? wp(20) :wp(45) }]}> {item?.createdAt
                                                ? new Date(item?.createdAt).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "-"}</Text>
                                            {/* <TouchableOpacity
                                                onPress={() => openPaidDatePicker(item?.id, item?.invoiceNumber)}
                                                style={{
                                                    width: wp(36),
                                                    paddingRight: spacings.xxxxLarge
                                                }}
                                            >
                                                <Text style={{
                                                    color: blackColor, fontSize: 14,
                                                    padding: 4,
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
                                            </TouchableOpacity> */}
                                            {item?.paidDate ? (
                                                <View
                                                    style={{
                                                        width: isTablet ? wp(24) :wp(30),
                                                        paddingRight: spacings.xLarge
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: blackColor,
                                                            fontSize: 14,
                                                            padding: 4,
                                                            borderWidth: 1,
                                                            borderColor: blueColor,
                                                            borderRadius: 8,
                                                            backgroundColor: lightGrayOpacityColor,
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {new Date(item?.paidDate).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => openPaidDatePicker(item?.id, item?.invoiceNumber)}
                                                    style={{
                                                        width:isTablet ? wp(24) : wp(30),
                                                        paddingRight: spacings.xxxxLarge
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: blackColor,
                                                            fontSize: 14,
                                                            padding: 4,
                                                            borderWidth: 1,
                                                            borderColor: blueColor,
                                                            borderRadius: 8,
                                                            backgroundColor: whiteColor,
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {paidDates[item.id]
                                                            ? new Date(paidDates[item.id]).toLocaleDateString("en-US", {
                                                                month: "long",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })
                                                            : "Select Date"}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity
                                                onPress={() => handleExport(item?.pdfLink, item?.id)}
                                                style={{
                                                    width:isTablet ? wp(20) : wp(30),
                                                    paddingHorizontal:isTablet ? wp(2) : wp(12)
                                                }}
                                            >
                                                {exportingId === item?.id ? (
                                                    <ActivityIndicator size="small" color={blueColor} />
                                                ) : (
                                                    <Feather name="download" size={20} color={blackColor} />
                                                )}
                                            </TouchableOpacity>

                                            <View style={[getStatusStyle(item?.status), alignJustifyCenter, { height: isTablet ? hp(2) : hp(4) }]}>
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
                    const formattedDate = date.toISOString();

                    setPaidDates((prev) => ({
                        ...prev,
                        [selectedInvoiceId]: date,
                    }));
                    setIsPaidDatePickerOpen(false);

                    updateInvoiceStatus({
                        invoiceNumber: selectedInvoiceNumber,
                        status: 'paid',
                        paidDate: formattedDate,
                    });
                }}
                onCancel={() => setIsPaidDatePickerOpen(false)}
            />

            {viewType === 'grid' && (
                <View style={{ width: "100%", height: Platform.OS === "android" ? isTablet ? hp(82.5) : hp(79) : isIOSAndTablet ? hp(82) : hp(73), paddingBottom: selectedVehicles?.length > 0 ? hp(8) : 0}}>
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
                                    onPress={() => navigation.navigate("InvoiceDetailsScreen", { invoiceId: item?.invoiceNumber })}
                                >
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                        <TouchableOpacity
                                            // onPress={() => toggleSelection(item)} 
                                            onPress={() => handleExport(item?.pdfLink, item?.id)}
                                            style={{ position: "absolute", right: -5, top: -10, zIndex: 999 }}>

                                            {exportingId === item?.id ? (
                                                <ActivityIndicator size="small" color={blueColor} />
                                            ) : (
                                                <Feather name="download" size={20} color={blackColor} />
                                            )}
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
                                            {item?.paidDate ? (
                                                <View
                                                    style={{
                                                        width: "auto",
                                                        paddingRight: spacings.xxxxLarge
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: blackColor,
                                                            fontSize: 14,
                                                            padding: 4,
                                                            borderWidth: 1,
                                                            borderColor: blueColor,
                                                            borderRadius: 8,
                                                            backgroundColor: lightGrayOpacityColor,
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {new Date(item?.paidDate).toLocaleDateString("en-US", {
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => openPaidDatePicker(item?.id, item?.invoiceNumber)}
                                                    style={{
                                                        width: "100%",
                                                        paddingRight: spacings.xxxxLarge
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: blackColor,
                                                            fontSize: 14,
                                                            padding: 4,
                                                            borderWidth: 1,
                                                            borderColor: blueColor,
                                                            borderRadius: 8,
                                                            backgroundColor: whiteColor,
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {paidDates[item.id]
                                                            ? new Date(paidDates[item.id]).toLocaleDateString("en-US", {
                                                                month: "long",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })
                                                            : "Select Date"}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View style={[{ width: '48%', marginBottom: 9 }]}>
                                            <Text style={{ color: '#555', fontSize: 10 }}>Status</Text>
                                            <Text
                                                style={{
                                                    color: getStatusText(item?.status) === "Paid" ?
                                                        greenColor : getStatusText(item?.status) === "UnPaid" ?
                                                            goldColor :
                                                            redColor,
                                                }}>
                                                {getStatusText(item?.status)}
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



            {/* {selectedVehicles.length > 0 && <View style={{ position: "absolute", bottom: 0, backgroundColor: whiteColor, width: wp(100), flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacings.large }}>
                <CustomButton
                    title={"Download"}
                    onPress={handleExport}
                    style={{ width: "100%", marginBottom: 0 }}
                />
            </View>} */}

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
