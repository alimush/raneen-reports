"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { RoleProvider } from '../../context/RoleContext';
import { PermissionProvider } from '../../context/PermissionContext';
import Layout from './components/NavBar';
import { Pacifico } from 'next/font/google';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({ subsets: ["latin"] });

const pageVariants = {
  initial: { opacity: 0 },
  enter: { 
    opacity: 1,
    transition: { 
      duration: 0.3,
      ease: "easeInOut",
    } 
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.2,
      ease: "easeInOut",
    } 
  },
};

const NavigationContext = createContext();

export const useNavigation = () => {
  return useContext(NavigationContext);
};

const RootLayout = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const loadingTimeoutRef = useRef(null);

  const startLoading = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Delay hiding the spinner to ensure smooth transition
  }, []);

  useEffect(() => {
    startLoading();
    stopLoading();
  }, [pathname, startLoading, stopLoading]);

  const handleNavigation = useCallback((url) => {
    startLoading();
    requestAnimationFrame(() => {
      window.location.href = url;
    });
  }, [startLoading]);

  return (
    <html lang="en">
      <body className={`font-zain relative`}>
        <NavigationContext.Provider value={handleNavigation}>
          <LoadingSpinner isLoading={isLoading} />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial="initial"
              animate="enter"
              exit="exit"
              variants={pageVariants}
              className="page-content"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              <RoleProvider>
                <PermissionProvider>
                <Layout>
              {children}
              </Layout>
                </PermissionProvider>
              </RoleProvider>
            </motion.div>
          </AnimatePresence>
        </NavigationContext.Provider>
      </body>
    </html>
  );
};

export default RootLayout;