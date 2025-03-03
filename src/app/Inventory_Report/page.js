"use client";
import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaSpinner, FaWarehouse } from 'react-icons/fa';
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, Transition } from '@headlessui/react';
import CustomAwesomeButton from '../components/CustomAwesomeButton';

export default function Inventory_Report() {
  const { hasPermission: canCreateStorage, loading: loadingPermission } = usePermission('Inventory_Report');
  const router = useRouter();

  const handleReturn = () => {
    router.back();
  };


  if (loadingPermission || loadingPermission2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FaSpinner className="text-4xl text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!canCreateStorage) {
    return <NotAuth />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto p-4 bg-gray-100 text-gray-900 min-h-screen"
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <CustomAwesomeButton
 buttonType="electric"
 onPress={handleReturn}
 isRTL={true}
>
<div className="flex flex-row">
<FaArrowLeft className="mr-2 mt-1" />
          رجوع
</div>
</CustomAwesomeButton>
  

    </motion.div>
  );
}
