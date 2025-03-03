"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaSpinner, FaSearch, FaPlus, FaEdit, FaImages, FaTimes } from 'react-icons/fa';
import { usePermission } from '../../../../context/PermissionContext';
import NotAuth from "../../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CustomAwesomeButton from "../../components/CustomAwesomeButton";

const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 text-black" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const ItemCard = ({ item, onEdit, onShowImages }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg"
  >
    <img
      src={item.mainImageUrl}
      alt={item.name}
      className="w-full h-48 object-cover cursor-pointer"
      onClick={() => onShowImages(item.mainImageUrl, item.images)}
    />
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2 truncate">{item.name}</h3>
      <p className="text-gray-600 mb-2 text-sm">ID: {item.productId}</p>
      <p className="text-sm font-semibold text-green-600 mb-2">Profit: {item.profitPercentage}%</p>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>UOM: {item.UOM}</span>
        <span>{item.Brand}</span>
      </div>
      <div className="mt-4 flex justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(item)}
          className="flex items-center px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition text-sm"
        >
          <FaEdit className="mr-1" />
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onShowImages(item.mainImageUrl, item.images)}
          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm"
        >
          <FaImages className="mr-1" />
          Images
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const UOM_OPTIONS = [
  'Piece',
  'Kilogram',
  'Gram',
  'Meter',
  'Liter',
  'Box',
  'Pack',
  'Dozen'
];

export default function SupplierItems() {
  const { hasPermission: canDefineItems, loading: loadingPermission3 } = usePermission('Define_items');
  const [items, setItems] = useState([]);
  console.log(items)
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    productId: '',
    mainImageUrl: '',
    images: [],
    category: '',
    subcategory: '',
    profitPercentage: 0,
    UOM: '',              // New field
    Specification: '',    // New field
    Brand: ''             // New field
  });
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, mainImageUrl: '', images: [] });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id;

  useEffect(() => {
    if (supplierId) {
      fetchItemsBySupplier();
    }
    fetchCategoriesWithSubcategories();
  }, [currentPage, supplierId]);
  
  useEffect(() => {
    if (editMode && selectedCategory) {
      const selectedCategoryData = categories.find(category => category._id === selectedCategory);
      if (selectedCategoryData) {
        setSubcategories(selectedCategoryData.subcategories);
  
        // Ensure subcategory is set correctly after the subcategories are loaded
        if (currentItem) {
          const selectedSubcategory = selectedCategoryData.subcategories.find(subcat => subcat.name === currentItem.subcategory);
          setNewItem(prevItem => ({
            ...prevItem,
            subcategory: selectedSubcategory ? selectedSubcategory._id : ''
          }));
        }
      }
    }
  }, [editMode, selectedCategory, categories, currentItem]);  
  
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  const fetchCategoriesWithSubcategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}Category/categories-with-subcategories`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories and subcategories:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const selectedCategory = categories.find(category => category._id === categoryId);
    setSelectedCategory(categoryId);
    setSubcategories(selectedCategory ? selectedCategory.subcategories : []);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    if (query.trim() === '') {
        // If the search query is empty, fetch the first page of items without any filtering
        await fetchItemsBySupplier(); // Fetches the first page without any query
    } else {
        await fetchItems(); // Fetch items based on the query
    }
};

const fetchItemsBySupplier = useCallback(async () => {
    setLoading(true);
    try {
        const response = await axios.get(`${apiUrl}Item/items/supplier/${supplierId}`, {
            params: { page: currentPage },
            headers: { Authorization: `Bearer ${token}` }
        });
        setItems(response.data.items);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
    } catch (error) {
        console.error('Error fetching items by supplier:', error);
        toast.error('Failed to fetch items. Please try again.');
    } finally {
        setLoading(false);
    }
}, [supplierId, currentPage, token]);

const fetchItems = async () => {
    setLoading(true);
    try {
        const response = await axios.get(`${apiUrl}Item/items/search`, {
            params: { query },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        setItems(response.data.items);
        setTotalPages(response.data.totalPages || 1);
    } catch (error) {
        console.error('Error fetching items:', error);
        toast.error('Failed to fetch items. Please try again.');
    } finally {
        setLoading(false);
    }
};

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchItemsBySupplier();
  };

  const handleFileUpload = async (file) => {
    try {
      const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
        params: {
          filename: file.name,
          filetype: file.type
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const { signedUrl, url } = response.data;
      await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read'
        }
      });
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

const handleCreateItem = async (e) => {
  e.preventDefault();
  setModalLoading(true);
  try {
    const mainImageUrl = await handleFileUpload(mainImageFile);
    const imageUrls = await Promise.all(imageFiles.map(file => handleFileUpload(file)));

    await axios.post(`${apiUrl}Item/define-items`, {
      items: [{
        ...newItem, 
        mainImageUrl, 
        images: imageUrls, 
        supplier: supplierId,
        UOM: newItem.UOM,  // Ensure UOM is correctly set
        Specification: newItem.Specification,  // Ensure Specification is correctly set
        Brand: newItem.Brand  // Ensure Brand is correctly set
      }]
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setShowModal(false);
    setNewItem({
      name: '',
      productId: '',
      mainImageUrl: '',
      images: [],
      category: '',
      subcategory: '',
      profitPercentage: 0,
      UOM: '',              // Reset new fields
      Specification: '',    // Reset new fields
      Brand: ''             // Reset new fields
    });
    fetchItemsBySupplier();
  } catch (error) {
    console.error('Error defining item:', error);
    toast.error('Failed to define item. Please try again.');
  } finally {
    setModalLoading(false);
  }
};

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const mainImageUrl = mainImageFile ? await handleFileUpload(mainImageFile) : newItem.mainImageUrl;
      const imageUrls = imageFiles.length > 0 ? await Promise.all(imageFiles.map(file => handleFileUpload(file))) : newItem.images;

      await axios.put(`${apiUrl}Item/items/${currentItem._id}`, { ...newItem, mainImageUrl, images: imageUrls }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setShowModal(false);
      setNewItem({
        name: '',
        productId: '',
        mainImageUrl: '',
        images: [],
        category: '',
        subcategory: '',
        profitPercentage: 0,
        UOM: '',              // Reset new fields
        Specification: '',    // Reset new fields
        Brand: ''             // Reset new fields
      });
      fetchItemsBySupplier();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
  
    const selectedCategory = categories.find(category => category.name === item.category);
    
    if (selectedCategory) {
      setSelectedCategory(selectedCategory._id);
      setSubcategories(selectedCategory.subcategories);
  
      // Find the subcategory by name and set it
      const selectedSubcategory = selectedCategory.subcategories.find(subcat => subcat.name === item.subcategory);
      
      setNewItem({
        name: item.name,
        productId: item.productId,
        mainImageUrl: item.mainImageUrl,
        images: item.images,
        category: selectedCategory._id,
        subcategory: selectedSubcategory ? selectedSubcategory._id : '',
        profitPercentage: item.profitPercentage,
        UOM: item.UOM,
        Specification: item.Specification,
        Brand: item.Brand
      });
    }
  
    setEditMode(true);
    setShowModal(true);
  };  
  
  const handleShowImages = (mainImageUrl, images) => {
    if (images && images.length > 0) {
      setImageModal({ isOpen: true, mainImageUrl: images[0], images });
    } else {
      setImageModal({ isOpen: true, mainImageUrl: mainImageUrl, images: [mainImageUrl] });
    }
  };

  const handleCloseImageModal = () => {
    setImageModal({ isOpen: false, mainImageUrl: '', images: [] });
  };

  const handleReturn = () => {
    router.back();
  };

  if (loadingPermission3) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canDefineItems) {
    return (
      <NotAuth />
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 text-gray-900">
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
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
        <h1 className="text-3xl font-bold text-indigo-600">Supplier Items</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditMode(false);
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600 transition shadow-md"
        >
          <FaPlus className="mr-2" />
          Add Item
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <form onSubmit={handleSearch} className="flex items-center mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search items..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-100 border-2 border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:border-indigo-500 transition duration-300"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="ml-4 bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 transition duration-300"
          >
            <FaSearch />
          </motion.button>
        </form>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <FaSpinner className="text-4xl text-indigo-500" />
            </motion.div>
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center text-gray-500 my-12"
              >
                No items found
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {items.map((item) => (
                    <ItemCard
                      key={item._id}
                      item={item}
                      onEdit={handleEditItem}
                      onShowImages={handleShowImages}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {!loading && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-center space-x-4 mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </motion.button>
            <span className="text-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? 'Edit Item' : 'Add New Item'}>
  <form onSubmit={editMode ? handleUpdateItem : handleCreateItem} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
      <input
        type="text"
        value={newItem.name}
        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
      <input
        type="text"
        value={newItem.productId}
        onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Main Image</label>
      <input
        type="file"
        onChange={(e) => setMainImageFile(e.target.files[0])}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        accept="image/*"
        required={!editMode}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Images</label>
      <input
        type="file"
        multiple
        onChange={(e) => setImageFiles([...e.target.files])}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        accept="image/*"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
      <select
        value={newItem.category}
        onChange={(e) => {
          const categoryId = e.target.value;
          handleCategoryChange(categoryId);
          setNewItem({ ...newItem, category: categoryId, subcategory: '' });
        }}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        required
      >
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
      <select
        value={newItem.subcategory}
        onChange={(e) => setNewItem({ ...newItem, subcategory: e.target.value })}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        required
      >
        <option value="">Select Subcategory</option>
        {subcategories.map((subcategory) => (
          <option key={subcategory._id} value={subcategory._id}>
            {subcategory.name}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Profit Percentage</label>
      <input
        type="number"
        min="0"
        max="100"
        value={newItem.profitPercentage}
        onChange={(e) => {
          const value = e.target.value;
          if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
            setNewItem({ ...newItem, profitPercentage: value });
          }
        }}
        onBlur={(e) => {
          const value = parseFloat(e.target.value);
          if (value < 0 || value > 100) {
            setNewItem({ ...newItem, profitPercentage: Math.min(Math.max(value, 0), 100) });
          }
        }}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
    <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure (UOM)</label>
            <select
              value={newItem.UOM}
              onChange={(e) => setNewItem({ ...newItem, UOM: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select UOM</option>
              {UOM_OPTIONS.map((uom, index) => (
                <option key={index} value={uom}>
                  {uom}
                </option>
              ))}
            </select>
          </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Specification</label>
      <input
        type="text"
        value={newItem.Specification}
        onChange={(e) => setNewItem({ ...newItem, Specification: e.target.value })}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
      <input
        type="text"
        value={newItem.Brand}
        onChange={(e) => setNewItem({ ...newItem, Brand: e.target.value })}
        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
    <div className="flex justify-end space-x-2 pt-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setShowModal(false)}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
      >
        Cancel
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center"
        disabled={modalLoading}
      >
        {modalLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
        {editMode ? 'Update' : 'Add'} Item
      </motion.button>
    </div>
  </form>
</Modal>

      <Modal isOpen={imageModal.isOpen} onClose={handleCloseImageModal} title="Image Gallery">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {imageModal.images.map((url, index) => (
            <motion.img
              key={index}
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-24 object-cover rounded-md cursor-pointer"
              onClick={() => setImageModal({ ...imageModal, mainImageUrl: url })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
        {imageModal.mainImageUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={imageModal.mainImageUrl}
              alt="Selected Image"
              className="max-w-full max-h-96 object-contain rounded-md"
            />
          </div>
        )}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCloseImageModal}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
          >
            Close
          </motion.button>
        </div>
      </Modal>
    </div>
  </div>
  );
}
