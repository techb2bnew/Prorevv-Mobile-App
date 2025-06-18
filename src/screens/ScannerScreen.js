// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { blackColor, whiteColor } from '../constans/Color';
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
// import Toast from 'react-native-simple-toast';

// import {
//   BarcodeScanner,
//   EnumScanningMode,
//   EnumResultStatus,
// } from 'dynamsoft-capture-vision-react-native';

// const LICENSE = 't0088pwAAABD8OHQ0/UvnShe4C+1IJdkz3JJP//JUFyQb7cE0vGVGB9wg48bHttuaO/w5TtTHkN84j8ihTeGkzszT2G+z7kIPeqR7Yz5fYmfjL29Bjc4LGnUhnQ==;t0088pwAAABCcLixyUwT7B8rUN1kRqyexIEMhDset/hb1ecFLbgAIRVZSo9kcfvBo+B7Ht2x4GTRZ5WYnckn92oV1aUUCxxP4G114UrNcSdaPP9QczQMnKIshtg==;t0089pwAAAEDBPRWUCLZe09uixYi6c4koyijjkaSGpOd3Zt02v/BoilRN6ZgViiih+BH0k6xxtZMCjv6pl19r2NVM6GOmUbroNzqhz8Yor2Jz4w+vQYnGCSvfIbw=';

// const ScannerScreen = ({ navigation, route }) => {
//   const [isScanning, setIsScanning] = useState(true);
//   const [timeLeft, setTimeLeft] = useState(30);

//   const fromScreen = route?.params?.from;
//   // Timer countdown effect
//   useEffect(() => {
//     if (!isScanning) return;

//     const timer = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           navigation.goBack();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [isScanning]);

//   useEffect(() => {
//     scanVinCode()
//   }, [])



//   // Function to launch scanner and handle result
//   const scanVinCode = async () => {
//     setIsScanning(false);

//     const config = {
//       license: LICENSE,
//       scanningMode: EnumScanningMode.SM_SINGLE,
//     };

//     try {
//       const result = await BarcodeScanner.launch(config);

//       if (result.resultStatus === EnumResultStatus.RS_FINISHED && result.barcodes?.length) {
//         let fullValue = result.barcodes[0].text || '';
//         console.log('Scanned fullValue:', fullValue);

//         // Remove I, O, Q from scanned string
//         fullValue = fullValue.toUpperCase().replace(/[IOQ]/g, '');
//         console.log('Cleaned VIN source:', fullValue);

//         // Extract first 17 characters after cleaning
//         const vin = fullValue.substring(0, 17);
//         console.log('Scanned VIN:', vin);

//         const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

//         if (vin && vinRegex.test(vin)) {
//           if (fromScreen === 'VinList') {
//             navigation.navigate('VinListScreen', { vinNumber: vin });
//           } else {
//             navigation.navigate('WorkOrderScreenTwo', { vinNumber: vin, isFromScanner: true, });
//           }
//         } else {
//           console.log('Invalid Scan', 'Please scan a valid VIN number.');
//           Toast.show('Please scan a valid VIN number.');
//           navigation.goBack(); // 👈 Go back on error result

//         }
//       } else if (result.resultStatus === EnumResultStatus.RS_CANCELED) {
//         navigation.goBack(); // 👈 Go back on error result

//       } else {
//         console.log('Scan Error', result.errorString || 'Something went wrong');
//         Toast.show(result.errorString || 'Something went wrong');
//         navigation.goBack(); // 👈 Go back on error result

//       }
//     } catch (error) {
//       console.log('Error', error.message || 'Unexpected error occurred');
//       navigation.goBack(); // 👈 Go back on error result

//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={30} color={blackColor} />
//         </Pressable>
//         <Text style={styles.headerTitle}>Scan Vehicle</Text>
//         <Text style={styles.timerText}>{timeLeft} sec</Text>
//       </View>

//       {/* Scan UI */}
//       {isScanning ? (
//         <>
//           {/* Timer hint */}
//           <View style={styles.hintContainer}>
//             <Text style={styles.timerHint}>
//               {timeLeft > 0
//                 ? 'Tap "Start Scan" to open scanner, align the barcode and wait for result.'
//                 : 'Returning back...'}
//             </Text>
//           </View>
//         </>
//       ) : (
//         <View style={styles.overlay}>
//           <TouchableOpacity
//             style={styles.button}
//             onPress={() => {
//               scanVinCode()
//               setIsScanning(true);
//               setTimeLeft(30);
//             }}
//           >
//             <Text style={styles.buttonText}>Scan Again</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// };

// // Styles
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: whiteColor },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     justifyContent: 'space-between',
//   },
//   backButton: { padding: 5 },
//   headerTitle: { fontSize: 20, fontWeight: 'bold', color: blackColor },
//   timerText: { fontSize: 16, color: blackColor },
//   scanButton: {
//     backgroundColor: '#007AFF',
//     marginHorizontal: 20,
//     marginTop: 50,
//     paddingVertical: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   scanButtonText: {
//     color: whiteColor,
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   flashButton: {
//     flexDirection: 'row',
//     backgroundColor: '#00000088',
//     padding: 10,
//     marginHorizontal: 100,
//     marginTop: 20,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   flashText: {
//     color: whiteColor,
//     marginLeft: 8,
//     fontWeight: '600',
//   },
//   hintContainer: {
//     width: wp(100),
//     backgroundColor: whiteColor,
//     height: hp(10),
//     justifyContent: 'center',
//     paddingHorizontal: 10,
//   },
//   timerHint: { fontSize: 14, color: blackColor, textAlign: 'center' },
//   overlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   text: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
//   button: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     borderRadius: 10,
//   },
//   buttonText: { color: whiteColor, fontSize: 16, fontWeight: '600' },
// });

// export default ScannerScreen;


import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { blackColor, whiteColor } from '../constans/Color';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../utils';
import Toast from 'react-native-simple-toast';

import {
  BarcodeScanner,
  EnumScanningMode,
  EnumResultStatus,
} from 'dynamsoft-capture-vision-react-native';
import { useFocusEffect } from '@react-navigation/native';

const LICENSE = 't0088pwAAABD8OHQ0/UvnShe4C+1IJdkz3JJP//JUFyQb7cE0vGVGB9wg48bHttuaO/w5TtTHkN84j8ihTeGkzszT2G+z7kIPeqR7Yz5fYmfjL29Bjc4LGnUhnQ==;t0088pwAAABCcLixyUwT7B8rUN1kRqyexIEMhDset/hb1ecFLbgAIRVZSo9kcfvBo+B7Ht2x4GTRZ5WYnckn92oV1aUUCxxP4G114UrNcSdaPP9QczQMnKIshtg==;t0089pwAAAEDBPRWUCLZe09uixYi6c4koyijjkaSGpOd3Zt02v/BoilRN6ZgViiih+BH0k6xxtZMCjv6pl19r2NVM6GOmUbroNzqhz8Yor2Jz4w+vQYnGCSvfIbw=';

const ScannerScreen = ({ navigation, route }) => {
  const fromScreen = route?.params?.from;

  useFocusEffect(
    useCallback(() => {
      scanVinCode();
    }, [])
  );

  const scanVinCode = async () => {
    const config = {
      license: LICENSE,
      scanningMode: EnumScanningMode.SM_SINGLE,
    };

    try {
      const result = await BarcodeScanner.launch(config);

      if (result.resultStatus === EnumResultStatus.RS_FINISHED && result.barcodes?.length) {
        let fullValue = result.barcodes[0].text || '';
        fullValue = fullValue.toUpperCase().replace(/[IOQ]/g, '');
        const vin = fullValue.substring(0, 17);

        const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

        if (vin && vinRegex.test(vin)) {
          if (fromScreen === 'VinList') {
            navigation.navigate('VinListScreen', { vinNumber: vin });
          } else {
            navigation.navigate('WorkOrderScreenTwo', { vinNumber: vin, isFromScanner: true });
          }
        } else {
          Toast.show('Please scan a valid VIN number.');
          navigation.goBack();
        }
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error', error.message || 'Unexpected error occurred');
      Toast.show(error.message || 'Unexpected error occurred');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={30} color={blackColor} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Vehicle</Text>
      </View>
      {/* No UI needed since scanner opens immediately */}
    </View>
  );
};

export default ScannerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: whiteColor },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: blackColor },
});
