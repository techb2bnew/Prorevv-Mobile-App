import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../utils';
import { blackColor, blueColor, orangeColor } from '../../constans/Color';
const { width, height } = Dimensions.get('window');

const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = blackColor,
  iconName
}) => {
  const isTablet = width >= 668 && height >= 1024;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      supportedOrientations={["portrait", "landscape-left", "landscape-right"]}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalBox, { width: isTablet ? wp(70) : wp(80) }]}>
          {iconName && (
            <View style={styles.modalIconContainer}>
              <Image
                source={iconName}
                style={{
                  width: wp(15),
                  height: hp(7),
                  resizeMode: 'contain'
                }}
              />
            </View>
          )}

          <Text style={[styles.modalTitle, { fontSize: isTablet ? wp(4) : wp(5) }]}>{title}</Text>
          <Text style={[styles.modalMessage, { fontSize: isTablet ? wp(2.5) : wp(3) }]}>{message}</Text>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
            >
              <Text style={[styles.confirmButtonText, { fontSize: isTablet ? wp(2.5) : wp(4) }]}>{confirmText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { fontSize: isTablet ? wp(2.5) : wp(4) }]}>{cancelText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBox: {
    width: wp(70),
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    marginBottom: hp(1),
    textAlign: 'center',
    color: '#333',
  },
  modalMessage: {
    fontSize: wp(4),
    marginBottom: hp(2),
    textAlign: 'center',
    color: '#666',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: hp(1.5),
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: wp(1),
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: wp(4),
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: wp(4),
  },
});

export default ConfirmationModal;