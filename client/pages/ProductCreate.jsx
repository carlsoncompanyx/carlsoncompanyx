import React, { useState, useEffect } from 'react';
import { Image, Tag, DollarSign, Save, ArrowLeft, Loader2, Info, ListChecks, X, PaintBucket, ImagePlus, CloudUpload, Zap, Send } from 'lucide-react';

// Mock state structure for the product
const initialProductState = {
  title: '',
  description: '',
  category: 'Home & Living',
  price: 0.00,
  quantity: 1,
  sku: '',
  isDigital: false,
  shippingOrigin: 'USA',
  processingTime: '1-3 business days',
  tags: [],
  images: [], // Now holds mock image objects with score/style/selection
};

// Mock Supabase data for the image categories (Image Prompts section)
const mockCategoryData = [
  { topic: 'Engagement', style: 'Vintage' },
  { topic: 'Wedding', style: 'Bohemian' },
  { topic: 'Birthdays', 'style': 'Geometric' },
  { topic: 'Anniversary', style: 'Art Deco' },
  { topic: 'Casual Wear', style: 'Minimal' },
];

// Mock data for images, simulating a "desktop folder" load. Sorted by score (high to low).
const mockImageData = [
    { id: 1, url: "https://placehold.co/150x150/4f46e5/ffffff?text=A_98", filename: 'mug_vintage_01.jpg', style: 'Vintage', score: 98, selected: false },
    { id: 2, url: "https://placehold.co/150x150/6366f1/ffffff?text=B_95", filename: 'mug_bohemian_02.jpg', style: 'Bohemian', score: 95, selected: false },
    { id: 3, url: "https://placehold.co/150x150/818cf8/ffffff?text=C_92", filename: 'mug_geometric_03.jpg', style: 'Geometric', score: 92, selected: false },
    { id: 4, url: "https://placehold.co/150x150/a5b4fc/ffffff?text=D_85", filename: 'mug_artdeco_04.jpg', style: 'Art Deco', score: 85, selected: false },
    { id: 5, url: "https://placehold.co/150x150/c7d2fe/ffffff?text=E_79", filename: 'mug_minimal_05.jpg', style: 'Minimal', score: 79, selected: false },
    { id: 6, url: "https://placehold.co/150x150/eef2ff/4f46e5?text=F_60", filename: 'mug_farmhouse_06.jpg', style: 'Farmhouse', score: 60, selected: false },
    { id: 7, url: "https://placehold.co/150x150/f0ab00/ffffff?text=G_75", filename: 'abstract_gold.jpg', style: 'Abstract', score: 75, selected: false },
    { id: 8, url: "https://placehold.co/150x150/78350f/ffffff?text=H_88", filename: 'nature_scene.jpg', style: 'Nature', score: 88, selected: false },
];

// Component for the large image preview modal
const ImageModal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={onClose}>
            <div className="relative max-w-2xl w-full max-h-full bg-white rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100 transition"
                    aria-label="Close image preview"
                >
                    <X className="w-5 h-5" />
                </button>
                <img
                    src={imageUrl}
                    alt="Image preview"
                    className="w-full h-auto object-contain max-h-[80vh] rounded-xl"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/ef4444/ffffff?text=Image+Load+Error" }}
                />
            </div>
        </div>
    );
};


// Component to handle the complete product creation page
const ProductCreatePage = () => {
  const [product, setProduct] = useState(initialProductState);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Listing Configuration State
  const [aspectRatio, setAspectRatio] = useState('3:2');
  const [productTypes, setProductTypes] = useState([]); // Multi-select array
  
  // Custom Photo State
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState("https://placehold.co/300x400/374151/ffffff?text=Upload+Original+Photo");
  // Updated to neutral placeholder
  const [modifiedPhotoUrl, setModifiedPhotoUrl] = useState("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output"); 
  const [selectedArtStyle, setSelectedArtStyle] = useState('Watercolor');
  const [originalFile, setOriginalFile] = useState(null); // To store the uploaded file object

  // Upscale Photo State
  const [upscaleOriginalUrl, setUpscaleOriginalUrl] = useState("https://placehold.co/300x400/f59e0b/ffffff?text=Low+Res+Input");
  // Updated to neutral placeholder
  const [upscaleModifiedUrl, setUpscaleModifiedUrl] = useState("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output");
  const [selectedUpscaleModel, setSelectedUpscaleModel] = useState('Standard');
  const [upscaleOriginalFile, setUpscaleOriginalFile] = useState(null); // New state for Upscale file object


  // New states for the Category Updater Table
  const [imageCategories, setImageCategories] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
    
  // New states for the Image Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(true);

  // --- Mock Supabase Fetch & Image Load on Component Mount ---
  useEffect(() => {
    // 1. Simulate fetching image categories
    setTimeout(() => {
      setImageCategories(mockCategoryData);
      setIsCategoryLoading(false);
    }, 800);
    
    // 2. Simulate loading images from "desktop folder"
    setTimeout(() => {
        // Load and sort the mock data initially by score (desc)
        const sortedImages = mockImageData.sort((a, b) => b.score - a.score);
        setProduct(prev => ({ 
            ...prev, 
            images: sortedImages
        }));
        setIsImageLoading(false);
    }, 500);
  }, []);
  // -----------------------------------------------------------

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setOriginalFile(file);
      // Display the uploaded image
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalPhotoUrl(reader.result);
        setModifiedPhotoUrl("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output"); // Reset modified to neutral placeholder
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpscaleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUpscaleOriginalFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpscaleOriginalUrl(reader.result);
        setUpscaleModifiedUrl("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output"); // Reset modified to neutral placeholder
      };
      reader.readAsDataURL(file);
    }
};


  // Removed global handleSubmit as sections have their own buttons
  const handleSubmit = (e) => {
    e.preventDefault();
    // No-op for global form submission
  };
  
  // --- Image Handlers ---
  
  const handleImageSelection = (id, isSelected) => {
    setProduct(prev => ({
        ...prev,
        images: prev.images.map(img =>
            img.id === id ? { ...img, selected: isSelected } : img
        )
    }));
  };
  
  const handleImageClick = (url) => {
    setModalImageUrl(url);
    setIsModalOpen(true);
  };

  const handleProductTypeChange = (type) => {
    setProductTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  // --- Category Handlers ---
  
  const handleCategoryChange = (index, fieldName, value) => {
    setImageCategories(prev =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [fieldName]: value };
        }
        return item;
      })
    );
  };

  const handleCategoryUpdate = () => {
    console.log('Categories Updated:', imageCategories);
  };
  // -----------------------------

  const Section = ({ icon: Icon, title, children, isSmall = false }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 ${isSmall ? 'mb-4' : 'mb-8'}`}>
      <h2 className={`font-bold text-gray-800 flex items-center mb-4 pb-2 border-b border-indigo-50/50 ${isSmall ? 'text-xl' : 'text-2xl'}`}>
        <Icon className={`mr-3 text-indigo-500 ${isSmall ? 'w-5 h-5' : 'w-6 h-6'}`} />
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  // --- Image Table Component (Fixed height, sticky header) ---
  const ImageTable = () => {
    if (isImageLoading) {
        return (
            <div className="flex justify-center items-center p-8 text-indigo-500 bg-gray-50 rounded-lg">
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Loading images from desktop folder...
            </div>
        );
    }
    
    if (product.images.length === 0) {
        return (
            <div className="p-6 bg-yellow-100 text-yellow-800 rounded-lg flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <p>No images loaded. Assuming images will be provided from a desktop source.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-lg">
            <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                Select
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Image
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Filename
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Style
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                Score
                            </th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {product.images.map(img => (
                            <tr key={img.id} className="hover:bg-indigo-50/30 transition duration-100">
                                {/* Checkbox */}
                                <td className="px-3 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={img.selected}
                                        onChange={(e) => handleImageSelection(img.id, e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </td>
                                {/* Image */}
                                <td className="px-4 py-2">
                                    <div 
                                        className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer shadow-md border border-gray-200 hover:border-indigo-500 transition duration-150"
                                        onClick={() => handleImageClick(img.url)}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Product Image ${img.id}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/fecaca/991b1b?text=Err" }}
                                        />
                                    </div>
                                </td>
                                {/* Filename - Non-bold style */}
                                <td className="px-4 py-2 text-sm text-gray-700 font-mono break-all">
                                    {img.filename}
                                </td>
                                {/* Style - Non-bold style */}
                                <td className="px-4 py-2 text-sm text-gray-700">
                                    {img.style}
                                </td>
                                {/* Score */}
                                <td className="px-4 py-2 text-right text-base font-semibold">
                                    <span className={img.score >= 90 ? 'text-green-600' : img.score >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                                        {img.score}
                                    </span>
                                </td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };
  
  // --- Listing Configuration Controls (Moved below ImageTable) ---
  const ListingConfigurationControls = () => {
    const isReadyToPublish = product.images.some(img => img.selected) && aspectRatio && productTypes.length > 0;

    return (
        <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Selected Image Configuration</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Aspect Ratio Dropdown */}
                <div className="flex flex-col">
                    <label htmlFor="aspectRatio" className="text-sm font-medium text-gray-700 mb-1">
                        Aspect Ratio
                    </label>
                    <select
                        id="aspectRatio"
                        name="aspectRatio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    >
                        <option value="3:2">3:2 (Horizontal)</option>
                        {/* Updated 4:3 label */}
                        <option value="4:3">4:3 (Horizontal)</option>
                        <option value="3:4">3:4 (Vertical)</option>
                    </select>
                </div>

                {/* Product Type Multi-Select Dropdown */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                        Product Type (Multi-Select)
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                        {['canvas', 'framed canvas', 'poster', 'metal print'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleProductTypeChange(type)}
                                className={`px-3 py-1 text-sm rounded-full transition-all duration-150 border 
                                    ${productTypes.includes(type)
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'
                                    }`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Publish Draft Button */}
            <div className="flex justify-end mt-6">
                 <button
                    type="button"
                    onClick={() => console.log('Publish Draft clicked with config:', { aspectRatio, productTypes })}
                    disabled={!isReadyToPublish}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition duration-150 shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-5 h-5 mr-2" />
                    Publish Draft
                </button>
            </div>
        </div>
    );
  };
  
  // --- Custom Photos Section (Section 2) ---
  const CustomPhotosSection = () => {
      const artStyles = ['Watercolor', 'Paint', 'Illustration', 'Photorealistic'];
      
      const handleModify = () => {
          if (!originalFile) return;
          console.log(`Starting modification for file: ${originalFile.name} using style: ${selectedArtStyle}`);
          // Mock modification logic (using indigo-600 color)
          setModifiedPhotoUrl(`https://placehold.co/300x400/4f46e5/ffffff?text=Modified+as+${selectedArtStyle.substring(0, 4)}`);
      };
      
      const handlePublishCustomDraft = () => {
          // Check if it's still the neutral placeholder before attempting to publish
          if (modifiedPhotoUrl.includes('9ca3af')) return; 
          console.log('Publish Custom Draft clicked for modified photo.');
          // Real logic would involve saving the modified image to storage and creating a draft listing
      };

      return (
          <>
            <p className="text-sm text-gray-600 mb-6">
                Upload your original image and select an art style to generate a customized, modified version.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-8 justify-around mb-8">
                {/* Original Photo Box (Now supports Upload) */}
                <div className="flex flex-col items-center w-full sm:w-1/2">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Original Photo</h3>
                    <label 
                        htmlFor="originalPhotoUpload" 
                        className="w-full h-80 bg-gray-100 rounded-xl shadow-inner border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition relative"
                    >
                        <input 
                            type="file" 
                            id="originalPhotoUpload" 
                            accept="image/*" 
                            onChange={handleFileUpload} 
                            className="hidden" 
                        />
                        <div className="w-full h-full">
                            {/* If it's the placeholder text */}
                            {originalPhotoUrl.includes('Upload+Original+Photo') ? (
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <CloudUpload className="w-12 h-12 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click or Drag to Upload</p>
                                </div>
                            ) : (
                                <img src={originalPhotoUrl} alt="Original" className="w-full h-full object-cover"/>
                            )}
                        </div>
                    </label>
                </div>
                
                {/* Modified Photo Box */}
                <div className="flex flex-col items-center w-full sm:w-1/2">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Modified Photo</h3>
                    <div className="w-full h-80 bg-gray-100 rounded-xl shadow-xl border-2 border-solid border-indigo-400 flex items-center justify-center overflow-hidden">
                        {/* Check if modified photo is still the neutral placeholder */}
                        {modifiedPhotoUrl.includes('9ca3af') ? ( 
                             <ImagePlus className="w-12 h-12 text-indigo-400" />
                        ) : (
                            <img src={modifiedPhotoUrl} alt="Modified" className="w-full h-full object-cover"/>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Art Style Selector and Modify/Publish Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between space-y-4 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-100">
                
                {/* Style Selector */}
                <div className="flex-1 max-w-sm">
                    <label htmlFor="artStyle" className="text-sm font-medium text-gray-700 mb-1">
                        Select Art Style
                    </label>
                    <select
                        id="artStyle"
                        name="artStyle"
                        value={selectedArtStyle}
                        onChange={(e) => setSelectedArtStyle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    >
                        {artStyles.map(style => (
                            <option key={style} value={style}>{style}</option>
                        ))}
                    </select>
                </div>

                <div className="flex space-x-4">
                    {/* Modify Button (Primary Indigo) */}
                    <button
                        type="button"
                        onClick={handleModify}
                        disabled={!originalFile}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md flex items-center justify-center h-full sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PaintBucket className="w-5 h-5 mr-2" />
                        Modify
                    </button>
                    
                    {/* Publish Custom Draft Button (Secondary Green) */}
                    <button
                        type="button"
                        onClick={handlePublishCustomDraft}
                        // Check if modified photo is still the neutral placeholder
                        disabled={modifiedPhotoUrl.includes('9ca3af')} 
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md flex items-center justify-center h-full sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        Publish Custom Draft
                    </button>
                </div>
            </div>
          </>
      );
  };

  // --- Upscale Photos Section (REPLACED Section 3) ---
  const UpscalePhotosSection = () => {
      const upscaleModels = ['Standard', 'HQ (Large)', 'Premium (Max Detail)'];
      
      const handleUpscale = () => {
          if (!upscaleOriginalFile) return; // Guard clause
          console.log(`Starting upscale for file: ${upscaleOriginalFile.name} using model: ${selectedUpscaleModel}`);
          // Mock upscale logic (using indigo-600 color)
          setUpscaleModifiedUrl(`https://placehold.co/300x400/4f46e5/ffffff?text=Upscaled+by+${selectedUpscaleModel.split(' ')[0]}`);
      };
      
      return (
          <>
            <p className="text-sm text-gray-600 mb-6">
                Use advanced models to increase the resolution and detail of an input image.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-8 justify-around mb-8">
                {/* Original Photo Box (Now supports Upload) */}
                <div className="flex flex-col items-center w-full sm:w-1/2">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Original Photo (Low Res)</h3>
                    <label 
                        htmlFor="upscalePhotoUpload" 
                        className="w-full h-80 bg-gray-100 rounded-xl shadow-inner border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-red-500 transition relative"
                    >
                        <input 
                            type="file" 
                            id="upscalePhotoUpload" 
                            accept="image/*" 
                            onChange={handleUpscaleFileUpload} 
                            className="hidden" 
                        />
                        <div className="w-full h-full">
                            {/* If it's the placeholder text */}
                            {upscaleOriginalUrl.includes('Low+Res+Input') ? (
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <CloudUpload className="w-12 h-12 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click or Drag to Upload</p>
                                </div>
                            ) : (
                                <img src={upscaleOriginalUrl} alt="Original Low Res" className="w-full h-full object-cover"/>
                            )}
                        </div>
                    </label>
                </div>
                
                {/* Upscaled Photo Box */}
                <div className="flex flex-col items-center w-full sm:w-1/2">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Modified Photo (High Res)</h3>
                    <div className="w-full h-80 bg-gray-100 rounded-xl shadow-xl border-2 border-solid border-red-400 flex items-center justify-center overflow-hidden">
                        {/* Check if modified photo is still the neutral placeholder */}
                        {upscaleModifiedUrl.includes('9ca3af') ? ( 
                            <ImagePlus className="w-12 h-12 text-red-400" />
                        ) : (
                            <img src={upscaleModifiedUrl} alt="Upscaled High Res" className="w-full h-full object-cover"/>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Model Selector and Upscale Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between space-y-4 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-100">
                
                {/* Model Selector */}
                <div className="flex-1 max-w-sm">
                    <label htmlFor="upscaleModel" className="text-sm font-medium text-gray-700 mb-1">
                        Select Upscale Model
                    </label>
                    <select
                        id="upscaleModel"
                        name="upscaleModel"
                        value={selectedUpscaleModel}
                        onChange={(e) => setSelectedUpscaleModel(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    >
                        {upscaleModels.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                <div className="flex space-x-4">
                    {/* Upscale Button (Primary Indigo) */}
                    <button
                        type="button"
                        onClick={handleUpscale}
                        disabled={!upscaleOriginalFile}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md flex items-center justify-center h-full sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Zap className="w-5 h-5 mr-2" />
                        Upscale
                    </button>
                    {/* Removed Publish Draft button */}
                </div>
            </div>
          </>
      );
  };


  // --- Category Updater Table Component ---
  const CategoryUpdaterTable = () => {
    const [isCategoryUpdating, setIsCategoryUpdating] = useState(false);

    if (isCategoryLoading) {
      return (
        <div className="flex justify-center items-center p-4 text-indigo-500">
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          Loading prompts...
        </div>
      );
    }
    
    if (categoryError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          Error loading prompts: {categoryError}
        </div>
      );
    }
    
    const handleUpdate = () => {
        setIsCategoryUpdating(true);
        setCategoryError('');
        // Simulate sending data to Supabase (replace this with your actual Supabase POST/PUT call)
        setTimeout(() => {
          console.log('Categories Updated (Mock Supabase Write):', imageCategories);
          setIsCategoryUpdating(false);
          console.log('Image Categories updated successfully!');
        }, 1200);
    };


    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/2 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Topics
              </th>
              <th className="w-1/2 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                Styles
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {imageCategories.map((item, index) => (
              <tr key={index} className="hover:bg-indigo-50/30 transition duration-100">
                <td className="px-1 py-1">
                  <input
                    type="text"
                    value={item.topic}
                    onChange={(e) => handleCategoryChange(index, 'topic', e.target.value)}
                    placeholder="Topic Name"
                    className="w-full text-sm p-1 border border-gray-200 rounded-md focus:ring-indigo-300 focus:border-indigo-300 transition duration-100"
                  />
                </td>
                <td className="px-1 py-1 border-l border-gray-100">
                  <input
                    type="text"
                    value={item.style}
                    onChange={(e) => handleCategoryChange(index, 'style', e.target.value)}
                    placeholder="Style Name"
                    className="w-full text-sm p-1 border border-gray-200 rounded-md focus:ring-indigo-300 focus:border-indigo-300 transition duration-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-3 bg-gray-50 flex justify-end border-t border-gray-200">
          <button
            onClick={handleUpdate}
            type="button"
            disabled={isCategoryUpdating}
            // Update Prompts Button (Primary Indigo)
            className="px-5 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-full hover:bg-indigo-700 transition duration-150 shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCategoryUpdating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ListChecks className="w-4 h-4 mr-2" />
            )}
            {isCategoryUpdating ? 'Updating...' : 'Update Prompts'}
          </button>
        </div>
      </div>
    );
  };
  // ------------------------------------------------

  return (
    // Set global font-inter
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <button
            onClick={() => console.log('Go back')} // Mock navigation
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 font-semibold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Listings
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900">Etsy Products</h1>
        </header>

        {/* Removed global form submit handling */}
        <form onSubmit={handleSubmit}>
          
          {/* Section 1: Create New Listings */}
          <Section icon={Image} title="Create New Listings">
            
             <p className="text-sm text-gray-600 mb-4">
                These images were loaded from your desktop folder. They are sorted by AI Score (highest to lowest). Select images to use for a new listing.
             </p>
            <ImageTable />

            {/* Configuration Controls (Now below the table, contains Publish Draft button) */}
            <ListingConfigurationControls />

          </Section>

          {/* Section 2: Custom Photos (Contains Modify and Publish Custom Draft buttons) */}
          <Section icon={ImagePlus} title="Custom Photos">
             <CustomPhotosSection />
          </Section>


          {/* Section 3: Upscale Photos (New Section) */}
          <Section icon={Zap} title="Upscale Photos">
            <UpscalePhotosSection />
          </Section>

          {/* Section 5: Image Prompts (Unchanged) */}
          <Section icon={ListChecks} title="Image Prompts: Topics & Styles" isSmall>
            <p className="text-xs text-gray-500 mb-2 -mt-2">
              (Optional) Define 5 Topic and Style pairs used for image generation.
            </p>
            <CategoryUpdaterTable />
          </Section>

          {/* Error Message Display */}
          {formError && (
            <div className="flex items-center p-4 bg-red-100 text-red-700 rounded-lg mb-6 shadow-sm">
              <Info className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="font-medium">{formError}</p>
            </div>
          )}

        </form>
      </div>
      {/* Image Modal Integration */}
      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageUrl={modalImageUrl} />
    </div>
  );
};

// Required export for the Canvas environment
export default ProductCreatePage;
