import React from 'react';
import { AwesomeButton } from 'react-awesome-button';
import 'react-awesome-button/dist/styles.css';
import '../AwesomeButtonCustom.css';
import { FaSpinner, FaSearch, FaPlus, FaTrash, FaArrowLeft, FaTimes } from "react-icons/fa";

const CustomAwesomeButton = ({ buttonType, isDisabled, onPress, children, isRTL = false }) => {
  const getButtonClass = () => {
    if (isDisabled) return 'aws-btn aws-btn-disabled';
    switch (buttonType) {
      case 'activate':
        return 'aws-btn aws-btn-activate';
      case 'post':
        return 'aws-btn aws-btn-post';
      case 'cancel':
        return 'aws-btn aws-btn-cancel';
      case 'info':
        return 'aws-btn aws-btn-info';
      case 'info2':
        return 'aws-btn2 aws-btn-info';
      case 'warning':
        return 'aws-btn aws-btn-warning';
      case 'success':
        return 'aws-btn aws-btn-success';
      case 'sunset':
        return 'aws-btn aws-btn-sunset';
      case 'ocean':
        return 'aws-btn aws-btn-ocean';
      case 'forest':
        return 'aws-btn aws-btn-forest';
      case 'lavender':
        return 'aws-btn aws-btn-lavender';
      case 'cosmic':
        return 'aws-btn aws-btn-cosmic';
      case 'citrus': return 'aws-btn aws-btn-citrus';
      case 'berry': return 'aws-btn aws-btn-berry';
      case 'mint': return 'aws-btn aws-btn-mint';
      case 'flamingo': return 'aws-btn aws-btn-flamingo';
      case 'electric': return 'aws-btn2 aws-btn-electric';
      case 'autumn': return 'aws-btn aws-btn-autumn';
      case 'deepspace': return 'aws-btn aws-btn-deepspace';
      case 'tropical': return 'aws-btn aws-btn-tropical';
      case 'cherry': return 'aws-btn aws-btn-cherry';
      case 'northern': return 'aws-btn aws-btn-northern';
      case 'desert': return 'aws-btn aws-btn-desert';
      case 'mystic': return 'aws-btn aws-btn-mystic';
      case 'strawberry': return 'aws-btn aws-btn-strawberry';
      case 'emerald': return 'aws-btn aws-btn-emerald';
      case 'royal': return 'aws-btn aws-btn-royal';
      case 'bubblegum': return 'aws-btn aws-btn-bubblegum';
      case 'golden': return 'aws-btn aws-btn-golden';
      case 'frozen': return 'aws-btn aws-btn-frozen';
      case 'volcanic': return 'aws-btn aws-btn-volcanic';
      case 'cottoncandy': return 'aws-btn aws-btn-cottoncandy';
      default:
        return 'aws-btn';
    }
  };

  return (
<button
  onClick={onPress}
  className="w-fit py-3 px-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
>
  <div className="flex flex-row">

    <div>{children}</div>
  </div>
</button>

  );
};

export default CustomAwesomeButton;