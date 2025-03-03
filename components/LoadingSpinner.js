// components/LoadingSpinner.js

import React from 'react';
import { TailSpin } from 'react-loader-spinner';

const LoadingSpinner = ({ isLoading }) => {
  return (
    isLoading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <TailSpin height="80" width="80" color="#FFFFFF" ariaLabel="loading" />
      </div>
    )
  );
};

export default LoadingSpinner;
