import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import GenerateInvoiceScreen from "../screens/GenerateInvoiceScreen";
import InvoiceDetailsScreen from "../screens/InvoiceDetailsScreen";
import InvoiceHistoryScreen from "../screens/InvoiceHistoryScreen";
import VehicleDetailsScreen from "../screens/VehicleDetailsScreen";
import CombinedInvoiceScreen from "../screens/CombinedInvoiceScreen";

const Stack = createStackNavigator();

export default function InvoiceStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CombinedInvoiceScreen" component={CombinedInvoiceScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="InvoiceHistoryScreen" component={InvoiceHistoryScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="InvoiceDetailsScreen" component={InvoiceDetailsScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="VehicleDetailsScreen" component={VehicleDetailsScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="GenerateInvoiceScreen" component={GenerateInvoiceScreen} options={{ gestureEnabled: false }} />
        </Stack.Navigator>
    );
}