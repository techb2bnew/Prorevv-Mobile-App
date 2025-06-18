import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Pressable, ScrollView, Alert, ScrollViewBase, Image, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Keyboard, Dimensions, TouchableWithoutFeedback } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import axios from 'axios';
import Header from '../componets/Header';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { blackColor, blueColor, grayColor, lightBlueColor, lightGrayColor, mediumGray, whiteColor } from '../constans/Color';
import Toast from 'react-native-simple-toast';
import Fontisto from 'react-native-vector-icons/Fontisto';
import AsyncStorage from '@react-native-async-storage/async-storage';




const WorkOrderScreen = ({ navigation }) => {
  const { width, height } = Dimensions.get("window");
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobName, setSelectedJobName] = useState("");
  const [searchText, setSearchText] = useState('');

  const jobList = [
    { id: '1', title: "Ron’s Chevy", year: "2020" },
    { id: '2', title: "Ron’s Dodge", year: "2022" },
    { id: '3', title: "Ron’s Nissan", year: "2024" },
    { id: '4', title: "Ron’s Audi", year: "2025" },
    { id: '5', title: "Ron’s RAM", year: "2023" },
    { id: '6', title: "Ron’s Lexus", year: "2025" },
    { id: '7', title: "Ron’s Toyota", year: "2024" },
    { id: '8', title: "Ron’s Ford", year: "2021" },
    { id: '9', title: "Ron’s BMW", year: "2020" },
    { id: '10', title: "Ron’s Honda", year: "2022" },
    { id: '11', title: "Ron’s Hyundai", year: "2023" },
    { id: '12', title: "Ron’s Kia", year: "2021" },
    { id: '13', title: "Ron’s Volkswagen", year: "2020" },
    { id: '14', title: "Ron’s Jeep", year: "2024" },
    { id: '15', title: "Ron’s Mahindra", year: "2022" },
  ];

  useEffect(() => {
    const loadSelectedJob = async () => {
      const savedJob = await AsyncStorage.getItem("current_Job");
      if (savedJob) {
        const parsed = JSON.parse(savedJob);
        setSelectedJob(parsed.id);
        setSelectedJobName(parsed.name);
      }
    };
    loadSelectedJob();
  }, []);

  const filteredJobList = jobList.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => navigation.navigate('Home')} title={"Work Order"} />
      <View style={{ padding: spacings.large, backgroundColor: whiteColor, height: hp(100), width: wp(100) }}>
        <Text style={[styles.label, { fontSize: style.fontSizeLarge.fontSize, }]}>Select Job <Text style={{ color: 'red' }}>*</Text></Text>

        <Text style={styles.label}>Search Job </Text>
        <View style={styles.searchTextInput}>
          <TextInput
            placeholder="Search Job"
            placeholderTextColor={grayColor}
            style={styles.input}
            value={searchText}
            onChangeText={text => setSearchText(text)}
          />
          <View style={styles.iconContainer}>
            <Ionicons name="search" size={20} color="#252837" />
          </View>
        </View>

        <Text style={styles.label}>Assigned Jobs</Text>

        <View style={{
          height: hp(40),
          borderColor: blueColor,
          borderWidth: 1,
          borderRadius: 10,
          overflow: "hidden"
        }}>
          <FlatList
            data={filteredJobList}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isSelected = selectedJob === item.id;
              const backgroundColor = isSelected
                ? blueColor
                : index % 2 === 0
                  ? whiteColor
                  : lightBlueColor;

              return (
                <Pressable
                  style={[styles.jobItem, { backgroundColor }]}
                  onPress={async () => {
                    const selectedJob = {
                      id: item.id,
                      name: item.title
                    };
                    setSelectedJob(item.id);
                    setSelectedJobName(item.title);
                    await AsyncStorage.setItem("current_Job", JSON.stringify(selectedJob));
                  }}
                >
                  <Fontisto
                    name={isSelected ? "radio-btn-active" : "radio-btn-passive"}
                    size={16}
                    color={isSelected ? whiteColor : blackColor}
                    style={styles.radioIcon}
                  />
                  <Text style={[{ color: isSelected ? whiteColor : blackColor, marginLeft: spacings.xLarge }]}>
                    {item.title} ({item.year})
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        <Pressable
          style={styles.nextButton}
          onPress={() => {
            if (!selectedJob) {
              Toast.show("Please select a job");
              return;
            }

            navigation.navigate("WorkOrderScreenTwo", {
              jobName: selectedJobName
            });
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </Pressable>
      </View>
    </View>
  )
}

export default WorkOrderScreen

const styles = StyleSheet.create({
  label: {
    fontSize: style.fontSizeNormal2x.fontSize,
    fontWeight: style.fontWeightThin1x.fontWeight,
    marginBottom: spacings.large,
    color: blackColor
  },
  searchTextInput: {
    flexDirection: 'row',
    backgroundColor: whiteColor,
    borderRadius: 8,
    paddingHorizontal: spacings.xxLarge,
    alignItems: 'center',
    height: hp(5.5),
    borderColor: blueColor,
    borderWidth: 1,
    marginBottom: spacings.large
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: blueColor,
    alignItems: 'center'
  },
  iconContainer: {
    paddingLeft: spacings.large,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor: blueColor,
    paddingVertical: 12,
    width: Dimensions.get('window').width * 0.3,
    borderRadius: 8,
    marginTop: hp(10),
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerContainer: {
    marginVertical: spacings.xLarge,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: spacings.large,
    color: blackColor,
  },
  scanButton: {
    backgroundColor: blueColor,
    paddingVertical: spacings.xLarge,
    borderRadius: 10,
    marginTop: spacings.Large1x
  },
  scanButtonText: {
    color: whiteColor,
    fontWeight: style.fontWeightThin.fontWeight,
    fontWeight: style.fontWeightMedium.fontWeight,
  },
  vinInput: {
    backgroundColor: whiteColor,
    borderWidth: 1,
    borderColor: blueColor,
    borderRadius: 10,
    padding: spacings.large,
    color: blackColor,
    fontSize: style.fontSizeNormal1x.fontSize,
  },
  fetchButton: {
    backgroundColor: blueColor,
    borderRadius: 10,
    height: hp(5),
  },
  fetchButtonText: {
    color: whiteColor,
    fontWeight: style.fontWeightThin.fontWeight,
    fontSize: 12
  },
})