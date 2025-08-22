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

const LICENSE = 't0087pwAAAKeZgdVqm7tfpy4k7T/sqExAnB9/PeqKCgM0uWoaZ3TLB0+ygOFM2/PPR8aD7FX9VdE3KWHNFs3S0rZ3fqcsolTVR7rAfA55bfzl5pqeeQIdaCGy;t0087pwAAAG16m1wucr9FotD8eFuoC/3rkPHvOK2mVxt0Udy0IV+VMUsrZAyOzAIhYeBKI4IB2/XJGuruk85xl/NKLR8zgi700UXN5yqvjb+KluzFfQc3iSHe;t0087pwAAAGCXfhVNb8ZjstZbOHrrATEumXNylX5bQB3LsOlchf+mtELeNy6eL8u2wQoO5WOdPhb8DKqnizvZg+BRucrFu1Q+1CuYz11eG3+aturNfQc5pSHi';

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
