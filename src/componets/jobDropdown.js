import React, { useState } from "react";
import {
    View,
    Text,
    Pressable,
    Modal,
    FlatList,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Platform,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Feather } from "@expo/vector-icons";
import { blackColor, blueColor, grayColor, mediumGray, lightBlueColor, whiteColor, lightGrayColor } from "../constans/Color";
import { spacings, style } from "../constans/Fonts";
import { heightPercentageToDP } from "../utils";

const { width } = Dimensions.get("window");

const JobDropdown = ({
    jobs = [],
    selectedJobId,
    setSelectedJobId,
    isLoading,
    getJobName = (item) => item.name,
    titleText = "Select Job",
    onEndReached = () => { },
    hasMore = false,
    loadingMore = false,
    disabled = false,
}) => {
    const [visible, setVisible] = useState(false);
    const selectedJob = jobs.find((j) => j.id === selectedJobId);
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;
    const handleSelect = (item) => {
        setSelectedJobId(item.id);
        setVisible(false);
    };

    // Filter out "All Jobs" option to get actual jobs count
    const actualJobs = jobs.filter(job => job?.id !== 'all' && !job?.isAllOption);

    return (
        <View style={{ paddingHorizontal: spacings.large, height: isTablet ? heightPercentageToDP(4) : heightPercentageToDP(6) }}>
            <Pressable
                style={{
                    borderColor: disabled ? grayColor : blackColor,
                    borderWidth: 1,
                    borderRadius: 10,
                    padding: isTablet ? spacings.large : 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: disabled ? lightGrayColor : whiteColor,
                    opacity: disabled ? 0.6 : 1,
                }}
                onPress={() => !disabled && setVisible(true)}
                disabled={disabled}
            >
                <View style={{ width: "80%", flexShrink: 1 }}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                            color: disabled ? grayColor : (selectedJob ? blackColor : grayColor),
                            fontSize: 16,
                        }}
                    >
                        {disabled ? "No jobs available" : (selectedJob ? getJobName(selectedJob) : "Select a Job")}
                    </Text>
                </View>

                <MaterialCommunityIcons 
                    name="chevron-down" 
                    size={22} 
                    color={disabled ? grayColor : blackColor} 
                    style={{ marginLeft: 8 }}
                />
            </Pressable>

            {/* Modal starts */}
            <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" supportedOrientations={["portrait", "landscape-left", "landscape-right"]}>
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "flex-end",
                    }}
                    onPress={() => setVisible(false)}
                >
                    <View
                        style={{
                            backgroundColor: "white",
                            paddingVertical: spacings.xxxxLarge,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            maxHeight: "60%",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: style.fontSizeNormal2x.fontSize,
                                fontWeight: "bold",
                                marginBottom: 10,
                                textAlign: "center",
                            }}
                        >
                            {titleText}
                        </Text>

                        <FlatList
                            data={jobs}
                            keyExtractor={(item) => item?.id?.toString()}
                            renderItem={({ item }) => {
                                const isSelected = item?.id === selectedJobId;
                                return (
                                    <Pressable
                                        style={{
                                            padding: spacings.xxLarge,
                                            backgroundColor: isSelected ? blackColor : "white",
                                            borderBottomColor: "#ccc",
                                            borderBottomWidth: 1,
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                        }}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text 
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            style={{ color: isSelected ? whiteColor : blackColor, flex: 1, marginRight: 10 }}
                                        >
                                            {getJobName(item)}
                                        </Text>
                                        {isSelected && (
                                            <MaterialCommunityIcons
                                                name="check-circle"
                                                size={20}
                                                color={whiteColor}
                                            />
                                        )}
                                    </Pressable>
                                );
                            }}
                            ListEmptyComponent={
                                <Text style={{ textAlign: "center", color: grayColor, marginTop: 10 }}>
                                    No jobs available
                                </Text>
                            }
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                loadingMore ? <ActivityIndicator size="small" color={blueColor} /> : null
                            }
                            onEndReached={() => {
                                if (hasMore && !loadingMore) {
                                    onEndReached(); // Call parent to fetch next page
                                }
                            }}
                            onEndReachedThreshold={0.5}
                            nestedScrollEnabled
                        />

                    </View>
                </Pressable>
            </Modal>
            {/* Modal ends */}
        </View>
    );
};

export default JobDropdown;
