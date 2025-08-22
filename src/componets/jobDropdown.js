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
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Feather } from "@expo/vector-icons";
import { blackColor, blueColor, grayColor, mediumGray, lightBlueColor } from "../constans/Color";
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

    return (
        <View style={{ paddingHorizontal: spacings.large, height: isTablet ? heightPercentageToDP(4) : heightPercentageToDP(6) }}>
            <Pressable
                style={{
                    borderColor: blueColor,
                    borderWidth: 1,
                    borderRadius: 10,
                    padding: isTablet ? spacings.large : 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
                onPress={() => setVisible(true)}
            >
                <View style={{ width: "80%" }}>
                    <Text
                        style={{
                            color: selectedJob ? blackColor : grayColor,
                            fontSize: 16,
                            flexWrap: "wrap",
                        }}
                    >
                        {selectedJob ? getJobName(selectedJob) : "Select a Job"}
                    </Text>
                </View>

                <MaterialCommunityIcons name="chevron-down" size={22} color={blackColor} style={{ marginLeft: 8 }}
                />
            </Pressable>

            {/* Modal starts */}
            <Modal visible={visible} animationType="slide" transparent>
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
                                            backgroundColor: isSelected ? "#e6f0ff" : "white",
                                            borderBottomColor: "#ccc",
                                            borderBottomWidth: 1,
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                        }}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={{ color: blackColor }}>{getJobName(item)}</Text>
                                        {isSelected && (
                                            <MaterialCommunityIcons
                                                name="check-circle"
                                                size={20}
                                                color={blueColor}
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
