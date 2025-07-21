import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/ProfileScreen";
import JobHistoryScreen from "../screens/JobHistoryScreen";
import AuthStack from "./AuthStack";
import JobDetailsScreen from "../screens/JobDetailsScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import HowToPlayScreen from "../screens/HowToPlayScreen";
import NewJobScreen from "../screens/NewJobScreen";
import VehicleDetailsScreen from "../screens/VehicleDetailsScreen";
import GenerateInvoiceScreen from "../screens/GenerateInvoiceScreen";
import InvoiceDetailsScreen from "../screens/InvoiceDetailsScreen";
import InvoiceHistoryScreen from "../screens/InvoiceHistoryScreen";


const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="JobHistory" component={JobHistoryScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="FeedBackScreen" component={FeedbackScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="AuthStack" component={AuthStack} options={{ gestureEnabled: false }} />
      <Stack.Screen name="HowToPlay" component={HowToPlayScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="NewJob" component={NewJobScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="VehicleDetailsScreen" component={VehicleDetailsScreen} options={{ gestureEnabled: false }} />
      {/* <Stack.Screen name="GenerateInvoiceScreen" component={GenerateInvoiceScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="InvoiceHistoryScreen" component={InvoiceHistoryScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="InvoiceDetailsScreen" component={InvoiceDetailsScreen} options={{ gestureEnabled: false }} /> */}
    </Stack.Navigator>
  );
}
