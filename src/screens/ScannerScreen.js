import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { blackColor, whiteColor } from '../constans/Color';
import Toast from 'react-native-simple-toast';
import {
  BarcodeScanner,
  EnumScanningMode,
  EnumResultStatus,
} from 'dynamsoft-capture-vision-react-native';
import { useFocusEffect } from '@react-navigation/native';

// const LICENSE = 't0104HAEAAHnkipevQ7nbqRETi/D3IBgFzyPBzKTpUMI6mdI1X8qE2N4Lk3Ss8P45mbE8M4T1LsEjYexiXT8H58OZPeJg0ck8BhjqZteaJm3wRp/cVHte1Tm+6Z0i+O+Uf52RNGZTHBJnOtc=;t0109HAEAAKy8sMF0BJ13Hx/FS8NVevExxUSUaMrYvO120w2tlfniJvq8csa/uPaDjz21w2cmqG4PEPHbTJt1VdEpZwxcLkIDYgC4DDDF5n1NRRvc0Sv2Hz6fVw2OZ0anyLx3yp/OnDRXUzkBHMg64w==';
const LICENSE = "t0105HAEAAIpnVSOFO9T+7CjQpSZ8UwDYJar+lpFw+mMsIc4CSImfJ/yUKSP0bTDKtWTiRCxNiNtXl/8m8fAnLxVPJW9L6B7QDbDUzZ41bNrhi/a8VHuWcnfMGZ0i8t8pn50xr8orfgH5bTql;t0109HAEAADym4Ba4lFuMbBibBRZjWnA0nyE2NAkxq7HefdYCVXGwuLn8zB26O40N65EORC7Qky3fITbbNf8wo6/nQTEeWPQHxA1gGGCKzfuaqlb4R0fsN5yfpTYcz9ydovDeKX86S8tqGT8A9rU6pA==";

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
      } else if (result.resultStatus === EnumResultStatus.RS_CANCELED) {
        console.log("Scanner closed by user");
        if (fromScreen === 'scanNext') {
          navigation.navigate('Home');
        } else {
          navigation.goBack();
        }
      }
      else {
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
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
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
