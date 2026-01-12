import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Linking, Platform } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../utils';
import { blackColor, whiteColor } from '../../constans/Color';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Fontisto from 'react-native-vector-icons/dist/Fontisto';
import Feather from 'react-native-vector-icons/dist/Feather';
import { SUPPORT_EMAIL, SUPPORT_MOBILE } from '../../constans/Constants';

const ContactSupportModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      supportedOrientations={["portrait", "landscape-left", "landscape-right"]}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalBox}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={blackColor} />
            </TouchableOpacity>
          </View>

          {/* Contact Details */}
          <View style={styles.modalContent}>
            {/* Email Open */}
            <TouchableOpacity 
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} 
              style={styles.contactItem}
            >
              <Fontisto name="email" size={25} color={blackColor} />
              <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>

            {/* Phone Dial */}
            <TouchableOpacity 
              onPress={() => Linking.openURL(`tel:${SUPPORT_MOBILE}`)} 
              style={styles.contactItem}
            >
              <Feather name="phone" size={24} color={blackColor} />
              <Text style={styles.contactText}>{SUPPORT_MOBILE}</Text>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBox: {
    width: 320,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    width: "100%",
    marginVertical: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  contactText: {
    marginLeft: 10,
    fontSize: 16,
    color: blackColor,
    textDecorationLine: "underline",
  },
});

export default ContactSupportModal;
