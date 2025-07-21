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
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [technicianType, setTechnicianType] = useState();
    const [technicianId, setTechnicianId] = useState();
    const [technicianName, setTechnicianName] = useState();


    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const getTechnicianDetail = async () => {
                try {
                    const storedData = await AsyncStorage.getItem('userDeatils');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        setTechnicianType(parsedData.types);
                        setTechnicianId(parsedData.id);
                        const storedName = await AsyncStorage.getItem('technicianName');
                        if (storedName) {
                            setTechnicianName(storedName);
                            console.log("parsedData:::::", storedName);
                        }
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
            // console.log(vehicleId);

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


    const handelCompleteWorkOrder = async (vehicleId) => {
        try {
            const apiUrl = `${API_BASE_URL}/updateVehicleStatus`;
            const token = await AsyncStorage.getItem("auth_token");

            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${token}`,
            };

            const body = new URLSearchParams();
            body.append("vehicleId", vehicleId);
            body.append("vehicleStatus", "true");
            body.append("completedBy", technicianName);

            const response = await fetch(apiUrl, {
                method: "POST",
                headers,
                body: body.toString(),
            });

            const data = await response.json();
            console.log("API Response Data:", data);

            if (response.ok) {
                setSuccessModalVisible(true)
                // ✅ Remove from pending list after successful sync
                // let pendingJobs = await AsyncStorage.getItem("pendingCompleteJobs");
                // pendingJobs = pendingJobs ? JSON.parse(pendingJobs) : [];
                // pendingJobs = pendingJobs.filter((id) => id !== jobId);
                // await AsyncStorage.setItem("pendingCompleteJobs", JSON.stringify(pendingJobs));
            } else {
                console.error("Error updating job status:", data.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error updating job status:", error);
        }

    };

    const capitalize = (str) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const formatVehicleData = (vehicleDetails) => {
        if (!vehicleDetails) return [];

        let jobDescriptions = vehicleDetails.jobDescription;

        // Case: If it's array of strings (like ["Work", "Cg"])
        if (Array.isArray(jobDescriptions) && typeof jobDescriptions[0] === "string") {
            jobDescriptions = jobDescriptions.map(str => ({
                jobDescription: str,
                cost: "" // No cost available
            }));
        }

        // Optional: if jobDescriptions is stored as stringified JSON array
        if (typeof jobDescriptions === "string") {
            try {
                jobDescriptions = JSON.parse(jobDescriptions);
            } catch (error) {
                console.error("Invalid jobDescription string format:", error);
                jobDescriptions = [];
            }
        }

        // Filter non-empty descriptions (cost may be empty)
        const validJobDescriptions = jobDescriptions?.filter(
            (desc) => desc?.jobDescription?.trim()
        );

        // let partnerTechnician = null;
        // if (vehicleDetails?.assignedTechnicians?.length > 1 && technicianId) {
        //     partnerTechnician = vehicleDetails.assignedTechnicians.find(t => t.id !== technicianId);
        // }

        // console.log("partnerTechnician", partnerTechnician);

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
                ].filter(item => {
                    const val = item?.value;
                    return (
                        val !== null &&
                        val !== undefined &&
                        val !== "" &&
                        val !== "null" &&
                        val !== "undefined" &&
                        val.toString().trim() !== ""
                    );
                })
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
                    ...(technicianType === "single-technician"
                        ? [{
                            label: "Labour Cost",
                            value: `$${vehicleDetails?.labourCost}`,
                        }]
                        : []),
                ]
            }] : []),
            {
                groupTitle: "Pay Info",
                data: [
                    {
                        label: "Start Date",
                        value: vehicleDetails?.startDate
                            ? new Date(vehicleDetails?.startDate).toLocaleDateString("en-US", {
                                month: "long",    // e.g., June
                                day: "numeric",   // e.g., 23
                                year: "numeric",  // e.g., 2025
                            })
                            : "-"
                    },
                    {
                        label: "End Date",
                        value: vehicleDetails?.endDate
                            ? new Date(vehicleDetails?.endDate).toLocaleDateString("en-US", {
                                month: "long",    // e.g., June
                                day: "numeric",   // e.g., 23
                                year: "numeric",  // e.g., 2025
                            })
                            : "-"
                    },
                    { label: "Status", value: vehicleDetails?.vehicleStatus === false ? "In-Progress" : "Completed" },
                    ...(technicianType === "manager"
                        ? [{
                            label: "Completed By",
                            value: capitalize(vehicleDetails?.completedBy),
                        }]
                        : [])
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
                : []),
            ...(technicianType === "manager" && vehicleDetails?.assignedTechnicians?.length
                ? [{
                    groupTitle: "Assigned Technicians",
                    data: vehicleDetails.assignedTechnicians.flatMap((tech, index) => {
                        const name = `${capitalize(tech.firstName)} ${capitalize(tech.lastName)}`;
                        const techTypeRaw = tech?.techType?.toLowerCase();
                        const shouldShowType = techTypeRaw?.includes('r') || techTypeRaw?.includes('rb');
                        const techType = shouldShowType ? ` (${tech.techType?.toUpperCase()})` : '';
                        const flatRate = tech?.VehicleTechnician?.techFlatRate;
                        const rRate = tech?.VehicleTechnician?.rRate;

                        let payInfo = '';
                        if (flatRate) {
                            payInfo = `Flat Rate: $${flatRate}`;
                        } else if (rRate) {
                            payInfo = `R Rate: $${rRate}`;
                        } else {
                            payInfo = 'N/A';
                        }

                        return [
                            {
                                label: `Technician ${index + 1}`,
                                value: `${name}${techType}`,
                            },
                            {
                                label: `Technician ${index + 1}`,
                                value: payInfo,
                            }
                        ];
                    })
                }]
                : []),


            // ...(from === 'partner' && partnerTechnician
            //     ? [{
            //         groupTitle: "Partner Technician",
            //         data: [
            //             {
            //                 label: "Partner Technician",
            //                 value: `${capitalize(partnerTechnician.firstName)} ${capitalize(partnerTechnician.lastName)}`
            //             },
            //             ...(partnerTechnician.email ? [{
            //                 label: "Partner Technician Email",
            //                 value: partnerTechnician.email
            //             }] : []),
            //             ...(partnerTechnician.mobile ? [{
            //                 label: "Partner Technician Phone",
            //                 value: partnerTechnician.mobile,
            //                 isPhoneNumber: true
            //             }] : [])
            //         ]
            //     }]
            //     : [])

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
                                                ) : item.label === "Email" || item.label === "Partner Technician Email" ? (
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
                                                    item.label === "Work Descriptions" || item.label === "Job Costs" ? (
                                                        <Text style={[styles.value, { marginVertical: 4, lineHeight: 20, width: technicianType === "single-technician" ? "100%" : wp(80) }]}>
                                                            {item.value}
                                                        </Text>
                                                    )
                                                        : (
                                                            <Text
                                                                style={[
                                                                    styles.value,
                                                                    item.label === "Status" &&
                                                                    (item.value === "Completed"
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

                    {!loading && vehicleDetails?.vehicleStatus === false && (
                        <Pressable
                            style={[styles.completeButton, alignItemsCenter]}
                            onPress={() => handelCompleteWorkOrder(vehicleId, setSuccessModalVisible)}
                        >
                            <Text style={styles.completeButtonText}>Complete This Work Order</Text>
                        </Pressable>
                    )}
                    {successModalVisible && <SuccessModal
                        visible={successModalVisible}
                        onClose={() => setSuccessModalVisible(false)}
                        headingText={"Congratulations"}
                        buttonText={"Ok"}
                        text={"You've successfully completed this work order."}
                        onPressContinue={() => {
                            setSuccessModalVisible(false);
                            navigation.goBack();
                            // navigation.navigate("ReportsScreen", { vehicleCompleted: true });
                        }}
                    />}
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