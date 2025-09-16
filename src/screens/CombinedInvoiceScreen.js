import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Platform,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { blueColor, whiteColor, blackColor, lightBlueColor } from '../constans/Color';
import InvoiceHistoryScreen from './InvoiceHistoryScreen';
import GenerateInvoiceScreen from './GenerateInvoiceScreen';
import Header from '../componets/Header';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../utils';

const CombinedInvoiceScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('generate');
    const [viewType, setViewType] = useState('list');
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const { width, height } = Dimensions.get("window");
    const isTablet = width >= 668 && height >= 1024;
    const isIOSAndTablet = Platform.OS === "ios" && isTablet;

    // Dynamically render top-right button group
    const renderActionBar = () => {
        return (
            <View style={{
                flexDirection: 'row',
                position: 'absolute',
                top: Platform.OS === "android" ? isTablet ? hp(1) : 10 : isTablet ? 20 : 13,
                right: -10,
                zIndex: 10
            }}>
                <TouchableOpacity
                    onPress={() => setViewType('list')}
                    style={[styles.tabButton, {
                        backgroundColor: viewType === 'list' ? blueColor : whiteColor,
                        marginRight: 10
                    }]}>
                    <Ionicons name="list" size={isTablet ? 35 : 20} color={viewType === 'list' ? whiteColor : blackColor} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setViewType('grid')}
                    style={[styles.tabButton, {
                        backgroundColor: viewType === 'grid' ? blueColor : whiteColor,
                        marginRight: 10
                    }]}>
                    <Ionicons name="grid-sharp" size={isTablet ? 35 : 20} color={viewType === 'grid' ? whiteColor : blackColor} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setIsFilterModalVisible(true)}
                    style={[styles.tabButton, {
                        backgroundColor: blueColor,
                        marginRight: 15
                    }]}>
                    <Text style={{ color: whiteColor }}>Filter</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Header */}
            <Header title={"Invoice"} />

            {/* Dynamic Buttons */}
            {renderActionBar()}

            {/* Tab Header */}
            <View style={styles.tabHeader}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'generate' && styles.activeTab]}
                    onPress={() => { setActiveTab('generate'), setViewType('list') }}
                >
                    <Text style={[styles.tabText, activeTab === 'generate' && styles.activeText]}>
                        Generate Invoice
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => { setActiveTab('history'), setViewType('list') }}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeText]}>
                        Invoice History
                    </Text>
                </TouchableOpacity>

            </View>

            {/* Render Tab Content */}
            <View style={{ flex: 1 }}>
                {activeTab === 'history'
                    ? <InvoiceHistoryScreen
                        viewType={viewType}
                        setViewType={setViewType}
                        isFilterModalVisible={isFilterModalVisible}
                        setIsFilterModalVisible={setIsFilterModalVisible}
                        navigation={navigation}
                    />
                    : <GenerateInvoiceScreen
                        viewType={viewType}
                        setViewType={setViewType}
                        isFilterModalVisible={isFilterModalVisible}
                        setIsFilterModalVisible={setIsFilterModalVisible}
                        navigation={navigation}
                    />
                }
            </View>
        </View>
    );
};

export default CombinedInvoiceScreen;

const styles = StyleSheet.create({
    tabHeader: {
        flexDirection: 'row',
        backgroundColor: whiteColor,
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: blueColor,
    },
    tabText: {
        fontSize: 16,
        color: blackColor,
    },
    activeText: {
        color: blueColor,
        fontWeight: 'bold',
    },
    tabButton: {
        width: wp(12),
        height: hp(4.5),
        borderRadius: 5,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
