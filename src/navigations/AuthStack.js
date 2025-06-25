import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import MainNavigator from "./MainNavigator";
import HomeStack from "./HomeStack";
import JoinAsScreen from "../screens/JoinAsScreen";
import OnboardingScreen from "../screens/onBoardingScreen";
import { ActivityIndicator, View } from "react-native";
import HowToPlayScreen from "../screens/HowToPlayScreen";
import ManagerNavigator from "./ManagerNavigator";

const Stack = createStackNavigator();

export default function AuthStack() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem("alreadyLaunched");
        if (value === null) {
          await AsyncStorage.setItem("alreadyLaunched", "true");
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (err) {
        console.log("Error checking first launch: ", err);
      }
    };

    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    // Show loader while checking
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch && (
        <Stack.Screen name="OnBoard" component={OnboardingScreen} />
      )}
      <Stack.Screen name="Login" component={LoginScreen} />
      {/* <Stack.Screen name="JoinAs" component={JoinAsScreen} /> */}
      <Stack.Screen name="Register" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
      <Stack.Screen name="ManagerNavigator" component={ManagerNavigator} />
      <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
    </Stack.Navigator>
  );
}
