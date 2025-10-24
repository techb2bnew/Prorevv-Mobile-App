import React, { useState, useEffect } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from './src/utils';
import { BaseStyle } from './src/constans/Style';
import SplashScreen from './src/screens/SplashScreen';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigations/AuthStack';
import MainNavigator from './src/navigations/MainNavigator';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { whiteColor } from './src/constans/Color';
import Toast from 'react-native-simple-toast';
import BackgroundTimer from 'react-native-background-timer';
import BiometricModal from './src/componets/Modal/BiometricModal';
import NetInfo from '@react-native-community/netinfo';
import InternetToast from './src/componets/InternetToast';
import ReactNativeBiometrics from "react-native-biometrics";
import axios from 'axios';
import { TabBarProvider } from './src/TabBarContext';
const { flex, alignItemsCenter, alignJustifyCenter } = BaseStyle;
const { width, height } = Dimensions.get('window');
import Orientation from 'react-native-orientation-locker';
import { API_BASE_URL } from './src/constans/Constants';


function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBiometricModalVisible, setIsBiometricModalVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(hp(100));
  const [userRole, setUserRole] = useState<string | null>(null); // ✅ Add userRole

  const isTablet = width >= 668 && height >= 1024;

  useEffect(() => {
    // Simulate a splash screen timeout
    const timer = setTimeout(() => {
      setIsLoading(false); // Hide splash screen after 3 seconds
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          setIsLoggedIn(true); // User is logged in
        }
      } catch (error) {
        console.error("Error checking auth token:", error);
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    Orientation.lockToPortrait(); // Just lock once
  }, []);


  useEffect(() => {
    if (Platform.OS === 'ios') {
      setKeyboardHeight(isLoggedIn ? hp(90.5) : hp(100));
    } else {
      setKeyboardHeight(hp(100));
    }
  }, [isLoggedIn]);

  const checkTechnicianStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const storedData = await AsyncStorage.getItem('userDeatils');

      if (!token || !storedData) {
        console.log("❌ Token or user details missing!");
        return;
      }

      const parsedData = JSON.parse(storedData);

      if (!parsedData || !parsedData.id) {
        console.log("❌ Technician ID not found in stored user details:", parsedData);
        return;
      }

      const technicianId = parsedData.id; // ✅ Technician ID fetch karna
      // console.log("✅ Checking status for Technician ID:", technicianId);

      // ✅ POST request with query params
      const response = await fetch(`${API_BASE_URL}/fetchSingleTechnician?technicianId=${technicianId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const textResponse = await response.text();
      // console.log("🌐 Raw API Response:", textResponse);
      // 👇 Token expire check here
      if (textResponse.includes("Token expire")) {
        Toast.show("⚠️ Session expired. Logging out...");
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("technician_id");
        await AsyncStorage.removeItem("firstLoginCompleted");
        await AsyncStorage.removeItem("jobHistoryData");
        await AsyncStorage.removeItem('technicianName');
        await AsyncStorage.removeItem("jobHistoryFetched");
        await AsyncStorage.removeItem('technicianProfile');
        await AsyncStorage.removeItem("customersList")
        await AsyncStorage.removeItem('userDeatils');
        await AsyncStorage.removeItem("offlineCustomers");
        await AsyncStorage.removeItem("businessLogo");
        await AsyncStorage.removeItem('selectedCustomer')
        setIsLoggedIn(false);
        return;
      }
      const data = JSON.parse(textResponse);
      // console.log("✅ Parsed API Response:", data);

      const technician = data?.technician;
      setUserRole(technician?.Role?.name)
      // console.log("🌐 technician?.payVehicleType:::::::::", technician);
      // console.log("🌐 technician?.payRate:::::::::", technician?.payRate);

      // await AsyncStorage.setItem('payRate', technician?.payRate);
      // await AsyncStorage.setItem('simpleFlatRate', technician?.simpleFlatRate);
      // await AsyncStorage.setItem('amountPercentage', technician?.amountPercentage);

      // if (technician?.payVehicleType) {
      //   const vehicleList = technician?.payVehicleType
      //     .split(',')
      //     .filter(item => item.trim() !== '');
      //   const vehicleArray = vehicleList.map(vehicle => ({
      //     label: vehicle?.trim(),
      //     value: vehicle?.trim()
      //   }));
      //   // Save to AsyncStorage
      //   await AsyncStorage.setItem('allowedVehicles', JSON.stringify(vehicleArray));
      //   // console.log("✅ Saved allowed vehicle types:", vehicleArray);
      // }

      if (technician?.isApproved === "reject") {
        Toast.show("❌ Technician access revoked. Logging out...");
      }

      if (technician?.accountStatus === false) {
        Toast.show("⚠️ Your technician account is inactive. Please contact support.");
      }

      if (technician?.deletedStatus === true) {
        Toast.show("⚠️ Your technician account has been deleted. Please contact support.");
      }

      // Logout process if any of the conditions are met
      if (technician?.isApproved === "reject" || !technician?.accountStatus || technician?.deletedStatus) {
        const keyToKeep = "alreadyLaunched";
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToDelete = allKeys.filter(key => key !== keyToKeep);
        await AsyncStorage.multiRemove(keysToDelete);
        setIsLoggedIn(false);
      }

    } catch (error) {
      console.error("🚨 Error fetching technician status:", error);
    }
  };

  // 🔹 Check Technician Status Every 10 Seconds
  useEffect(() => {
    if (isLoggedIn) {
      checkTechnicianStatus(); // Call API once immediately

      // Android & iOS: BackgroundTimer for every 5 seconds
      const interval =
        Platform.OS === "android"
          ? BackgroundTimer.setInterval(() => {
            checkTechnicianStatus();
          }, 5000)
          : setInterval(() => {
            checkTechnicianStatus();
          }, 5000);

      return () => {
        if (Platform.OS === "android") {
          BackgroundTimer.clearInterval(interval);
        } else {
          clearInterval(interval);
        }
      };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const firstLoginCompleted = await AsyncStorage.getItem("firstLoginCompleted");
        const userToken = await AsyncStorage.getItem("auth_token");

        if (firstLoginCompleted === "true" && userToken) {
          const rnBiometrics = new ReactNativeBiometrics();
          const { available } = await rnBiometrics.isSensorAvailable();

          if (available) {
            setIsBiometricModalVisible(true);
          } else {
            console.log("Biometric authentication is not available on this device.");
          }
        } else {
          await AsyncStorage.setItem("firstLoginCompleted", "true");
        }
      } catch (error) {
        console.error("Error checking first launch:", error);
      }
    };

    checkFirstLaunch();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setToastMessage('⚠️ No Internet Connection. Your data is being saved locally and will sync once you’re back online.');
        setIsConnected(false);
        setToastVisible(true);

        setTimeout(() => setToastVisible(false), 5000); // Hide toast after 5 nseconds
      } else {
        if (!isConnected) {
          // Show message only when the internet reconnects
          setToastMessage('✅ Internet connected! Syncing data... Please wait a moment.');
          setToastVisible(true);
          setTimeout(() => setToastVisible(false), 5000); // Hide after 5 seconds
        }
        setIsConnected(true);
      }
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  useEffect(() => {
    const checkAndSyncJobs = async () => {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        await syncOfflineJobs();
        await syncOfflineCustomers();
      }
    };

    checkAndSyncJobs();
  }, [isConnected, isLoggedIn]);

  const syncOfflineJobs = async () => {
    try {
      let existingJobs = await AsyncStorage.getItem("offlineJobs");
      if (!existingJobs) return;

      let jobsArray = JSON.parse(existingJobs);
      const token = await AsyncStorage.getItem("auth_token");

      if (!token) {
        console.error("Token not found!");
        return;
      }

      while (jobsArray.length > 0) {
        const jobData = jobsArray[0]; // ✅ First job pick karo
        console.log("Syncing job data:", jobData);

        const formData = new FormData();
        jobData._parts.forEach(([key, value]) => {
          formData.append(key, value);
        });

        try {
          const response = await axios.post(
            `${API_BASE_URL}/technicianCreateJob`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 201) {
            console.log("Offline job synced successfully:", response.data);
            jobsArray.shift(); // ✅ Job sync hone ke baad remove karo
          } else {
            console.error("Failed to sync job:", response.data);
            break; // ✅ Agar fail ho, retry ke liye break karo
          }
        } catch (error) {
          const errorMessage = error.response?.data?.error || "";

          console.error("Error syncing job:", errorMessage);

          if (errorMessage.includes("Duplicate VIN found")) {
            console.log("Duplicate VIN found! Sending data to createVinDetails API...");

            try {
              const duplicateResponse = await axios.post(
                `${API_BASE_URL}/createVinDetails`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (duplicateResponse.status === 201) {
                console.log("Vehicle details saved successfully:", duplicateResponse.data);
                jobsArray.shift(); // ✅ Duplicate error solve hone ke baad remove karo
              } else {
                console.error("Failed to override job.");
                break;
              }
            } catch (duplicateError) {
              console.error("Error overriding job:", duplicateError.response?.data);
              break;
            }
          } else {
            break; // ✅ Unknown error aaya to loop se break karo
          }
        }

        // ✅ Updated jobs list save karo
        if (jobsArray.length === 0) {
          await AsyncStorage.removeItem("offlineJobs");
          console.log("All offline jobs synced and removed from local storage.");
        } else {
          await AsyncStorage.setItem("offlineJobs", JSON.stringify(jobsArray));
          console.log("Remaining jobs stored for retry:", jobsArray.length);
        }
      }
    } catch (error) {
      console.error("Error syncing offline jobs:", error);
    }
  };

  const syncOfflineCustomers = async () => {
    try {
      const storedCustomers = await AsyncStorage.getItem("offlineCustomers");
      if (!storedCustomers) return;

      const customerList = JSON.parse(storedCustomers);
      console.log(customerList);

      for (const customer of customerList) {
        try {
          const token = await AsyncStorage.getItem("auth_token");
          if (!token) {
            console.error("Token not found!");
            continue;
          }
          const formData = new FormData();

          // Append all customer fields except 'image'
          for (const key in customer) {
            if (key !== "image" && customer.hasOwnProperty(key)) {
              formData.append(key, customer[key]);
            }
          }

          // Conditionally add the image
          if (customer.image) {
            const newUri = Platform.OS === 'ios'
              ? customer.image.replace("file://", "")
              : customer.image;

            formData.append("image", {
              uri: newUri,
              name: "image.jpg",
              type: "image/jpeg"
            });
          } else {
            formData.append("image", "");
          }

          const response = await axios.post(
            `${API_BASE_URL}/createCustomer`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${token}`
              }
            }
          );

          console.log("Customer synced successfully:", response.data);
          console.log("Customer added successfully.");

        } catch (error) {
          console.error("API request failed:", error.response ? error.response.data.error : error.message);
        }
      }

      await AsyncStorage.removeItem("offlineCustomers");
      console.log("All offline customers synced successfully.");
    } catch (error) {
      console.error("Error syncing offline customers:", error);
    }
  };

  return (
    <SafeAreaView style={[flex, { backgroundColor: whiteColor }]}>
      <KeyboardAvoidingView
        style={{
          height:
            Platform.OS === 'ios'
              ? isTablet ? hp(98) : hp(93.5)
              : isTablet ? hp(98) : hp(100),
        }}
      >
        {isLoading ? (
          <SplashScreen />
        ) : (
          <TabBarProvider>
            <NavigationContainer>
              {isLoggedIn ? <MainNavigator /> : <AuthStack />}
            </NavigationContainer>
          </TabBarProvider>
        )}
        {/* {isBiometricModalVisible && <BiometricModal isBiometricModalVisible={isBiometricModalVisible} setIsBiometricModalVisible={setIsBiometricModalVisible} />} */}
        <InternetToast message={toastMessage} visible={toastVisible} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

});

export default App;
