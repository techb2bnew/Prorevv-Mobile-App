import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Pressable, ScrollView, Alert, ScrollViewBase, Image, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Keyboard, Dimensions, TouchableWithoutFeedback } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import axios from 'axios';
import Header from '../componets/Header';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { blackColor, blueColor, grayColor, lightBlueColor, lightGrayColor, mediumGray, whiteColor } from '../constans/Color';
import Toast from 'react-native-simple-toast';
import Fontisto from 'react-native-vector-icons/Fontisto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constans/Constants';
import CustomerDropdown from '../componets/CustomerDropdown';

const WorkOrderScreen = ({ navigation }) => {
  const { width, height } = Dimensions.get("window");
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobName, setSelectedJobName] = useState("");
  const [searchText, setSearchText] = useState('');
  const isTablet = width >= 668 && height >= 1024;
  const [technicianId, setTechnicianId] = useState();
  const [technicianType, setTechnicianType] = useState();
  const [jobList, setJobList] = useState([]);
  const pageRef = useRef(1); // useRef to avoid re-render
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMoreCustomer, setHasMoreCustomer] = useState(true);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [allJobList, setAllJobList] = useState([]);


  useEffect(() => {
    const loadSelectedJob = async () => {
      const savedJob = await AsyncStorage.getItem("current_Job");

      if (savedJob) {
        const parsed = JSON.parse(savedJob);
        setSelectedJob(parsed.id);
        setSelectedJobName(parsed.name);
      }
    };
    loadSelectedJob();
  }, []);

  useEffect(() => {
    const getTechnicianDetail = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userDeatils");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setTechnicianId(parsedData?.id);
          setTechnicianType(parsedData?.types)
        }
      } catch (error) {
        console.error("Error fetching stored user:", error);
      }
    };

    getTechnicianDetail();
  }, []);

  useEffect(() => {
    const loadLastSelectedCustomer = async () => {
      try {
        const savedCustomer = await AsyncStorage.getItem("current_customer");
        if (savedCustomer) {
          const parsedCustomer = JSON.parse(savedCustomer);
          setSelectedCustomer(parsedCustomer);
          setIsDetailLoading(true);
          setJobList([]);
          pageRef.current = 1;
          setHasMore(true);
          fetchSingleCustomerDetails(parsedCustomer?.id);
          const customerJobs = allJobList.filter(job => job?.customer?.fullName === parsedCustomer?.fullName);
          setJobList(customerJobs)
        }
      } catch (err) {
        console.error("Error loading last selected customer:", err);
      }
    };

    loadLastSelectedCustomer();
  }, [allJobList]);

  useEffect(() => {
    if (jobList.length === 1) {
      const job = jobList[0];
      setSelectedJob(job?.id);
      setSelectedJobName(job?.jobName);
      AsyncStorage.setItem("current_Job", JSON.stringify(job));
    }
  }, [jobList]);

  useEffect(() => {
    if (technicianId && customers.length === 0) {
      fetchCustomers(1);
      console.log("Fetching customers for the first time...");
    }
  }, [technicianId]);

  const fetchCustomers = async (page) => {
    if (!hasMoreCustomer) return;

    setIsCustomerLoading(true);
    try {
      const token = await AsyncStorage.getItem("auth_token");

      if (!token) {
        console.error("Token not found!");
        return;
      }

      // Construct the API URL with parameters
      const apiUrl = `${API_BASE_URL}/fetchAllTechnicianCustomer?userId=${technicianId}&page=${page}`;
      // console.log(apiUrl, token);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status && data.jobs?.jobs?.length > 0) {
        setAllJobList(data.jobs?.jobs);
        console.log("data.jobs?.jobs", data.jobs?.jobs);

        const newCustomers = data.jobs.jobs
          .map(job => {
            if (job.customer && job.customer.id) {
              return {
                ...job.customer,
                jobName: job.jobName,
                jobId: job.id
              };
            }
            return null;
          })
          .filter(cust => cust); // Remove nulls

        // ✅ Remove duplicate customers by ID
        const uniqueCustomers = [...customers, ...newCustomers].filter(
          (cust, index, self) =>
            index === self.findIndex(c => c.id === cust.id)
        );
        console.log("uniqueCustomers", uniqueCustomers);

        setCustomers(uniqueCustomers);

        if (data.jobs.jobs.length >= 10) {
          setPageNumber(prevPage => prevPage + 1);
        } else {
          setHasMoreCustomer(false);
        }
      } else {
        setHasMoreCustomer(false);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const fetchSingleCustomerDetails = async (customerId) => {
    try {

      setCustomerDetails(null);

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
      // console.log("API Response Data:", data);

      if (response.ok) {
        const customerData = data?.customers?.customer;
        setCustomerDetails(customerData);
        setSelectedCustomer(customerData)
      } else {
        console.error("Error fetching customer details. Status:", response.status);
        setCustomerDetails(null);
      }
    } catch (error) {
      console.error("Network error:", error);
      setCustomerDetails(null);
    } finally {
      setIsDetailLoading(false); // stop loading
    }
  };

  const handleCustomerSelect = async (item) => {
    setSelectedCustomer(item.id);
    setIsDetailLoading(true);
    setJobList([]);
    pageRef.current = 1;
    setHasMore(true);
    // Save selected customer
    await AsyncStorage.setItem("current_customer", JSON.stringify(item));
    // Clear previously selected job
    setSelectedJob(null);
    setSelectedJobName("");
    await AsyncStorage.removeItem("current_Job");
    fetchSingleCustomerDetails(item.id);
    const customerJobs = allJobList.filter(job => job.customer?.fullName === item.fullName);
    setJobList(customerJobs)
  };

  const handleLoadMore = () => {
    if (!isCustomerLoading && hasMoreCustomer && customers.length >= 10) {
      fetchCustomers(pageNumber);
    }
  };

  // const fetchCustomerJobs = async (customerId, jobId, force = false) => {
  //   if (!force && (loading || !hasMore)) return;

  //   try {
  //     setLoading(true);

  //     const token = await AsyncStorage.getItem("auth_token");
  //     if (!token) {
  //       console.error("No token found");
  //       return;
  //     }
  //     if (!customerId) {
  //       console.error("No customerId found");
  //       return;
  //     }

  //     const response = await axios.get(
  //       `${API_BASE_URL}/fetchCustomerJobsApp?customerId=${customerId}&jobId=${jobId}&page=${pageRef.current}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     const newJobs = response?.data?.jobs || [];

  //     console.log("ressss:::::", newJobs);

  //     if (newJobs.length > 0) {
  //       setJobList(prev => [...prev, ...newJobs]);
  //       if (newJobs.length < 10) {
  //         setHasMore(false);
  //       } else {
  //         pageRef.current += 1;
  //       }
  //     } else {
  //       setHasMore(false);
  //     }

  //   } catch (error) {
  //     console.error("Error to fetch customer job:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => navigation.navigate('Home')} title={"Select Job"} />
      <View style={{ padding: spacings.large, backgroundColor: whiteColor, height: hp(100), width: wp(100) }}>
        <Text style={[styles.label, { fontSize: style.fontSizeLarge.fontSize, }]}>Select Customer <Text style={{ color: 'red' }}>*</Text></Text>
        <CustomerDropdown
          data={customers}
          selectedValue={customerDetails}
          onSelect={handleCustomerSelect}
          showIcon={true}
          rightIcon={true}
          titleText="Select Customer"
          handleLoadMore={handleLoadMore}
          isLoading={isCustomerLoading}
        />

        {selectedCustomer != null && jobList?.length > 0 && <View style={{ marginTop: spacings.xxxxLarge }}>
          <Text style={styles.label}>Assigned Jobs</Text>
          <View style={{
            maxHeight: hp(40),
            borderColor: blueColor,
            borderWidth: 1,
            borderRadius: 10,
            overflow: "hidden"
          }}>
            <FlatList
              data={jobList}
              keyExtractor={item => item?.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const isSelected = selectedJob === item?.id;
                const backgroundColor = isSelected
                  ? blueColor
                  : index % 2 === 0
                    ? whiteColor
                    : lightBlueColor;

                return (
                  <Pressable
                    style={[styles.jobItem, { backgroundColor }]}
                    onPress={async () => {
                      setSelectedJob(item?.id);
                      setSelectedJobName(item?.jobName);
                      await AsyncStorage.setItem("current_Job", JSON.stringify(item));
                    }}
                  >
                    <Fontisto
                      name={isSelected ? "radio-btn-active" : "radio-btn-passive"}
                      size={16}
                      color={isSelected ? whiteColor : blackColor}
                      style={styles.radioIcon}
                    />
                    <Text style={[{ color: isSelected ? whiteColor : blackColor, marginLeft: spacings.xLarge }]}>
                      {item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}
                    </Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                !loading && (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Text style={{ color: grayColor, fontSize: 16 }}>
                      No jobs found for this customer.
                    </Text>
                  </View>
                )
              }
              // onEndReached={fetchCustomerJobs(selectedCustomer.id,selectedCustomer.jobId,true)}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color={blueColor} />
                  </View>
                ) : null
              } />
          </View>

          {jobList?.length > 0 && (
            <Pressable
              style={styles.nextButton}
              onPress={() => {
                if (!selectedJob) {
                  Toast.show("Please select a job");
                  return;
                }

                navigation.navigate("WorkOrderScreenTwo", {
                  jobName: selectedJobName,
                  // jobId: selectedJob
                });
              }}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </Pressable>
          )}
        </View>}
      </View>
    </View>
  )
}

export default WorkOrderScreen

const styles = StyleSheet.create({
  label: {
    fontSize: style.fontSizeNormal2x.fontSize,
    fontWeight: style.fontWeightThin1x.fontWeight,
    marginBottom: spacings.large,
    color: blackColor
  },
  searchTextInput: {
    flexDirection: 'row',
    backgroundColor: whiteColor,
    borderRadius: 8,
    paddingHorizontal: spacings.xxLarge,
    alignItems: 'center',
    // height: hp(5.5),
    borderColor: blueColor,
    borderWidth: 1,
    marginBottom: spacings.large
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: blueColor,
    alignItems: 'center'
  },
  iconContainer: {
    paddingLeft: spacings.large,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor: blueColor,
    paddingVertical: 12,
    width: Dimensions.get('window').width * 0.3,
    borderRadius: 8,
    marginTop: hp(10),
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerContainer: {
    marginVertical: spacings.xLarge,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: spacings.large,
    color: blackColor,
  },
  scanButton: {
    backgroundColor: blueColor,
    paddingVertical: spacings.xLarge,
    borderRadius: 10,
    marginTop: spacings.Large1x
  },
  scanButtonText: {
    color: whiteColor,
    fontWeight: style.fontWeightThin.fontWeight,
    fontWeight: style.fontWeightMedium.fontWeight,
  },
  vinInput: {
    backgroundColor: whiteColor,
    borderWidth: 1,
    borderColor: blueColor,
    borderRadius: 10,
    padding: spacings.large,
    color: blackColor,
    fontSize: style.fontSizeNormal1x.fontSize,
  },
  fetchButton: {
    backgroundColor: blueColor,
    borderRadius: 10,
    height: hp(5),
  },
  fetchButtonText: {
    color: whiteColor,
    fontWeight: style.fontWeightThin.fontWeight,
    fontSize: 12
  },
})