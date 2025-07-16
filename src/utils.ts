
import { Dimensions, PixelRatio } from 'react-native';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const widthPercentageToDP = widthPercent => {
  const screenWidth = Dimensions.get('window').width;
  const elemWidth = parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

export const heightPercentageToDP = heightPercent => {
  const screenHeight = Dimensions.get('window').height;
  const elemHeight = parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};


export const exportToCSV = async (data, selectedFields, filename = 'export.csv') => {
  try {
    // 1. Make CSV header
    const header = selectedFields.join(',') + '\n';

    // 2. Prepare CSV rows
    const csvRows = data.map(item =>
      selectedFields.map(field => `"${item[field] ?? ''}"`).join(',')
    );

    const csvString = header + csvRows.join('\n');

    // 3. File path
    const path =
      Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${filename}`
        : `${RNFS.DocumentDirectoryPath}/${filename}`;

    // 4. Android permission
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to save the file',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Storage permission is required');
        return;
      }
    }

    // 5. Write file
    await RNFS.writeFile(path, csvString, 'utf8');
    console.log(`✅ CSV file saved to: ${path}`);
     return path;
    // Alert.alert('Success', `CSV saved to:\n${path}`);
  } catch (err) {
    console.error('❌ Error exporting CSV:', err);
    Alert.alert('Error', 'Failed to export CSV');
  }
};