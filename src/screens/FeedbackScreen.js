import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable, TextInput, Image } from 'react-native';
import * as ImagePicker from "react-native-image-picker";
import CustomDropdown from "../componets/CustomDropdown";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { BaseStyle } from '../constans/Style';
import { spacings, style } from '../constans/Fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { blackColor, blueColor, grayColor, redColor, whiteColor } from "../constans/Color";
import CustomButton from "../componets/CustomButton";
import SuccessModal from "../componets/Modal/SuccessModal";
import { FEEDBACK_IMAGE } from "../assests/images";
import { Image as ImageCompressor } from 'react-native-compressor';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../componets/Header";
import { API_BASE_URL } from "../constans/Constants";

const { flex, alignItemsCenter, flexDirectionRow, textAlign } = BaseStyle;

const FeedbackScreen = () => {
    const route = useRoute();
    const { emailParam } = route.params || {};
    const navigation = useNavigation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState(emailParam);
    const [issueType, setIssueType] = useState("Issue");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [descriptionError, setDescriptionError] = useState("");
    const [error, setError] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const issueTypes = ["Issue", "Feedback"];
    const priorityLevels = ["Low", "Medium", "High"];
    const [technicianType, setTechnicianType] = useState();


    const compressImage = async (uri) => {
        try {
            const compressedUri = await ImageCompressor.compress(uri, {
                quality: 0.7, // Reduce quality (1 = 100%)
                maxWidth: 500, // Resize width
                maxHeight: 500, // Resize height
            });

            return compressedUri; // Compressed image URI return karega
        } catch (error) {
            console.log('Image Compression Error:', error);
            return uri; // Agar error aaye toh original image return kare
        }
    };

    useFocusEffect(
        useCallback(() => {
            const getTechnicianDetail = async () => {
                try {
                    const storedData = await AsyncStorage.getItem('userDeatils');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        setTechnicianType(parsedData.types)
                    }
                } catch (error) {
                    console.error("Error fetching stored user:", error);
                }
            };
            getTechnicianDetail();
        }, [])
    );


    const handleSubmit = async () => {
        setEmailError("");
        setDescriptionError("");
        setIsLoading(true);

        let isValid = true;

        if (!description.trim()) {
            setDescriptionError("Description is required");
            isValid = false;
        }

        if (!isValid) {
            setIsLoading(false);
            return;
        }

        const apiUrl = `${API_BASE_URL}/feedback`;

        // ✅ Fetch token from AsyncStorage
        const token = await AsyncStorage.getItem("auth_token");
        if (!token) {
            console.error("Token not found!");
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("name", name || "");
        formData.append("email", email);
        formData.append("issueType", issueType);
        formData.append("subject", subject);
        formData.append("description", description);
        formData.append("priorityLevel", priority);
        formData.append("roleType", technicianType);


        if (image) {
            const newUri = Platform.OS === "ios" ? image.replace("file://", "") : image;
            formData.append("image", {
                uri: newUri,
                name: "feedback_image.jpg",
                type: "image/jpeg",
            });
        }

        console.log("Submitting Feedback...", formData);

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (error) {
                console.error("Invalid JSON response:", text);
                return;
            }

            if (!response.ok) {
                console.error("Error:", data.error || "Something went wrong");
                setError(data.error || "Something went wrong")
            } else {
                console.log("Success:", data.message || "Feedback submitted successfully!");
                setModalVisible(true);
            }
        } catch (error) {
            console.error("Network Error:", error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <View style={[styles.container, flex]}>
                {/* ScrollView */}
                <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp(2) }}>
                    {/* Header with Back Button */}
                    <Header title={"Feedback & Issue Reporting"} />
                    <View style={{ padding: spacings.xxLarge }}>
                        <Text style={styles.label}>Name (Optional)</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            placeholder="Enter your name"
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text); // Store the email
                                setEmailError(""); // Clear error when user types
                            }}
                            editable={false}
                            style={styles.input}
                            placeholder="Enter your Email"
                        />
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        <Text style={styles.label}>Issue Type</Text>
                        <CustomDropdown data={issueTypes} selectedValue={issueType} onSelect={setIssueType} rightIcon={true} titleText={"Select a Issue Type"} />

                        <Text style={styles.label}>Subject</Text>
                        <TextInput
                            value={subject}
                            onChangeText={setSubject}
                            style={styles.input}
                            placeholder="Enter subject"
                        />

                        <Text style={styles.label}>Description <Text style={{ color: redColor }}>*</Text></Text>
                        <TextInput
                            value={description}
                            onChangeText={(text) => {
                                setDescription(text); // Store the description
                                setDescriptionError(""); // Clear error when user types
                            }}
                            multiline
                            style={styles.textArea}
                            placeholder="Describe your issue or feedback"
                        />
                        {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}

                        {/* Upload Image Section */}
                        <TouchableOpacity
                            style={styles.uploadBox}
                            onPress={async () => {
                                try {
                                    const result = await ImagePicker.launchImageLibrary({
                                        mediaType: 'photo',
                                        quality: 0.8,
                                        selectionLimit: 1,
                                    });

                                    if (!result.didCancel && result.assets && result.assets.length > 0) {
                                        const pickedImageUri = result.assets[0].uri;

                                        // Pehle image ko compress karo
                                        const compressedUri = await compressImage(pickedImageUri);

                                        // Ab compressed image ko setImage mein set karo
                                        setImage(compressedUri);
                                    }
                                } catch (err) {
                                    console.log("Error picking image:", err);
                                }
                            }}
                        >
                            {image ? (
                                <Image source={{ uri: image }} style={styles.uploadedImage} />
                            ) : (
                                <>
                                    <Ionicons name="camera-outline" size={30} color={grayColor} />
                                    <Text style={[styles.label, { fontSize: 10, color: grayColor }]}>
                                        (“jpeg , webp and png” images will be accepted)
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Text style={[textAlign, { fontSize: 10, color: redColor }]}>
                            Note: Upload an image, and I'll help! 😊
                        </Text>

                        <Text style={styles.label}>Priority Level</Text>
                        <CustomDropdown data={priorityLevels} selectedValue={priority} onSelect={setPriority} rightIcon={true} titleText={"Select a Priority Level"} />
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* <CustomButton title="Submit" onPress={handleSubmit} style={styles.button} loading={isLoading} disabled={isLoading} /> */}
                    </View>
                    {modalVisible && <SuccessModal
                        visible={modalVisible}
                        onClose={() => setModalVisible(false)}
                        headingText={"Thank You for Your Feedback!"}
                        text={"Your Feedback has been submitted successfully. Our team will review it soon."}
                        onPressContinue={() => { setModalVisible(false), navigation.goBack(); }}
                        buttonText={'Ok'}
                        image={FEEDBACK_IMAGE}
                    />}
                </ScrollView>
                <View style={{ padding: spacings.xLarge, paddingHorizontal: spacings.Large1x }}>
                    <CustomButton title="Submit" onPress={handleSubmit} style={styles.button} loading={isLoading} disabled={isLoading} />
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: whiteColor,
    },
    header: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacings.large,
        paddingHorizontal: spacings.xxLarge,
        backgroundColor: whiteColor,
    },
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: style.fontSizeLarge.fontSize,
        fontWeight: style.fontWeightThin1x.fontWeight,
        color: blackColor,
    },
    label: {
        fontSize: style.fontSizeNormal2x.fontSize,
        fontWeight: style.fontWeightThin1x.fontWeight,
        marginVertical: spacings.xLarge,
    },
    input: {
        height: 41.2,
        borderWidth: 1,
        borderColor: blackColor,
        borderRadius: 50,
        paddingHorizontal: spacings.large,
        backgroundColor: "#fff",
    },
    textArea: {
        borderWidth: 1,
        borderColor: blackColor,
        borderRadius: 5,
        padding: spacings.large,
        height: 100,
        textAlignVertical: "top",
        marginBottom: 10,
    },
    uploadBox: {
        width: "100%",
        borderColor: blackColor,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: spacings.small2x,
        marginVertical: spacings.large,
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
    },
    uploadedImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        borderRadius: 10,
    },
    uploadText: {
        marginTop: 5,
        fontSize: 12,
    },
    button: {
        marginTop: spacings.large,
        backgroundColor:blackColor
    },
    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 2,
    },
});

export default FeedbackScreen;
