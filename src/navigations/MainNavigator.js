import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ProfileStack from "./ProfileStack";
import HomeStack from "./HomeStack";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "../utils";
import { blackColor, blueColor, grayColor, lightBlueColor, orangeColor, whiteColor } from "../constans/Color";
import { HOME_FOCUSED_IMAGE, HOME_IMAGE, JOB_FOCUSED_IMAGE, JOB_IMAGE, PROFILE_FOCUSED_IMAGE, PROFILE_IMAGE, SETTING_FOCUSED_IMAGE, SETTING_IMAGE } from "../assests/images";
import { Dimensions, Image, Platform, View } from "react-native";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import JobHistoryStack from "./JobHistoryStack";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useTabBar } from "../TabBarContext";
import ReportStack from "./ReportsStack";
import ScannerStack from "./ScannerStack";
import AntDesign from 'react-native-vector-icons/AntDesign';
import VinListStack from "./VinListStack";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get("window");

// Function to check if the device is a tablet
const isTablet = width >= 668 && height >= 1024;
export default function MainNavigator() {
    const { isTabBarHidden } = useTabBar();
    const [technicianType, setTechnicianType] = React.useState(null);

    const shouldHideTabBar = (route) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? "";
        return routeName === "CustomerInfo"
            || routeName === "AuthStack"
            || routeName === "JobDetails"
            || routeName === "ScannerScreen"
            || routeName === "HowToPlay"
            || routeName === "FeedBackScreen"
            || routeName === "AddVehicle"
            || routeName === "WorkOrderScreen"
            || routeName === "WorkOrderScreenTwo"
            || routeName === "VehicleDetailsScreen"
            || routeName === "NewJobDetailsScreen"
            || routeName === "CreateJobScreen"
            || isTabBarHidden;
    };

    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedData = await AsyncStorage.getItem('userDeatils');
                if (!storedData) throw new Error('User details not found');

                const parsedData = JSON.parse(storedData);
                setTechnicianType(parsedData.types);
            } catch (error) {
                console.error("Error fetching user details:", error.message);
            }
        };

        fetchUserData();
    }, []);

    if (technicianType === null) return null;


    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarLabelPosition: "below-icon",
                tabBarIcon: ({ focused, color }) => {
                    let iconName;
                    let IconComponent = Ionicons;

                    if (route.name === "Home") {
                        IconComponent = Feather;
                        iconName = focused ? "home" : "home";
                    } else if (route.name === "Reports") {
                        IconComponent = Ionicons;
                        iconName = "bag-add-outline";
                    } else if (route.name === "Scanner") {
                        IconComponent = AntDesign;
                        iconName = focused ? "scan1" : "scan1";
                    } else if (route.name === "Account") {
                        IconComponent = Feather;
                        iconName = focused ? "user" : "user";
                    } else if (route.name === "Vin List") {
                        IconComponent = Feather;
                        iconName = focused ? "list" : "list";
                    }

                    return (
                        <IconComponent
                            name={iconName}
                            size={24}
                            color={focused ? blueColor : grayColor}
                        />
                    );
                },
                tabBarActiveTintColor: blueColor,
                tabBarInactiveTintColor: grayColor,
                tabBarStyle: shouldHideTabBar(route)
                    ? { display: "none" }
                    : {
                        position: "absolute",
                        bottom: Platform.OS === "android" ? 0 : 20,
                        height: isTablet ? 90 : 70,
                        backgroundColor: lightBlueColor,
                        borderRadius: 50,
                        borderWidth: 1,
                        borderTopWidth: 1,
                        borderColor: blueColor,
                        // shadowColor: "#000",
                        // shadowOffset: { width: 0, height: 4 },
                        // shadowOpacity: 0.05,
                        // shadowRadius: 8,
                        elevation: 0,
                        paddingTop: isTablet ? 15 : 7,
                        paddingBottom: 10,
                        marginHorizontal: 20,
                        zIndex: 9999
                    },
                tabBarLabelStyle: {
                    fontSize: isTablet ? 16 : 12,
                    fontWeight: "600",
                    marginTop: 4,
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                listeners={({ navigation, route }) => ({
                    tabPress: e => {
                        const state = navigation.getState();
                        const currentRoute = state.routes.find(r => r.name === "Home");
                        if (currentRoute?.state?.index > 0) {
                            // Reset stack if not on first screen
                            navigation.navigate("Home", {
                                screen: "Home", // 👈 your initial screen name in HomeStack
                            });
                        }
                    },
                })}
            />
            {technicianType !== "ifs" && (
                <Tab.Screen
                    name="Vin List"
                    component={VinListStack}
                    listeners={({ navigation }) => ({
                        tabPress: e => {
                            const state = navigation.getState();
                            const currentRoute = state.routes.find(r => r.name === "Vin List");
                            if (currentRoute?.state?.index > 0) {
                                navigation.navigate("Vin List", {
                                    screen: "VinListScreen",
                                });
                            }
                        },
                    })}
                />)}

            <Tab.Screen
                name="Reports"
                component={ReportStack}
                listeners={({ navigation }) => ({
                    tabPress: e => {
                        const state = navigation.getState();
                        const currentRoute = state.routes.find(r => r.name === "Reports");
                        if (currentRoute?.state?.index > 0) {
                            navigation.navigate("Reports", {
                                screen: "ReportsScreen",
                            });
                        }
                    },
                })}
            />


            <Tab.Screen
                name="Account"
                component={ProfileStack}
                listeners={({ navigation }) => ({
                    tabPress: e => {
                        const state = navigation.getState();
                        const currentRoute = state.routes.find(r => r.name === "Account");
                        if (currentRoute?.state?.index > 0) {
                            navigation.navigate("Account", {
                                screen: "Profile",
                            });
                        }
                    },
                })}
            />



        </Tab.Navigator>
    )
}