"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSpinner, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { MdEdit } from "react-icons/md";
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../components/CustomAwesomeButton';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
};

const Page = () => {
  const { hasPermission: canAddCategory, loading: loadingAddCategoryPermission } = usePermission('Edit_Category');
  const { hasPermission: canEditCategory, loading: loadingEditCategoryPermission } = usePermission('Edit_Category');
  const { hasPermission: canAddSubCategory, loading: loadingAddSubCategoryPermission } = usePermission('Edit_SubCategory');
  const { hasPermission: canEditSubCategory, loading: loadingEditSubCategoryPermission } = usePermission('Edit_SubCategory');

  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [subCategoryImage, setSubCategoryImage] = useState(null);
  const [subCategoryImageUrl, setSubCategoryImageUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showSubCategoriesModal, setShowSubCategoriesModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditSubCategoryModal, setShowEditSubCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}Category/categories-with-subcategories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories. Please try again.');
      setLoading(false);
    }
  };

  const handleFileChange = async (e, setImage, setUrl) => {
    const file = e.target.files[0];
    setImage(file);

    if (file) {
      try {
        const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
          params: { filename: file.name, filetype: file.type }
        });

        const { signedUrl, url } = response.data;

        await axios.put(signedUrl, file, {
          headers: { 'Content-Type': file.type }
        });

        setUrl(url);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload image. Please try again.');
      }
    }
  };

  const addCategory = async () => {
    if (!categoryName.trim()) {
      toast.warn('Please enter a category name');
      return;
    }
    setLoadingAdd(true);
    try {
      let imageUrl = categoryImageUrl;

      if (!categoryImageUrl && categoryImage) {
        const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
          params: { filename: categoryImage.name, filetype: categoryImage.type }
        });

        const { signedUrl, url } = response.data;

        await axios.put(signedUrl, categoryImage, {
          headers: { 'Content-Type': categoryImage.type }
        });

        imageUrl = url;
      }

      await axios.post(`${apiUrl}Category/create-category`, 
        { name: categoryName, imageUrl }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCategories();
      setShowCategoryModal(false);
      setCategoryName('');
      setCategoryImage(null);
      setCategoryImageUrl('');
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to add category. Please try again.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const addSubCategory = async () => {
    if (!subCategoryName.trim()) {
      toast.warn('Please enter a subcategory name');
      return;
    }
    setLoadingAdd(true);
    try {
      let imageUrl = subCategoryImageUrl;

      if (!subCategoryImageUrl && subCategoryImage) {
        const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
          params: { filename: subCategoryImage.name, filetype: subCategoryImage.type }
        });

        const { signedUrl, url } = response.data;

        await axios.put(signedUrl, subCategoryImage, {
          headers: { 'Content-Type': subCategoryImage.type }
        });

        imageUrl = url;
      }

      await axios.post(`${apiUrl}Category/create-subcategory`, 
        { name: subCategoryName, categoryId: selectedCategory._id, imageUrl }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategories();
      const updatedCategory = categories.find(category => category._id === selectedCategory._id);
      setSelectedCategory(updatedCategory);

      setShowSubCategoryModal(false);
      setSubCategoryName('');
      setSubCategoryImage(null);
      setSubCategoryImageUrl('');
      toast.success('Subcategory added successfully');
    } catch (error) {
      console.error('Error creating subcategory:', error);
      toast.error('Failed to add subcategory. Please try again.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const editCategory = async () => {
    if (!categoryName.trim()) {
      toast.warn('Please enter a category name');
      return;
    }
    setLoadingAdd(true);
    try {
      let imageUrl = categoryImageUrl;

      if (categoryImage) {
        const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
          params: { filename: categoryImage.name, filetype: categoryImage.type }
        });

        const { signedUrl, url } = response.data;

        await axios.put(signedUrl, categoryImage, {
          headers: { 'Content-Type': categoryImage.type }
        });

        imageUrl = url;
      }

      await axios.put(`${apiUrl}Category/edit-category/${selectedCategory._id}`, 
        { name: categoryName, imageUrl }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategories();
      setShowEditCategoryModal(false);
      setCategoryName('');
      setCategoryImage(null);
      setCategoryImageUrl('');
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error editing category:', error);
      toast.error('Failed to update category. Please try again.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const editSubCategory = async () => {
    if (!subCategoryName.trim()) {
      toast.warn('Please enter a subcategory name');
      return;
    }
    setLoadingAdd(true);
    try {
      let imageUrl = subCategoryImageUrl;

      if (subCategoryImage) {
        const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
          params: { filename: subCategoryImage.name, filetype: subCategoryImage.type }
        });

        const { signedUrl, url } = response.data;

        await axios.put(signedUrl, subCategoryImage, {
          headers: { 'Content-Type': subCategoryImage.type }
        });

        imageUrl = url;
      }

      await axios.put(`${apiUrl}Category/edit-subcategory/${selectedSubCategory._id}`, 
        { name: subCategoryName, imageUrl }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedSubcategories = selectedCategory.subcategories.map(subcategory =>
        subcategory._id === selectedSubCategory._id ? { ...subcategory, name: subCategoryName, imageUrl } : subcategory
      );
      setSelectedCategory(prevCategory => ({
        ...prevCategory,
        subcategories: updatedSubcategories
      }));
      setShowEditSubCategoryModal(false);
      setSubCategoryName('');
      setSubCategoryImage(null);
      setSubCategoryImageUrl('');
      await fetchCategories();
      toast.success('Subcategory updated successfully');
    } catch (error) {
      console.error('Error editing subcategory:', error);
      toast.error('Failed to update subcategory. Please try again.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleReturn = () => {
    router.back();
  };

if (loadingAddCategoryPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canAddCategory) {
    return <NotAuth />;
  }

  return (
     <div className="bg-gray-100 min-h-screen p-4 text-gray-900">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-7xl mx-auto">
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

        <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">Categories Management</h1>

        <div className="flex justify-center mb-8">
          {loadingAddCategoryPermission ? (
            <FaSpinner className="animate-spin text-2xl text-blue-500" />
          ) : (
            canAddCategory && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center"
                onClick={() => setShowCategoryModal(true)}
              >
                <FaPlus className="mr-2" />
                Add Category
              </motion.button>
            )
          )}
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <motion.ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {categories.map(category => (
                <motion.li
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white border border-gray-300 p-6 rounded-lg shadow-lg flex flex-col"
                >
                  <div className="flex items-center mb-4">
                    {category.imageUrl && (
                      <img src={category.imageUrl} alt={category.name} className="w-16 h-16 object-cover rounded-lg mr-4" />
                    )}
                    <h3 className="text-xl font-semibold flex-grow">{category.name}</h3>
                  </div>
                  <div className="flex flex-col space-y-2 mt-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowSubCategoriesModal(true);
                      }}
                    >
                      <FaEdit className="mr-2" />
                      View Subcategories
                    </motion.button>
                    {loadingEditCategoryPermission ? (
                      <FaSpinner className="animate-spin text-2xl text-blue-500 self-center" />
                    ) : (
                      canEditCategory && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-all flex items-center justify-center"
                          onClick={() => {
                            setSelectedCategory(category);
                            setCategoryName(category.name);
                            setCategoryImageUrl(category.imageUrl);
                            setShowEditCategoryModal(true);
                          }}
                        >
                          <MdEdit className="mr-2" />
                          Edit Category
                        </motion.button>
                      )
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

<Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add Category">
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="border p-3 mb-6 w-full rounded-lg"
            placeholder="Category Name"
          />
          <input
            type="file"
            onChange={(e) => handleFileChange(e, setCategoryImage, setCategoryImageUrl)}
            className="border p-3 mb-6 w-full rounded-lg"
          />
          <div className="flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all"
              onClick={() => setShowCategoryModal(false)}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              onClick={addCategory}
              disabled={loadingAdd}
            >
              {loadingAdd ? <FaSpinner className="animate-spin mx-auto" /> : 'Add'}
            </motion.button>
          </div>
        </Modal>

        <Modal isOpen={showSubCategoriesModal} onClose={() => setShowSubCategoriesModal(false)} title={`Subcategories of ${selectedCategory?.name}`}>
          <div className="max-h-96 overflow-y-auto mb-6">
            <ul className="space-y-4">
              {selectedCategory?.subcategories.map(subcategory => (
                <motion.li
                  key={subcategory._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border p-4 rounded-lg bg-gray-100 shadow flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    {subcategory.imageUrl && (
                      <img src={subcategory.imageUrl} alt={subcategory.name} className="w-12 h-12 object-cover rounded-lg" />
                    )}
                    <span>{subcategory.name}</span>
                  </div>
                  {loadingEditSubCategoryPermission ? (
                    <FaSpinner className="animate-spin text-2xl text-blue-500" />
                  ) : (
                    canEditSubCategory && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-yellow-600 text-white p-2 rounded-full hover:bg-yellow-700 transition-all"
                        onClick={() => {
                          setSelectedSubCategory(subcategory);
                          setSubCategoryName(subcategory.name);
                          setSubCategoryImageUrl(subcategory.imageUrl);
                          setShowEditSubCategoryModal(true);
                        }}
                      >
                        <MdEdit />
                      </motion.button>
                    )
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end space-x-4">
            {loadingAddSubCategoryPermission ? (
              <FaSpinner className="animate-spin text-2xl text-blue-500" />
            ) : (
              canAddSubCategory && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all"
                  onClick={() => setShowSubCategoryModal(true)}
                >
                  Add Subcategory
                </motion.button>
              )
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all"
              onClick={() => setShowSubCategoriesModal(false)}
            >
              Close
            </motion.button>
          </div>
        </Modal>

        <Modal isOpen={showSubCategoryModal} onClose={() => setShowSubCategoryModal(false)} title={`Add Subcategory to ${selectedCategory?.name}`}>
          <input
            type="text"
            value={subCategoryName}
            onChange={(e) => setSubCategoryName(e.target.value)}
            className="border p-3 mb-6 w-full rounded-lg"
            placeholder="Subcategory Name"
          />
          <input
            type="file"
            onChange={(e) => handleFileChange(e, setSubCategoryImage, setSubCategoryImageUrl)}
            className="border p-3 mb-6 w-full rounded-lg"
          />
          <div className="flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all"
              onClick={() => setShowSubCategoryModal(false)}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              onClick={addSubCategory}
              disabled={loadingAdd}
            >
              {loadingAdd ? <FaSpinner className="animate-spin mx-auto" /> : 'Add'}
            </motion.button>
          </div>
        </Modal>

        <Modal isOpen={showEditCategoryModal} onClose={() => setShowEditCategoryModal(false)} title="Edit Category">
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="border p-3 mb-6 w-full rounded-lg"
            placeholder="Category Name"
          />
          <input
            type="file"
            onChange={(e) => handleFileChange(e, setCategoryImage, setCategoryImageUrl)}
            className="border p-3 mb-6 w-full rounded-lg"
          />
          <div className="flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all"
              onClick={() => setShowEditCategoryModal(false)}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              onClick={editCategory}
              disabled={loadingAdd}
            >
              {loadingAdd ? <FaSpinner className="animate-spin mx-auto" /> : 'Save'}
            </motion.button>
          </div>
        </Modal>

        <Modal isOpen={showEditSubCategoryModal} onClose={() => setShowEditSubCategoryModal(false)} title="Edit Subcategory">
          <input
            type="text"
            value={subCategoryName}
            onChange={(e) => setSubCategoryName(e.target.value)}
            className="border p-3 mb-6 w-full rounded-lg"
            placeholder="Subcategory Name"
          />
          <input
            type="file"
            onChange={(e) => handleFileChange(e, setSubCategoryImage, setSubCategoryImageUrl)}
            className="border p-3 mb-6 w-full rounded-lg"
          />
          <div className="flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all"
              onClick={() => setShowEditSubCategoryModal(false)}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              onClick={editSubCategory}
              disabled={loadingAdd}
            >
              {loadingAdd ? <FaSpinner className="animate-spin mx-auto" /> : 'Save'}
            </motion.button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Page;

       