import { Image, StyleSheet, Text, TouchableOpacity, View, Pressable, FlatList, ImageBackground, Platform, Dimensions, Alert, ToastAndroid, TextInput, ScrollView } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { blackColor, blueColor, ExtraExtralightOrangeColor, grayColor, lightBlueColor, lightGrayColor, lightOrangeColor, orangeColor, redColor, whiteColor } from '../constans/Color';
import { ADD_CASTUMER_BACK_IMAGE, ADD_CASTUMER_TAB_BACK_IMAGE, ADD_CASTUMER_TAB_WHITE_BACK_IMAGE, ADD_CASTUMER_WHITE_BACK_IMAGE, ADD_VEHICLE_BACK_IMAGE, ADD_VEHICLE_IMAGE, ADD_VEHICLE_TAB_BACK_IMAGE, APP_ICON_IMAGE, APP_NAME_IMAGE, CARD_BACKGROUND, CAROUSAL_ONE_IMAGE, CAROUSAL_THREE_IMAGE, CAROUSAL_TWO_IMAGE, CIRLE_SCANNER_IMAGE, HEADER_BACKGROUND, HOW_TO_PLAY_BACK_IMAGE, HOW_TO_PLAY_TAB_BACK_IMAGE, HOW_TO_USE_IMAGE, JOB_HISTORY_BACK_IMAGE, JOB_HISTORY_IMAGE, JOB_HISTORY_TAB_BACK_IMAGE, NEW_CLIENT_IMAGE, NEW_WORK_ORDER_IMAGE, VIN_LIST_IMAGE } from '../assests/images';
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
import { useOrientation } from '../OrientationContext';

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
  const [searchVinText, setSearchVinText] = useState('');
  const [vinSearchResults, setVinSearchResults] = useState(null);
  const [isSearchingVin, setIsSearchingVin] = useState(false);
  const [allVehicles, setAllVehicles] = useState([]);
  const { orientation } = useOrientation();
  const [selectedCard, setSelectedCard] = useState(null);

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
      // color: '#3B6981',
      color: blackColor,

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
      color: blackColor,
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
      // color: '#3B6981',
      color: blackColor,
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

          // load last selected home card
          const lastSelected = await AsyncStorage.getItem('home_selected_card');
          if (lastSelected) {
            setSelectedCard(lastSelected);
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
      // Clear search states when screen comes into focus
      setIsSearching(false);
      setSearchVinText('');
      setVinSearchResults(null);
      setIsSearchingVin(false);

      // Only fetch dashboard count if technicianId and technicianType are available
      if ((technicianType === "manager" || (technicianId && technicianId !== '' && !isNaN(technicianId))) && technicianType) {
        fetchDashboardCount();
      }
      
      if (technicianType === "ifs") {
        fetchIFSCustomers();
      } else if (technicianId && technicianId !== '' && !isNaN(technicianId)) {
        fetchCustomers();
      }
    }, [technicianId, technicianType])
  );

  const fetchDashboardCount = async (page = 1) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("Token not found!");
        return;
      }

      // Validate technicianId for non-manager types
      if (technicianType !== "manager") {
        // Check if technicianId is valid (not empty, not undefined, and is a valid number)
        if (!technicianId || technicianId === '' || technicianId === 'undefined' || isNaN(technicianId)) {
          console.log("Waiting for valid technicianId...", technicianId);
          return;
        }
      }

      // Validate technicianType is set
      if (!technicianType || technicianType === '') {
        console.log("Waiting for technicianType...");
        return;
      }

      let apiUrl = "";
      let fetchOptions = {};
      console.log("technicianType", technicianType, "technicianId", technicianId);

      if (technicianType === "manager") {
        apiUrl = `https://techrepairtracker.base2brand.com/api/deshboradCount?page=1&roleType=${technicianType}&limit=10`;
        fetchOptions = {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        };
      } else {
        // Ensure technicianId is a valid number string
        const validTechnicianId = String(technicianId).trim();
        if (!validTechnicianId || isNaN(validTechnicianId)) {
          console.error("Invalid technicianId:", technicianId);
          return;
        }
        apiUrl = `${API_BASE_URL}/appDeshboardCount?userId=${validTechnicianId}`;
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

  const fetchAllVehicles = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("Token not found!");
        return;
      }

      // Use the same API as VinListScreen
      const apiUrl = technicianType === "manager"
        ? `${API_BASE_URL}/fetchVehicalInfo?page=1&roleType=${technicianType}&limit=1000`
        : technicianType === "ifs"
          ? `${API_BASE_URL}/fetchtechVehicleInfo?page=1&userId=${technicianId}&limit=1000`
          : `${API_BASE_URL}/fetchVehicalInfo?page=1&roleType=${technicianType}&userId=${technicianId}&limit=1000`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const vehicles = response?.data?.jobs?.vehicles || response.data?.response?.vehicles || [];
      console.log("Fetched all vehicles for search:", vehicles);
      setAllVehicles(vehicles);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    }
  };

  const searchVinByText = async (vinText) => {
    if (!vinText.trim()) {
      setVinSearchResults(null);
      return;
    }

    setIsSearchingVin(true);
    try {
      // If we don't have vehicles loaded yet, fetch them first
      // if (allVehicles.length === 0) {
      await fetchAllVehicles();
      // }

      // Filter vehicles based on search text
      const filteredVehicles = allVehicles.filter(vehicle =>
        vehicle.vin?.toLowerCase().includes(vinText.trim().toLowerCase())
        // ||
        // vehicle.make?.toLowerCase().includes(vinText.trim().toLowerCase()) ||
        // vehicle.model?.toLowerCase().includes(vinText.trim().toLowerCase()) ||
        // vehicle.jobName?.toLowerCase().includes(vinText.trim().toLowerCase())
      );


      if (filteredVehicles.length > 0) {
        // Show the first matching vehicle
        setVinSearchResults(filteredVehicles[0]);
      } else {
        // Show "No result found" when no matches
        setVinSearchResults({ noResult: true });
      }
    } catch (error) {
      console.error("Error searching VIN:", error);
      setVinSearchResults(null);
    } finally {
      setIsSearchingVin(false);
    }
  };

  const handleVinTextChange = (text) => {
    setSearchVinText(text);

    // Clear results immediately when text is cleared or empty
    if (!text || !text.trim()) {
      setVinSearchResults(null);
      setIsSearchingVin(false);
      return;
    }

    // Search automatically as user types
    searchVinByText(text.trim());
  };

  const openScanner = async () => {
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

  const renderCard = ({ item, index }) => (
    <View style={styles.shadowWrapper}>
      {selectedCard === item.name ? (
        <LinearGradient
          colors={['#8B0000', '#dc2626e2', '#2D1B1B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.innerCard, { backgroundColor: blackColor, padding: 0 }]}
        >
          <Pressable
            onPress={async () => {
              try {
                setSelectedCard(item.name);
                await AsyncStorage.setItem('home_selected_card', item.name);
              } catch (e) { }
              item?.onPress && item.onPress();
            }}
            style={[styles.innerCard]}
          >
            {/* Main Content */}
            <View style={[styles.cardContent, justifyContentSpaceBetween]}>
              <View style={[alignJustifyCenter, flexDirectionRow]}>
                <View
                  style={{
                    width: wp(12),
                    height: wp(12),
                    borderRadius: 8,
                    marginRight: spacings.xxLarge,
                    backgroundColor: 'red', // Even darker red for icon background like image
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
                      {
                        color: whiteColor,
                        fontSize: isIOSAndTablet ? 20 : 16
                      }
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.actionSubtitle,
                      {
                        color: whiteColor,
                        fontSize: isIOSAndTablet ? 16 : 13
                      }
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
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name="arrow-right"
                  size={isTablet ? 25 : 23}
                  color={whiteColor}
                />
              </View>
            </View>
          </Pressable>
        </LinearGradient>
      ) : (
        <Pressable
          style={[styles.innerCard, { backgroundColor: "#1b1b1bff" }]}
          onPress={async () => {
            try {
              setSelectedCard(item.name);
              await AsyncStorage.setItem('home_selected_card', item.name);
            } catch (e) { }
            item?.onPress && item.onPress();
          }}
        >
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
                    {
                      color: whiteColor,
                      fontSize: isIOSAndTablet ? 20 : 16
                    }
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    {
                      color: whiteColor,
                      fontSize: isIOSAndTablet ? 16 : 13
                    }
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
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather
                name="arrow-right"
                size={isTablet ? 25 : 23}
                color={whiteColor}
              />
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.container, flex]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: isTablet ? hp(5) : Platform.OS === "android" ? hp(2) : hp(5) }}>
          {/* <ImageBackground source={HEADER_BACKGROUND} style={{
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
                  : Platform.OS === "android" ? hp(37.5) : hp(30),
            backgroundColor: !isTablet && Platform.OS === "ios" ? blueColor : "transparent"
          }}> */}
          <View style={[styles.header, { justifyContent: "space-between" }]}>
            {/* Left side */}
            {technicianType === "single-technician" ? (
              isSearching ? (
                // 🔙 Back button
                <Pressable
                  onPress={() => {
                    setIsSearching(false);
                    setSearchVinText('');
                    setVinSearchResults(null);
                  }}
                  style={{
                    borderRadius: 10,
                    // backgroundColor: whiteColor,
                    // borderColor: "#fff",
                    // borderWidth: 0.5,
                    padding: spacings.large,
                    height: hp(6.5)
                  }}
                >
                  <Feather name="arrow-left" size={25} color={whiteColor} />
                </Pressable>
              ) : (
                // 👤 Profile button
                <Pressable
                  onPress={() => navigation.navigate("ProfileStackScreen")}
                  style={{
                    borderRadius: 10,
                    // backgroundColor: whiteColor,
                    // borderColor: "#fff",
                    // borderWidth: 0.5,
                    padding: spacings.large,
                    height: hp(6.5)
                  }}
                >
                  <Feather name="user" size={25} color={whiteColor} />
                </Pressable>
              )
            ) : (
              // 👇 Not single tech → search mode me Back button left me
              isSearching ? (
                <Pressable
                  onPress={() => {
                    setIsSearching(false);
                    setSearchVinText('');
                    setVinSearchResults(null);
                  }}
                  style={{
                    borderRadius: 10,
                    // backgroundColor: whiteColor,
                    // borderColor: "#fff",
                    // borderWidth: 0.5,
                    padding: spacings.large,
                    height: hp(6.5)
                  }}
                >
                  <Feather name="arrow-left" size={25} color={whiteColor} />
                </Pressable>
              ) : (
                <View style={{ width: 50 }} /> // default empty
              )
            )}

            {/* Center logo */}
            <Image
              source={APP_ICON_IMAGE}
              style={[styles.profileImage, { resizeMode: "contain", width: isIOSAndTablet ? wp(35) : wp(30), height: isIOSAndTablet ? hp(10) : hp(10) }]}
            />

            {/* Right side */}
            {technicianType === "single-technician" ? (
              isSearching ? (
                // 👤 Profile (when searching)
                <Pressable
                  onPress={() => navigation.navigate("ProfileStackScreen")}
                  style={{
                    borderRadius: 10,
                    // backgroundColor: whiteColor,
                    // borderColor: "#fff",
                    // borderWidth: 0.5,
                    padding: spacings.large,
                    height: hp(6.5)
                  }}
                >
                  <Feather name="user" size={25} color={whiteColor} />
                </Pressable>
              ) : (
                // 🔍 Search
                <Pressable
                  onPress={() => setIsSearching(true)}
                  style={{
                    borderRadius: 10,
                    // backgroundColor: whiteColor,
                    // borderColor: "#fff",
                    // borderWidth: 0.5,
                    padding: spacings.large,
                    height: hp(6.5)
                  }}
                >
                  <Feather name="search" size={25} color={whiteColor} />
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
                    // backgroundColor: whiteColor,
                    // borderColor: "#fff",
                    // borderWidth: 0.5,
                    padding: spacings.large,
                    height: hp(6.5)
                  }}
                >
                  <Feather name="search" size={25} color={whiteColor} />
                </Pressable>
              )
            )}
          </View>
          <Text style={{ color: whiteColor, fontWeight: style.fontWeightThin1x.fontWeight, textAlign: "center", fontSize: style.fontSizeLarge1x.fontSize, paddingTop: spacings.large }}>Prorevv</Text>

          {isSearching && (
            <View style={styles.searchContainer}>
              <View style={[styles.searchTextInput, { height: isTablet ? hp(4) : hp(5.5), flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                <TextInput
                  placeholder="Enter VIN number"
                  placeholderTextColor={grayColor}
                  style={[styles.input, { flex: 1, fontSize: 16, color: blackColor }]}
                  value={searchVinText}
                  onChangeText={handleVinTextChange}
                  autoCapitalize="characters"
                />
                {searchVinText.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchVinText('');
                      setVinSearchResults(null);
                    }}
                    style={{ marginRight: spacings.small }}
                  >
                    <Feather name="x" size={20} color={blackColor} />
                  </TouchableOpacity>
                ) : isSearchingVin ? (
                  <Feather
                    name="loader"
                    size={20}
                    color={blackColor}
                    style={{ marginRight: spacings.small }}
                  />
                ) : null}
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={openScanner}
                >
                  <MaterialIcons name="qr-code-scanner" size={24} color="#252837" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* VIN Search Results - Show above search input */}
          {isSearching && vinSearchResults && searchVinText.trim() && (
            <Pressable style={[styles.vinResultsContainer,
            {
              top: isTablet ?
                Platform.OS === 'ios' ? orientation === "LANDSCAPE" ? hp(22.5) : hp(21) : hp(21) : Platform.OS === 'ios' ? hp(25.5) : hp(27.5)
            }]} onPress={() => {
              if (vinSearchResults && !vinSearchResults.noResult) {
                navigation.navigate("VehicleDetailsScreen", {
                  vehicleId: vinSearchResults.id,
                });
              }
            }}>
              {vinSearchResults.noResult ? (
                <View style={styles.noResultContainer}>
                  <Text style={styles.noResultText}>No result found</Text>
                  <Text style={styles.noResultSubText}>Try searching with a different VIN number</Text>
                </View>
              ) : (
                <View style={styles.vinDetailsCard}>
                  <View style={styles.vinDetailRow}>
                    <Text style={styles.vinDetailLabel}>VIN:</Text>
                    <Text style={styles.vinDetailValue}>{vinSearchResults.vin}</Text>
                  </View>
                  <View style={styles.vinDetailRow}>
                    <Text style={styles.vinDetailLabel}>Make:</Text>
                    <Text style={styles.vinDetailValue}>{vinSearchResults.make || 'N/A'}</Text>
                  </View>
                  <View style={styles.vinDetailRow}>
                    <Text style={styles.vinDetailLabel}>Model:</Text>
                    <Text style={styles.vinDetailValue}>{vinSearchResults.model || 'N/A'}</Text>
                  </View>
                  <View style={styles.vinDetailRow}>
                    <Text style={styles.vinDetailLabel}>Customer:</Text>
                    <Text style={styles.vinDetailValue}>
                      {vinSearchResults.customer ? vinSearchResults.customer.fullName || 'N/A' : 'No result found'}
                    </Text>
                  </View>
                </View>
              )}
            </Pressable>
          )}

          <View style={styles.totalOverview}>
            <Text style={[styles.greeting, {
              color: whiteColor,
              textAlign: "center",
              fontSize: isIOSAndTablet
                ? style.fontSizeMedium2x.fontSize
                : isTablet
                  ? style.fontSizeMedium.fontSize
                  : style.fontSizeNormal2x.fontSize,
            }]}>
              Total Overview
            </Text>
            <View style={{ flexDirection: "row", justifyContent: technicianType != "ifs" ? "space-between" : "space-around", marginTop: spacings.large }}>
              {/* Active Jobs */}
              <Pressable style={styles.overviewCard} onPress={() => { navigation.navigate("CreateJobScreen") }}>
                {/* <View style={styles.overviewCardIcon}>
                    <Ionicons name="bag-add-outline" size={25} color='#FF5733' />
                  </View> */}
                <Text style={[styles.overviewNumber, {
                  color: 'red',
                  fontSize: isIOSAndTablet ? style.fontSizeMedium2x.fontSize : style.fontSizeLarge1x.fontSize
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
              </Pressable>

              {/* Customers */}
              {technicianType != "ifs" && <Pressable style={styles.overviewCard} onPress={() => { navigation.navigate("CustomerInfo") }}>
                {/* <View style={styles.overviewCardIcon}>
                    <Feather name="users" size={25} color='#28A745' />
                  </View> */}
                <Text style={[styles.overviewNumber, {
                  color: 'red',
                  fontSize: isIOSAndTablet ? style.fontSizeMedium2x.fontSize : style.fontSizeLarge1x.fontSize
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
              </Pressable>}

              {/* Vehicles */}
              <Pressable style={styles.overviewCard} onPress={() => { navigation.navigate("VinListScreen") }}>
                {/* <View style={styles.overviewCardIcon}>
                    <Ionicons name="car-outline" size={25} color='#8A2BE2' />
                  </View> */}
                <Text style={[styles.overviewNumber, {
                  color: 'red', fontSize: isIOSAndTablet ? style.fontSizeMedium2x.fontSize : style.fontSizeLarge1x.fontSize
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
              </Pressable>
            </View>
          </View>
          {/* </ImageBackground> */}
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
    backgroundColor: blackColor
  },
  searchContainer: {
    marginTop: spacings.Large2x,
    marginHorizontal: spacings.xxLarge,
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
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: blackColor,
  },
  scanButton: {
    padding: spacings.small,
    marginLeft: spacings.small,
  },
  vinResultsContainer: {
    position: 'absolute',
    left: spacings.large,
    right: spacings.large,
    backgroundColor: whiteColor,
    borderRadius: 8,
    padding: spacings.large,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  noResultContainer: {
    alignItems: 'center',
    paddingVertical: spacings.large,
  },
  noResultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: redColor,
    marginBottom: spacings.small,
  },
  noResultSubText: {
    fontSize: 14,
    color: grayColor,
    textAlign: 'center',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: blackColor,
    marginBottom: spacings.large,
    textAlign: 'center',
  },
  vinDetailsCard: {
    backgroundColor: lightGrayColor,
    borderRadius: 8,
    padding: spacings.large,
  },
  vinDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacings.small,
    borderBottomWidth: 1,
    borderBottomColor: grayColor,
  },
  vinDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: blackColor,
    flex: 1,
  },
  vinDetailValue: {
    fontSize: 14,
    color: blackColor,
    flex: 2,
    textAlign: 'right',
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
    // alignItems: "center",
    justifyContent: "center"
  },
  profileImage: {
    borderRadius: 8,
    // marginRight: spacings.xxLarge,
    padding: spacings.small,
    // backgroundColor: '#cacaca58',
    // borderColor: "#fff",
    // borderWidth: .5
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
    backgroundColor: blackColor,
    borderRadius: 12,
    padding: spacings.xxxLarge,
    marginHorizontal: spacings.xxxLarge,
    marginTop: spacings.large,
    // elevation: 5,
    // iOS shadow
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.15,
    // shadowRadius: 8,
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
    color: whiteColor,
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
    marginHorizontal: spacings.small2x,
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