import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import CustomerInfoScreen from "../screens/CustomerInfoScreen";
import NewJobScreen from "../screens/NewJobScreen";
import ScannerScreen from "../screens/ScannerScreen";
import JobHistoryScreen from "../screens/JobHistoryScreen";
import JobDetailsScreen from "../screens/JobDetailsScreen";
import HowToPlayScreen from "../screens/HowToPlayScreen";
import AddVehicleScreen from "../screens/AddVehicleScreen";
import WorkOrderScreen from "../screens/WorkOrderScreen";
import WorkOrderScreenTwo from "../screens/WorkOrderScreenTwo";
import VinListScreen from "../screens/VinListScreen";
import Reports from "../screens/Reports";


const Stack = createStackNavigator();

export default function ScannerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScannerScreen" component={ScannerScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="JobHistory" component={JobHistoryScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="WorkOrderScreen" component={WorkOrderScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="WorkOrderScreenTwo" component={WorkOrderScreenTwo} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="VinListScreen" component={VinListScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="ReportsScreen" component={Reports} options={{ gestureEnabled: false }}/>
    </Stack.Navigator>
  );
}
