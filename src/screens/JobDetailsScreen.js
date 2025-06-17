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

const JobDetailsScreen = ({ navigation, route }) => {
  const { jobId } = route.params; // Get jobId from navigation params
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState(null); // Initially null
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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


  const fetchJobData = async (jobId) => {
    try {
      setLoading(true); // Start loading

      const netState = await NetInfo.fetch();
      const isConnected = netState.isConnected;

      if (isConnected) {

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
          console.log("API Response Data:", data.jobs);

          // ✅ State update
          setJobDetails(data.jobs);
        } else {
          console.error("Error fetching job data:", data.error || "Unknown error");
        }
      } else {

        // ✅ Get stored job list from local storage
        const storedJobs = await AsyncStorage.getItem("jobHistoryData");
        if (storedJobs) {
          const jobArray = JSON.parse(storedJobs);

          // ✅ Find the specific job with matching jobId
          const matchingJob = jobArray.find((job) => job.id === jobId);

          if (matchingJob) {
            setJobDetails(matchingJob); // ✅ Set state with matched job
          } else {
            console.error("Job not found in local storage.");
          }
        } else {
          console.error("No job history found in local storage.");
        }
      }
    } catch (error) {
      console.error("An error occurred while fetching job data:", error);
    } finally {
      setLoading(false); // Stop loading after API call
    }
  };

  useEffect(() => {
    fetchJobData(jobId);
  }, [jobId]);

  const handelCompleteJob = async (jobId, setSuccessModalVisible) => {

    try {
      const netState = await NetInfo.fetch();
      const isConnected = netState.isConnected;

      if (isConnected) {
        await completeJobAPI(jobId);
      } else {
        let pendingJobs = await AsyncStorage.getItem("pendingCompleteJobs");
        pendingJobs = pendingJobs ? JSON.parse(pendingJobs) : [];
        if (!pendingJobs.includes(jobId)) {
          pendingJobs.push(jobId);
          await AsyncStorage.setItem("pendingCompleteJobs", JSON.stringify(pendingJobs));
        }
      }

      // ✅ Fix: Ensure setSuccessModalVisible is a function
      if (typeof setSuccessModalVisible === "function") {
        setSuccessModalVisible(true);
      }
    } catch (error) {
      console.error("Error handling job completion:", error);
    }
  };

  // ✅ API Call to Update Job Status
  const completeJobAPI = async (jobId) => {
    try {
      const apiUrl = `${API_BASE_URL}/updateJobStatus`;
      const token = await AsyncStorage.getItem("auth_token");

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      };

      const body = new URLSearchParams();
      body.append("jobId", jobId);
      body.append("jobStatus", "true");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: body.toString(),
      });

      const data = await response.json();
      console.log("API Response Data:", data);

      if (response.ok) {

        // ✅ Remove from pending list after successful sync
        let pendingJobs = await AsyncStorage.getItem("pendingCompleteJobs");
        pendingJobs = pendingJobs ? JSON.parse(pendingJobs) : [];
        pendingJobs = pendingJobs.filter((id) => id !== jobId);
        await AsyncStorage.setItem("pendingCompleteJobs", JSON.stringify(pendingJobs));
      } else {
        console.error("Error updating job status:", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  // ✅ Auto Sync Pending Jobs When Internet is Available
  const syncPendingJobs = async () => {

    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        return;
      }

      // 🔹 Get Pending Jobs
      let pendingJobs = await AsyncStorage.getItem("pendingCompleteJobs");
      pendingJobs = pendingJobs ? JSON.parse(pendingJobs) : [];

      if (pendingJobs.length === 0) {
        return;
      }

      // 🔹 Loop through pending jobs and sync
      for (const jobId of pendingJobs) {
        await completeJobAPI(jobId);
      }


    } catch (error) {
      console.error("Error syncing pending jobs:", error);
    }
  };

  // ✅ Call `syncPendingJobs` When Internet is Available
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      syncPendingJobs();
    }
  });

  const formatJobData = (jobDetails) => {
    if (!jobDetails) return [];

    let jobDescriptions = jobDetails.jobDescription;

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

    if (jobDetails) {
      if (technicianType === "single-technician") {
        labourCost = parseFloat(jobDetails?.labourCost) || 0;
        payRate = `$${labourCost?.toFixed(2)}`;
      }
      else {
        if (jobDetails.simpleFlatRate) {
          labourCost = parseFloat(jobDetails?.simpleFlatRate) || 0;
          payRate = `$${labourCost?.toFixed(2)}`;
        } else if (jobDetails?.amountPercentage) {
          const percentage = parseFloat(jobDetails?.amountPercentage) || 0;
          labourCost = (jobDescriptionTotal * percentage) / 100;
          payRate = `${percentage}%`;
        } else if (jobDetails?.technicians?.[0]?.amountPercentage) {
          const percentage = parseFloat(jobDetails?.technicians?.[0]?.amountPercentage) || 0;
          labourCost = (jobDescriptionTotal * percentage) / 100;
          payRate = `${percentage}%`;
        } else if (jobDetails?.technicians?.[0]?.simpleFlatRate) {
          const percentage = parseFloat(jobDetails?.technicians?.[0]?.simpleFlatRate) || 0;
          labourCost = (jobDescriptionTotal * percentage) / 100;
          payRate = `$${labourCost?.toFixed(2)}`;
        }
      }
    }

    const totalCost = parseFloat(jobDescriptionTotal) + labourCost;

    return [
      {
        groupTitle: "Customer Info",
        data: [
          { label: "Name", value: `${jobDetails.customer?.firstName} ${jobDetails.customer?.lastName}` },
          { label: "Email", value: jobDetails.customer?.email },
          { label: "Phone Number", value: jobDetails.customer?.phoneNumber, isPhoneNumber: true },
          { label: "Assign Technician", value: jobDetails.technicians?.[0]?.firstName + " " + jobDetails.technicians?.[0]?.lastName },
        ]
      },
      {
        groupTitle: "Vehicle Info",
        data: [
          { label: "Vin Manually", value: jobDetails.vin },
          { label: "Vehicle Descriptor", value: jobDetails.vehicleDescriptor },
          { label: "Make", value: jobDetails.make },
          { label: "Manufacture Name", value: jobDetails.manufacturerName },
          { label: "Model", value: jobDetails.model },
          { label: "Model Year", value: jobDetails.modelYear?.toString() },
          { label: "Vehicle Type", value: (jobDetails.vehicleType && jobDetails.vehicleType !== "null") ? jobDetails.vehicleType : null },
          {
            label: "Color",
            value: jobDetails.color
              ? jobDetails.color.charAt(0).toUpperCase() + jobDetails.color.slice(1)
              : null, // yahan "N/A" ki jagah null diya taki filter me remove ho jaye
          },
        ].filter(item => !!item?.value && item.value.toString().trim() !== "")
      },

      ...(validJobDescriptions?.length ? [{
        groupTitle: "Job Description",
        data: [
          {
            label: "Job Descriptions",
            value: validJobDescriptions
              .map((desc) => `• ${desc.jobDescription.charAt(0).toUpperCase() + desc.jobDescription.slice(1)}`)
              .join('\n'),
            isMultiLine: true
          },
          {
            label: "Job Costs",
            value: validJobDescriptions
              .map((desc) => `• $${(parseFloat(desc.cost) || 0).toFixed(2)}`)
              .join('\n'),
            isMultiLine: true
          },
          {
            label: "Sub Total",
            value: `$${jobDescriptionTotal}`,
            isTotal: true
          }
        ]
      }] : []),
      {
        groupTitle: "Pay Info",
        data: [
          { label: "R/I R/R", value: payRate },

          ...(totalCost > 0
            ? [{
              label: "Total Cost",
              value: `$${totalCost?.toFixed(2)}`
            }]
            : []),
        ]
      },
      {
        groupTitle: "Job Status",
        data: [
          { label: "Date", value: jobDetails.createdAt ? new Date(jobDetails.createdAt).toLocaleDateString() : "N/A" },
          { label: "Current Job Status", value: jobDetails.jobStatus ? "Complete" : "In Progress", isWarning: !jobDetails.jobStatus },
        ]
      },
      ...(jobDetails?.notes?.trim()
        ? [{
          groupTitle: "Job Notes",
          data: [
            { label: "Notes", value: jobDetails.notes }
          ]
        }]
        : [])
      ,
      ...(jobDetails?.images?.length
        ? [{
          groupTitle: "Images",
          data: [{ label: "Attachments", images: jobDetails.images }]
        }]
        : [])
    ];
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={"Job Detail"} />
      {!jobDetails?.jobStatus && <Pressable
        onPress={() => navigation.navigate("NewJob", { jobId: jobId, isFromScanner: true })}
        style={{
          position: "absolute",
          top: Platform.OS === "android" ? isTablet ? 20 : 13 : isTablet ? 20 : 13,
          right: 15,
          borderColor: blueColor,
          width: isTablet ? wp(8) : wp(9),
          height: isTablet ? wp(6) : wp(8),
          borderRadius: 5,
          borderWidth: 2,
          justifyContent: "center",
          alignItems: "center",
          zIndex:999
        }}
      >
        <Feather name="edit-3" size={20} color={blackColor} />
      </Pressable>}
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
              formatJobData(jobDetails).map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.detailContainer}>
                  <FlatList
                    data={section.data}
                    renderItem={({ item }) => (
                      <View style={[styles.detailItem,(item.label === "Notes") && { width: "100%" }]}>
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

          {/* Complete Job Button */}
          {!loading && !jobDetails?.jobStatus && (
            <Pressable
              style={[styles.completeButton, alignItemsCenter]}
              onPress={() => handelCompleteJob(jobId, setSuccessModalVisible)}
            >
              <Text style={styles.completeButtonText}>Complete This Job</Text>
            </Pressable>
          )}
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

          {successModalVisible && <SuccessModal
            visible={successModalVisible}
            onClose={() => setSuccessModalVisible(false)}
            headingText={"Congratulations"}
            buttonText={"Ok"}
            text={"You've successfully completed this job."}
            onPressContinue={() => {
              setSuccessModalVisible(false);
              navigation.navigate("JobHistory", { jobCompleted: true });
            }}
          />}
          {modalVisible && <SuccessModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            headingText={"Not Authorized "}
            text={"You have not subscribed to the technician plan. Please subscribe to view your pay rates."}
            onPressContinue={() => { setModalVisible(false) }}
            image={XCIRCLE_IMAGE}
            buttonText={"Subscibe Now"}
            color={greenColor}
          />}
        </View>
      </ScrollView>
    </View>
  )
}

export default JobDetailsScreen

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