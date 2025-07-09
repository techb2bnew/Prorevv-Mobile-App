import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import VinListScreen from "../screens/VinListScreen";
import Reports from "../screens/Reports";
import VehicleDetailsScreen from "../screens/VehicleDetailsScreen";
import NewJobDetailsScreen from "../screens/NewJobDetailsScreen";
import CreateJobScreen from "../screens/CreateJobScreen";
import WorkOrderScreen from "../screens/WorkOrderScreen";
import WorkOrderScreenTwo from "../screens/WorkOrderScreenTwo";


const Stack = createStackNavigator();

export default function ReportStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsScreen" component={Reports} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="VinListScreen" component={VinListScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="VehicleDetailsScreen" component={VehicleDetailsScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="NewJobDetailsScreen" component={NewJobDetailsScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="CreateJobScreen" component={CreateJobScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="WorkOrderScreen" component={WorkOrderScreen} options={{ gestureEnabled: false }}/>
      <Stack.Screen name="WorkOrderScreenTwo" component={WorkOrderScreenTwo} options={{ gestureEnabled: false }}/>
    </Stack.Navigator>
  );
}
