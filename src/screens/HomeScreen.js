import { Image, StyleSheet, Text, TouchableOpacity, View, Pressable, FlatList, ImageBackground, Platform, Dimensions, Alert, ToastAndroid, TextInput } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { blackColor, blueColor, ExtraExtralightOrangeColor, grayColor, lightBlueColor, lightOrangeColor, orangeColor, whiteColor } from '../constans/Color';
import { ADD_CASTUMER_BACK_IMAGE, ADD_CASTUMER_TAB_BACK_IMAGE, ADD_VEHICLE_BACK_IMAGE, ADD_VEHICLE_IMAGE, ADD_VEHICLE_TAB_BACK_IMAGE, APP_NAME_IMAGE, CAROUSAL_ONE_IMAGE, CAROUSAL_THREE_IMAGE, CAROUSAL_TWO_IMAGE, CIRLE_SCANNER_IMAGE, HOW_TO_PLAY_BACK_IMAGE, HOW_TO_PLAY_TAB_BACK_IMAGE, HOW_TO_USE_IMAGE, JOB_HISTORY_BACK_IMAGE, JOB_HISTORY_IMAGE, JOB_HISTORY_TAB_BACK_IMAGE, NEW_CLIENT_IMAGE, NEW_WORK_ORDER_IMAGE, VIN_LIST_IMAGE } from '../assests/images';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import { API_BASE_URL, JOB_HISTORY, NEW_CLIENT, NEW_WORK_ORDER } from '../constans/Constants';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import Toast from 'react-native-simple-toast';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { generateFilePath } from 'react-native-compressor';
const { width, height } = Dimensions.get('window');

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign } = BaseStyle;

const HomeScreen = ({ navigation }) => {
  const [technicianName, setTechnicianName] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [technicianType, setTechnicianType] = useState('');
  const [bLogo, setbLogo] = useState(null);
  // const [activeIndex, setActiveIndex] = useState(0);
  const isTablet = width >= 668 && height >= 1024;
  const isAndroidAndTablet = Platform.OS === "android" && isTablet;
  // const [banners, setBanners] = useState([]);


  const cardData = [
    {
      name: "Jobs",
      image: NEW_WORK_ORDER_IMAGE,
      backgroundColor: orangeColor,
      onPress: () => { navigation.navigate("WorkOrderScreen") },
      backgroundImage: isTablet ? ADD_CASTUMER_TAB_BACK_IMAGE : ADD_CASTUMER_BACK_IMAGE
    },
    {
      name: "Scan Vin",
      image: ADD_VEHICLE_IMAGE,
      backgroundColor: ExtraExtralightOrangeColor,
      // onPress: () => { navigation.navigate("JobHistory") },
      onPress: () => { navigation.navigate("ScannerScreen"); },
      backgroundImage: isTablet ? ADD_VEHICLE_TAB_BACK_IMAGE : ADD_VEHICLE_BACK_IMAGE
    },
    {
      name: "Vin List",
      image: VIN_LIST_IMAGE,
      backgroundColor: ExtraExtralightOrangeColor,
      onPress: () => { navigation.navigate("VinListScreen"); },

      backgroundImage: isTablet ? JOB_HISTORY_TAB_BACK_IMAGE : JOB_HISTORY_BACK_IMAGE

    },

    {
      name: "Reports",
      image: JOB_HISTORY_IMAGE,
      backgroundColor: ExtraExtralightOrangeColor,
      // onPress: () => { navigation.navigate("JobHistory") },
      onPress: () => { navigation.navigate("ReportsScreen") },
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
      fetchCustomers();
    }, [technicianId])
  );

  // useFocusEffect(
  //   React.useCallback(() => {
  //     const fetchBanners = async () => {
  //       console.log("technician type::::::::::::::::::::", technicianType, technicianId);

  //       try {
  //         const token = await AsyncStorage.getItem("auth_token");

  //         const response = await axios.get(`${API_BASE_URL}/bannerImages`, {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         });

  //         const allBanners = response.data.banners;
  //         console.log("All banners from response:", allBanners);

  //         const matchedBanner = allBanners.find(
  //           (item) =>
  //             item.roleType.trim().toLowerCase() === technicianType.trim().toLowerCase() &&
  //             Number(item.userId) === Number(technicianId)
  //         );

  //         if (matchedBanner) {
  //           console.log("✅ Matched banner found:", matchedBanner);
  //           setBanners(matchedBanner.bannerImages || []);
  //         } else {
  //           const fallbackBanner = allBanners.find((item) => item.roleType === "superadmin");
  //           console.log("⚠️ No exact match found. Showing superadmin banner:", fallbackBanner);
  //           setBanners(fallbackBanner?.bannerImages || []);
  //         }
  //       } catch (error) {
  //         console.error('❌ Error fetching banner images:', error);
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  //     if (technicianId && technicianType) {
  //       fetchBanners();
  //     }

  //     // Cleanup not needed in this case
  //   }, [technicianId, technicianType])
  // );


  const fetchCustomers = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("Token not found!");
        return;
      }
      if (!technicianId) {
        console.error("technicianId not found!");
        return;
      }
      // Construct the API URL with parameters
      const apiUrl = `${API_BASE_URL}/fetchCustomer?userId=${technicianId}`;
      console.log("Fetching customers from URL:", apiUrl); // Log the API URL

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log("customers::", data);
      await AsyncStorage.setItem("customersList", JSON.stringify(data.customers?.customers));
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
      <View style={[styles.logoContainer, alignItemsCenter]}>
        <Text style={[styles.title, textAlign]}>👋 Hi, {capitalizetext(technicianName)}</Text>
        <Pressable style={styles.searchTextInput} onPress={() => {
          navigation.navigate("ScannerScreen", {
            from: "VinList"
          });
        }}>
          <TextInput
            placeholder="Scan VIN"
            placeholderTextColor={grayColor}
            style={styles.input}
            editable={false}
          />
          <View style={styles.iconContainer} >
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
          top: Platform.OS === "android" ? (isTablet ? hp(21.5) : hp(17.4)) : isTablet ? hp(12) : hp(15.8),
          left: Platform.OS === "android" ? (isTablet ? wp(38) : wp(38.3)) : isTablet ? wp(38) : wp(38.4),
        }]}
          onPress={() => navigation.navigate("ScannerScreen")}
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
            source={CIRLE_SCANNER_IMAGE}
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

    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    // padding: spacings.large,
    backgroundColor: whiteColor
  },
  logoContainer: {
    height: Platform.OS === "android" ? hp(19) : hp(16),
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
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  searchTextInput: {
    flexDirection: 'row',
    backgroundColor: whiteColor,
    borderRadius: 8,
    paddingHorizontal: spacings.xxLarge,
    alignItems: 'center',
    height: hp(5.5),
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