import { Image, StyleSheet, Text, TouchableOpacity, View, Pressable, FlatList, ImageBackground, Platform, Dimensions, Alert, ToastAndroid, TextInput } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { blackColor, blueColor, ExtraExtralightOrangeColor, grayColor, lightBlueColor, lightGrayColor, lightOrangeColor, orangeColor, whiteColor } from '../constans/Color';
import { ADD_CASTUMER_BACK_IMAGE, ADD_CASTUMER_TAB_BACK_IMAGE, ADD_CASTUMER_TAB_WHITE_BACK_IMAGE, ADD_CASTUMER_WHITE_BACK_IMAGE, ADD_VEHICLE_BACK_IMAGE, ADD_VEHICLE_IMAGE, ADD_VEHICLE_TAB_BACK_IMAGE, APP_NAME_IMAGE, CAROUSAL_ONE_IMAGE, CAROUSAL_THREE_IMAGE, CAROUSAL_TWO_IMAGE, CIRLE_SCANNER_IMAGE, HOW_TO_PLAY_BACK_IMAGE, HOW_TO_PLAY_TAB_BACK_IMAGE, HOW_TO_USE_IMAGE, JOB_HISTORY_BACK_IMAGE, JOB_HISTORY_IMAGE, JOB_HISTORY_TAB_BACK_IMAGE, NEW_CLIENT_IMAGE, NEW_WORK_ORDER_IMAGE, VIN_LIST_IMAGE } from '../assests/images';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import { API_BASE_URL, JOB_HISTORY, NEW_CLIENT, NEW_WORK_ORDER } from '../constans/Constants';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';

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

  const cardData = [
    {
      name: technicianType === "ifs" ? "Jobs" : "Customer",
      image: technicianType === "ifs" ? NEW_WORK_ORDER_IMAGE : NEW_CLIENT_IMAGE,
      backgroundColor: orangeColor,
      onPress: () => {
        if (technicianType === "ifs") {
          navigation.navigate("WorkOrderScreen");
        } else {
          navigation.navigate("CustomerInfo");
        }
      },
      backgroundImage: isTablet ? ADD_CASTUMER_TAB_BACK_IMAGE : ADD_CASTUMER_BACK_IMAGE

    },
    {
      name: technicianType === "ifs" ? "Scan Vin" : "Jobs",
      image: technicianType === "ifs" ? CIRLE_SCANNER_IMAGE : NEW_WORK_ORDER_IMAGE,
      backgroundColor: ExtraExtralightOrangeColor,
      // onPress: () => { navigation.navigate("ScannerScreen"); },
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
      backgroundImage: isTablet ? ADD_VEHICLE_TAB_BACK_IMAGE : ADD_VEHICLE_BACK_IMAGE
    },
    {
      name: technicianType === "ifs" ? "Vin List" : "Vehicle",
      image: technicianType === "ifs" ? VIN_LIST_IMAGE : ADD_VEHICLE_IMAGE,
      backgroundColor: ExtraExtralightOrangeColor,
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
      backgroundImage: isTablet ? JOB_HISTORY_TAB_BACK_IMAGE : JOB_HISTORY_BACK_IMAGE
    },
    {
      name: technicianType === "ifs" ? "Reports" : "Scan Vin",
      image: technicianType === "ifs" ? JOB_HISTORY_IMAGE : CIRLE_SCANNER_IMAGE,
      backgroundColor: ExtraExtralightOrangeColor,
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
      backgroundImage: isTablet ? HOW_TO_PLAY_TAB_BACK_IMAGE : HOW_TO_PLAY_BACK_IMAGE
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
      if (technicianType === "ifs") {
        fetchIFSCustomers();
      } else {
        fetchCustomers();
      }
    }, [technicianId])
  );

  const fetchCustomers = async (pageNum = 1) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token || !technicianId || !technicianType) return;

      // const apiUrl = technicianType === "manager"
      //   ? `${API_BASE_URL}/fetchAllCustomer?page=${pageNum}&userId=${technicianId}&limit=10&roleType=${technicianType}`
      //   : `${API_BASE_URL}/fetchCustomer?page=${pageNum}&userId=${technicianId}&limit=10`;

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

  return (
    <View style={[styles.container, flex]}>
      <View style={[styles.logoContainer, alignItemsCenter, {
        height: Platform.OS === "android" ? isTablet ? hp(12) : hp(17) : isIOSAndTablet ? hp(12) : hp(14),
      }]}>
        <Text style={[styles.title, textAlign]}>👋 Hi, {capitalizetext(technicianName)}</Text>
        {technicianType === "single-technician" && <Pressable
          onPress={() => navigation.navigate("ProfileStackScreen")}
          style={{
            borderRadius: 30,
            position: "absolute",
            right: 10,
            top: 10,
          }}
        >
          <Feather name="user" size={30} color={whiteColor} />
        </Pressable>}
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

        // onPress={() => navigation.navigate("ScannerScreen", {
        //   from: "VinList"
        // })}

        >
          <View style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
            <Text style={{ color: grayColor }}>Search By Scan VIN</Text>
            <AntDesign name="scan1" size={24} color="#252837" />
          </View>
        </Pressable>
      </View>

      <View style={{ width: "100%", height: "55%", marginTop: 20, paddingHorizontal: spacings.large }}>
        <FlatList
          data={cardData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />

        {/* Center Circular Logo */}
        <Pressable style={[styles.logoCircle, {
          top: Platform.OS === "android" ? (isTablet ? hp(21.5) : hp(17.5)) : isTablet ? hp(12) : hp(15.8),
          left: Platform.OS === "android" ? (isTablet ? wp(39) : wp(39.5)) : isTablet ? wp(38) : wp(39.4),
        }]}
        >
          {/* {bLogo ? (
            <Image
              source={{ uri: bLogo }}
              style={[
                styles.logo,
                (Platform.OS === "ios" && isTablet) && {
                  borderWidth: 8,
                  borderColor: whiteColor,
                  borderRadius: 1000, // circular ke liye large radius
                }
              ]}
            />
          ) : ( */}
          <Image
            source={APP_NAME_IMAGE}
            style={[
              styles.logo,
              (Platform.OS === "ios" && isTablet) && {
                borderWidth: 8,
                borderColor: whiteColor,
                borderRadius: 1000,
              }
            ]}
          />
          {/* )} */}

        </Pressable>
      </View>

    </View >
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    // padding: spacings.large,
    backgroundColor: whiteColor
  },
  logoContainer: {
    backgroundColor: blueColor,
    padding: spacings.large,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  title: {
    fontSize: style.fontSizeLarge1x.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
    color: whiteColor,
  },
  card: {
    width: wp(48),
    margin: spacings.small,
    height: Platform.OS === "android" ? hp(28) : hp(20),
    resizeMode: "cover"
  },
  cardImage: {
    width: wp(15),
    height: hp(10),
  },
  cardText: {
    fontSize: style.fontSizeNormal2x.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
  },
  logoCircle: {
    position: 'absolute',
    width: wp(12) * 2,
    height: wp(12) * 2,
  },
  logo: {
    width: '90%',
    height: '90%',
    borderRadius: 100,
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
    marginHorizontal: spacings.xLarge
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: blueColor,
  },
  iconContainer: {
    paddingLeft: spacings.large,
  },
});