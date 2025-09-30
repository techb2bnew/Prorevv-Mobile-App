import { Image, StyleSheet, Text, TouchableOpacity, View, Pressable, FlatList, ImageBackground, Platform, Dimensions, Alert, ToastAndroid, TextInput, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { blackColor, blueColor, ExtraExtralightOrangeColor, grayColor, lightBlueColor, lightGrayColor, lightOrangeColor, orangeColor, redColor, whiteColor } from '../constans/Color';
import { ADD_CASTUMER_BACK_IMAGE, ADD_CASTUMER_TAB_BACK_IMAGE, ADD_CASTUMER_TAB_WHITE_BACK_IMAGE, ADD_CASTUMER_WHITE_BACK_IMAGE, ADD_VEHICLE_BACK_IMAGE, ADD_VEHICLE_IMAGE, ADD_VEHICLE_TAB_BACK_IMAGE, APP_NAME_IMAGE, CARD_BACKGROUND, CAROUSAL_ONE_IMAGE, CAROUSAL_THREE_IMAGE, CAROUSAL_TWO_IMAGE, CIRLE_SCANNER_IMAGE, HEADER_BACKGROUND, HOW_TO_PLAY_BACK_IMAGE, HOW_TO_PLAY_TAB_BACK_IMAGE, HOW_TO_USE_IMAGE, JOB_HISTORY_BACK_IMAGE, JOB_HISTORY_IMAGE, JOB_HISTORY_TAB_BACK_IMAGE, NEW_CLIENT_IMAGE, NEW_WORK_ORDER_IMAGE, VIN_LIST_IMAGE } from '../assests/images';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import { API_BASE_URL, JOB_HISTORY, NEW_CLIENT, NEW_WORK_ORDER } from '../constans/Constants';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';


import Toast from 'react-native-simple-toast';

const { width, height } = Dimensions.get('window');

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const HomeScreen = ({ navigation }) => {
  const [technicianName, setTechnicianName] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [technicianType, setTechnicianType] = useState('');
  const [bLogo, setbLogo] = useState(null);
  const [ifscustomers, setIfsCustomers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isTablet = width >= 668 && height >= 1024;
  const isIOSAndTablet = Platform.OS === "ios" && isTablet;
  const [dashboardData, setDashboardData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const cardData = [
    {
      name: technicianType === "ifs" ? "View Jobs" : "Add Customer",
      subtitle: technicianType === "ifs" ? "See all assigned jobs" : "Create a new customer",
      image: technicianType === "ifs" ? NEW_WORK_ORDER_IMAGE : NEW_CLIENT_IMAGE,
      backgroundColor: whiteColor,
      onPress: () => {
        if (technicianType === "ifs") {
          navigation.navigate("WorkOrderScreen");
        } else {
          navigation.navigate("CustomerInfo");
        }
      },
      // color: ' #cacaca58',
      backgroundImage: isTablet ? ADD_CASTUMER_TAB_BACK_IMAGE : ADD_CASTUMER_BACK_IMAGE,
      iconComponent: technicianType === "ifs" ? Feather : Ionicons,
      iconName: technicianType === "ifs" ? "file-text" : "person-add-outline",
      color: '#3B6981',
    },
    {
      name: technicianType === "ifs" ? "Scan Vin" : "Manage Jobs",
      subtitle: technicianType === "ifs" ? "Scan VIN number" : "Start a new job",
      image: technicianType === "ifs" ? CIRLE_SCANNER_IMAGE : NEW_WORK_ORDER_IMAGE,
      backgroundColor: whiteColor,
      color: blackColor,
      onPress: async () => {
        if (technicianType === "ifs") {
          try {
            const currentJob = await AsyncStorage.getItem("current_Job");
            if (ifscustomers.length === 0) {
              Toast.show("You don't have any assigned job currently.");
            } else if (!currentJob) {
              Toast.show("Please select a job from the jobs page first.");
            } else {
              navigation.navigate("ScannerScreen");
            }
          } catch (error) {
            console.error("Error checking current job:", error);
          }
        } else {
          if (customers.length === 0) {
            Toast.show("You don't have any Customer Please first add a customer before creating a job.");
          } else {
            navigation.navigate("CreateJobScreen")

          }
        }
      },
      backgroundImage: isTablet ? ADD_VEHICLE_TAB_BACK_IMAGE : ADD_VEHICLE_BACK_IMAGE,
      iconComponent: technicianType === "ifs" ? MaterialIcons : MaterialIcons,
      iconName: technicianType === "ifs" ? "qr-code-scanner" : "add",
    },
    {
      name: technicianType === "ifs" ? "Vin List" : "Assign Jobs",
      subtitle: technicianType === "ifs" ? "Browse saved VINs" : "Manage assign Jobs",
      image: technicianType === "ifs" ? VIN_LIST_IMAGE : ADD_VEHICLE_IMAGE,
      backgroundColor: whiteColor,
      color:redColor,
      onPress: () => {
        if (technicianType === "ifs") {
          navigation.navigate("VinListScreen")
        } else {
          if (customers.length === 0) {
            Toast.show("You don't have any Customer Please first add a customer before add a vehicle.");
          } else {
            navigation.navigate("WorkOrderScreen");

          }
        }
      },
      backgroundImage: isTablet ? JOB_HISTORY_TAB_BACK_IMAGE : JOB_HISTORY_BACK_IMAGE,
      iconComponent: technicianType === "ifs" ? MaterialIcons : Ionicons,
      iconName: technicianType === "ifs" ? "format-list-bulleted" : "car-outline",
    },
    {
      name: technicianType === "ifs" ? "View Reports" : "Scan Vin",
      subtitle: technicianType === "ifs" ? "Check reports summary" : "Scan VIN number",
      image: technicianType === "ifs" ? JOB_HISTORY_IMAGE : CIRLE_SCANNER_IMAGE,
      backgroundColor: whiteColor,
      color: '#3B6981',
      onPress: async () => {
        if (technicianType === "ifs") {
          navigation.navigate("ReportsScreen")
        } else {
          try {
            const currentJob = await AsyncStorage.getItem("current_Job");
            if (customers.length === 0) {
              Toast.show("You don't have any assigned job currently.");
            } else if (!currentJob) {
              Toast.show("Please select a job from the vehicles page first.");
            } else {
              navigation.navigate("ScannerScreen");
            }
          } catch (error) {
            console.error("Error checking current job:", error);
          }
        }
      },
      backgroundImage: isTablet ? HOW_TO_PLAY_TAB_BACK_IMAGE : HOW_TO_PLAY_BACK_IMAGE,
      iconComponent: technicianType === "ifs" ? Octicons : MaterialIcons,
      iconName: technicianType === "ifs" ? "checklist" : "qr-code-scanner",
    }
  ]

  useFocusEffect(
    useCallback(() => {
      const fetchTechnicianProfile = async () => {
        try {
          const storedData = await AsyncStorage.getItem('userDeatils');
          if (!storedData) throw new Error('User details not found');

          const parsedData = JSON.parse(storedData);
          const technicianId = parsedData.id;
          setTechnicianId(technicianId)
          setTechnicianType(parsedData.types)
          // console.log(parsedData.types);

          const storedName = await AsyncStorage.getItem('technicianName');
          if (storedName) {
            setTechnicianName(storedName);
          }

          const storedbusinessLogo = await AsyncStorage.getItem('businessLogo');
          if (storedName) {
            setbLogo(storedbusinessLogo);
          }

          const token = await AsyncStorage.getItem('auth_token');
          if (!token) throw new Error('No token found');

          const response = await axios.get(
            `${API_BASE_URL}/fetchTechnicianProfile?technicianId=${technicianId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log("data", response?.data?.technician);
          const fullName = response?.data?.technician.firstName + " " + response?.data?.technician.lastName;
          setTechnicianName(response?.data?.technician.firstName);
          setbLogo(response?.data?.technician?.businessLogo)
          // Save technician name to AsyncStorage
          await AsyncStorage.setItem('technicianName', response?.data?.technician.firstName);
          await AsyncStorage.setItem('businessLogo', response?.data?.technician?.businessLogo);

        } catch (err) {
          console.log("dataerr", err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchTechnicianProfile();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      fetchDashboardCount()
      if (technicianType === "ifs") {
        fetchIFSCustomers();
      } else {
        fetchCustomers();
      }
    }, [technicianId])
  );

  const fetchDashboardCount = async (page = 1) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("Token not found!");
        return;
      }

      let apiUrl = "";
      let fetchOptions = {};
      console.log("technicianType", technicianType);

      if (technicianType === "manager") {
        apiUrl = `https://techrepairtracker.base2brand.com/api/deshboradCount?page=1&roleType=${technicianType}&limit=10
 `;
        fetchOptions = {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        };
      } else {
        apiUrl = `${API_BASE_URL}/appDeshboardCount?userId=${technicianId}`;
        fetchOptions = {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        };
      }

      const response = await fetch(apiUrl, fetchOptions);
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Response is not JSON. Possibly an error page:", e);
        return;
      }

      console.log("Dashboard Data:", data);

      if (data?.status) {
        setDashboardData(data?.count);
      } else {
        console.warn("No dashboard data found");
      }
    } catch (error) {
      console.error("Network error:::::::", error);
    }
  };

  const fetchCustomers = async (pageNum = 1) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token || !technicianId || !technicianType) return;
      const apiUrl = technicianType === "manager"
        ? `${API_BASE_URL}/fetchAllCustomer?page=${pageNum}&userId=${technicianId}&limit=10&roleType=${technicianType}`
        : technicianType === "ifs"
          ? `${API_BASE_URL}/fetchCustomer?page=${pageNum}&userId=${technicianId}&limit=10` :
          `${API_BASE_URL}/fetchCustomer?page=${pageNum}&userId=${technicianId}&limit=10&roleType=${technicianType}`;


      const response = await axios.get(
        apiUrl,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newCustomers = response?.data?.customers?.customers || [];

      // If page is 1, reset list. Else, append.
      if (pageNum === 1) {
        setCustomers(newCustomers);
      } else {
        setCustomers(prev => [...prev, ...newCustomers]);
      }

      // If less than 10 items fetched, no more data
      setHasMore(newCustomers.length === 10);
      setPage(pageNum);
      console.log("newCustomers", customers);

    } catch (error) {
      console.error("Error fetching customers:", error.response?.data || error.message);
    }
  };

  const fetchIFSCustomers = async (page) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("Token not found!");
        return;
      }

      const apiUrl = `${API_BASE_URL}/fetchAllTechnicianCustomer?userId=${technicianId}&page=${page}`;
      // const apiUrl = technicianType === "manager"
      //   ? `${API_BASE_URL}/fetchAllTechnicianCustomer?roleType=${technicianType}&page=${page}`
      //   : `${API_BASE_URL}/fetchAllTechnicianCustomer?userId=${technicianId}&page=${page}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      let uniqueCustomers = [];

      if (data.status && data.jobs?.jobs?.length > 0) {
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
          .filter(cust => cust);
        uniqueCustomers = [...ifscustomers, ...newCustomers].filter(
          (cust, index, self) => index === self.findIndex(c => c.id === cust.id)
        );
        console.log("uniqueCustomers", uniqueCustomers);
        setIfsCustomers(uniqueCustomers);
      } else {
        setIfsCustomers([]);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const capitalizetext = (name) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderItem = ({ item, index }) => {
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;

    const borderRadiusStyle = isIOSAndTablet
      ? {
        borderTopLeftRadius: index === 0 ? 30 : 0,
        borderTopRightRadius: index === 1 ? 30 : 0,
        borderBottomLeftRadius: index === 2 ? 30 : 0,
        borderBottomRightRadius: index === 3 ? 30 : 0,
        overflow: 'hidden',
      }
      : {};

    return (
      <ImageBackground
        source={item.backgroundImage}
        style={[
          styles.card,
          alignJustifyCenter,
          borderRadiusStyle,
          {
            width: isTablet ? wp(48) : wp(46),
            height:
              Platform.OS === "android"
                ? isTablet
                  ? hp(27.5)
                  : hp(22)
                : hp(20),
          },
        ]}
      >
        <Pressable style={alignJustifyCenter} onPress={item.onPress}>
          <Image source={item.image} style={[styles.cardImage, resizeModeContain]} />
          <Text
            style={[
              styles.cardText,
              {
                color: item.backgroundColor === orangeColor ? whiteColor : blackColor,
                // color: item.backgroundColor === orangeColor ? technicianType != "ifs" ? blackColor : whiteColor : blackColor,
                fontSize: isTablet ? style.fontSizeLarge.fontSize : style.fontSizeNormal2x.fontSize,

              },
            ]}
          >
            {item.name}
          </Text>
        </Pressable>
      </ImageBackground>
    );
  };

  // const renderCard = ({ item, index }) => (
  //   <TouchableOpacity style={[styles.actionCard, { backgroundColor: item.backgroundColor }]} onPress={item?.onPress}>
  //     <View
  //       style={{
  //         position: 'absolute',
  //         top: -wp(10),
  //         right: -wp(10),
  //         width: wp(25),
  //         height: wp(25),
  //         borderRadius: wp(25) / 2,
  //         backgroundColor: 'rgba(222, 219, 219, 0.45)',
  //         opacity: index === 0 ? .5 : 1
  //       }}
  //     />
  //     <View
  //       style={{
  //         position: 'absolute',
  //         bottom: -wp(10),
  //         left: -wp(14),
  //         width: wp(25),
  //         height: wp(25),
  //         borderRadius: wp(25) / 2,
  //         backgroundColor: '#cacaca58',
  //         transform: [{ scaleX: 1.3 }],
  //         opacity: index === 0 ? .6 : 1
  //       }}
  //     />
  //     <View style={[styles.cardContent, justifyContentSpaceBetween]}>
  //       <View style={[alignJustifyCenter, flexDirectionRow]}>
  //         <View style={{
  //           width: wp(12),
  //           height: wp(12),
  //           borderRadius: 8,
  //           marginRight: spacings.xxLarge,
  //           backgroundColor: (index === 0 ? '#cacaca58' : item?.color),
  //           borderColor: "#fff",
  //           borderWidth: .5,
  //           alignItems: "center",
  //           justifyContent: "center",
  //         }}>
  //           {/* <Image source={item?.image} style={styles.cardIcon} /> */}
  //           <item.iconComponent
  //             name={item.iconName}
  //             size={24}
  //             color="#fff"
  //           />
  //         </View>
  //         <View>
  //           <Text style={[styles.actionTitle, { color: item.backgroundColor === blueColor ? whiteColor : blackColor }]}>{item.name}</Text>
  //           <Text style={[styles.actionSubtitle, { color: item.backgroundColor === blueColor ? whiteColor : blackColor }]}>Tap to open</Text>
  //         </View>
  //       </View>
  //       <View style={{
  //         width: wp(8),
  //         height: wp(8),
  //         borderRadius: 8,
  //         marginRight: spacings.xxLarge,
  //         padding: spacings.small,
  //         backgroundColor: '#cacaca58',
  //         borderColor: "#cacacaff",
  //         borderWidth: .5,
  //         alignItems: "center",
  //         justifyContent: "center",
  //       }}>
  //         <Feather name="arrow-right" size={20} color={index === 0 ? '#fff' : item?.color} />
  //       </View>
  //     </View>
  //   </TouchableOpacity>
  // );
  const renderCard = ({ item, index }) => (
    <View style={styles.shadowWrapper}>
      <Pressable
        style={[styles.innerCard, { backgroundColor: item.backgroundColor }]}
        onPress={item?.onPress}
      >
        {/* Decorative Shapes */}
        <View
          style={{
            position: 'absolute',
            top: -wp(10),
            right: -wp(10),
            width: wp(25),
            height: wp(25),
            borderRadius: wp(25) / 2,
            backgroundColor: 'rgba(222, 219, 219, 0.45)',
            opacity: index === 0 ? 0.5 : 1
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -wp(10),
            left: -wp(14),
            width: wp(25),
            height: wp(25),
            borderRadius: wp(25) / 2,
            backgroundColor: '#cacaca58',
            transform: [{ scaleX: 1.3 }],
            opacity: index === 0 ? 0.6 : 1
          }}
        />

        {/* Main Content */}
        <View style={[styles.cardContent, justifyContentSpaceBetween]}>
          <View style={[alignJustifyCenter, flexDirectionRow]}>
            <View
              style={{
                width: wp(12),
                height: wp(12),
                borderRadius: 8,
                marginRight: spacings.xxLarge,
                backgroundColor: (item?.color),
                borderColor: "#fff",
                borderWidth: 0.5,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <item.iconComponent
                name={item.iconName}
                size={isTablet ? 35 : 24}
                color="#fff"
              />
            </View>
            <View>
              <Text
                style={[
                  styles.actionTitle,
                  { color: item.backgroundColor === blueColor ? whiteColor : blackColor, fontSize: isIOSAndTablet ? 20 : 16 }
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.actionSubtitle,
                  { color: item.backgroundColor === blueColor ? whiteColor : blackColor, fontSize: isIOSAndTablet ? 16 : 13 }
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
          <View
            style={{
              width: wp(8),
              height: wp(8),
              borderRadius: 8,
              marginRight: spacings.xxLarge,
              padding: spacings.small,
              backgroundColor: item?.color,
              borderColor: "#cacacaff",
              borderWidth: 0.5,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name="arrow-right"
              size={isTablet ? 25 : 20}
              color={whiteColor}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, flex]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: isTablet ? hp(5) : Platform.OS === "android" ? hp(5.5) : hp(5) }}>
          <ImageBackground source={HEADER_BACKGROUND} style={{
            resizeMode: "contain",
            height: isIOSAndTablet
              ? !isSearching
                ? hp(18)
                : hp(25)
              : isTablet
                ? !isSearching
                  ? hp(15.5)
                  : hp(21)
                : !isSearching
                  ? Platform.OS === "android" ? hp(30) : hp(22)
                  : Platform.OS === "android" ? hp(35.5) : hp(30),
            backgroundColor: !isTablet && Platform.OS === "ios" ? blueColor : "transparent"
          }}>
            <View style={[styles.header, { justifyContent: "space-between" }]}>
              {/* Left side */}
              {technicianType === "single-technician" ? (
                isSearching ? (
                  // 🔙 Back button
                  <Pressable
                    onPress={() => setIsSearching(false)}
                    style={{
                      borderRadius: 10,
                      backgroundColor: whiteColor,
                      borderColor: "#fff",
                      borderWidth: 0.5,
                      padding: spacings.large,
                    }}
                  >
                    <Feather name="arrow-left" size={25} color={blueColor} />
                  </Pressable>
                ) : (
                  // 👤 Profile button
                  <Pressable
                    onPress={() => navigation.navigate("ProfileStackScreen")}
                    style={{
                      borderRadius: 10,
                      backgroundColor:whiteColor,
                      borderColor: "#fff",
                      borderWidth: 0.5,
                      padding: spacings.large,
                    }}
                  >
                    <Feather name="user" size={25} color={blueColor} />
                  </Pressable>
                )
              ) : (
                // 👇 Not single tech → search mode me Back button left me
                isSearching ? (
                  <Pressable
                    onPress={() => setIsSearching(false)}
                    style={{
                      borderRadius: 10,
                      backgroundColor: whiteColor,
                      borderColor: "#fff",
                      borderWidth: 0.5,
                      padding: spacings.large,
                    }}
                  >
                    <Feather name="arrow-left" size={25} color={blueColor} />
                  </Pressable>
                ) : (
                  <View style={{ width: 50 }} /> // default empty
                )
              )}

              {/* Center logo */}
              <Image
                source={APP_NAME_IMAGE}
                style={[styles.profileImage, { resizeMode: "contain", width: isIOSAndTablet ? 80 : 50, height: isIOSAndTablet ? 80 : 50 }]}
              />

              {/* Right side */}
              {technicianType === "single-technician" ? (
                isSearching ? (
                  // 👤 Profile (when searching)
                  <Pressable
                    onPress={() => navigation.navigate("ProfileStackScreen")}
                    style={{
                      borderRadius: 10,
                      backgroundColor:whiteColor,
                      borderColor: "#fff",
                      borderWidth: 0.5,
                      padding: spacings.large,
                    }}
                  >
                    <Feather name="user" size={25} color={blueColor} />
                  </Pressable>
                ) : (
                  // 🔍 Search
                  <Pressable
                    onPress={() => setIsSearching(true)}
                    style={{
                      borderRadius: 10,
                      backgroundColor: whiteColor,
                      borderColor: "#fff",
                      borderWidth: 0.5,
                      padding: spacings.large,
                    }}
                  >
                    <Feather name="search" size={25} color={blueColor} />
                  </Pressable>
                )
              ) : (
                // 👇 Not single tech → search mode me right side empty
                isSearching ? (
                  <View style={{ width: 50 }} />
                ) : (
                  // Default → Search icon
                  <Pressable
                    onPress={() => setIsSearching(true)}
                    style={{
                      borderRadius: 10,
                      backgroundColor: whiteColor,
                      borderColor: "#fff",
                      borderWidth: 0.5,
                      padding: spacings.large,
                    }}
                  >
                    <Feather name="search" size={25} color={blueColor} />
                  </Pressable>
                )
              )}
            </View>

            {isSearching && (
              <Pressable style={[styles.searchTextInput, { height: isTablet ? hp(4) : hp(4.8), }]}
                onPress={async () => {
                  if (technicianType === "ifs") {
                    try {
                      const currentJob = await AsyncStorage.getItem("current_Job");

                      if (ifscustomers.length === 0) {
                        Toast.show("You don't have any assigned job currently.");
                      } else if (!currentJob) {
                        Toast.show("Please select a job from the jobs page first.");
                      } else {
                        navigation.navigate("ScannerScreen", {
                          from: "VinList"
                        });
                      }
                    } catch (error) {
                      console.error("Error checking current job:", error);
                    }
                  } else {
                    navigation.navigate("ScannerScreen", {
                      from: "VinList"
                    });
                  }
                }}
              >
                <View style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                  <Text style={{ color: grayColor }}>Search By Scan VIN</Text>
                  <MaterialIcons name="qr-code-scanner" size={24} color="#252837" />
                </View>
              </Pressable>)}

            <View style={styles.totalOverview}>
              <Text style={[styles.greeting, {
                color: blackColor,
                textAlign: "center",
                fontSize: isIOSAndTablet
                  ? style.fontSizeMedium2x.fontSize
                  : isTablet
                    ? style.fontSizeMedium.fontSize
                    : style.fontSizeNormal2x.fontSize,
              }]}>
                Total Overview
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacings.large }}>
                {/* Active Jobs */}
                <View style={styles.overviewCard}>
                  {/* <View style={styles.overviewCardIcon}>
                    <Ionicons name="bag-add-outline" size={25} color='#FF5733' />
                  </View> */}
                  <Text style={[styles.overviewNumber, {
                    color: '#FF5733',
                    fontSize: isIOSAndTablet ? style.fontSizeMedium2x.fontSize : style.fontSizeNormal2x.fontSize
                  }]}>
                    {technicianType === "manager"
                      ? (dashboardData?.jobsuperadmin ?? 0)
                      : (dashboardData?.AppJobCount ?? 0)}
                  </Text>
                  <Text style={[styles.overviewText,
                  {
                    fontSize:
                      isIOSAndTablet
                        ? style.fontSizeMedium.fontSize
                        : isTablet
                          ? style.fontSizeNormal1x.fontSize
                          : style.fontSizeSmall2x.fontSize,
                  }]}>
                    Active Jobs
                  </Text>
                </View>

                {/* Customers */}
                <View style={styles.overviewCard}>
                  {/* <View style={styles.overviewCardIcon}>
                    <Feather name="users" size={25} color='#28A745' />
                  </View> */}
                  <Text style={[styles.overviewNumber, {
                   color: '#8A2BE2',
                    fontSize: isIOSAndTablet ? style.fontSizeMedium2x.fontSize : style.fontSizeNormal2x.fontSize
                  }]}>
                    {technicianType === "manager"
                      ? (dashboardData?.Customersuperadmin ?? 0)
                      : (dashboardData?.AppCustomerCount ?? 0)}
                  </Text>
                  <Text style={[styles.overviewText,
                  {
                    fontSize:
                      isIOSAndTablet
                        ? style.fontSizeMedium.fontSize
                        : isTablet
                          ? style.fontSizeNormal1x.fontSize
                          : style.fontSizeSmall2x.fontSize,
                  }]}>Customers</Text>
                </View>

                {/* Vehicles */}
                <View style={styles.overviewCard}>
                  {/* <View style={styles.overviewCardIcon}>
                    <Ionicons name="car-outline" size={25} color='#8A2BE2' />
                  </View> */}
                  <Text style={[styles.overviewNumber, {
                    color: '#e2682bff', fontSize: isIOSAndTablet ? style.fontSizeMedium2x.fontSize : style.fontSizeNormal2x.fontSize
                  }]}>
                    {technicianType === "manager"
                      ? (dashboardData?.Vehiclesuperadmin ?? 0)
                      : (dashboardData?.AppVehicleCount ?? 0)}
                  </Text>
                  <Text style={[styles.overviewText,
                  {
                    fontSize:
                      isIOSAndTablet
                        ? style.fontSizeMedium.fontSize
                        : isTablet
                          ? style.fontSizeNormal1x.fontSize
                          : style.fontSizeSmall2x.fontSize,
                  }]}>Vehicles</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>
        <FlatList
          data={cardData}
          renderItem={renderCard}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    // padding: spacings.large,
    backgroundColor: whiteColor
  },
  searchTextInput: {
    flexDirection: 'row',
    backgroundColor: whiteColor,
    borderRadius: 8,
    paddingHorizontal: spacings.xxLarge,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    marginTop: spacings.Large2x,
    marginHorizontal: spacings.xxLarge
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: blueColor,
  },
  iconContainer: {
    paddingLeft: spacings.large,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacings.xxxLarge,
    paddingTop: spacings.xxxLarge,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: "center",
    justifyContent: "center"
  },
  profileImage: {
    borderRadius: 8,
    marginRight: spacings.xxLarge,
    padding: spacings.small,
    backgroundColor: '#cacaca58',
    borderColor: "#fff",
    borderWidth: .5
  },
  greeting: {
    color: '#fff',
    fontSize: style.fontSizeNormal2x.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
  },
  subtitle: {
    color: '#ddd',
    fontSize: style.fontSizeNormal.fontSize,
    paddingVertical: spacings.small
  },
  totalOverview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacings.xxxLarge,
    margin: spacings.xxxLarge,
    elevation: 5,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  overviewCard: {
    alignItems: 'center',
  },
  overviewCardIcon: {
    backgroundColor: '#cacaca58',
    borderRadius: 12,
    padding: spacings.xxxLarge,
    margin: spacings.xxxLarge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  overviewNumber: {
    fontSize: style.fontSizeNormal2x.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
  },
  overviewText: {
    fontSize: style.fontSizeSmall2x.fontSize,
    color: '#555',
    marginTop: 4,
  },
  actionCard: {
    borderRadius: 12,
    padding: spacings.xxxLarge,
    marginBottom: spacings.xxLarge,
    marginHorizontal: spacings.xxxxLarge,
    elevation: 5,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: wp(10),
    height: wp(10),
    resizeMode: "contain"
  },

  shadowWrapper: {
    borderRadius: 12,
    marginBottom: spacings.xxLarge,
    marginHorizontal: spacings.xxxxLarge,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  innerCard: {
    borderRadius: 12,
    padding: spacings.xxxLarge,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#f2f2f2',
    marginTop: 4,
  },
});