import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import VinListScreen from "../screens/VinListScreen";
import Reports from "../screens/Reports";
import VehicleDetailsScreen from "../screens/VehicleDetailsScreen";
import NewJobDetailsScreen from "../screens/NewJobDetailsScreen";
import CreateJobScreen from "../screens/CreateJobScreen";


const Stack = createStackNavigator();

export default function ReportStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsScreen" component={Reports} />
      <Stack.Screen name="VinListScreen" component={VinListScreen} />
      <Stack.Screen name="VehicleDetailsScreen" component={VehicleDetailsScreen} />
      <Stack.Screen name="NewJobDetailsScreen" component={NewJobDetailsScreen} />
      <Stack.Screen name="CreateJobScreen" component={CreateJobScreen} />

    </Stack.Navigator>
  );
}
