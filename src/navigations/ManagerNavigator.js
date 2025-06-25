import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import WorkOrderScreen from "../screens/WorkOrderScreen";
import WorkOrderScreenTwo from "../screens/WorkOrderScreenTwo";
import ScannerScreen from "../screens/ScannerScreen";


const Stack = createStackNavigator();

export default function ManagerNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="WorkOrderScreen" component={WorkOrderScreen} initialParams={{ hideBack: true }} />
            <Stack.Screen name="WorkOrderScreenTwo" component={WorkOrderScreenTwo} />
            <Stack.Screen name="ScannerScreen" component={ScannerScreen} />
        </Stack.Navigator>
    );
}
