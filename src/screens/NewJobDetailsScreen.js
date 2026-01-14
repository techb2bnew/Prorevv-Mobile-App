import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Linking, Modal, Dimensions, Platform, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { blackColor, whiteColor, grayColor, mediumGray, orangeColor, redColor, greenColor, blueColor, lightBlueColor, lightGrayColor } from '../constans/Color';
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
import { useOrientation } from '../OrientationContext';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter, justifyContentSpaceEvenly } = BaseStyle;

const NewJobDetailsScreen = ({ navigation, route }) => {
  const { jobId, customerId, from } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [technicianType, setTechnicianType] = useState();
  const { width, height } = useWindowDimensions();
  const { orientation } = useOrientation();
  const isTablet = width >= 668 && height >= 1024;
  const isIOsAndTablet = Platform.OS === "ios" && isTablet;
  const [customerJobs, setCustomerJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const getTechnicianDetail = async () => {
        try {
          const storedData = await AsyncStorage.getItem('userDeatils');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
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
    } catch (error) {
      console.error("An error occurred while fetching job data:", error);
    } finally {
      setLoading(false); // Stop loading after API call
    }
  };

  useEffect(() => {
    if (customerId || from === "customer") {
      fetchSingleCustomerDetails(customerId);
      // fetchJobsByCustomer(1); // also load jobs
    } else if (jobId) {
      fetchJobData(jobId); // load only single job
    }
  }, [customerId, from, jobId]);

  const fetchSingleCustomerDetails = async (customerId) => {
    try {

      setCustomerJobs(null);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("Token not found!");
        return;
      }

      if (!customerId) {
        console.error("Invalid customerId");
        return;
      }

      const url = `${API_BASE_URL}/fetchSingleCustomer?customerId=${customerId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const customerData = data?.customers?.customer;
        console.log("data?.customers?.customer", data?.customers?.customer);

        setCustomerJobs(customerData);
        setLoading(false); // Start loading

        // setSelectedCustomer(customerData)
      } else {
        console.error("Error fetching customer details. Status:", response.status);
        setCustomerJobs(null);
      }
    } catch (error) {
      console.error("Network error:", error);
      setCustomerJobs(null);
    } finally {
      setLoading(false); // stop loading
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    fetchJobData(job?.id);
  };

  const capitalize = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const renderItem = ({ item, index }) => {

    // Console when row renders
    console.log("Rendering Vehicle Row:", {
      item
    });

    return (
      <Pressable
        onPress={() => {
          console.log("Pressed Vehicle:", { id: item.id, vin: item.vin });
          navigation.navigate('VehicleDetailsScreen', { vehicleId: item.id });
        }}
        style={[
          styles.row,
          { backgroundColor: index % 2 === 0 ? lightGrayColor : whiteColor }
        ]}
      >
        <Text style={[styles.cell, { width: wp(40),textAlign:  'left' ,paddingLeft: spacings.small2x }]}>{item.vin || 'N/A'}</Text>
        <Text style={[styles.cell, { width: wp(25), paddingLeft: spacings.small2x }]}>{item.make || '-'}</Text>
        <Text style={[styles.cell, { width: wp(22) }]}>{item.model || '-'}</Text>
        <Text style={[styles.cell, { width: wp(25) }]}>{item.modelYear || '-'}</Text>
        <Text style={[styles.cell, { width: wp(25) }]}>{item.labourCost ? "-" : jobDetails?.estimatedCost ? `$${jobDetails.estimatedCost}` : '—'}</Text>
        <Text style={[styles.cell, { width: wp(25) }]}>{item.labourCost ? `$${item.labourCost}` : '-'}</Text>

        <Text style={[
          styles.cell,
          { color: item.vehicleStatus ? 'green' : blackColor, width: wp(35) }
        ]}>
          {item.vehicleStatus ? 'Complete' : 'In Progress'}
        </Text>

        <Pressable
          onPress={() => {
            console.log("View Button Clicked:", { id: item.id, vin: item.vin });
            navigation.navigate("VehicleDetailsScreen", { vehicleId: item.id });
          }}
          style={{ width: wp(20), alignItems: 'center' }}
        >
          <Text style={styles.viewText}>View</Text>
        </Pressable>
      </Pressable>
    );
  };


  return (
    <View style={{ flex: 1 }}>
      <Header
        title={
          customerId || from === 'customer'
            ? "Customer Jobs"
            : (selectedJob?.jobName || jobDetails?.jobName
              ? (selectedJob?.jobName || jobDetails?.jobName).charAt(0).toUpperCase() +
              (selectedJob?.jobName || jobDetails?.jobName).slice(1)
              : "Job Details"
            )
        }
      />
      {loading ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 10 }}>
          <View style={[alignJustifyCenter, { width: wp(100), height: hp(85) }]}>
            <ActivityIndicator size={'large'} color={blueColor} />
          </View>
        </View>
      ) : customerId && !selectedJob ? (
        <FlatList
          data={customerJobs?.jobs || []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              {/* Customer Info Box */}
              <View style={{
                padding: 16,
                backgroundColor: lightGrayColor,
                margin: 10,
                borderRadius: 10,
                borderColor: blackColor,
                borderWidth: 1
              }}>
                <View style={styles.rowItem}>
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>Customer</Text>
                    <Text style={styles.value}>{capitalize(customerJobs?.fullName || "-")}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>Customer Email</Text>
                    <Text style={styles.value}>{customerJobs?.email || "-"}</Text>
                  </View>
                </View>
                <View style={styles.leftCol}>
                  <Text style={styles.label}>Customer Phone</Text>
                  <Text style={styles.value}>{customerJobs?.phoneNumber || "-"}</Text>
                </View>
              </View>

              {/* Jobs Table Header */}
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.headerText, { width: "30%" }]}>Job Title</Text>
                <Text style={[styles.cell, styles.headerText, { width: "38%" }]}>Number of W.O.</Text>
                <Text style={[styles.cell, styles.headerText, { width: "33%" }]}>Status</Text>
              </View>
            </>
          )}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                paddingVertical: 12,
                // paddingHorizontal: 10,
                backgroundColor: index % 2 === 0 ? whiteColor : lightGrayColor,
              }}
              onPress={() => handleJobSelect(item)}
            >
              <Text style={[styles.cell, { width: "30%" }]}>{capitalize(item?.jobName || "-")}</Text>
              <Text style={[styles.cell, { width: "38%", textAlign: 'center' }]}>{item?.vehicles?.length}</Text>
              <Text
                style={[
                  styles.cell,
                  { width: "33%", color: item?.jobStatus ? 'green' : blackColor, textAlign: 'center' }
                ]}
              >
                {item?.jobStatus ? "Complete" : "In Progress"}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>No jobs found.</Text>
          )}
        />


      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Job Info */}
          {jobDetails?.jobName && jobDetails?.customer?.fullName && (
            <View style={[styles.card, { borderColor: blackColor, borderWidth: 1, margin: 10 }]}>
              <View style={styles.rowItem}>
                <View style={styles.leftCol}>
                  <Text style={styles.label}>Job Title</Text>
                  <Text style={styles.value}>{capitalize(jobDetails?.jobName)}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.label}>Customer</Text>
                  <Text style={styles.value}>{capitalize(jobDetails?.customer?.fullName)}</Text>
                </View>
              </View>
              <View style={styles.rowItem}>
                <View style={styles.rightCol}>
                  <Text style={[styles.label, { marginBottom: 4 }]}>Job Status</Text>
                  <Text
                    style={[
                      styles.value,
                      { fontWeight: '600' },
                      { color: jobDetails?.jobStatus ? 'green' : blackColor }
                    ]}
                  >
                    {jobDetails?.jobStatus ? "Complete" : "In Progress"}
                  </Text>
                </View>
                {/* {technicianType != 'ifs' && <View style={styles.rightCol}>
                  <Text style={styles.label}>Job Estimated Cost</Text>
                  <Text style={styles.value}>
                    {jobDetails?.estimatedCost ? `$${jobDetails.estimatedCost}` : '—'}
                  </Text>
                </View>} */}

              </View>
              <View style={styles.rowItem}>
                <View style={styles.leftCol}>
                  <Text style={styles.label}>Start Date</Text>
                  <Text style={styles.value}>
                    {jobDetails?.startDate
                      ? new Date(jobDetails?.startDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                      : "-"}
                  </Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.label}>End Date</Text>
                  <Text style={styles.value}>
                    {jobDetails?.endDate
                      ? new Date(jobDetails?.endDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                      : "-"}
                  </Text>
                </View>
              </View>
              <View style={{ marginBottom: spacings.large }} >
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.value}>
                  {jobDetails?.notes || '—'}
                </Text>
              </View>
              {Array.isArray(jobDetails.technicians) && jobDetails.technicians.length > 0 && technicianType === "manager" && (
                <View >
                  <Text style={[styles.label, { marginBottom: 6 }]}>Assigned Technicians</Text>

                  {jobDetails.technicians.flatMap((tech, index) => {
                    const name = `${capitalize(tech.firstName)} ${capitalize(tech.lastName)}`;
                    const techTypeRaw = tech?.techType?.toLowerCase() || '';
                    const showType = techTypeRaw.includes('r') || techTypeRaw.includes('rb');
                    const techType = showType ? ` (${tech.techType.toUpperCase()})` : '';

                    const flatRate = tech?.UserJob?.techFlatRate;
                    const rRate = tech?.UserJob?.rRate;

                    let payInfo = '';
                    if (flatRate) {
                      payInfo = `Flat Rate: $${flatRate}`;
                    } else if (rRate) {
                      payInfo = `R Rate: $${rRate}`;
                    } else {
                      payInfo = 'N/A';
                    }

                    return [
                      <View style={[styles.rowItem]}>
                        <View key={`tech-name-${index}`} style={[{ marginBottom: 4 }, styles.leftCol]}>
                          <Text style={styles.label}>{`Technician ${index + 1}`}</Text>
                          <Text style={styles.value}>{`${name}${techType}`}</Text>
                        </View>,
                        <View key={`tech-pay-${index}`} style={[{ marginBottom: 10 }, styles.rightCol]}>
                          <Text style={styles.label}>{`Technician ${index + 1} (Pay Info)`}</Text>
                          <Text style={styles.value}>{payInfo}</Text>
                        </View>
                      </View>
                    ];
                  })}
                </View>
              )}
            </View>
          )}

          {jobDetails?.vehicles?.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Header Row */}
                  <View style={[styles.row, styles.headerRow]}>
                    <Text style={[styles.cell, styles.headerText, { width: wp(40), textAlign: "left", paddingLeft: spacings.large }]}>VIN</Text>
                    <Text style={[styles.cell, styles.headerText, { width: wp(25) }]}>Make</Text>
                    <Text style={[styles.cell, styles.headerText, { width: wp(22) }]}>Model</Text>
                    <Text style={[styles.cell, styles.headerText, { width: wp(25) }]}>Year</Text>
                    <Text style={[styles.cell, styles.headerText, { width: wp(27) }]}>Vehicle Price</Text>
                    <Text style={[styles.cell, styles.headerText, { width: wp(25) }]}>Override Cost</Text>
                    <Text style={[styles.cell, styles.headerText, { width: wp(35) }]}>Status</Text>
                    <Text style={[styles.cell, styles.headerText, { width: wp(20), textAlign: orientation === "LANDSCAPE" ? 'left' : 'center', marginLeft: orientation === "LANDSCAPE" ? wp(3) : 0 }]}>Action</Text>
                  </View>

                  {/* List */}
                  <FlatList
                    data={jobDetails?.vehicles.reverse() || []}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    scrollEnabled={false}
                  />
                </View>
              </ScrollView>
            </>
          ) : (
            // 👉 Show this when vehicle list is empty
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#999' }}>No Vehicle Found in this Job</Text>
            </View>
          )}

          {/* Image Modal */}
          <Modal visible={imageModalVisible} transparent animationType="fade" presentationStyle="overFullScreen" supportedOrientations={["portrait", "landscape-left", "landscape-right"]}>
            <View style={styles.modalContainer}>
              <TouchableOpacity onPress={() => setImageModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close-circle-sharp" size={35} color="#fff" />
              </TouchableOpacity>
              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
              )}
            </View>
          </Modal>
        </ScrollView>
      )}

    </View>
  )
}

export default NewJobDetailsScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: whiteColor,
    padding: spacings.xxLarge,
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

  value: {
    fontSize: style.fontSizeNormal.fontSize,
    color: blackColor,
    fontWeight: style.fontWeightThin1x.fontWeight,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: blackColor,
  },

  card: {
    backgroundColor: lightGrayColor,
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
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
  row: {
    flexDirection: 'row',
    paddingVertical: spacings.large,
  },
  cell: {
    textAlign: 'center',
    fontSize: style.fontSizeNormal.fontSize
  },
  headerRow: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: blackColor
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
})
