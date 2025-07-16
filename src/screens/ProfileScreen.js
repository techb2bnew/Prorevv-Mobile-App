import { Alert, Image, Pressable, StyleSheet, Text, TouchableOpacity, View, PermissionsAndroid, Platform, ActivityIndicator, TextInput, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard, Modal, Linking, Dimensions } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { blackColor, blueColor, grayColor, greenColor, lightBlueColor, mediumGray, orangeColor, redColor, whiteColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Fontisto from 'react-native-vector-icons/dist/Fontisto';
import Feather from 'react-native-vector-icons/dist/Feather';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import AntDesign from 'react-native-vector-icons/dist/AntDesign';
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import { ScrollView } from 'react-native-gesture-handler';
import PhoneInput from 'react-native-phone-number-input';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { Image as ImageCompressor } from 'react-native-compressor';
import { API_BASE_URL, SUPPORT_EMAIL, SUPPORT_MOBILE } from '../constans/Constants';
import NetInfo from "@react-native-community/netinfo";
import ConfirmationModal from '../componets/Modal/ConfirmationModal';
import { DELETE_ACCOUNT_IMAGE, LOGOUT_IMAGE } from '../assests/images';
import Header from '../componets/Header';
import { useEditing, useTabBar } from '../TabBarContext';
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
const { width, height } = Dimensions.get('window');

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter } = BaseStyle;

const ProfileScreen = ({ navigation }) => {
  const [technicianId, setTechnicianId] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [secondryPhoneNumber, setSecondryPhoneNumber] = useState("");
  const [secondryEmail, setSecondryEmail] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessLogoUri, setBusinessLogoUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [roleType, setRoleType] = useState("");
  const { setIsTabBarHidden } = useTabBar();
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [countryValue, setCountryValue] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [errors, setErrors] = useState({});
  const phoneInput = useRef(null);
  const [defaultIsoCode, setDefaultIsoCode] = useState('US');
  const [rawNumber, setRawNumber] = useState('');
  const [rawSecondryNumber, setRawSecondryNumber] = useState('');
  const isTablet = width >= 668 && height >= 1024;
  const isIOsAndTablet = Platform.OS === "ios" && isTablet;
  const [cities, setCities] = useState([]);
  const [cityValue, setCityValue] = useState("");
  const googleRef = useRef();


  useEffect(() => {
    setIsTabBarHidden(isEditing);
    return () => setIsTabBarHidden(isEditing);
  }, [isEditing]);

  useFocusEffect(
    useCallback(() => {
      const fetchTechnicianProfile = async () => {
        try {
          const netState = await NetInfo.fetch();

          // if (!netState.isConnected) {
          //   console.log("No Internet Connection. Loading from local storage...");

          //   const storedProfile = await AsyncStorage.getItem('technicianProfile');
          //   if (storedProfile) {
          //     const parsedProfile = JSON.parse(storedProfile);
          //     setProfile(parsedProfile);
          //     setPhoneNumber(parsedProfile.phoneNumber);
          //     setEmail(parsedProfile.email);
          //     setFirstName(parsedProfile.firstName || '');
          //     setLastName(parsedProfile.lastName || '');
          //     setAddress(parsedProfile.address || '');
          //     setCityValue(parsedProfile.city || '');
          //     setCity(parsedProfile.city || '');
          //     setState(parsedProfile.state || '');
          //     setStateValue(parsedProfile.state || '');
          //     setCountry(parsedProfile.country || '');
          //     setCountryValue(parsedProfile.country || '');
          //     setPostalCode(parsedProfile.zipCode || '');
          //     setBusinessName(parsedProfile.businessName || "");
          //     setRoleType(parsedProfile.types || "");
          //     setSecondryPhoneNumber(parsedData.secondaryContactName || "")
          //     setSecondryEmail(parsedData.secondaryEmail || "")
          //     if (parsedProfile.image) {
          //       setImageUri(parsedProfile.image);
          //     }
          //     if (parsedProfile.businessLogo) {
          //       setBusinessLogoUri(parsedProfile.businessLogo);
          //     }

          //   }
          //   return; // Stop execution if no internet
          // }

          // If internet is available, fetch from API
          const storedData = await AsyncStorage.getItem('userDeatils');
          if (!storedData) throw new Error('User details not found');

          const parsedData = JSON.parse(storedData);
          const technicianId = parsedData.id;

          setTechnicianId(technicianId);

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
          const profileData = response?.data?.technician;

          // Set profile data from API
          setProfile(profileData);
          setPhoneNumber(profileData?.phoneNumber);
          setEmail(profileData?.email);
          setFirstName(profileData?.firstName || '');
          setLastName(profileData?.lastName || '');
          setAddress(profileData?.address || '');
          setCityValue(profileData?.city || '');
          setState(profileData?.state || '');
          setStateValue(profileData?.state || '');
          setCountry(profileData?.country || '');
          setCountryValue(profileData?.country || '');
          setPostalCode(profileData?.zipCode || '');
          setBusinessName(profileData?.businessName || "");
          setRoleType(profileData?.types || "");
          setSecondryPhoneNumber(profileData?.secondaryContactName || "")
          setSecondryEmail(profileData?.secondaryEmail || "")

          if (profileData?.image) {
            setImageUri(profileData.image);
          }
          if (profileData?.businessLogo) {
            setBusinessLogoUri(profileData?.businessLogo);
          }

          // Update AsyncStorage with latest profile data
          await AsyncStorage.setItem('technicianProfile', JSON.stringify(profileData));

        } catch (err) {
          console.log("API Error:", err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchTechnicianProfile();
      console.log("roleType", roleType);

    }, [isEditing])
  );

  // useEffect(() => {
  //   fetchCountries();
  // }, [country]);

  // useEffect(() => {
  //   if (countryValue) {
  //     fetchStates();
  //   }
  // }, [countryValue]);

  const getCountryByCallingCode = async (callingCode) => {
    try {
      const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,idd');

      const countries = response.data;

      const country = countries.find(c => {
        const root = c.idd?.root;
        const suffixes = c.idd?.suffixes || [];

        return suffixes.some(suffix => `${root}${suffix}` === callingCode);
      });

      console.log("✅ Response data length:", country);

      if (country) {
        return country.cca2;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching country data:', error);
      return null;
    }
  };

  // 👇 useEffect to handle phoneNumber and update ISO code
  useEffect(() => {
    const handlePhone = async () => {
      if (phoneNumber?.startsWith('+')) {
        const matchedCode = phoneNumber.match(/^\+(\d{1})/);
        const callingCode = matchedCode ? `+${matchedCode[1]}` : null;
        console.log("callingCode", callingCode);

        if (callingCode) {
          const iso = await getCountryByCallingCode(callingCode);
          if (iso) {
            setDefaultIsoCode(iso);
          }
          // Remove the calling code from phone number
          const numberOnly = phoneNumber.replace(callingCode, '').replace(/[^0-9]/g, '').trim();
          setRawNumber(numberOnly);
        }
      }
    };

    handlePhone();
  }, [phoneNumber, isEditing]);

  useEffect(() => {
    const handleSecondryPhone = () => {
      if (secondryPhoneNumber?.startsWith('+')) {
        const matchedCode = secondryPhoneNumber.match(/^\+(\d{1,4})/);
        const callingCode = matchedCode ? `+${matchedCode[1]}` : null;

        if (callingCode) {
          const numberOnly = secondryPhoneNumber.replace(callingCode, '').replace(/[^0-9]/g, '').trim();
          setRawSecondryNumber(numberOnly);
        }
      } else {
        setRawSecondryNumber(secondryPhoneNumber);
      }
    };

    if (secondryPhoneNumber) {
      handleSecondryPhone();
    }
  }, [secondryPhoneNumber]);

  // useEffect(() => {
  //   if (countryValue && stateValue) {
  //     fetchCities();
  //   }
  // }, [countryValue, stateValue]);

  // const fetchCities = async () => {
  //   setIsLoadingState(true);
  //   try {
  //     const response = await axios.post(
  //       "https://countriesnow.space/api/v0.1/countries/state/cities",
  //       {
  //         country: countryValue,
  //         state: stateValue,
  //       }
  //     );

  //     if (response.data && response.data.data) {
  //       // console.log("Cities of", formData.state, ":", response.data.data);
  //       setCities(response.data.data);
  //     } else {
  //       console.log("No cities found for", stateValue);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching cities:", error);
  //   } finally {
  //     setIsLoadingState(false);
  //   }
  // };

  // const fetchCountries = async () => {
  //   try {
  //     console.log("Fetching countries...");
  //     const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
  //     const data = await response.json();

  //     console.log("Fetched Countries:", data);

  //     if (Array.isArray(data)) {
  //       const countryNames = data.map((item) => item.name.common);
  //       const sortedCountries = countryNames.sort((a, b) => a.localeCompare(b));

  //       setCountries(sortedCountries);
  //       console.log("Countries:", sortedCountries);

  //       // Set initial country value if profile has country data
  //       if (profile?.country) {
  //         setCountryValue(profile.country);
  //       }
  //     } else {
  //       console.log("No countries found.");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching countries:", error);
  //   }
  // };


  // const fetchStates = async () => {
  //   setIsLoadingState(true);
  //   try {
  //     const response = await axios.post(
  //       "https://countriesnow.space/api/v0.1/countries/states",
  //       { country: countryValue }
  //     );

  //     if (response.data && response.data.data && response.data.data.states) {
  //       console.log("States of", countryValue, ":", response.data.data.states);
  //       const stateNames = response.data.data.states.map(state => state);
  //       setStates(stateNames);

  //       // Set initial state value if profile has state data
  //       if (profile?.state) {
  //         setStateValue(profile.state);
  //       }
  //     } else {
  //       console.log("No states found for", countryValue);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching states:", error);
  //   } finally {
  //     setIsLoadingState(false);
  //   }
  // };

  // // Update your handleInputChange function
  // const handleInputChange = (field, value) => {
  //   // Update validation errors if needed
  //   setErrors((prev) => ({
  //     ...prev,
  //     [field]: value ? '' : `Please select ${field}`,
  //   }));
  // };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Permission granted, open the camera
        openCamera();
      } else {
        // Permission denied
        Alert.alert('Permission Denied', 'You need to allow camera access to take photos.');
      }
    } else {
      // iOS doesn't need manual permission handling
      openCamera();
    }
  };

  // Handle Image Selection
  const handleImageUpload = () => {
    Alert.alert(
      "Select Image",
      "Choose an option",
      [
        { text: "Camera", onPress: requestCameraPermission },
        { text: "Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Function to compress the selected image
  const compressImage = async (uri) => {
    try {
      const compressedUri = await ImageCompressor.compress(uri, {
        quality: 0.7, // Reduce quality to 70%
        maxWidth: 500, // Resize width
        maxHeight: 500, // Resize height
      });

      return compressedUri;
    } catch (error) {
      console.log('Image Compression Error:', error);
      return uri; // Return original URI if compression fails
    }
  };

  // Function to handle image selection from Camera
  const openCamera = () => {
    launchCamera(
      {
        mediaType: "photo",
        quality: 1,
        includeBase64: false,
        maxWidth: 800,
        maxHeight: 800,
      },
      async (response) => {
        if (response.didCancel) {
          console.log("User canceled camera");
        } else if (response.errorCode) {
          console.log("Camera Error: ", response.errorMessage);
        } else {
          const compressedUri = await compressImage(response.assets[0].uri);
          setImageUri(compressedUri);
        }
      }
    );
  };

  // Function to handle image selection from Gallery
  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 1,
        includeBase64: false,
        selectionLimit: 1,
        maxWidth: 800,
        maxHeight: 800,
      },
      async (response) => {
        if (response.didCancel) {
          console.log("User canceled gallery");
        } else if (response.errorCode) {
          console.log("Gallery Error: ", response.errorMessage);
        } else {
          const compressedUri = await compressImage(response.assets[0].uri);
          setImageUri(compressedUri);
        }
      }
    );
  };

  // Handle Image Selection
  const handlebusinessImageUpload = () => {
    Alert.alert(
      "Select Image",
      "Choose an option",
      [
        { text: "Camera", onPress: requestBusinessCameraPermission },
        { text: "Gallery", onPress: openBusinesGallery },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const requestBusinessCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Permission granted, open the camera
        openBusinessCamera();
      } else {
        // Permission denied
        Alert.alert('Permission Denied', 'You need to allow camera access to take photos.');
      }
    } else {
      // iOS doesn't need manual permission handling
      openBusinessCamera();
    }
  };

  // Function to handle image busisnes selection from Camera
  const openBusinessCamera = () => {
    launchCamera(
      {
        mediaType: "photo",
        quality: 1,
        includeBase64: false,
        maxWidth: 800,
        maxHeight: 800,
      },
      async (response) => {
        if (response.didCancel) {
          console.log("User canceled camera");
        } else if (response.errorCode) {
          console.log("Camera Error: ", response.errorMessage);
        } else {
          const compressedUri = await compressImage(response.assets[0].uri);
          setBusinessLogoUri(compressedUri);
        }
      }
    );
  };

  // Function to handle image busisnes selection from Gallery
  const openBusinesGallery = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 1,
        includeBase64: false,
        selectionLimit: 1,
        maxWidth: 800,
        maxHeight: 800,
      },
      async (response) => {
        if (response.didCancel) {
          console.log("User canceled gallery");
        } else if (response.errorCode) {
          console.log("Gallery Error: ", response.errorMessage);
        } else {
          const compressedUri = await compressImage(response.assets[0].uri);
          setBusinessLogoUri(compressedUri);
        }
      }
    );
  };

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      ?.split(" ")
      ?.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getInitials = (fullName) => {
    return fullName
      ?.split(" ")
      ?.map((n) => n[0])
      ?.join("")
      ?.toUpperCase();
  };

  // const handleLogout = async () => {
  //   try {
  //     await AsyncStorage.removeItem('auth_token');
  //     await AsyncStorage.removeItem('userDeatils');
  //     await AsyncStorage.removeItem("firstLoginCompleted");
  //     await AsyncStorage.removeItem("jobHistoryData");
  //     await AsyncStorage.removeItem('technicianName');
  //     await AsyncStorage.removeItem("jobHistoryFetched");
  //     await AsyncStorage.removeItem('technicianProfile');
  //     await AsyncStorage.removeItem("customersList")
  //     await AsyncStorage.removeItem("offlineCustomers");
  //     await AsyncStorage.removeItem("businessLogo");
  //     await AsyncStorage.removeItem('selectedCustomer')
  //     console.log("User logged out successfully.");
  //     // Reset navigation to AuthStack
  //     // navigation.navigate("AuthStack");
  //     navigation.dispatch(
  //       CommonActions.reset({
  //         index: 0,
  //         routes: [{ name: 'AuthStack' }],
  //       })
  //     );
  //   } catch (error) {
  //     console.error("Error during logout:", error);
  //   }
  // };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) throw new Error("No token found");
      console.log("🔑 Auth Token:", token);
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: `email=${encodeURIComponent(email)}`
      });

      const result = await response.json();
      console.log("✅ Logout API response:", result);

      if (response.ok) {
        // Clear local data and reset navigation
        // await AsyncStorage.removeItem('auth_token');
        // await AsyncStorage.removeItem('userDeatils');
        // await AsyncStorage.removeItem("firstLoginCompleted");
        // await AsyncStorage.removeItem("jobHistoryData");
        // await AsyncStorage.removeItem('technicianName');
        // await AsyncStorage.removeItem("jobHistoryFetched");
        // await AsyncStorage.removeItem('technicianProfile');
        // await AsyncStorage.removeItem("customersList")
        // await AsyncStorage.removeItem("offlineCustomers");
        // await AsyncStorage.removeItem("businessLogo");
        // await AsyncStorage.removeItem('selectedCustomer')
        // await AsyncStorage.removeItem("current_Job");
        // await AsyncStorage.removeItem("current_customer");
        const keyToKeep = "alreadyLaunched";

        const allKeys = await AsyncStorage.getAllKeys();
        const keysToDelete = allKeys.filter(key => key !== keyToKeep);

        await AsyncStorage.multiRemove(keysToDelete);

        console.log("User logged out successfully.");
        // Reset navigation to AuthStack
        // navigation.navigate("AuthStack");
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'AuthStack' }],
          })
        );
      } else {
        console.warn("❌ Logout failed:", result?.message || 'Unknown error');
      }
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) throw new Error("Auth token not found");

      const storedData = await AsyncStorage.getItem("userDeatils");
      if (!storedData) throw new Error("User details not found in AsyncStorage");

      const parsedData = JSON.parse(storedData);
      const technicianId = parsedData?.id; // Ensure id exists

      if (!technicianId) throw new Error("Technician ID not found");

      console.log("🔹 Technician ID:", technicianId);
      console.log("🔹 Auth Token:", token);

      // Manually encode form data
      const formBody = `technicianId=${encodeURIComponent(technicianId)}&deletedStatus=false`;

      console.log("🔹 Request Headers:", {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      });

      console.log("🔹 Request Body:", formBody);

      // Make API request
      const response = await fetch(
        `${API_BASE_URL}/deleteTechnician`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${token}`
          },
          body: formBody
        }
      );

      console.log("🔹 API Response Status:", response.status);

      const text = await response.text();
      console.log("🔹 Raw Response:", text);

      // Parse response
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }

      console.log("✅ Account deleted successfully:", result);

      // Clear AsyncStorage on success
      await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());

      // Navigate to Auth stack
      navigation.navigate("AuthStack");

    } catch (error) {
      console.error("❌ Error during account deletion:", error.message);
    }
  };

  // 📌 Handle Save Profile
  const handleSave = async () => {
    setError("");
    setIsEditingLoading(true);

    // ✅ Validate Required Fields
    if (!firstName || !lastName || !phoneNumber) {
      setError("Please fill all details");
      setIsEditingLoading(false);
      return;
    }
    const countryCode = phoneInput.current?.getCallingCode();

    // ✅ Format phone number
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith(`+${countryCode}-`)) {
      const phoneWithoutCode = phoneNumber
        .replace(`+${countryCode}`, "")
        .replace(/^-+/, "")
        .trim();
      formattedPhoneNumber = `+${countryCode}-${phoneWithoutCode}`;
    }

    // ✅ Format secondary phone number
    let formattedSecondaryPhone = secondryPhoneNumber;
    if (
      secondryPhoneNumber &&
      !secondryPhoneNumber.startsWith(`+${countryCode}-`)
    ) {
      const secondaryWithoutCode = secondryPhoneNumber
        .replace(`+${countryCode}`, "")
        .replace(/^-+/, "")
        .trim();
      formattedSecondaryPhone = `+${countryCode}-${secondaryWithoutCode}`;
    }

    // ✅ Create FormData
    const formData = new FormData();
    formData.append("technicianId", technicianId);
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("phoneNumber", formattedPhoneNumber);
    formData.append("address", address);
    // formData.append("country", country);
    // formData.append("state", state);
    formData.append("country", countryValue); // Using dropdown value
    formData.append("state", stateValue);
    formData.append("city", cityValue);
    formData.append("zipCode", postalCode);
    formData.append("businessName", businessName);
    formData.append("secondaryContactName", formattedSecondaryPhone);
    formData.append("secondaryEmail", secondryEmail);

    // ✅ Add Image (New or Existing)
    if (imageUri) {
      if (!imageUri.startsWith("http")) {
        const fileType = imageUri.split(".").pop();
        const fileUri = Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri;
        const imageFile = {
          uri: fileUri,
          type: `image/${fileType}`,
          name: `profile_${Date.now()}.${fileType}`,
        };
        formData.append("image", imageFile);
      } else {
        // Existing image URL
        formData.append("image", imageUri);
      }
    }

    // ✅ Add Business Logo (New or Existing)
    if (businessLogoUri) {
      if (!businessLogoUri.startsWith("http")) {
        const fileType = businessLogoUri.split(".").pop();
        const fileUri = Platform.OS === "ios" ? businessLogoUri.replace("file://", "") : businessLogoUri;
        const businessImageFile = {
          uri: fileUri,
          type: `image/${fileType}`,
          name: `business_logo_${Date.now()}.${fileType}`,
        };
        formData.append("businessLogo", businessImageFile);
      } else {
        // Existing business logo URL
        formData.append("businessLogo", businessLogoUri);
      }
    }

    console.log("🚀 Sending FormData:", formData);

    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) throw new Error("No token found");
      console.log("🔑 Auth Token:", token);

      const response = await axios.post(
        `${API_BASE_URL}/updateTechnicianProfile`,
        formData,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          transformRequest: (data) => data, // Ensure FormData is passed correctly
        }
      );

      console.log("✅ Profile Updated:", response.data);
      await AsyncStorage.setItem("userDeatils", JSON.stringify(response.data.technician));
      await AsyncStorage.setItem('technicianProfile', JSON.stringify(response.data.technician));

      setIsEditingLoading(false);
      setIsEditing(false)

    } catch (error) {
      console.log("❌ Full Error Object:", error);
      setIsEditingLoading(false);
      if (error.response) {
        console.log("⚠️ Error Response:", error.response);
        setError(error.response?.data?.error || "Something went wrong");
      } else if (error.request) {
        console.log("⚠️ No Response Received:", error.request);
        setError("No response from server. Check network.");
      } else {
        console.log("⚠️ Request Setup Error:", error.message);
        setError(error.message);
      }
    } finally {
      setIsEditingLoading(false);
    }
  };

  const logoutModalConfig = {
    title: "Come back soon!",
    message: "Are you sure you want to logout?",
    confirmText: "Logout",
    iconName: LOGOUT_IMAGE,
    onConfirm: () => {
      setLogoutModalVisible(false); // Close modal first
      handleLogout(); // Then perform action
    }
  };

  const deleteModalConfig = {
    title: "Delete Account",
    message: "Do you really want to delete the account?",
    confirmText: "Yes",
    iconName: DELETE_ACCOUNT_IMAGE,
    onConfirm: () => {
      setDeleteModalVisible(false); // Close modal first
      handleDelete(); // Then perform action
    },
    confirmColor: redColor,

  };

  if (loading) {
    return (
      <SkeletonPlaceholder>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: wp(25), height: wp(25), borderRadius: 50 }} />
            <View style={{ marginLeft: 10 }}>
              <View style={{ width: 120, height: 16, borderRadius: 4 }} />
            </View>
          </View>
          <View style={{ width: wp(11), height: wp(11), borderRadius: 50 }} />
        </View>
        <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
          <View style={{ width: "100%", height: 50, marginBottom: 10, borderRadius: 8 }} />
          <View style={{ width: "100%", height: 50, marginBottom: 10, borderRadius: 8 }} />
          <View style={{ width: "100%", height: 50, marginBottom: 10, borderRadius: 8 }} />
          <View style={{ width: "100%", height: 50, marginBottom: 10, borderRadius: 8 }} />
          <View style={{ width: "100%", height: 50, marginBottom: 10, borderRadius: 8 }} />
          <View style={{ width: "100%", height: 50, marginBottom: 10, borderRadius: 8 }} />
        </View>
      </SkeletonPlaceholder>
    );
  }

  return (
    <>
      <Header title={!isEditing ? "My Profile" : "Edit Profile"} onBack={() => isEditing ? setIsEditing(false) : navigation.goBack()} />
      {!isEditing && <TouchableOpacity
        onPress={() => setLogoutModalVisible(true)}
        // onPress={() => { setIsEditing(true) }}
        disabled={loading}
        style={{
          position: "absolute",
          top: Platform.OS === "android" ? isTablet ? 20 : 13 : isTablet ? 20 : 13,
          right: 15,
          // backgroundColor: blueColor,
          borderColor: blueColor,
          width: isTablet ? wp(8) : wp(9),
          height: isTablet ? wp(6) : wp(8),
          borderRadius: 5,
          borderWidth: 2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="power" size={25} color={redColor} />
        {/* <Feather name="edit-3" size={25} color={blackColor} /> */}

      </TouchableOpacity>}
      {!isEditing ?
        <View style={[styles.container]}>
          <View style={{ height: Platform.OS === "android" ? hp(82.5) : hp(75.5), width: "100%" }}>
            <ScrollView
              contentContainerStyle={{ backgroundColor: whiteColor }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.userdetailsBox, { padding: spacings.xLarge, borderWidth: 2, borderColor: lightBlueColor, backgroundColor: whiteColor }]}>
                <View style={[flexDirectionRow, alignItemsCenter]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={[styles.image, { borderRadius: isTablet ? isIOsAndTablet ? 1000 : 100 : 50 }]} />
                  ) : (
                    <View style={[styles.fallbackContainer, { borderRadius: isTablet ? isIOsAndTablet ? 1000 : 100 : 50 }]}>
                      <Text style={styles.fallbackText}>{getInitials(profile?.firstName)}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={{ fontSize: 16, marginHorizontal: 10, fontWeight: style.fontWeightThin1x.fontWeight }}>
                      {capitalizeWords(firstName + " " + lastName)}
                    </Text>
                    <Text style={{ fontSize: 16, marginHorizontal: 10, marginTop: 5, fontWeight: style.fontWeightThin.fontWeight, color: grayColor }}>
                      {roleType === "manager" ? "Manager" : "Technician"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={[{ backgroundColor: blueColor, width: "100%", height: isTablet ? wp(6) : wp(9.5), borderRadius: 50, marginTop: spacings.large }, alignJustifyCenter, flexDirectionRow]}
                  onPress={() => { setIsEditing(true) }}>
                  <Text style={{ fontSize: 16, fontWeight: style.fontWeightThin1x.fontWeight, color: whiteColor, marginHorizontal: 8 }}>
                    Edit
                  </Text>
                  <Feather name="edit-3" size={20} color={whiteColor} />
                </TouchableOpacity>
              </View>

              <View style={[styles.userdetailsBox, alignJustifyCenter]}>
                <View style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]}>
                  <View style={{ padding: spacings.xLarge }}>
                    <Feather name="phone" size={25} color={blueColor} />
                  </View>
                  <TouchableOpacity
                    style={{ paddingVertical: spacings.xLarge }}
                    onPress={() => Linking.openURL(`tel:${phoneNumber}`)}
                  >
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight, textDecorationLine: "underline" }]}>{phoneNumber}</Text>
                  </TouchableOpacity>
                </View>
                {/* <View style={[styles.separator, { marginVertical: spacings.large }]} /> */}
                <View style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]}>
                  <View style={{ padding: spacings.xLarge }}>
                    <Fontisto name="email" size={25} color={blueColor} />
                  </View>
                  <TouchableOpacity
                    style={{ paddingVertical: spacings.xLarge }}
                    onPress={() => Linking.openURL(`mailto:${email}`)}
                  >
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight, textDecorationLine: "underline" }]}>{email}</Text>
                  </TouchableOpacity>
                </View>
                {/* <View style={[styles.separator, { marginVertical: spacings.large }]} /> */}
                <View style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]}>
                  <View style={{ padding: spacings.xLarge }}>
                    <Feather name="map-pin" size={24} color={blueColor} />
                  </View>
                  <View style={{ paddingVertical: spacings.large, width: "80%" }}>
                    <Text
                      style={[
                        styles.text,
                        {
                          fontSize: style.fontSizeNormal1x.fontSize,
                          paddingTop: 3,
                          fontWeight: style.fontWeightThin1x.fontWeight,
                          textTransform: "capitalize"
                        },
                      ]}
                    >
                      {[
                        address,
                        cityValue,
                        stateValue,
                        country,
                        postalCode
                      ]
                        .filter(Boolean) // removes undefined, null, ""
                        .join(", ")}
                    </Text>
                  </View>
                </View>
                {/* {businessName && <View style={[styles.separator, { marginVertical: spacings.large }]} />} */}
                {businessName && <View style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]}>
                  <View style={{ padding: spacings.xLarge }}>
                    <Ionicons name="business-outline" size={25} color={blueColor} />
                  </View>
                  <View style={{ paddingVertical: spacings.xLarge }}>
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight }]}>{businessName}</Text>
                  </View>
                </View>}
              </View>

              <View style={[styles.userdetailsBox, alignJustifyCenter,]}>

                <TouchableOpacity style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]} onPress={() => navigation.navigate("InvoiceScreen")}>
                  <View style={{ padding: spacings.xLarge }}>
                    <MaterialIcons name="support-agent" size={24} color={blueColor} />
                  </View>
                  <View style={{ paddingVertical: spacings.xLarge }}>
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight }]}>Invoice</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]} onPress={() => setModalVisible(true)}>
                  <View style={{ padding: spacings.xLarge }}>
                    <MaterialIcons name="support-agent" size={24} color={blueColor} />
                  </View>
                  <View style={{ paddingVertical: spacings.xLarge }}>
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight }]}>Contact Support</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]} onPress={() => { navigation.navigate("FeedBackScreen", { emailParam: email }) }}>
                  <View style={{ padding: spacings.xLarge }}>
                    <MaterialCommunityIcons name="message-text-lock-outline" size={24} color={blueColor} />
                  </View>
                  <View style={{ paddingVertical: spacings.xLarge }}>
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight }]}>Feedback & Issue Report</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.userdetailsBox, alignJustifyCenter]}>
                <TouchableOpacity style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]} onPress={() => navigation.navigate("HowToPlay")}>
                  <View style={{ padding: spacings.xLarge }}>
                    <MaterialCommunityIcons name="gesture-spread" size={25} color={blueColor} />
                  </View>
                  <View style={{ paddingVertical: spacings.xLarge }}>
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight }]}>How To Use</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.userdetailsBox, alignJustifyCenter]}>
                <TouchableOpacity style={[{ width: wp(100), height: 'auto', paddingLeft: spacings.xLarge }, flexDirectionRow]} onPress={() => setDeleteModalVisible(true)}>
                  <View style={{ padding: spacings.xLarge }}>
                    <AntDesign name="delete" size={25} color={redColor} />
                  </View>
                  <View style={{ paddingVertical: spacings.xLarge }}>
                    <Text style={[styles.text, { fontSize: style.fontSizeNormal1x.fontSize, paddingTop: 3, fontWeight: style.fontWeightThin1x.fontWeight, }]}>Delete Account</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Modals */}
              <ConfirmationModal
                visible={logoutModalVisible}
                onClose={() => setLogoutModalVisible(false)}
                {...logoutModalConfig}
              />

              <ConfirmationModal
                visible={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                {...deleteModalConfig}
              />

              {/* Support Modal */}
              {modalVisible && <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                  <View style={styles.modalBox}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Contact Support</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={28} color={blueColor} />
                      </TouchableOpacity>
                    </View>

                    {/* Contact Details */}
                    <View style={styles.modalContent}>
                      {/* Email Open */}
                      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.contactItem}>
                        <Fontisto name="email" size={25} color={blueColor} />
                        <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
                      </TouchableOpacity>

                      {/* Phone Dial */}
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${SUPPORT_MOBILE}`)} style={styles.contactItem}>
                        <Feather name="phone" size={24} color={blueColor} />
                        <Text style={styles.contactText}>{SUPPORT_MOBILE}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Pressable>
              </Modal>}
            </ScrollView>
          </View>
        </View>
        :
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: whiteColor }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

            <ScrollView
              contentContainerStyle={{ flexGrow: 1, marginBottom: 100, paddingBottom: hp(12), backgroundColor: whiteColor }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {isLoadingState && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={blueColor} />
                </View>
              )}
              <View style={[styles.container]}>
                <View style={{
                  width: "100%",
                  flexDirection: "row",
                  justifyContent: roleType === "single-technician" ? 'space-between' : 'center',
                  alignItems: 'center'
                }}>
                  <View style={[styles.userdetailsBox, alignJustifyCenter, { backgroundColor: whiteColor, width: roleType === "single-technician" ? '40%' : 'auto' }]}>
                    <TouchableOpacity onPress={handleImageUpload}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={[styles.image, { width: wp(25), height: wp(25), borderRadius: isTablet ? isIOsAndTablet ? 1000 : 100 : 50 }]} />
                      ) : (
                        <View style={[styles.fallbackContainer, { borderRadius: isTablet ? isIOsAndTablet ? 1000 : 100 : 50 }]}>
                          <Text style={styles.fallbackText}>{getInitials(profile?.firstName)}</Text>
                        </View>
                      )}
                      <View style={[styles.cameraIconContainer, {
                        bottom: isTablet ? isIOsAndTablet ? 20 : 15 : 5,
                        right: isTablet ? isIOsAndTablet ? 20 : 15 : -1,
                        backgroundColor: blueColor,
                        width: isTablet ? 35 : 25,
                        height: isTablet ? 35 : 25,
                        borderRadius: isTablet ? 25 : 15
                      }]}>
                        <Ionicons name="camera-outline" size={15} color={whiteColor} />
                      </View>
                    </TouchableOpacity>
                    <Text style={[styles.label, { marginTop: 10 }]}>Profile Image</Text>
                  </View>

                  {roleType === "single-technician" && <View style={[styles.userdetailsBox, alignJustifyCenter, { backgroundColor: whiteColor, marginTop: 20, width: '49%' }]}>
                    <TouchableOpacity
                      onPress={handlebusinessImageUpload}
                    >
                      {businessLogoUri ? (
                        <Image source={{ uri: businessLogoUri }} style={[styles.image, { width: wp(25), height: wp(25), borderRadius: isTablet ? isIOsAndTablet ? 1000 : 100 : 50 }]} />
                      ) : (
                        <View style={[styles.fallbackContainer, { backgroundColor: '#ddd', borderRadius: isTablet ? isIOsAndTablet ? 1000 : 100 : 50 }]}>
                          <Ionicons name="business-outline" size={30} color={blackColor} />
                        </View>
                      )}
                      <View style={[styles.cameraIconContainer, {
                        bottom: isTablet ? isIOsAndTablet ? 20 : 15 : 5,
                        right: isTablet ? isIOsAndTablet ? 20 : 15 : -1,
                        backgroundColor: blueColor,
                        width: isTablet ? 35 : 25,
                        height: isTablet ? 35 : 25,
                        borderRadius: isTablet ? 25 : 15
                      }]}>
                        <Ionicons name="camera-outline" size={15} color={whiteColor} />
                      </View>
                    </TouchableOpacity>
                    <Text style={[styles.label, { marginTop: 10 }]}>Business Logo</Text>

                  </View>}
                </View>
                <View style={styles.editContainer}>
                  <View style={[flexDirectionRow, justifyContentSpaceBetween, { width: "100%" }]}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>First Name<Text style={styles.asterisk}> *</Text></Text>
                      <TextInput style={[styles.input, { width: isTablet ? wp(46) : wp(43.5) }]} value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter First Name"
                        maxLength={20} />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Last Name<Text style={styles.asterisk}> *</Text></Text>
                      <TextInput style={[styles.input, { width: isTablet ? wp(46) : wp(43.5) }]}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter Last Name"
                        maxLength={20} />
                    </View>
                  </View>
                  {roleType === "single-technician" && <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business Name</Text>
                    <TextInput style={styles.input}
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="Enter Business Name" />
                  </View>}
                  {/* <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter Phone Number" keyboardType="phone-pad" />
                  </View> */}
                  <View style={styles.phoneContainer}>
                    <Text style={styles.label}>
                      Phone Number<Text style={styles.asterisk}> *</Text>
                    </Text>
                    <PhoneInput
                      ref={phoneInput}
                      defaultValue={rawNumber}
                      defaultCode={defaultIsoCode}
                      layout="second"
                      onChangeFormattedText={(text) => {
                        setPhoneNumber(text);
                      }}
                      containerStyle={styles.phoneInput}
                      textContainerStyle={styles.phoneText}
                      textInputStyle={[styles.phoneTextInput, { marginBottom: isTablet ? 12 : 0 }]}
                      textInputProps={{
                        keyboardType: "default",
                        placeholder: "Enter your phone number",
                        maxLength: 13,
                      }}
                      flagButtonStyle={styles.flagButton}
                    />
                  </View>
                  <View style={[styles.inputGroup, { height: isTablet ? hp(5) : hp(10) }]}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter Address" />

                    {/* <GooglePlacesAutocomplete
                      ref={googleRef}
                      placeholder="Enter Your Address"
                      fetchDetails={true}
                      onPress={(data, details = null) => {
                        console.log('Selected:', data.description);
                        setAddress(data.description);
                      }}
                      textInputProps={{
                        value: address,
                        onChangeText: (text) => setAddress(text),
                      }}
                      query={{
                        key: 'AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI',
                        language: 'en',
                      }}
                      styles={{
                        container: {
                          flex: 0,
                          zIndex: 999,
                        },
                        listView: {
                          zIndex: 999,
                          position: 'absolute',
                          top: 55,
                        },
                        textInputContainer: {
                          zIndex: 999,
                        },
                        textInput: {
                          height: 44,
                          borderWidth: 1,
                          borderColor: 'blue',
                          borderRadius: 50,
                          paddingHorizontal: 16,
                          backgroundColor: '#fff',
                        },
                      }}
                    /> */}

                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Secondary Phone Number (Optional)</Text>
                    <PhoneInput
                      defaultValue={rawSecondryNumber}
                      defaultCode={defaultIsoCode}
                      layout="second"
                      onChangeFormattedText={(text) => {
                        setSecondryPhoneNumber(text);
                      }}
                      containerStyle={styles.phoneInput}
                      textContainerStyle={styles.phoneText}
                      textInputStyle={[styles.phoneTextInput, { marginBottom: isTablet ? 12 : 0 }]}
                      textInputProps={{
                        keyboardType: "default",
                        placeholder: "Enter Phone Number",
                        maxLength: 13,
                      }}
                      flagButtonStyle={styles.flagButton}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Secondary Email (Optional)</Text>
                    <TextInput style={styles.input} value={secondryEmail} onChangeText={setSecondryEmail} placeholder="Enter Secondary Email" />
                  </View>
                  {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
                </View>

              </View>
            </ScrollView>

          </TouchableWithoutFeedback>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            {isEditingLoading ? (
              <ActivityIndicator size="small" color={whiteColor} />
            ) : (
              <Text style={styles.saveButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView >
      }
    </>
  )
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: whiteColor,
    paddingHorizontal: spacings.xLarge,
    height: hp(100)
  },
  title: {
    fontSize: style.fontSizeLargeX.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
    color: blackColor,
  },
  userdetailsBox: {
    width: "100%",
    backgroundColor: lightBlueColor,
    borderRadius: 10,
    marginTop: 8,
    padding: spacings.large
  },
  image: {
    width: wp(20),
    height: wp(20),
    resizeMode: "cover",
    borderRadius: 50
  },
  text: {
    fontSize: style.fontSizeNormal2x.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
    color: blackColor,
    paddingHorizontal: spacings.large
  },
  fallbackContainer: {
    width: wp(25),
    height: wp(25),
    backgroundColor: blueColor,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100
  },
  fallbackText: {
    fontSize: 20,
    fontWeight: "bold",
    color: whiteColor,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 5,
    right: -1,
    backgroundColor: blueColor,
    width: 25,
    height: 25,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderColor: whiteColor,
    borderWidth: 1
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: "#d9d9d9",
  },
  editContainer: {
    padding: 10,
    backgroundColor: whiteColor,
    borderRadius: 10,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: blackColor,
  },
  input: {
    height: 41.2,
    borderWidth: 1,
    borderColor: blueColor,
    borderRadius: 50,
    paddingHorizontal: spacings.large,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: blueColor,
    padding: spacings.large,
    borderRadius: 8,
    alignItems: "center",
    // marginTop: 20,
    margin: 20
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBox: {
    width: 320,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    width: "100%",
    // alignItems: "center",
    marginVertical: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  contactText: {
    marginLeft: 10,
    fontSize: 16,
    color: blueColor,
    textDecorationLine: "underline",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center"
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  phoneContainer: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: blackColor,
    marginBottom: 7,
    fontWeight: "500",
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: blueColor,
    borderRadius: 50,
    height: 42,
    width: "100%",
    overflow: "hidden"
  },
  phoneText: {
    backgroundColor: whiteColor,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  phoneTextInput: {
    fontSize: 16,
    color: blackColor,
    height: 40,
  },
  flagButton: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999,
  },
  asterisk: {
    color: redColor
  }
})