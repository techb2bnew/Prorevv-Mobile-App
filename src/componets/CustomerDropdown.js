import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { heightPercentageToDP, widthPercentageToDP } from "../utils";
import { blackColor, blueColor, grayColor, lightBlueColor, mediumGray } from "../constans/Color";
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
const { width, height } = Dimensions.get('window');
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-simple-toast';
import { spacings } from "../constans/Fonts";
import { useOrientation } from "../OrientationContext";

const CustomerDropdown = ({ data, selectedValue, onSelect, showIcon, rightIcon, titleText, handleLoadMore, isLoading, disabled }) => {
    const [visible, setVisible] = useState(false);
    const isTablet = width >= 668 && height >= 1024;
    const userPressed = useRef(false);
    const [dropdownHeight, setDropdownHeight] = useState(0);
    const dropdownRef = useRef(null);
    const { orientation } = useOrientation();

    const handleOpenDropdown = () => {
        userPressed.current = true;
        setVisible(true);
    };

    const handleCloseDropdown = () => {
        userPressed.current = false;
        setVisible(false);
    };

    // Function to get full customer name
    const getCustomerName = (customer) => {
        const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
        return `${capitalize(customer.fullName)}`;
    };


    return (
        <View style={[styles.container, { height: isTablet ? heightPercentageToDP(4) : orientation === "LANDSCAPE" ? heightPercentageToDP(8) : heightPercentageToDP(6) }]}>
            <Pressable style={[styles.dropdownButton, { padding: isTablet ? spacings.large : 8 }]} onPress={() => {
                if (!disabled) {
                    handleOpenDropdown();
                } else {
                    // Optionally show toast or feedback
                    Toast.show("Customer selection is disabled.");
                }
            }}>
                {showIcon && <MaterialCommunityIcons name={"account"} size={22} color={mediumGray} />}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                    <Text style={[styles.selectedText, { color: selectedValue ? blackColor : grayColor }]} numberOfLines={1} ellipsizeMode="tail">
                        {selectedValue ? (selectedValue.isAllOption ? 'All Customers' : getCustomerName(selectedValue)) : "Select customer"}
                    </Text>
                </ScrollView>

                {rightIcon &&
                    <View>
                        <MaterialCommunityIcons name={"chevron-down"} size={22} color={blackColor} style={{ marginLeft: "auto" }} />
                    </View>}
            </Pressable>

            <Modal transparent visible={visible} animationType="slide">
                <Pressable style={styles.overlay} onPress={handleCloseDropdown} />
                {dropdownHeight > 0 && (
                    <View style={{
                        position: "absolute",
                        bottom: dropdownHeight,
                        left: width / 2 - 27,
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
                    <Text style={styles.modalTitle}>{titleText || "Select Customer"}</Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => {
                            const isSelected = selectedValue?.id === item.id;

                            return (
                                <Pressable
                                    style={[
                                        styles.item,
                                        isSelected && { backgroundColor: lightBlueColor }  // light blue background
                                    ]}
                                    onPress={() => {
                                        onSelect(item);
                                        handleCloseDropdown();
                                    }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <Text style={[styles.itemText, item.isAllOption && { fontWeight: 'bold' }]}>
                                            {item.isAllOption ? 'All Customers' : getCustomerName(item)}
                                        </Text>
                                        {isSelected && (
                                            <MaterialCommunityIcons name="check-circle" size={20} color={blueColor} />
                                        )}
                                    </View>
                                </Pressable>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No customers available</Text>
                        }
                        showsVerticalScrollIndicator={true}
                        ListFooterComponent={
                            isLoading ? <ActivityIndicator size="large" color={blueColor} /> : null
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        nestedScrollEnabled={true}
                    />
                </View>
            </Modal>
        </View>
    );
};

// Reuse the same styles from your original component
const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: blueColor,
        borderRadius: 10,
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
        paddingVertical: 10,
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

export default CustomerDropdown;