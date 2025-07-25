import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Dimensions, StyleSheet, Pressable, FlatList } from 'react-native';
import { blackColor, blueColor, lightGrayColor, mediumGray, whiteColor, redColor, greenColor, lightBlueColor } from '../constans/Color';
import Header from '../componets/Header';
import { spacings, style } from '../constans/Fonts';
import { API_BASE_URL } from '../constans/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const InvoiceDetailsScreen = ({ route, navigation }) => {
    const { invoiceId } = route.params;
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOsAndTablet = Platform.OS === "ios" && isTablet;
    const [loading, setLoading] = useState(false);
    const [invoiceDetail, setInvoiceDetail] = useState();

    useEffect(() => {
        fetchInvoiceDetail();
    }, [invoiceId]);

    const fetchInvoiceDetail = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("auth_token");
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            };
            const response = await fetch(`${API_BASE_URL}/fetchSingleInvoice?invoiceId=${invoiceId}`, {
                method: 'GET',
                headers,
            });
            const data = await response.json();
            console.log("invoicedetails::", data?.response?.invoice);

            setInvoiceDetail(data?.response?.invoice);
        } catch (error) {
            console.error('Failed to fetch invoice detail:', error);
        } finally {
            setLoading(false);
        }
    }


    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    };


    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={blueColor} />
            </View>
        );
    }

    if (!invoiceDetail) {
        return (
            <View style={styles.loaderContainer}>
                <Text>No invoice found.</Text>
            </View>
        );
    }
    const capitalize = (text) => {
        if (!text || typeof text !== 'string') return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    const renderItem = ({ item, index }) => (
        <Pressable
            onPress={() => navigation.navigate('VehicleDetailsScreen', { vehicleId: item.id })}
            style={[styles.row, { backgroundColor: index % 2 === 0 ? '#f4f6ff' : whiteColor },]}
        >
            <Text style={[styles.cell, { width: isIOsAndTablet ? "40%" : "44%", paddingLeft: spacings.small2x }]}>{item?.vin || 'N/A'}</Text>
            <Text style={[styles.cell, { color: item.vehicleStatus ? 'green' : 'red', width: isIOsAndTablet ? "43%" : "38%", }]}>
                {item?.vehicleStatus ? 'Complete' : 'In Progress'}
            </Text>
            <Pressable onPress={() => navigation.navigate("VehicleDetailsScreen", {
                vehicleId: item?.id,
            })}>
                <Text style={styles.viewText}>View</Text>
            </Pressable>
        </Pressable>
    );
    return (
        <View style={{ flex: 1, backgroundColor: whiteColor }}>
            <Header title={"Invoice History"} />
            <View style={[styles.card, { borderColor: blueColor, borderWidth: 1, margin: 10 }]}>
                <View style={styles.rowItem}>
                    <View style={styles.leftCol}>
                        <Text style={styles.label}>Invoice Number</Text>
                        <Text style={styles.value}>{invoiceDetail?.invoiceNumber}</Text>
                    </View>
                    <View style={styles.rightCol}>
                        <Text style={styles.label}>Customer</Text>
                        <Text style={styles.value}>{capitalize(invoiceDetail?.customer?.fullName)}</Text>
                    </View>
                </View>
                <View style={styles.rowItem}>
                    <View style={styles.leftCol}>
                        <Text style={styles.label}>Job Title</Text>
                        <Text style={styles.value}>{capitalize(invoiceDetail?.job?.jobName)}</Text>
                    </View>
                    <View style={styles.rightCol}>
                        <Text style={styles.label}>Grand Total</Text>
                        <Text style={styles.value}>{invoiceDetail?.grandTotal
                            ? `${invoiceDetail.grandTotal}`
                            : "-"}
                        </Text>
                    </View>
                </View>
                <View style={styles.rowItem}>
                    <View style={styles.leftCol}>
                        <Text style={styles.label}>Created Date</Text>
                        <Text style={styles.value}>{formatDate(invoiceDetail?.createdAt)}</Text>
                    </View>
                    <View style={styles.rightCol}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={{ color: invoiceDetail?.status === 'Paid' ? greenColor : redColor }}>{capitalize(invoiceDetail?.status)}</Text>
                    </View>
                </View>
            </View>

            {invoiceDetail?.job?.vehicles?.length > 0 ? (
                <>
                    <View style={[styles.row, styles.headerRow]}>
                        <Text style={[styles.cell, styles.headerText, { width: "40%" }]}>VIN</Text>
                        <Text style={[styles.cell, styles.headerText, { width: "40%" }]}>Status</Text>
                        <Text style={[styles.cell, styles.headerText, { width: "20%" }]}>Action</Text>
                    </View>

                    <FlatList
                        data={invoiceDetail?.job?.vehicles || []}
                        keyExtractor={(item) => item?.id?.toString()}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </>
            ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#999' }}>No Vehicle Found in this Job</Text>
                </View>
            )}
        </View>
    );
};

export default InvoiceDetailsScreen;
const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: whiteColor,
    },

    card: {
        backgroundColor: lightBlueColor,
        padding: 10,
        borderRadius: 12,
        marginBottom: 15,
    },
    rowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    leftCol: {
        width: '48%',
    },

    rightCol: {
        width: '48%',
    },

    label: {
        fontSize: style.fontSizeSmall.fontSize,
        color: '#666'
    },
    headerRow: {
        borderBottomWidth: 1,
        borderColor: '#ccc',
        backgroundColor: blueColor
    },
    row: {
        flexDirection: 'row',
        paddingVertical: spacings.large,
    },
    cell: {
        textAlign: 'center',
        fontSize: style.fontSizeNormal.fontSize
    },
    headerText: {
        fontWeight: style.fontWeightThin1x.fontWeight,
        fontSize: style.fontSizeNormal1x.fontSize,
        color: whiteColor
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
    },
    viewText: {
        marginLeft: spacings.small2x,
        fontSize: style.fontSizeSmall1x.fontSize,
        color: blackColor,
        borderColor: blackColor,
        borderWidth: 1,
        padding: 4,
        borderRadius: 2,
    },

});
