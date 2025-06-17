import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Feather from 'react-native-vector-icons/Feather';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { blackColor, whiteColor, grayColor, mediumGray, orangeColor, greenColor, redColor, lightGrayColor, blueColor, lightBlueColor } from '../constans/Color';
import { BaseStyle } from '../constans/Style';
import { spacings, style } from '../constans/Fonts';
import DatePicker from "react-native-date-picker";
import { useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SORT_IMAGE } from '../assests/images';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import NetInfo from "@react-native-community/netinfo";
import Header from '../componets/Header';
import { API_BASE_URL } from '../constans/Constants';

const { flex, alignItemsCenter, alignJustifyCenter, resizeModeContain, flexDirectionRow, justifyContentSpaceBetween, textAlign, justifyContentCenter, justifyContentSpaceEvenly } = BaseStyle;

const JobHistoryScreen = ({ navigation }) => {
  const route = useRoute();
  const { jobCompleted } = route.params || {};
  const [search, setSearch] = useState('');
  const [jobHistoryData, setjobHistoryData] = useState([])
  const [technicianId, setTechnicianId] = useState();
  const [technicianType, setTechnicianType] = useState();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortType, setSortType] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { width, height } = Dimensions.get("window");
  const isTablet = width >= 668 && height >= 1024;
  const [jobFilter, setJobFilter] = useState('active'); // 'all', 'active', 'completed'
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);


  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const toggleFilterModal = () => {
    setFilterModalVisible(!isFilterModalVisible);
  };

  const handleFilterSelect = (filter) => {
    setJobFilter(filter);
    setFilterModalVisible(false);
  };

  const handleSort = (order, type) => {
    let sortedData = [...jobHistoryData];

    if (type === "name") {
      sortedData.sort((a, b) => {
        return order === "asc"
          ? a?.customer?.firstName.localeCompare(b?.customer?.firstName)
          : b?.customer?.firstName.localeCompare(a?.customer?.firstName);
      });
    } else if (type === "date") {
      sortedData.sort((a, b) => {
        return order === "oldest"
          ? new Date(a?.createdAt) - new Date(b?.createdAt)
          : new Date(b?.createdAt) - new Date(a?.createdAt);
      });
    } else if (type === "modified") {
      sortedData.sort((a, b) => {
        return order === "oldest"
          ? new Date(a?.updatedAt) - new Date(b?.updatedAt)
          : new Date(b?.updatedAt) - new Date(a?.updatedAt);
      });
    } else if (type === "status") {
      sortedData.sort((a, b) => {
        const statusA = a?.jobStatus ? "Complete" : "InProgress";
        const statusB = b?.jobStatus ? "Complete" : "InProgress";

        return order === "asc"
          ? statusA.localeCompare(statusB) // InProgress → Complete
          : statusB.localeCompare(statusA); // Complete → InProgress
      });
    }

    // ✅ Pehle se select kiya hua item sabse upar rahe
    const selectedItem = sortedData.find(item => item.sortType === type);
    sortedData = sortedData.filter(item => item.sortType !== type);
    if (selectedItem) sortedData.unshift(selectedItem);

    setjobHistoryData(sortedData);
    setSortOrder(order);
    setSortType(type);
    setModalVisible(false);
  };

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1); // 👈 1 month before today
    setStartDate(lastMonth);
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

  useEffect(() => {
    if (technicianId) {
      checkFirstLaunch();
    }
  }, [technicianId]);


  const checkFirstLaunch = async () => {
    try {
      const storedData = await AsyncStorage.getItem("jobHistoryData");

      if (storedData) {
        setjobHistoryData(JSON.parse(storedData));
        setLoading(false);
      }

      const isFetched = await AsyncStorage.getItem("jobHistoryFetched");
      if (!isFetched) {
        console.log("wokring");
        await fetchJobHistory();
        await AsyncStorage.setItem("jobHistoryFetched", "true");
      }
    } catch (error) {
      console.error("Error checking first launch:", error);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getTechnicianDetailAndFetchJobs = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userDeatils");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const id = parsedData?.id;
          setTechnicianId(id);

          if (id) {
            setTimeout(() => {
              fetchJobHistory(); // Ab ye technicianId update hone ke baad chalega
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error fetching stored user:", error);
      }
    };

    getTechnicianDetailAndFetchJobs();
  }, [jobCompleted, technicianId]);


  const fetchJobHistory = async (newPage = 1, isPagination = false) => {
    if (!technicianId) {
      console.warn("No Technician ID found. Exiting function.");
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.warn("No internet connection. Loading cached data...");

      // Load cached data if offline
      const cachedData = await AsyncStorage.getItem("jobHistoryData");
      if (cachedData) {
        setjobHistoryData(JSON.parse(cachedData));
      }
      return;
    }

    // Show loading indicators based on request type
    if (isPagination) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/fetchJobHistory?technicianId=${technicianId}&roleType=${technicianType}&page=${newPage}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newJobs = response?.data?.jobs?.jobs || [];

      const updatedJobs = newPage === 1 ? newJobs : [...jobHistoryData, ...newJobs];

      setjobHistoryData(updatedJobs);
      await AsyncStorage.setItem("jobHistoryData", JSON.stringify(updatedJobs));
      console.log("working", updatedJobs);

      setHasMore(newJobs.length > 0);
      setPage(newPage);
    } catch (error) {
      console.error("Error fetching job history:", error);
    } finally {
      if (isPagination) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    setStartDate(sevenDaysAgo);
    setEndDate(today);

    setPage(1);
    setHasMore(true);
    await fetchJobHistory(1, false);
  };

  // Load More (fetch next page)
  const handleLoadMore = async () => {
    if (hasMore && !loadingMore) {
      await fetchJobHistory(page + 1, true);
    }
  };

  const fetchFilteredJobHistory = async (start, end) => {
    if (!technicianId) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const formattedStartDate = start
        ? new Date(start).toISOString().split("T")[0].split("-").reverse().join("-")
        : "";

      const formattedEndDate = end
        ? new Date(end).toISOString().split("T")[0].split("-").reverse().join("-")
        : "";

      console.log("Start date:", formattedStartDate, "End date:", formattedEndDate, "technicianid", technicianId, token);

      const response = await axios.post(
        `${API_BASE_URL}/jobFilter`,
        `startDate=${formattedStartDate}&endDate=${formattedEndDate}&technicianId=${technicianId}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response:", response?.data?.jobs);
      setjobHistoryData(response?.data?.jobs || []);
    } catch (error) {
      console.error("Error fetching filtered job history:", error);
    } finally {
      setLoading(false);
    }
  };

  // const filteredData = jobHistoryData?.filter(item => {
  //   const matchesSearch =
  //     item?.customer?.firstName.toLowerCase().includes(search.toLowerCase()) ||
  //     item?.vin.includes(search) ||
  //     item?.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
  //     item?.customer?.phoneNumber?.includes(search);

  //   return matchesSearch;
  // });

  const filteredData = jobHistoryData?.filter(item => {
    // First filter by status
    const statusMatch =
      jobFilter === 'all' ||
      (jobFilter === 'active' && item.jobStatus === false) ||
      (jobFilter === 'completed' && item.jobStatus === true);

    // Then filter by search text
    const matchesSearch =
      item?.customer?.firstName.toLowerCase().includes(search.toLowerCase()) ||
      item?.vin.includes(search) ||
      item?.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      item?.customer?.phoneNumber?.includes(search);

    return statusMatch && matchesSearch;
  });

  const renderItem = ({ item }) => {
    // console.log("Item:", item.jobStatus);
    const Status = item.jobStatus === false ? "In Progress" : "Complete";

    return (
      <Pressable
        style={[
          styles.listItem,
          justifyContentSpaceBetween,
          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: isTablet ? 20 : 10 },
        ]}
        onPress={() => navigation.navigate("JobDetails", { jobId: item.id })}
      >
        <View style={{ width: "25%" }}>
          <Text style={styles.value}>
            {item?.customer?.firstName.charAt(0).toUpperCase() + item?.customer?.firstName.slice(1) + " " +
              item?.customer?.lastName.charAt(0).toUpperCase() + item?.customer?.lastName.slice(1)}
          </Text>
        </View>

        <View style={{ width: "45%" }}>
          <Text style={styles.value}>{item?.vin}</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }} >
          <Text style={styles.viewText}>View</Text>
        </View>
      </Pressable>
    );
  };


  return (
    <View style={[flex, styles.container]}>
      {/* Header */}
      <Header title={"Job History"} onBack={() => navigation.navigate("Home")} />
      <TouchableOpacity
        onPress={handleRefresh}
        disabled={loading}
        style={{
          position: "absolute",
          top: Platform.OS === "android" ? isTablet ? 20 : 13 : isTablet ? 20 : 13,
          right: 15,
          backgroundColor: blueColor,
          width: isTablet ? wp(8) : wp(9),
          height: isTablet ? wp(6) : wp(8),
          borderRadius: 5,
          borderWidth: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator size={isTablet ? 30 : 18} color={whiteColor} />
        ) : (
          <Ionicons name="refresh-sharp" size={isTablet ? 30 : 20} color={whiteColor} />
        )}
      </TouchableOpacity>

      <View style={{ padding: spacings.large, }}>
        {/* Filter & Date Picker */}
        <View style={styles.datePickerContainer}>
          <View style={{ width: wp(38) }}>
            <Text style={styles.dateText}>From*</Text>
          </View>
          <View style={{ width: wp(38) }}>
            <Text style={styles.dateText}>To*</Text>
          </View>
        </View>
        <View style={[styles.datePickerContainer, { marginBottom: 15 }]}>
          <TouchableOpacity onPress={() => setIsStartPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
            <Text style={styles.dateText}>{startDate.toLocaleDateString("en-GB")}</Text>
            <Feather name="calendar" size={20} color={blackColor} />

          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsEndPickerOpen(true)} style={[styles.datePicker, flexDirectionRow, alignItemsCenter]}>
            <Text style={styles.dateText}>{endDate.toLocaleDateString("en-GB")}</Text>
            <Feather name="calendar" size={20} color={blackColor} />
          </TouchableOpacity>
        </View>

        <DatePicker
          modal
          open={isStartPickerOpen}
          date={startDate}
          mode="date"
          onConfirm={(date) => {
            setStartDate(date);
            setIsStartPickerOpen(false);
            fetchFilteredJobHistory(date, endDate);
          }}
          onCancel={() => setIsStartPickerOpen(false)}
        />

        <DatePicker
          modal
          open={isEndPickerOpen}
          date={endDate}
          mode="date"
          onConfirm={(date) => {
            const newEndDate = date;
            setEndDate(newEndDate);
            setIsEndPickerOpen(false);
            fetchFilteredJobHistory(startDate, newEndDate); // Use new end date
          }}
          onCancel={() => setIsEndPickerOpen(false)}
        />

        {/* Search Bar */}
        <View style={[styles.searchBar, flexDirectionRow, alignItemsCenter, {
          width:
            Platform.OS === "android"
              ? isTablet
                ? wp(87) // Android tablet
                : wp(78) // Android phone
              : isTablet
                ? wp(88) // iOS tablet
                : wp(80), // iOS phone
        }]}>
          <TextInput
            style={[styles.searchInput, flex]}
            placeholder="Search.."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={blackColor}
          />
          <Feather name="search" size={20} color={blackColor} />

          <TouchableOpacity style={[styles.filterButton, { top: isTablet ? Platform.OS === "android" ? hp(0.5) : hp(1) : hp(0.5), right: isTablet ? Platform.OS === "android" ? -80 : -100 : -60 }]}
            onPress={toggleModal}
          >
            <Image source={SORT_IMAGE} resizeMode='contain' style={{ width: isTablet ? wp(7) : wp(10), height: hp(3.2) }} />
          </TouchableOpacity>
        </View>
        {/* Filter Tabs */}
        <View style={styles.tabContainer}>

          <TouchableOpacity
            onPress={() => handleFilterSelect('active')}
            style={[
              styles.tabButton,
              jobFilter === 'active' && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              jobFilter === 'active' && styles.activeTabText
            ]}>
              Active Jobs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleFilterSelect('completed')}
            style={[
              styles.tabButton,
              jobFilter === 'completed' && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              jobFilter === 'completed' && styles.activeTabText
            ]}>
              Completed Jobs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect('all')}
            style={[
              styles.tabButton,
              jobFilter === 'all' && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              jobFilter === 'all' && styles.activeTabText
            ]}>
              All Jobs
            </Text>
          </TouchableOpacity>

        </View>
        {/* Job History List */}
        <View style={[styles.listItem, { flexDirection: "row", padding: isTablet ? 20 : 10, backgroundColor: blueColor }, justifyContentSpaceBetween]}>
          <View style={{ width: "19%" }}>
            <Text style={styles.label}>Customer</Text>
          </View>

          <View style={{ width: isTablet ? "25%" : "40%", alignItems: isTablet ? "flex-start" : "center" }}>
            <Text style={styles.label}>VIN</Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.label}>Action</Text>
          </View>
        </View>
        {loading ? (
          <View>
            {Array(5).fill(null).map((_, index) => (
              <SkeletonPlaceholder key={index} borderRadius={4}>
                <SkeletonPlaceholder.Item
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  style={styles.listItem}
                >
                  <View>
                    <SkeletonPlaceholder.Item width={80} height={15} />
                    <SkeletonPlaceholder.Item width={100} height={20} marginTop={5} />
                  </View>
                  <View>
                    <SkeletonPlaceholder.Item width={50} height={15} />
                    <SkeletonPlaceholder.Item width={60} height={20} marginTop={5} />
                  </View>
                  <View>
                    <SkeletonPlaceholder.Item width={50} height={15} />
                    <SkeletonPlaceholder.Item width={60} height={20} marginTop={5} />
                  </View>
                  <SkeletonPlaceholder.Item width={60} height={20} />
                </SkeletonPlaceholder.Item>
              </SkeletonPlaceholder>
            ))}
          </View>
        ) : (filteredData?.length > 0 ? (
          <View style={{ height: Platform.OS === "android" ? hp(52) : hp(59.5) }}>
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              refreshing={loading}
              onRefresh={handleRefresh}
              contentContainerStyle={{ paddingBottom: hp(10) }}
              ListFooterComponent={loadingMore ? <ActivityIndicator size="large" color={blueColor} /> : null}
            />
          </View>
        ) : (
          <View style={[{ width: "100%", height: hp(60) }, alignJustifyCenter]}>
            <Text style={{ fontSize: 16, color: "gray" }}>
              {search.trim() ? "No results match your search" : "No jobs found"}
            </Text>
          </View>
        ))}

        {/* Filter Modal */}
        {/* <Modal
          animationType="slide"
          transparent={true}
          visible={isFilterModalVisible}
          onRequestClose={toggleFilterModal}
        >
          <TouchableWithoutFeedback onPress={toggleFilterModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={{
                  width: "100%",
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: '#ddd',
                  paddingBottom: 10,
                  padding: 20
                  // marginBottom: 15
                }}>
                  <Text style={styles.modalTitle}>Filter Jobs</Text>
                  <Feather name="filter" size={20} color={grayColor} />
                </View>

                <TouchableOpacity
                  onPress={() => handleFilterSelect('all')}
                  style={[
                    styles.filterOption,
                    jobFilter === 'all' && styles.activeFilterOption
                  ]}
                >
                  <Text style={[
                    styles.filterOptionText,
                    jobFilter === 'all' && styles.activeFilterOptionText
                  ]}>
                    All Jobs
                  </Text>
                  {jobFilter === 'all' && (
                    <Feather name="check" size={20} color={blueColor} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleFilterSelect('active')}
                  style={[
                    styles.filterOption,
                    jobFilter === 'active' && styles.activeFilterOption
                  ]}
                >
                  <Text style={[
                    styles.filterOptionText,
                    jobFilter === 'active' && styles.activeFilterOptionText
                  ]}>
                    Active Jobs (In Progress)
                  </Text>
                  {jobFilter === 'active' && (
                    <Feather name="check" size={20} color={blueColor} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleFilterSelect('completed')}
                  style={[
                    styles.filterOption,
                    jobFilter === 'completed' && styles.activeFilterOption
                  ]}
                >
                  <Text style={[
                    styles.filterOptionText,
                    jobFilter === 'completed' && styles.activeFilterOptionText
                  ]}>
                    Completed Jobs
                  </Text>
                  {jobFilter === 'completed' && (
                    <Feather name="check" size={20} color={blueColor} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal> */}

        {/* Sorting Modal */}
        <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={toggleModal}>
          <TouchableWithoutFeedback onPress={toggleModal}>
            <View style={styles.modalOverlay}>
              <Feather name="chevron-down" size={55} color={blackColor} />

              <View style={styles.modalContainer}>
                <View style={{
                  width: "100%",
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: '#ddd'
                }}>
                  <Text style={styles.modalTitle}>Sort By</Text>
                  <Feather name="sliders" size={20} color={grayColor} />
                </View>
                <TouchableOpacity
                  onPress={() => handleSort(sortType === "name" && sortOrder === "asc" ? "desc" : "asc", "name")}
                  style={styles.sortOption}
                >
                  <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "name" ? blackColor : 'gray' }]}>
                    Customer Name
                  </Text>
                  <Text style={[styles.sortText, { color: sortType === "name" ? blackColor : 'gray' }]}>
                    {sortType === "name" ? (sortOrder === "asc" ? "A to Z" : "Z to A") : "A to Z"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSort(sortType === "date" && sortOrder === "newest" ? "oldest" : "newest", "date")}
                  style={styles.sortOption}
                >
                  <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "date" ? blackColor : 'gray' }]}>
                    Date Created
                  </Text>
                  <Text style={[styles.sortText, { color: sortType === "date" ? blackColor : 'gray' }]}>
                    {sortType === "date" ? (sortOrder === "newest" ? "New to Old" : "Old to New") : "New to Old"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSort(sortType === "modified" && sortOrder === "latest" ? "oldest" : "latest", "modified")}
                  style={styles.sortOption}
                >
                  <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "modified" ? blackColor : 'gray' }]}>
                    Last Modified
                  </Text>
                  <Text style={[styles.sortText, { color: sortType === "modified" ? blackColor : 'gray' }]}>
                    {sortType === "modified" ? (sortOrder === "latest" ? "Latest to Oldest" : "Oldest to Latest") : "Latest to Oldest"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSort(sortType === "status" && sortOrder === "asc" ? "desc" : "asc", "status")}
                  style={styles.sortOption}
                >
                  <Text style={[styles.sortText, { fontWeight: style.fontWeightThin.fontWeight, color: sortType === "status" ? blackColor : 'gray' }]}>
                    Job Status
                  </Text>
                  <Text style={[styles.sortText, { color: sortType === "status" ? blackColor : 'gray' }]}>
                    {sortType === "status" ? (sortOrder === "asc" ? "In Progress → Complete" : "Complete → In Progress") : "In Progress → Complete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </View>
  );
};

export default JobHistoryScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: whiteColor,
  },
  header: {
    marginBottom: spacings.medium,
  },
  title: {
    fontSize: style.fontSizeLargeX.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
    color: blackColor,
  },
  subtitle: {
    fontSize: style.fontSizeNormal.fontSize,
    color: mediumGray,
    marginVertical: spacings.small2x,
  },
  datePicker: {
    width: wp(38),
    paddingVertical: spacings.large,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: grayColor,
  },
  dateText: {
    color: blackColor,
    marginRight: spacings.small2x,
    fontSize: style.fontSizeNormal.fontSize,
  },
  searchBar: {
    // backgroundColor: blueColor,
    backgroundColor: whiteColor,
    paddingHorizontal: spacings.large,
    borderRadius: 8,
    // width: Platform.OS === "android" ? wp(80) : isTablet ? wp(85) : wp(80),
    borderBottomWidth: 1,
    borderBottomColor: grayColor
  },
  searchInput: {
    height: hp(5),
    color: blackColor
  },
  listItem: {
    backgroundColor: lightBlueColor,
    padding: spacings.xLarge,
    borderRadius: 8,
    marginTop: spacings.large,
    width: "100%"
  },
  label: {
    fontSize: style.fontSizeSmall2x.fontSize,
    fontWeight: style.fontWeightMedium.fontWeight,
    color: whiteColor,
  },
  value: {
    fontSize: style.fontSizeSmall1x.fontSize,
    color: blackColor,
  },
  viewText: {
    marginLeft: 5,
    fontSize: style.fontSizeSmall1x.fontSize,
    color: blackColor,
    borderColor: blackColor,
    borderWidth: 1,
    padding: 4,
    borderRadius: 2,
  },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    // marginBottom: 15
  },
  filterButton: {
    backgroundColor: blueColor,
    padding: 6,
    borderRadius: 5,
    alignItems: "center",
    position: "absolute",
    zIndex: 999
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: whiteColor,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    // paddingBottom: 10,
    padding: 20,

    // alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    // fontWeight: 'bold',
    color: grayColor,
    marginBottom: 15,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
  },
  sortText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    width: '100%',
    backgroundColor: orangeColor,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: whiteColor,
    fontWeight: 'bold',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 20
  },
  filterOptionText: {
    fontSize: 16,
    color: grayColor,
  },
  activeFilterOption: {
    backgroundColor: lightBlueColor,
  },
  activeFilterOptionText: {
    color: blueColor,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: lightBlueColor,
  },
  activeTab: {
    backgroundColor: blueColor,
    borderColor: blueColor,
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    textAlign: "center"
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
});