import React, { useRef, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions, StyleSheet, ImageBackground, Animated, Easing, useWindowDimensions, Platform } from 'react-native';
import { blackColor, blueColor, lightBlueColor, lightGrayColor, redColor, whiteColor } from '../constans/Color';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { WELCOME_ON_BOARDING_IMAGE, WELCOME_ON_BOARDING_LANSCAPE_IMAGE } from '../assests/images'
import { BaseStyle } from '../constans/Style';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import { style, spacings } from '../constans/Fonts';
import CustomButton from '../componets/CustomButton';
import { useOrientation } from '../OrientationContext';
// const { width, height } = Dimensions.get('window');
const onboardingData = [
  {
    id: '1',
    title: 'Fetch Car Details Instantly',
    description: 'Scan or enter VIN to auto-fetch vehicle details and link it with the customer profile — quick and accurate.',
    image: require('../assests/carRepair.png'),
  },
  {
    id: '2',
    title: 'Create Job & Assign Tasks',
    description: 'Easily create a job card for each vehicle, assign tasks, and let your technician handle it step-by-step.',
    image: require('../assests/tireService.png'),
  },
  {
    id: '3',
    title: 'Track & Complete Jobs',
    description: 'Track work progress in real-time and mark jobs as complete once all tasks are done — stay organized, stay efficient.',
    image: require('../assests/carMechanics.png'),
  }
];

const OnboardingScreen = ({ navigation }) => {
  const flatListRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const { orientation } = useOrientation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const slideAnim = useRef(new Animated.Value(height)).current;
  // Function to check if the device is a tablet
  const isTablet = width >= 668 && height >= 1024;
  const isIOSAndTablet = Platform.OS === "ios" && isTablet;

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current.scrollToIndex({ index: currentIndex - 1 });
    } else {
      // Show welcome screen immediately so it's visible behind onboarding
      setShowWelcomeScreen(true);
      // Slide down animation - onboarding goes down, welcome screen stays visible behind
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 500,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  };

  const startOnboarding = () => {
    // Slide up animation - onboarding will come on top of welcome screen
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      // Hide welcome screen after animation completes
      setShowWelcomeScreen(false);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Welcome screen - always rendered, stays visible underneath */}
      {showWelcomeScreen && (
        <ImageBackground 
          source={orientation === "LANDSCAPE" ? WELCOME_ON_BOARDING_LANSCAPE_IMAGE : WELCOME_ON_BOARDING_IMAGE} 
          style={[styles.welcomeContainer, { zIndex: 1 }]}
        >
          <View style={[styles.welcomeTextContainer, {
            alignItems: isIOSAndTablet ? "flex-start" : orientation === "LANDSCAPE" ? "flex-start" : 'center',
            bottom: height * 0.3,
            width: width * 0.85,
          }]}>
            <Text style={[styles.welcomeTitle]}>Welcome to Prorevv!</Text>
            <Text style={styles.welcomeDescription}>
              Manage car servicing like a pro.Scan VINs, assign tasks, and track job progress — all in one smart app.
            </Text>
          </View>
          <View style={[styles.welcomeButtonContainer, {
            width: width * (isTablet ? 0.95 : orientation === "LANDSCAPE" ? 0.95 : 0.90),
            bottom: height * 0.03,
          }]}>
            <CustomButton title={"Let's get you started!"} onPress={startOnboarding} style={{backgroundColor:lightGrayColor}} textStyle={{color:blackColor}} />
          </View>
        </ImageBackground>
      )}

      {/* Onboarding content - slides up on top of welcome screen */}
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }], zIndex: 2 }
        ]}
      >
      <LinearGradient
        colors={['#400000', '#000000', '#000000']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={{ alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', height: '100%' }}
      >
        {/* Show Skip button on first and second screen, hide on last (third) screen */}
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Login')}>
            <Text style={{ fontWeight: style.fontWeightMedium.fontWeight, color: whiteColor }}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={whiteColor} />
        </TouchableOpacity>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <Image source={item.image} style={[styles.image, { width: width * 0.8, height: height * 0.4 }]} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}
          onScroll={handleScroll}
        />
        <View style={styles.dotContainer}>
          {onboardingData.map((_, index) => (
            <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
          ))}
        </View>

        {currentIndex === onboardingData.length - 1 ? (
          // Show this when on the last onboarding step
          <View style={[styles.buttonContainer, {
            flexDirection: 'row', justifyContent: 'space-between', width: wp(90), width: width * 0.8,
          }]}>
            <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate("HowToPlay") }}>
              <Text style={styles.buttonText}>Start Tutorial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Let's Go</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show this on other steps
          <View style={[styles.buttonContainer, { left: isTablet ? wp(47) : orientation === "LANDSCAPE" ? wp(48) : wp(43), width: width * 0.8 }]}>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTextContainer: {
    position: "absolute",
    left: 25,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: "bold",
    marginTop: 20,
    alignSelf: "flex-start",
    color: whiteColor,
  },
  welcomeDescription: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 20,
    color: whiteColor,
  },
  welcomeButtonContainer: {
    position: "absolute",

    left: 20,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,

  },
  image: {

    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    color: whiteColor,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: whiteColor,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // left: wp(42)
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 999,
  },
  skipButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    padding: 12,
    zIndex: 999
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: redColor,
    padding: 12,
    borderRadius: 25,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    position: 'absolute',
    bottom: 120,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: whiteColor,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: whiteColor,
    width: 22,
    height: 12,
  },
  button: {
    backgroundColor: redColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default OnboardingScreen;


