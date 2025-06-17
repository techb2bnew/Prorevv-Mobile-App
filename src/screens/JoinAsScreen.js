import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Dimensions, Platform } from 'react-native';
import { blackColor, blueColor, lightBlueColor, whiteColor } from '../constans/Color';
import { TECH_OBJECT_IMAGE } from '../assests/images';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import CustomButton from '../componets/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../componets/Header';
const { width, height } = Dimensions.get('window');

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween } = BaseStyle;

const JoinAsScreen = ({ navigation }) => {

    const [selectedRole, setSelectedRole] = useState("IFS - Technician");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;


    const handleContinue = () => {
        // Map the display values to your internal values
        const roleValue = selectedRole === "IFS - Technician"
            ? "Ifs-Technician"
            : "Single-Technician";

        navigation.navigate("Register", { role: roleValue });
    };


    return (
        <View style={[styles.container, flex]}>
            <Header title={"Join as"} />
            <View style={{ padding: spacings.large, flex: 1 }}>
                {/* Selection Buttons */}
                <TouchableOpacity
                    style={[styles.option, selectedRole === "IFS - Technician" && styles.selectedOption, { padding: isTablet ? 35 : 25 }]}
                    onPress={() => setSelectedRole("IFS - Technician")}
                >
                    <FontAwesome name="users" size={20} color={blueColor} />
                    <Text style={[styles.optionText, { color: selectedRole === "IFS - Technician" ? blueColor : blackColor }]}>IFS - Technician</Text>
                    {selectedRole === "IFS - Technician" && <Ionicons name="checkmark-circle" size={24} color="navy" />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.option, selectedRole === "Single - Technician" && styles.selectedOption, { padding: isTablet ? 35 : 25 }]}
                    onPress={() => setSelectedRole("Single - Technician")}
                >
                    <FontAwesome name="user" size={20} color={blueColor} />
                    <Text style={[styles.optionText, { color: selectedRole === "Single - Technician" ? blueColor : blackColor }]}>Single - Technician</Text>
                    {selectedRole === "Single - Technician" && <Ionicons name="checkmark-circle" size={24} color="navy" />}
                </TouchableOpacity>

                {!isIOSAndTablet && <View style={[styles.circle, { width: isTablet ? 1000 : 600, height: isTablet ? 1000 : 600, borderRadius: isTablet ? 2000 : 1000 }]} />}
                <Image source={TECH_OBJECT_IMAGE} style={[styles.image, { height: isTablet ? Platform.OS === "android" ? hp(62) : hp(65) : hp(59), width: isTablet ? Platform.OS === "android" ? wp(58) : wp(50) : wp(68), bottom: isTablet ? hp(4) : hp(5) }]} />
                <View style={[{ position: "absolute", bottom: hp(2), width: "100%", left: 10 }]}>
                    <CustomButton
                        title="Continue"
                        onPress={handleContinue}
                    />
                </View>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: whiteColor
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 25,
        borderRadius: 10,
        marginBottom: 15,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: blueColor,
    },
    selectedOption: {
        borderColor: blueColor,
        backgroundColor: "#E8EAF6",
    },
    optionText: {
        fontSize: 20,
        fontWeight: style.fontWeightThin1x.fontWeight,
        flex: 1,
        marginLeft: 10,
    },
    image: {
        width: wp(68),
        height: hp(55),
        alignSelf: "center",
        position: "absolute",
        bottom: hp(5)
    },
    circle: {
        backgroundColor: lightBlueColor,
        position: "absolute",
        bottom: -200, right: 0
    }
});

export default JoinAsScreen;
