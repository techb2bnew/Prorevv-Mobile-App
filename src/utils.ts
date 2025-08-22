
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

export const exportToCSV = async (data, selectedFields, filename = "export.csv") => {
  try {
    // 1. CSV Header
    const header = selectedFields.join(",") + "\n";

    // 2. CSV Rows
    const csvRows = data.map(item =>
      selectedFields.map(field => `"${item[field] ?? ""}"`).join(",")
    );

    const csvString = header + csvRows.join("\n");

    // 3. File path
    // 👉 Unique filename to avoid EEXIST error
    const safeFileName = filename.replace(".csv", `_${Date.now()}.csv`);
    const path =
      Platform.OS === "android"
        ? `${RNFS.DownloadDirectoryPath}/${safeFileName}`
        : `${RNFS.DocumentDirectoryPath}/${safeFileName}`;

    // 4. Android storage permission
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission Required",
          message: "App needs access to your storage to save the file",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "Storage permission is required");
        return null;
      }
    }

    // 5. Delete if file exists (safety measure)
    const exists = await RNFS.exists(path);
    if (exists) {
      await RNFS.unlink(path);
    }

    // 6. Write file
    await RNFS.writeFile(path, csvString, "utf8");
    console.log(`✅ CSV file saved to: ${path}`);
    return path;
  } catch (err) {
    console.error("❌ Error exporting CSV:", err);
    Alert.alert("Error", "Failed to export CSV");
    return null;
  }
};
