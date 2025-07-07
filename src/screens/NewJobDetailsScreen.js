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

const NewJobDetailsScreen = ({ navigation, route }) => {
  const { jobId, customerId, from } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [technicianType, setTechnicianType] = useState();
  const { width, height } = Dimensions.get("window");
  const isTablet = width >= 668 && height >= 1024;
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
          {/* {Array.from({ length: 13 }).map((_, index) => (
            <View key={index} style={{ width: '48%', marginBottom: 10 }}>
              <SkeletonPlaceholder borderRadius={5}>
                <SkeletonPlaceholder.Item flexDirection="column" alignItems="flex-start">
                  <SkeletonPlaceholder.Item width={120} height={20} marginTop={5} />
                  <SkeletonPlaceholder.Item width={80} height={15} marginTop={10} />
                  <SkeletonPlaceholder.Item width={100} height={20} marginTop={5} />
                </SkeletonPlaceholder.Item>
              </SkeletonPlaceholder>
            </View>
          ))} */}
          <View style={[alignJustifyCenter, { width: wp(100), height: hp(85) }]}>
            <ActivityIndicator size={'large'} color={blueColor} />
          </View>
        </View>
      ) : customerId && !selectedJob ? (
        <FlatList
          data={customerJobs?.jobs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={{ padding: 16, backgroundColor: lightBlueColor, margin: 10, borderRadius: 10, borderColor: blueColor, borderWidth: 1 }}>
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
          )}
          renderItem={({ item, index }) => {
            const rowStyle = {
              backgroundColor: index % 2 === 0 ? whiteColor : lightBlueColor, // white / light blue
            };

            return (
              <TouchableOpacity
                style={[styles.card, { marginHorizontal: 10, borderColor: blueColor, borderWidth: 1 }, rowStyle]}
                onPress={() => handleJobSelect(item)}
              >
                <View style={styles.rowItem}>
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>Job Title</Text>
                    <Text style={styles.value}>{capitalize(item?.jobName || "-")}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>Estimated By</Text>
                    <Text style={styles.value}>{capitalize(item?.estimatedBy || "-")}</Text>
                  </View>
                </View>
                <View style={styles.rowItem}>
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>Created At</Text>
                    <Text style={styles.value}>
                      {item?.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                        : "-"}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={[styles.value, { color: item?.jobStatus ? 'green' : 'red' }]}>
                      {item?.jobStatus ? "Complete" : "In Progress"}
                    </Text>
                  </View>
                </View>
                <View style={styles.leftCol}>
                  <Text style={styles.label}>Number of W.O</Text>
                  <Text style={styles.value}>
                    {item?.vehicles?.length}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}

          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>No jobs found.</Text>
          )}
        />

      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Job Info */}
          {jobDetails?.jobName && jobDetails?.customer?.fullName && (
            <View style={[styles.card, { borderColor: blueColor, borderWidth: 1 }]}>
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
                      { color: jobDetails?.jobStatus ? 'green' : 'red' }
                    ]}
                  >
                    {jobDetails?.jobStatus ? "Complete" : "In Progress"}
                    {/* {(() => {
                      const allVehiclesComplete = jobDetails?.vehicles?.every(v => v?.vehicleStatus === true);
                      const isJobComplete = jobDetails?.jobStatus || allVehiclesComplete;

                      return (
                        <Text
                          style={[
                            styles.value,
                            { fontWeight: '600' },
                            { color: isJobComplete ? 'green' : 'red' }
                          ]}
                        >
                          {isJobComplete ? "Complete" : "In Progress"}
                        </Text>
                      );
                    })()} */}
                  </Text>
                </View>
                {technicianType != 'ifs' && <View style={styles.rightCol}>
                  <Text style={styles.label}>Job Estimated Cost</Text>
                  <Text style={styles.value}>${jobDetails?.estimatedCost}</Text>
                </View>}

              </View>
              <View style={styles.rowItem}>
                <View style={styles.leftCol}>
                  <Text style={styles.label}>Start Date</Text>
                  <Text style={styles.value}>
                    {new Date(jobDetails?.startDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.label}>End Date</Text>
                  <Text style={styles.value}>
                    {new Date(jobDetails?.endDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
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

          {/* Vehicles */}
          {jobDetails?.vehicles?.map((vehicle, index) => (
            <View key={vehicle.id} style={[styles.card, { borderColor: blueColor, borderWidth: 1, padding: 0 }]}>
              {/* <Text style={[styles.sectionTitle,{backgroundColor:blueColor,color:whiteColor}]}>Vehicle {index + 1}</Text> */}
              {/* <View style={{ height: 1, backgroundColor: '#ccc', marginBottom: 10 }} /> */}
              <View style={{
                backgroundColor: blueColor,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 12,
                width: '100%'
              }}>
                <Text style={[styles.sectionTitle, { color: whiteColor }]}>
                  Vehicle {index + 1}
                </Text>
              </View>

              <View style={[styles.rowItem, { paddingHorizontal: 10, marginTop: spacings.large }]}>
                {!!vehicle.vin && (
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>VIN</Text>
                    <Text style={styles.value}>{vehicle.vin}</Text>
                  </View>
                )}
                {!!vehicle.make && (
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>Make</Text>
                    <Text style={styles.value}>{vehicle.make}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.rowItem, { paddingHorizontal: 10 }]}>
                {!!vehicle.model && (
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>Model</Text>
                    <Text style={styles.value}>{vehicle.model}</Text>
                  </View>
                )}
                {!!vehicle.modelYear && (
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>Model Year</Text>
                    <Text style={styles.value}>{vehicle.modelYear}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.rowItem, { paddingHorizontal: 10 }]}>
                {!!vehicle.manufacturerName && (
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>Manufacturer</Text>
                    <Text style={styles.value}>{vehicle.manufacturerName}</Text>
                  </View>
                )}
                {!!vehicle.color && (
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>Color</Text>
                    <Text style={styles.value}>{capitalize(vehicle.color)}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.rowItem, { paddingHorizontal: 10 }]}>
                {!!vehicle.vehicleDescriptor && (
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>Descriptor</Text>
                    <Text style={styles.value}>{vehicle.vehicleDescriptor}</Text>
                  </View>
                )}
                {!!vehicle.bodyClass && (
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>Body Type</Text>
                    <Text style={styles.value}>{vehicle.bodyClass}</Text>
                  </View>
                )}
              </View>

              {Array.isArray(vehicle.jobDescription) &&
                vehicle.jobDescription.filter(desc => {
                  if (typeof desc === 'object' && desc !== null) {
                    return desc.jobDescription || desc.cost;
                  }
                  return !!desc; // in case it's a plain string
                }).length > 0 && (
                  <View style={{ padding: 10 }}>
                    {/* Heading */}
                    <View style={[flexDirectionRow, justifyContentSpaceBetween]}>
                      <View style={styles.leftCol}>
                        <Text style={styles.label}>Work Description</Text>
                      </View>
                    </View>

                    {/* List of Work Items */}
                    {vehicle.jobDescription.map((desc, i) => {
                      const isObject = typeof desc === 'object' && desc !== null;
                      const description = isObject ? desc.jobDescription : desc;
                      const cost = isObject ? desc.cost : '';

                      if (!description && !cost) return null;

                      return (
                        <View key={i} style={[flexDirectionRow, justifyContentSpaceBetween]}>
                          <View style={styles.leftCol}>
                            <Text style={styles.value}>• {description || '—'}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}


              {technicianType === "single-technician" && vehicle?.labourCost
                ? (
                  <View style={{ padding: 10 }}>
                    <Text style={[styles.label, { marginBottom: 4 }]}>Labour Cost</Text>
                    <Text style={[styles.value, { fontWeight: '600' }]}>
                      ${vehicle.labourCost}
                    </Text>
                  </View>
                ) : null}


              {/* Notes */}
              {!!vehicle.notes?.trim() && (
                <View style={{ padding: 10 }}>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={styles.value}>{vehicle.notes}</Text>
                </View>
              )}

              {/* Images */}
              {Array.isArray(vehicle.images) && vehicle.images.length > 0 && (
                <View style={{ marginTop: 10, padding: 10 }}>
                  <Text style={styles.label}>Attachments</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                    {vehicle.images.map((img, i) => (
                      <TouchableOpacity key={i} onPress={() => openImageModal(img)}>
                        <Image
                          source={{ uri: img }}
                          style={{ width: 60, height: 60, marginRight: 10, marginBottom: 10, borderRadius: 8 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <View style={{ padding: 10 }}>
                <View style={styles.rowItem}>
                  <View style={styles.leftCol}>
                    <Text style={styles.label}>Start Date</Text>
                    <Text style={styles.value}>
                      {new Date(vehicle?.startDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.label}>End Date</Text>
                    <Text style={styles.value}>
                      {new Date(vehicle?.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.rowItem, { paddingHorizontal: 10 }]}>
                <View style={styles.rightCol}>
                  <Text style={[styles.label, { marginBottom: 4 }]}>Work Order Status</Text>
                  <Text
                    style={[
                      styles.value,
                      { fontWeight: '600' },
                      { color: vehicle?.vehicleStatus ? 'green' : 'red' }
                    ]}
                  >
                    {vehicle?.vehicleStatus ? "Complete" : "In Progress"}
                  </Text>
                </View>
              </View>

              {technicianType === "manager" && Array.isArray(vehicle.assignedTechnicians) && vehicle.assignedTechnicians.length > 0 && (
                <View style={{ padding: 10 }}>
                  <Text style={[styles.label, { marginBottom: 6 }]}>Assigned Technicians</Text>

                  {vehicle.assignedTechnicians.flatMap((tech, index) => {
                    const name = `${capitalize(tech.firstName)} ${capitalize(tech.lastName)}`;
                    const techTypeRaw = tech?.techType?.toLowerCase() || '';
                    const showType = techTypeRaw.includes('r') || techTypeRaw.includes('rb');
                    const techType = showType ? ` (${tech.techType.toUpperCase()})` : '';

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
          ))}

          {/* Image Modal */}
          <Modal visible={imageModalVisible} transparent animationType="fade">
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
    backgroundColor: lightBlueColor,
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
  }
})


// import React, { useCallback, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Modal,
//   Dimensions,
//   ActivityIndicator
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import Header from '../componets/Header';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_BASE_URL } from '../constans/Constants';
// import { blackColor, whiteColor, grayColor, blueColor, greenColor, redColor } from '../constans/Color';

// const { width, height } = Dimensions.get("window");
// const isTablet = width >= 668 && height >= 1024;

// const NewJobDetailsScreen = ({ navigation, route }) => {
//   const { jobId } = route.params;
//   const [loading, setLoading] = useState(true);
//   const [jobDetails, setJobDetails] = useState(null);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [imageModalVisible, setImageModalVisible] = useState(false);

//   const fetchJobData = async (jobId) => {
//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem("auth_token");
//       const headers = { "Content-Type": "application/json" };
//       if (token) headers["Authorization"] = `Bearer ${token}`;

//       const response = await fetch(`${API_BASE_URL}/fetchSingleJobs?jobid=${jobId}`, {
//         method: 'POST',
//         headers,
//       });

//       const data = await response.json();
//       if (response.ok && data.jobs) setJobDetails(data.jobs);
//     } catch (error) {
//       console.error("Error fetching job data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchJobData(jobId);
//   }, [jobId]);

//   const capitalize = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : '';

//   return (
//     <View style={{ flex: 1 }}>
//       <Header title={capitalize(jobDetails?.jobName)} />
//       {loading ? (
//         <View style={styles.loader}><ActivityIndicator size="large" color={blueColor} /></View>
//       ) : (
//         <ScrollView contentContainerStyle={{ padding: 16 }}>
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Job Info</Text>
//             <InfoRow label="Job Name" value={capitalize(jobDetails?.jobName)} />
//             <InfoRow label="Customer Name" value={capitalize(jobDetails?.customer?.fullName)} />
//             <InfoRow label="Email" value={jobDetails?.customer?.email} />
//             <InfoRow label="Phone" value={jobDetails?.customer?.phoneNumber} />
//           </View>

//           {jobDetails?.vehicles?.map((vehicle, index) => (
//             <View key={vehicle.id} style={styles.section}>
//               <Text style={styles.sectionTitle}>Vehicle {index + 1}</Text>
//               <InfoRow label="VIN" value={vehicle.vin} />
//               <InfoRow label="Make" value={vehicle.make} />
//               <InfoRow label="Model" value={vehicle.model} />
//               <InfoRow label="Year" value={vehicle.modelYear} />
//               <InfoRow label="Color" value={capitalize(vehicle.color)} />
//               <InfoRow label="Manufacturer" value={vehicle.manufacturerName} />
//               <InfoRow label="Status" value={vehicle.vehicleStatus ? "Complete" : "In Progress"} status={vehicle.vehicleStatus} />
//               <InfoRow label="Created" value={new Date(vehicle.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />

//               {vehicle.jobDescription?.length > 0 && (
//                 <View style={{ marginTop: 10 }}>
//                   <Text style={styles.label}>Job Description</Text>
//                   {vehicle.jobDescription.map((desc, i) => (
//                     <View key={i} style={styles.descRow}>
//                       <Text style={styles.descText}>• {desc.jobDescription || '—'}</Text>
//                       <Text style={styles.descText}>${desc.cost || '0.00'}</Text>
//                     </View>
//                   ))}
//                 </View>
//               )}

//               {!!vehicle.notes && (
//                 <View style={{ marginTop: 10 }}>
//                   <Text style={styles.label}>Notes</Text>
//                   <Text style={styles.value}>{vehicle.notes}</Text>
//                 </View>
//               )}

//               {!!vehicle.images?.length && (
//                 <View style={{ marginTop: 10 }}>
//                   <Text style={styles.label}>Images</Text>
//                   <View style={styles.imageWrap}>
//                     {vehicle.images.map((img, i) => (
//                       <TouchableOpacity key={i} onPress={() => {
//                         setSelectedImage(img);
//                         setImageModalVisible(true);
//                       }}>
//                         <Image source={{ uri: img }} style={styles.imageThumb} />
//                       </TouchableOpacity>
//                     ))}
//                   </View>
//                 </View>
//               )}
//             </View>
//           ))}

//           <Modal visible={imageModalVisible} transparent animationType="fade">
//             <View style={styles.modalContainer}>
//               <TouchableOpacity onPress={() => setImageModalVisible(false)} style={styles.closeButton}>
//                 <Ionicons name="close-circle-sharp" size={35} color="#fff" />
//               </TouchableOpacity>
//               {selectedImage && (
//                 <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
//               )}
//             </View>
//           </Modal>
//         </ScrollView>
//       )}
//     </View>
//   );
// };

// const InfoRow = ({ label, value, status }) => (
//   <View style={styles.rowItem}>
//     <Text style={styles.label}>{label}</Text>
//     <Text style={[styles.value, status !== undefined && { color: status ? greenColor : redColor }]}> {value}</Text>
//   </View>
// );

// const styles = StyleSheet.create({
//   loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   section: { backgroundColor: whiteColor, padding: 16, borderRadius: 12, marginBottom: 15, elevation: 1 },
//   sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: blackColor },
//   rowItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
//   label: { color: grayColor, fontSize: 13 },
//   value: { color: blackColor, fontSize: 14 },
//   descRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
//   descText: { color: blackColor },
//   imageWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
//   imageThumb: { width: 60, height: 60, marginRight: 8, marginBottom: 8, borderRadius: 6 },
//   modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
//   fullImage: { width: '90%', height: '80%' },
//   closeButton: { position: 'absolute', top: 40, right: 20 },
// });

// export default NewJobDetailsScreen;