import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

const OrientationContext = createContext();

export const OrientationProvider = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const [orientation, setOrientation] = useState(width > height ? 'LANDSCAPE' : 'PORTRAIT');

  useEffect(() => {
    // Update orientation when dimensions change
    const currentOrientation = width > height ? 'LANDSCAPE' : 'PORTRAIT';
    setOrientation(currentOrientation);
  }, [width, height]);

  const value = {
    orientation, // 'PORTRAIT' or 'LANDSCAPE'
    width,       // Dynamic width
    height,      // Dynamic height
  };

  return (
    <OrientationContext.Provider value={value}>
      {children}
    </OrientationContext.Provider>
  );
};

export const useOrientation = () => {
  const context = useContext(OrientationContext);
  if (!context) {
    throw new Error('useOrientation must be used within OrientationProvider');
  }
  return context;
};
