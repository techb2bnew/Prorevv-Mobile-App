import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { blackColor, lightBlueColor, lightGrayColor } from '../constans/Color';
import { heightPercentageToDP } from '../utils';
import { spacings, style } from '../constans/Fonts';

const Header = ({ title, onBack, hideBack = false }) => {
    const navigation = useNavigation();
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigation.goBack();
        }
    };
    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
        </View>
    );
};

const styles = {
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        height: heightPercentageToDP(7),
        backgroundColor: blackColor,
        borderBottomWidth: 0.7,
        borderBottomColor: "#807f7fff",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: style.fontWeightMedium.fontWeight,
        color: 'white',
    },
};

export default Header;
