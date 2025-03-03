import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ErrorPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center space-y-6 max-w-md w-full"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <AlertCircle className="w-20 h-20 text-red-500" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-bold text-red-500 text-center"
        >
          ليس لديك الإذن للوصول إلى هذه الصفحة
        </motion.p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-gray-600 text-center"
        >
          يرجى التحقق من صلاحياتك أو الاتصال بالمسؤول
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full flex items-center space-x-2 hover:bg-red-600 transition-colors duration-300"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>العودة</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ErrorPage;