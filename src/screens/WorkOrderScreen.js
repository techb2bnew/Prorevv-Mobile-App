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
import { API_BASE_URL } from '../constans/Constants';

const WorkOrderScreen = ({ navigation }) => {
  const { width, height } = Dimensions.get("window");
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobName, setSelectedJobName] = useState("");
  const [searchText, setSearchText] = useState('');
  const isTablet = width >= 668 && height >= 1024;
  const [technicianId, setTechnicianId] = useState();
  const [technicianType, setTechnicianType] = useState();
  const [jobList, setJobList] = useState([]);
  const pageRef = useRef(1); // useRef to avoid re-render
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const getTechnicianDetail = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userDeatils");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setTechnicianId(parsedData?.id);
          setTechnicianType(parsedData?.types)
        }
      } catch (error) {
        console.error("Error fetching stored user:", error);
      }
    };

    getTechnicianDetail();
  }, []);

  const fetchJobsFromAPI = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/fetchAllJobs?page=${pageRef.current}&roleType=${technicianType}&userId=${technicianId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response?.data;
      const newJobs = data?.jobs.jobs || [];

      if (newJobs.length > 0) {
        setJobList(prev => [...prev, ...newJobs]);

        const currentPage = data?.currentPage || pageRef.current;
        const totalPages = data?.totalPages || 1;

        if (currentPage < totalPages) {
          pageRef.current += 1;
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }

    } catch (error) {
      console.error("Fetch error:", error);
      Toast.show("Failed to fetch jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (technicianId && technicianType) {
      fetchJobsFromAPI();
    }
  }, [technicianId, technicianType]);

  const filteredJobList = jobList.filter(item =>
    item.jobName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => navigation.navigate('Home')} title={"Work Order"} />
      <View style={{ padding: spacings.large, backgroundColor: whiteColor, height: hp(100), width: wp(100) }}>
        <Text style={[styles.label, { fontSize: style.fontSizeLarge.fontSize, }]}>Select Job <Text style={{ color: 'red' }}>*</Text></Text>

        <Text style={styles.label}>Search Job </Text>
        <View style={[styles.searchTextInput, { height: isTablet ? hp(4) : hp(5.5), }]}>
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
          maxHeight: hp(40),
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
                    setSelectedJob(item?.id);
                    setSelectedJobName(item?.jobName);
                    await AsyncStorage.setItem("current_Job", JSON.stringify(item));
                  }}
                >
                  <Fontisto
                    name={isSelected ? "radio-btn-active" : "radio-btn-passive"}
                    size={16}
                    color={isSelected ? whiteColor : blackColor}
                    style={styles.radioIcon}
                  />
                  <Text style={[{ color: isSelected ? whiteColor : blackColor, marginLeft: spacings.xLarge }]}>
                    {item?.jobName?.charAt(0).toUpperCase() + item?.jobName?.slice(1)}
                  </Text>
                </Pressable>
              );
            }}
            onEndReached={fetchJobsFromAPI}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading ? (
                <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={blueColor} />
                </View>
              ) : null
            } />
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
    // height: hp(5.5),
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