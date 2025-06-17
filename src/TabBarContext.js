import React, { createContext, useContext, useState } from 'react';

const TabBarContext = createContext();

export const TabBarProvider = ({ children }) => {
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);

  return (
    <TabBarContext.Provider value={{ isTabBarHidden, setIsTabBarHidden }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => useContext(TabBarContext);