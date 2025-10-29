import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, StyleSheet, ScrollView, Dimensions } from "react-native";
import { heightPercentageToDP, widthPercentageToDP } from "../utils";
import { blackColor, blueColor, grayColor, mediumGray } from "../constans/Color";
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
const { width, height } = Dimensions.get('window');
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-simple-toast';
import { spacings } from "../constans/Fonts";

const CustomDropdown = ({ data, country,selectedValue, onSelect, showIcon, rightIcon, titleText, state }) => {
    const [visible, setVisible] = useState(false);
    const isTablet = width >= 668 && height >= 1024;
    // console.log(data);
    const userPressed = useRef(false);
    const [dropdownHeight, setDropdownHeight] = useState(0);
    const dropdownRef = useRef(null);
    const handleOpenDropdown = () => {
        userPressed.current = true;
        setVisible(true);
    };

    const handleCloseDropdown = () => {
        userPressed.current = false;
        setVisible(false);
    };

    return (
        <View style={[styles.container, { height: isTablet ? heightPercentageToDP(4) : heightPercentageToDP(6) }]}>
            <Pressable style={[styles.dropdownButton,{padding: isTablet ? spacings.large : 8}]}
                onPress={handleOpenDropdown}>
                {showIcon && <MaterialCommunityIcons name={"flag"} size={22} color={mediumGray} />}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                    <Text style={[styles.selectedText, { color: selectedValue ? blackColor : grayColor }]} numberOfLines={1} ellipsizeMode="tail">
                        {selectedValue ?
                            selectedValue
                                .split(" ")
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")
                            : country ? "Select country" : state ? "Select state" : "Select city"
                        }
                    </Text>
                </ScrollView>

                {rightIcon &&
                    <View >
                        <MaterialCommunityIcons name={"chevron-down"} size={22} color={blackColor} style={{ marginLeft: "auto" }} />
                    </View>}
            </Pressable>

            <Modal transparent visible={visible} animationType="slide" presentationStyle="overFullScreen" supportedOrientations={["portrait", "landscape-left", "landscape-right"]}>
                <Pressable style={styles.overlay} onPress={handleCloseDropdown} />
                {/* <View style={{ position: "absolute", bottom: heightPercentageToDP(49), left: widthPercentageToDP(45) }}>
                    <Feather name="chevron-down" size={55} color={blackColor} />
                </View> */}
                {dropdownHeight > 0 && (
                    <View style={{
                        position: "absolute",
                        bottom: dropdownHeight,
                        left: width / 2 - 27, // 27 is half of icon size (55/2)
                        zIndex: 1000,
                    }}>
                        <Feather name="chevron-down" size={55} color={blackColor} />
                    </View>
                )}
                <View
                    ref={dropdownRef}
                    style={styles.fullScreenDropdown}
                    onLayout={(event) => {
                        const { height } = event.nativeEvent.layout;
                        setDropdownHeight(height);
                    }}
                >
                    <Text style={styles.modalTitle}>{titleText ? titleText : "Select"}</Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => (country ? item.id : item.state_code)}
                        renderItem={({ item }) => (
                            <Pressable
                                style={styles.item}
                                onPress={() => {
                                    onSelect(state ? item.name : item);
                                    handleCloseDropdown(); // close on selection
                                }}
                            >
                                <Text style={styles.itemText}>{state ? item.name : item}</Text>
                            </Pressable>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>
                            {country
                                ? "No Country available"
                                : state
                                    ? "No states available"
                                    : data?.length === 0
                                        ? "No city available"
                                        : "Please select state first"
                            }</Text>}
                        showsVerticalScrollIndicator={true}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        // height: heightPercentageToDP(6),
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: blueColor,
        padding: 8,
        borderRadius: 50,
        backgroundColor: "#fff",
        flexDirection: "row",
    },
    scrollContainer: {
        flexDirection: "row",
        alignItems: "center",
        minWidth: "100%",
    },
    selectedText: {
        fontSize: 16,
        paddingLeft: 8,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    fullScreenDropdown: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        maxHeight: heightPercentageToDP(50),
        backgroundColor: "#fff",
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        elevation: 5,
        padding: 10,
        paddingBottom: 30
    },
    modalTitle: {
        textAlign: "center",
        fontWeight: "500",
        fontSize: 18,
        paddingVertical: 8,
        color: blackColor,
    },
    item: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    itemText: {
        fontSize: 14,
        color: "#333",
    },
    emptyText: {
        textAlign: "center",
        fontSize: 16,
        color: "gray",
        marginTop: 20,
    }
});

export default CustomDropdown;