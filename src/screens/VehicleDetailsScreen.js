import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Linking, Modal, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { blackColor, whiteColor, grayColor, mediumGray, orangeColor, redColor, greenColor, blueColor, lightBlueColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { spacings, style } from '../constans/Fonts';
import SuccessModal from '../componets/Modal/SuccessModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XCIRCLE_IMAGE } from '../assests/images';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Feather from 'react-native-vector-icons/dist/Feather';
import NetInfo from "@react-native-community/netinfo";
import Header from '../componets/Header';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../constans/Constants';


const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter, justifyContentSpaceEvenly } = BaseStyle;

const VehicleDetailsScreen = ({ navigation, route }) => {
    const { vehicleId, from } = route.params; // Get jobId from navigation params
    const [loading, setLoading] = useState(true);
    const [vehicleDetails, setVehicleDetails] = useState(null); // Initially null
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [technicianType, setTechnicianType] = useState();
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;

    useFocusEffect(
        useCallback(() => {
            const getTechnicianDetail = async () => {
                try {
                    const storedData = await AsyncStorage.getItem('userDeatils');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        // console.log("parsedData:::::", parsedData.types);
                        setTechnicianType(parsedData.types)
                    }
                } catch (error) {
                    console.error("Error fetching stored user:", error);
                }
            };

            getTechnicianDetail();
        }, [])
    );

    const openImageModal = (img) => {
        setSelectedImage(img);
        setImageModalVisible(true);
    };


    const fetchVehileData = async (vehicleId) => {
        try {
            setLoading(true);

            const apiUrl = `${API_BASE_URL}`;
            const token = await AsyncStorage.getItem("auth_token");

            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`${apiUrl}/fetchSingleVehicleInfo?vehicleId=${vehicleId}`, {
                method: "GET", // ✅ FIXED
                headers,
            });

            const contentType = response.headers.get("Content-Type");

            if (response.ok && contentType?.includes("application/json")) {
                const data = await response.json();
                console.log("API Response Data:", data?.vehicle?.vehicle);

                if (data?.vehicle?.vehicle) {
                    setVehicleDetails(data?.vehicle?.vehicle);
                } else {
                    console.error("No vehicle found in API response.");
                }
            } else {
                const rawText = await response.text();
                console.error("Unexpected non-JSON response:", rawText);
            }
        } catch (error) {
            console.error("An error occurred while fetching job data:", error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchVehileData(vehicleId);
    }, [vehicleId]);

    const formatVehicleData = (vehicleDetails) => {
        if (!vehicleDetails) return [];

        let jobDescriptions = vehicleDetails.jobDescription;

        if (typeof jobDescriptions?.[0] === "string") {
            try {
                jobDescriptions = jobDescriptions.map(desc => JSON.parse(desc));
            } catch (error) {
                console.error("Error parsing jobDescription:", error);
                jobDescriptions = [];
            }
        }
        const validJobDescriptions = jobDescriptions?.filter(
            (desc) => desc?.jobDescription?.trim() && desc?.cost?.trim()
        );

        const jobDescriptionTotal = (
            jobDescriptions?.reduce(
                (sum, desc) => sum + (parseFloat(desc.cost) || 0),
                0
            ) || 0
        ).toFixed(2);

        let labourCost = 0;
        let payRate = "N/A";

        if (vehicleDetails) {
            if (technicianType === "single-technician") {
                labourCost = parseFloat(vehicleDetails?.labourCost) || 0;
                payRate = `$${labourCost?.toFixed(2)}`;
            }
            else {
                if (vehicleDetails.simpleFlatRate) {
                    labourCost = parseFloat(vehicleDetails?.simpleFlatRate) || 0;
                    payRate = `$${labourCost?.toFixed(2)}`;
                } else if (vehicleDetails?.amountPercentage) {
                    const percentage = parseFloat(vehicleDetails?.amountPercentage) || 0;
                    labourCost = (jobDescriptionTotal * percentage) / 100;
                    payRate = `${percentage}%`;
                } else if (vehicleDetails?.technicians?.[0]?.amountPercentage) {
                    const percentage = parseFloat(vehicleDetails?.technicians?.[0]?.amountPercentage) || 0;
                    labourCost = (jobDescriptionTotal * percentage) / 100;
                    payRate = `${percentage}%`;
                } else if (vehicleDetails?.technicians?.[0]?.simpleFlatRate) {
                    const percentage = parseFloat(vehicleDetails?.technicians?.[0]?.simpleFlatRate) || 0;
                    labourCost = (jobDescriptionTotal * percentage) / 100;
                    payRate = `$${labourCost?.toFixed(2)}`;
                }
            }
        }

        const totalCost = parseFloat(jobDescriptionTotal);

        return [
           
            {
                groupTitle: "Vehicle Info",
                data: [
                    { label: "Job Name", value: vehicleDetails?.jobName.charAt(0).toUpperCase() + vehicleDetails?.jobName.slice(1) },
                    { label: "Vin Manually", value: vehicleDetails?.vin },
                    { label: "Vehicle Descriptor", value: vehicleDetails?.vehicleDescriptor },
                    { label: "Make", value: vehicleDetails?.make },
                    { label: "Manufacture Name", value: vehicleDetails?.manufacturerName },
                    { label: "Model", value: vehicleDetails?.model },
                    { label: "Model Year", value: vehicleDetails?.modelYear?.toString() },
                    { label: "Vehicle Type", value: (vehicleDetails?.vehicleType && vehicleDetails?.vehicleType !== "null") ? vehicleDetails?.vehicleType : null },
                    {
                        label: "Color",
                        value: vehicleDetails?.color
                            ? vehicleDetails?.color.charAt(0).toUpperCase() + vehicleDetails.color.slice(1)
                            : null, // yahan "N/A" ki jagah null diya taki filter me remove ho jaye
                    },
                ].filter(item => !!item?.value && item.value.toString().trim() !== "")
            },

            ...(validJobDescriptions?.length ? [{
                groupTitle: "Job Description",
                data: [
                    {
                        label: "Work Descriptions",
                        value: validJobDescriptions
                            .map((desc) => `• ${desc?.jobDescription.charAt(0).toUpperCase() + desc?.jobDescription.slice(1)}`)
                            .join('\n'),
                        isMultiLine: true
                    },
                    {
                        label: "Cost",
                        value: validJobDescriptions
                            .map((desc) => `• $${(parseFloat(desc?.cost) || 0).toFixed(2)}`)
                            .join('\n'),
                        isMultiLine: true
                    },
                    {
                        label: "Sub Total",
                        value: `$${jobDescriptionTotal}`,
                        isTotal: true
                    },
                    ...(totalCost > 0
                        ? [{
                            label: "Total Cost",
                            value: `$${totalCost?.toFixed(2)}`
                        }]
                        : []),
                ]
            }] : []),
            {
                groupTitle: "Pay Info",
                data: [
                    { label: "Date", value: vehicleDetails?.createdAt ? new Date(vehicleDetails?.createdAt).toLocaleDateString() : "N/A" },
                    { label: "Status", value: vehicleDetails?.vehicleStatus === false ? "In-Progress" : "Completed" },
                ]
            },
            ...(vehicleDetails?.notes?.trim()
                ? [{
                    groupTitle: "Job Notes",
                    data: [
                        { label: "Notes", value: vehicleDetails?.notes }
                    ]
                }]
                : [])
            ,
            ...(vehicleDetails?.images?.length
                ? [{
                    groupTitle: "Images",
                    data: [{ label: "Attachments", images: vehicleDetails?.images }]
                }]
                : [])
        ];
    };

    return (
        <View style={{ flex: 1 }}>
            <Header title={"Vehicle Detail"} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={[flex, styles.container]}>
                    <View >
                        {loading ? (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", padding: 10 }}>
                                {Array.from({ length: 13 }).map((_, index) => (
                                    <View key={index} style={{ width: "48%", marginBottom: 10 }}>
                                        <SkeletonPlaceholder borderRadius={5}>
                                            <SkeletonPlaceholder.Item flexDirection="column" alignItems="flex-start">
                                                {/* <SkeletonPlaceholder.Item width={80} height={15} /> */}
                                                <SkeletonPlaceholder.Item width={120} height={20} marginTop={5} />
                                                <SkeletonPlaceholder.Item width={80} height={15} marginTop={10} />
                                                <SkeletonPlaceholder.Item width={100} height={20} marginTop={5} />
                                            </SkeletonPlaceholder.Item>
                                        </SkeletonPlaceholder>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            formatVehicleData(vehicleDetails).map((section, sectionIndex) => (
                                <View key={sectionIndex} style={styles.detailContainer}>
                                    <FlatList
                                        data={section.data}
                                        renderItem={({ item }) => (
                                            <View style={[styles.detailItem, (item.label === "Notes") && { width: "100%" }]}>
                                                <Text style={styles.label}>{item.label}</Text>
                                                {item.isPhoneNumber ? (
                                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.value}`)} style={[flexDirectionRow, { alignItems: "center" }]}>
                                                        <Feather name="phone-outgoing" size={15} color={blueColor} />
                                                        <Text style={[styles.value, { color: blueColor, textDecorationLine: "underline", marginLeft: 5 }]}>{item.value}</Text>
                                                    </TouchableOpacity>
                                                ) : item.label === "Email" ? (
                                                    <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.value}`)} style={[flexDirectionRow, { alignItems: "center" }]}>
                                                        <Text style={[styles.value, { color: blueColor, textDecorationLine: "underline" }]}>{item.value}</Text>
                                                    </TouchableOpacity>
                                                ) : item.images ? (
                                                    <ScrollView horizontal style={{ marginRight: 10, width: wp(90) }}>
                                                        {item.images.map((img, index) => (
                                                            <TouchableOpacity key={index} onPress={() => openImageModal(img)}>
                                                                <Image
                                                                    source={{ uri: img }}
                                                                    style={{ width: 50, height: 50, margin: 5, borderRadius: 5 }}
                                                                    resizeMode="cover"
                                                                />
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                ) :
                                                    item.label === "Job Descriptions" || item.label === "Job Costs" ? (
                                                        <Text style={[styles.value, { marginVertical: 4, lineHeight: 20 }]}>
                                                            {item.value}
                                                        </Text>
                                                    )
                                                        : (
                                                            <Text
                                                                style={[
                                                                    styles.value,
                                                                    item.label === "Current Job Status" &&
                                                                    (item.value === "Complete"
                                                                        ? { color: greenColor }
                                                                        : { color: redColor })
                                                                ]}
                                                            >
                                                                {item.value}
                                                            </Text>
                                                        )}
                                            </View>
                                        )}
                                        keyExtractor={(item, index) => `${sectionIndex}-${index}`}
                                        numColumns={2}
                                        scrollEnabled={false}
                                    />
                                </View>
                            ))
                        )}
                    </View>

                    {/* Image Modal */}
                    <Modal visible={imageModalVisible} transparent={true} animationType="fade">
                        <View style={styles.modalContainer}>
                            <TouchableOpacity onPress={() => setImageModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close-circle-sharp" size={35} color={whiteColor} />
                            </TouchableOpacity>
                            {selectedImage && (
                                <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
                            )}
                        </View>
                    </Modal>


                </View>
            </ScrollView>
        </View>
    )
}

export default VehicleDetailsScreen

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor,
        padding: spacings.xxLarge,
    },

    detailContainer: {
        backgroundColor: lightBlueColor,
        paddingHorizontal: spacings.xxxLarge,
        paddingVertical: spacings.large,
        borderRadius: 10,
        marginBottom: 10
    },
    detailItem: {
        paddingVertical: spacings.normalx,
        marginRight: 5,
        width: wp(42)
    },
    // label: {
    //   fontSize: style.fontSizeNormal.fontSize,
    //   fontWeight: style.fontWeightMedium.fontWeight,
    //   color: blackColor,
    // },
    // value: {
    //   fontSize: style.fontSizeNormal.fontSize,
    //   color: blackColor,
    // },
    label: {
        fontSize: style.fontSizeSmall.fontSize,
        color: '#666'
    },
    value: {
        fontSize: style.fontSizeNormal.fontSize,
        color: blackColor,
        fontWeight: style.fontWeightThin1x.fontWeight,
    },
    warningText: {
        color: greenColor,
    },
    completeButton: {
        backgroundColor: blueColor,
        paddingVertical: spacings.xLarge,
        borderRadius: 15,
        marginTop: 20,
        width: "100%",
        alignSelf: "center"
    },
    completeButtonText: {
        fontSize: style.fontSizeNormal1x.fontSize,
        color: whiteColor,
        fontWeight: style.fontWeightMedium.fontWeight,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullImage: {
        width: "90%",
        height: "80%",
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
    },
})