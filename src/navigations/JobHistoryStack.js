import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import CustomerInfoScreen from "../screens/CustomerInfoScreen";
import NewJobScreen from "../screens/NewJobScreen";
import ScannerScreen from "../screens/ScannerScreen";
import JobHistoryScreen from "../screens/JobHistoryScreen";
import JobDetailsScreen from "../screens/JobDetailsScreen";


const Stack = createStackNavigator();

export default function JobHistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JobHistory" component={JobHistoryScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="NewJob" component={NewJobScreen} />
    </Stack.Navigator>
  );
}
