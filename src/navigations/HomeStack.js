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
import VehicleDetailsScreen from "../screens/VehicleDetailsScreen";
import NewJobDetailsScreen from "../screens/NewJobDetailsScreen";
import CreateJobScreen from "../screens/CreateJobScreen";
import ProfileStack from "./ProfileStack";
import AuthStack from "./AuthStack";


const Stack = createStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="CustomerInfo" component={CustomerInfoScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="NewJob" component={NewJobScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="ScannerScreen" component={ScannerScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="JobHistory" component={JobHistoryScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="HowToPlay" component={HowToPlayScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="WorkOrderScreen" component={WorkOrderScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="WorkOrderScreenTwo" component={WorkOrderScreenTwo} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="VinListScreen" component={VinListScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="VehicleDetailsScreen" component={VehicleDetailsScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="NewJobDetailsScreen" component={NewJobDetailsScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="ReportsScreen" component={Reports} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="CreateJobScreen" component={CreateJobScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="ProfileStackScreen" component={ProfileStack} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="AuthStack" component={AuthStack} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
