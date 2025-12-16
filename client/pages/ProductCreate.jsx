import React, { useState, useEffect } from 'react';
import { Image, Tag, DollarSign, Save, ArrowLeft, Loader2, Info, ListChecks, X, PaintBucket, ImagePlus, CloudUpload, Zap, Send } from 'lucide-react';

// =================================================================================
// # API & CONFIGURATION BLOCK: DO NOT EDIT THE KEYS IN THIS BLOCK IF YOU HAVE ALREADY CONFIGURED THEM
// =================================================================================
const apiConfig = {
  // # SUPABASE CONFIGURATION
  // 1. YOUR SUPABASE REST URL (e.g., https://[project_ref].supabase.co)
  supabase_api_url: "YOUR_SUPABASE_REST_URL_HERE",
  // 2. YOUR SUPABASE ANON PUBLIC KEY
  supabase_anon_key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcXBocm9nZXh5emh3aWZ1a3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjIyNjcsImV4cCI6MjA3NjUzODI2N30.L3rWgtCxc3aec1zCLe_TZfep2PdJ_8i9Dhp_ob0Kldw",
  // Note: Your ID 30767 can be used here if it's part of a flow key or project ID:
  supabase_project_id: "30767", 
  
  // # N8N/RUNPOD FLOW WEBHOOKS (For triggering external actions)
  // # 1. Flow to fetch images from your local PC (I:\Images-Initial), upload them to storage, and return URLs.
  n8n_initial_fetch_webhook: "YOUR_N8N_WEBHOOK_FOR_INITIAL_IMAGE_FETCH", 
  
  // # 2. Flow to publish a draft listing using selected pre-processed images.
  n8n_publish_draft_webhook: "YOUR_N8N_WEBHOOK_FOR_PUBLISH_DRAFT",
  
  // # 3. AI Modification Endpoint (e.g., RunPod or specialized n8n flow for image-to-image)
  ai_modify_endpoint: "YOUR_RUNPOD_OR_N8N_WEBHOOK_FOR_AI_MODIFY",
  
  // # 4. Flow to publish a draft listing using the newly modified image.
  n8n_publish_custom_draft_webhook: "YOUR_N8N_WEBHOOK_FOR_PUBLISH_CUSTOM_DRAFT",
  
  // # 5. AI Upscaling Endpoint (e.g., RunPod or specialized n8n flow for super-resolution)
  ai_upscale_endpoint: "YOUR_RUNPOD_OR_N8N_WEBHOOK_FOR_AI_UPSCALE",
  
  // # Shared Auth/Token (If flows are secured)
  flow_auth_token: "YOUR_SHARED_SECRET_API_TOKEN", 
};
// =================================================================================


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
  images: [], 
};

// MOCK DATA for Image Prompts: Topics & Styles (Used as fallback/initial state)
// NOTE: I am updating this mock data to use 'topic' and 'styleSplit' to match the request.
const mockCategoryData = [
  { id: 1, topic: 'Engagement Ring Box', styleSplit: '50% Elegant, 50% Minimal' },
  { id: 2, topic: 'Bohemian Wall Hanging', styleSplit: '70% Macrame, 30% Geometric' },
  { id: 3, topic: 'Abstract Birthday Card', styleSplit: '90% Watercolor, 10% Line Art' },
];

// --- Helper Functions for API Calls ---

// A mock function to simulate converting a file to a Base64 string for API payload
const fileToBase64 = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
};

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
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Listing Configuration State
  const [aspectRatio, setAspectRatio] = useState('3:2');
  const [productTypes, setProductTypes] = useState([]); 
  
  // Custom Photo State
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState("https://placehold.co/300x400/374151/ffffff?text=Upload+Original+Photo");
  const [modifiedPhotoUrl, setModifiedPhotoUrl] = useState("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output"); 
  const [selectedArtStyle, setSelectedArtStyle] = useState('Watercolor');
  const [originalFile, setOriginalFile] = useState(null); 

  // Upscale Photo State
  const [upscaleOriginalUrl, setUpscaleOriginalUrl] = useState("https://placehold.co/300x400/f59e0b/ffffff?text=Low+Res+Input");
  const [upscaleModifiedUrl, setUpscaleModifiedUrl] = useState("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output");
  const [selectedUpscaleModel, setSelectedUpscaleModel] = useState('Standard');
  const [upscaleOriginalFile, setUpscaleOriginalFile] = useState(null); 

  // Category Updater Table State (Data fetched from Supabase)
  const [imageCategories, setImageCategories] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isCategoryUpdating, setIsCategoryUpdating] = useState(false);
  const [categoryError, setCategoryError] = useState('');
    
  // Image Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');


  // --- Supabase and Initial Image Load on Component Mount ---
  
  // Function to fetch categories from Supabase (Used in useEffect and refresh)
  const fetchCategories = async () => {
      // # 1. SUPABASE INTEGRATION BLOCK: Load Image Categories (Topics & Styles)
      setIsCategoryLoading(true);
      setCategoryError('');
      
      // Check for config presence
      if (apiConfig.supabase_api_url === "https://ckqphrogexyzhwifuksr.supabase.co/rest/v1/etsytopics?select=topic") {
          setCategoryError("Please configure 'supabase_api_url' and 'supabase_anon_key' in apiConfig. Using mock data.");
          setImageCategories(mockCategoryData);
          setIsCategoryLoading(false);
          return;
      }
      
      const SUPABASE_TABLE_NAME = 'etsytopics'; // Assuming this is your table name

      try {
          // # Fetch categories from your Supabase table
          const response = await fetch(`https://ckqphrogexyzhwifuksr.supabase.co/rest/v1/etsytopics?select=*`, {
              headers: {
                  'apikey': apiConfig.supabase_anon_key,
                  'Authorization': `Bearer ${apiConfig.supabase_anon_key}`,
              },
          });

          if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Could not parse error response.' }));
              const errorMessage = `Supabase fetch failed (Status: ${response.status}). Message: ${errorData.message || 'Unknown error'}`;
              console.error(errorMessage);
              setCategoryError(errorMessage + '. Using mock data.');
              setImageCategories(mockCategoryData);
              return;
          }

          const data = await response.json();
          // Map data to ensure it has 'topic' and 'styleSplit'
          const processedData = data.map(item => ({
            id: item.id,
            topic: item.topic || '',
            styleSplit: item.style_split || '',
          }));
          
          setImageCategories(processedData.length > 0 ? processedData : mockCategoryData);

      } catch (err) {
          // Catch network errors (e.g., CORS, no connection)
          const errorMessage = `Failed to load categories due to network error: ${err.message}.`;
          console.error(errorMessage, err);
          setCategoryError(errorMessage + ' Using mock data.');
          setImageCategories(mockCategoryData);
      } finally {
          setIsCategoryLoading(false);
      }
  };


  useEffect(() => {
    
    fetchCategories();
    
    // # 2. N8N INTEGRATION BLOCK: Initial Image Fetch (Simulating I:\Images-Initial)
    const triggerInitialImageFetchFlow = async () => {
        setIsImageLoading(true);
        
        // Prevent triggering if webhook is not configured
        if (apiConfig.n8n_initial_fetch_webhook === "YOUR_N8N_WEBHOOK_FOR_INITIAL_IMAGE_FETCH") {
            setFormError("Please configure 'n8n_initial_fetch_webhook' in apiConfig. Using mock images.");
            const mockFallback = [
                { id: crypto.randomUUID(), url: "https://placehold.co/150x150/4f46e5/ffffff?text=A_98", filename: 'mug_vintage_01.jpg', style: 'Vintage', score: 98, selected: false },
                { id: crypto.randomUUID(), url: "https://placehold.co/150x150/6366f1/ffffff?text=B_95", filename: 'mug_bohemian_02.jpg', style: 'Bohemian', score: 95, selected: false },
                { id: crypto.randomUUID(), url: "https://placehold.co/150x150/818cf8/ffffff?text=C_92", filename: 'mug_geometric_03.jpg', style: 'Geometric', score: 92, selected: false },
            ];
            setProduct(prev => ({ ...prev, images: mockFallback }));
            setIsImageLoading(false);
            return;
        }
        
        console.log("Triggering n8n flow to fetch images from local PC and return URLs...");

        try {
            const response = await fetch(apiConfig.n8n_initial_fetch_webhook, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.flow_auth_token}`
                },
                // You can send contextual data to n8n if needed
                body: JSON.stringify({ userId: 'current_user_id', projectId: apiConfig.supabase_project_id }) 
            });
            
            const result = await response.json();
            if (!response.ok || !Array.isArray(result.images)) {
                // Assuming n8n returns an object like { success: true, images: [...] }
                const message = result.message || `n8n did not return a valid image array (Status: ${response.status}).`;
                console.error(message);
                throw new Error(message);
            }

            const sortedImages = result.images.sort((a, b) => b.score - a.score);
            setProduct(prev => ({ ...prev, images: sortedImages }));

        } catch (error) {
            console.error('Error triggering initial n8n fetch flow:', error.message);
            // MOCK DATA FALLBACK (if n8n fails)
            setFormError(`Initial image fetch failed: ${error.message}. Using mock image data.`);
            
            // Generate mock data structured as if it came from n8n
            const mockFallback = [
                { id: crypto.randomUUID(), url: "https://placehold.co/150x150/4f46e5/ffffff?text=A_98", filename: 'mug_vintage_01.jpg', style: 'Vintage', score: 98, selected: false },
                { id: crypto.randomUUID(), url: "https://placehold.co/150x150/6366f1/ffffff?text=B_95", filename: 'mug_bohemian_02.jpg', style: 'Bohemian', score: 95, selected: false },
                { id: crypto.randomUUID(), url: "https://placehold.co/150x150/818cf8/ffffff?text=C_92", filename: 'mug_geometric_03.jpg', style: 'Geometric', score: 92, selected: false },
            ];
            setProduct(prev => ({ ...prev, images: mockFallback }));
        } finally {
            setIsImageLoading(false);
        }
    };

    triggerInitialImageFetchFlow(); 
  }, []);
  // -----------------------------------------------------------

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalPhotoUrl(reader.result);
        setModifiedPhotoUrl("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output"); 
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
        setUpscaleModifiedUrl("https://placehold.co/300x400/9ca3af/ffffff?text=A.I.+Output"); 
      };
      reader.readAsDataURL(file);
    }
};


  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would handle form submission logic
    console.log("Form submission triggered (Prevented default behavior for demo)");
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
  
  // --- Category Handlers (Supabase Update) ---
  
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

  const handleCategoryUpdate = async () => {
    // # 3. SUPABASE INTEGRATION BLOCK: Update Image Categories
    
    // Prevent updating if API URL is not configured
    if (apiConfig.supabase_api_url === "YOUR_SUPABASE_REST_URL_HERE") {
        setCategoryError("Please configure 'supabase_api_url' and 'supabase_anon_key' in apiConfig before updating.");
        return;
    }

    setIsCategoryUpdating(true);
    setCategoryError('');
    const SUPABASE_TABLE_NAME = 'image_prompts'; 
    
    try {
        // We use POST/upsert to update existing records or insert new ones.
        const response = await fetch(`${apiConfig.supabase_api_url}/rest/v1/${SUPABASE_TABLE_NAME}`, {
            method: 'POST',
            headers: {
                'apikey': apiConfig.supabase_anon_key,
                'Authorization': `Bearer ${apiConfig.supabase_anon_key}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates' // Use upsert/merge
            },
            // Ensure the data being sent matches the table schema (topic, styleSplit, id are present)
            body: JSON.stringify(imageCategories.map(({ topic, styleSplit, id }) => ({ topic, styleSplit, id })))
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Could not parse error response.' }));
            throw new Error(errorData.message || `Supabase update failed (Status: ${response.status}).`);
        }

        console.log('Categories successfully updated in Supabase.');
        setCategoryError('Successfully saved changes to Supabase! Refreshing data...');
        // Refetch data after successful update to ensure state matches DB
        await fetchCategories();
        setCategoryError('Successfully saved changes to Supabase!');
        
    } catch (err) {
        setCategoryError(`Failed to update categories in Supabase: ${err.message}`);
        console.error(err);
    } finally {
        setIsCategoryUpdating(false);
    }
  };
  // ---------------------------------------------

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
                Loading images... (n8n is fetching and uploading)
            </div>
        );
    }
    
    if (product.images.length === 0) {
        return (
            <div className="p-6 bg-yellow-100 text-yellow-800 rounded-lg flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <p>No images loaded. Check your n8n flow and configuration.</p>
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
  
  // --- Listing Configuration Controls ---
  const ListingConfigurationControls = () => {
    const isReadyToPublish = product.images.some(img => img.selected) && aspectRatio && productTypes.length > 0;

    const handlePublishDraft = async () => {
        // # 4. EXTERNAL FLOW INTEGRATION BLOCK: Publish Draft (n8n/Etsy API)
        
        // Prevent publishing if webhook is not configured
        if (apiConfig.n8n_publish_draft_webhook === "YOUR_N8N_WEBHOOK_FOR_PUBLISH_DRAFT") {
            setFormError("Please configure 'n8n_publish_draft_webhook' in apiConfig before publishing.");
            return;
        }

        const selectedImages = product.images.filter(img => img.selected);
        setLoading(true);
        setFormError('');

        try {
            const response = await fetch(apiConfig.n8n_publish_draft_webhook, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.flow_auth_token}`
                },
                body: JSON.stringify({
                    listingData: {
                        images: selectedImages.map(img => img.url),
                        aspectRatio,
                        productTypes,
                        // Include other product data here
                    },
                    auth: {
                        token: apiConfig.flow_auth_token,
                    }
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to trigger n8n workflow.');
            console.log('n8n Publish Draft Flow triggered successfully:', result);
            setFormError('Draft publishing flow successfully initiated!');

        } catch (error) {
            console.error('Error triggering Publish Draft flow:', error.message);
            setFormError(`Failed to publish draft: ${error.message}. Check n8n logs.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-t border-gray-200 pt-6 mt-6">
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
                    onClick={handlePublishDraft}
                    disabled={!isReadyToPublish || loading}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition duration-150 shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                    {loading ? 'Triggering Flow...' : 'Publish Draft'}
                </button>
            </div>
        </div>
    );
  };
  
  // --- Custom Photos Section (Section 2) ---
  const CustomPhotosSection = () => {
      const artStyles = ['Watercolor', 'Paint', 'Illustration', 'Photorealistic'];
      const [modifyLoading, setModifyLoading] = useState(false);
      
      const handleModify = async () => {
          if (!originalFile) return;
          
          // Prevent modification if endpoint is not configured
          if (apiConfig.ai_modify_endpoint === "YOUR_RUNPOD_OR_N8N_WEBHOOK_FOR_AI_MODIFY") {
              setFormError("Please configure 'ai_modify_endpoint' in apiConfig before attempting AI modification.");
              return;
          }

          // # 5. EXTERNAL FLOW INTEGRATION BLOCK: Image Modification (RunPod/n8n)
          setModifyLoading(true);
          setFormError('');
          const base64Image = await fileToBase64(originalFile);
          
          try {
              const response = await fetch(apiConfig.ai_modify_endpoint, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.flow_auth_token}`
                  },
                  body: JSON.stringify({
                      image_data: base64Image,
                      art_style: selectedArtStyle,
                      // You can add a prompt here if needed
                  })
              });
              
              const result = await response.json();
              if (!response.ok || !result.modified_image_url) throw new Error('AI modification failed.');
              
              // Assuming the API returns a temporary public URL or a base64 encoded image
              setModifiedPhotoUrl(result.modified_image_url);
              setFormError('Image successfully modified by AI.');

          } catch (error) {
              console.error('Error running modification flow:', error.message);
              setFormError(`Image modification failed: ${error.message}`);
              // Fallback placeholder on error
              setModifiedPhotoUrl("https://placehold.co/300x400/ef4444/ffffff?text=AI+ERROR"); 
          } finally {
              setModifyLoading(false);
          }
      };
      
      const handlePublishCustomDraft = async () => {
          if (modifiedPhotoUrl.includes('9ca3af') || modifiedPhotoUrl.includes('AI+ERROR')) return; 
          
          // Prevent publishing if webhook is not configured
          if (apiConfig.n8n_publish_custom_draft_webhook === "YOUR_N8N_WEBHOOK_FOR_PUBLISH_CUSTOM_DRAFT") {
            setFormError("Please configure 'n8n_publish_custom_draft_webhook' in apiConfig before publishing.");
            return;
          }

          // # 6. EXTERNAL FLOW INTEGRATION BLOCK: Publish Custom Draft (n8n/Etsy API)
          setLoading(true);
          setFormError('');

          try {
              const response = await fetch(apiConfig.n8n_publish_custom_draft_webhook, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.flow_auth_token}`
                  },
                  body: JSON.stringify({
                      image_url: modifiedPhotoUrl,
                      art_style: selectedArtStyle,
                      // Include other product data here
                  })
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.message || 'Failed to trigger custom flow.');
              console.log('n8n Custom Publish Draft Flow triggered successfully:', result);
              setFormError('Custom draft publishing flow successfully initiated!');

          } catch (error) {
              console.error('Error triggering Custom Draft flow:', error.message);
              setFormError(`Failed to publish custom draft: ${error.message}. Check n8n logs.`);
          } finally {
              setLoading(false);
          }
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
                        {/* If the image is loading, show spinner */}
                        {modifyLoading ? (
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        ) : modifiedPhotoUrl.includes('9ca3af') ? ( 
                            // If it's the neutral placeholder
                             <ImagePlus className="w-12 h-12 text-indigo-400" />
                        ) : (
                            // Show the modified image
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
                        disabled={!originalFile || modifyLoading}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md flex items-center justify-center h-full sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {modifyLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PaintBucket className="w-5 h-5 mr-2" />}
                        {modifyLoading ? 'Generating...' : 'Modify'}
                    </button>
                    
                    {/* Publish Custom Draft Button (Secondary Green) */}
                    <button
                        type="button"
                        onClick={handlePublishCustomDraft}
                        disabled={modifiedPhotoUrl.includes('9ca3af') || modifiedPhotoUrl.includes('AI+ERROR') || loading} 
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md flex items-center justify-center h-full sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        {loading ? 'Triggering Flow...' : 'Publish Custom Draft'}
                    </button>
                </div>
            </div>
          </>
      );
  };

  // --- Upscale Photos Section (Section 3) ---
  const UpscalePhotosSection = () => {
      const upscaleModels = ['Standard', 'HQ (Large)', 'Premium (Max Detail)'];
      const [upscaleLoading, setUpscaleLoading] = useState(false);

      const handleUpscale = async () => {
          if (!upscaleOriginalFile) return; 

          // Prevent upscaling if endpoint is not configured
          if (apiConfig.ai_upscale_endpoint === "YOUR_RUNPOD_OR_N8N_WEBHOOK_FOR_AI_UPSCALE") {
            setFormError("Please configure 'ai_upscale_endpoint' in apiConfig before attempting AI upscale.");
            return;
          }

          // # 7. EXTERNAL FLOW INTEGRATION BLOCK: Image Upscale (RunPod/n8n)
          setUpscaleLoading(true);
          setFormError('');
          const base64Image = await fileToBase64(upscaleOriginalFile);

          try {
              const response = await fetch(apiConfig.ai_upscale_endpoint, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.flow_auth_token}`
                  },
                  body: JSON.stringify({
                      image_data: base64Image,
                      model: selectedUpscaleModel,
                  })
              });
              
              const result = await response.json();
              if (!response.ok || !result.upscaled_image_url) throw new Error('AI upscale failed.');
              
              setUpscaleModifiedUrl(result.upscaled_image_url);
              setFormError('Image successfully upscaled by AI.');
              
          } catch (error) {
              console.error('Error running upscale flow:', error.message);
              setFormError(`Image upscale failed: ${error.message}`);
              setUpscaleModifiedUrl("https://placehold.co/300x400/ef4444/ffffff?text=AI+ERROR");
          } finally {
              setUpscaleLoading(false);
          }
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
                        {/* If the image is loading, show spinner */}
                        {upscaleLoading ? (
                            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                        ) : upscaleModifiedUrl.includes('9ca3af') ? ( 
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
                        disabled={!upscaleOriginalFile || upscaleLoading}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md flex items-center justify-center h-full sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {upscaleLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                        {upscaleLoading ? 'Upscaling...' : 'Upscale'}
                    </button>
                </div>
            </div>
          </>
      );
  };


  // --- Category Updater Table Component ---
  const CategoryUpdaterTable = () => {
    
    if (isCategoryLoading) {
      return (
        <div className="flex justify-center items-center p-4 text-indigo-500">
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          Loading prompts from Supabase...
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/2 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Topic
              </th>
              <th className="w-1/2 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                Style Split
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {imageCategories.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-indigo-50/30 transition duration-100">
                <td className="px-4 py-1">
                  <input
                    type="text"
                    value={item.topic}
                    onChange={(e) => handleCategoryChange(index, 'topic', e.target.value)}
                    placeholder="Topic Name"
                    className="w-full text-sm p-1 border border-gray-200 rounded-md focus:ring-indigo-300 focus:border-indigo-300 transition duration-100"
                  />
                </td>
                <td className="px-4 py-1 border-l border-gray-100">
                  <input
                    type="text"
                    value={item.styleSplit}
                    onChange={(e) => handleCategoryChange(index, 'styleSplit', e.target.value)}
                    placeholder="Style Split (e.g., 70% Watercolor)"
                    className="w-full text-sm p-1 border border-gray-200 rounded-md focus:ring-indigo-300 focus:border-indigo-300 transition duration-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-3 bg-gray-50 flex justify-end border-t border-gray-200">
          {/* Button to add a new row locally for a new configuration */}
          <button
            onClick={() => setImageCategories(prev => [...prev, { topic: '', styleSplit: '', id: crypto.randomUUID() }])}
            type="button"
            className="px-4 py-1.5 bg-gray-400 text-white text-sm font-semibold rounded-full hover:bg-gray-500 transition duration-150 shadow-md flex items-center mr-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Row
          </button>
        
          <button
            onClick={handleCategoryUpdate}
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
            {isCategoryUpdating ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
        {categoryError && (
            <div className={`p-3 text-xs rounded-b-lg ${categoryError.includes('Successfully') ? 'text-green-800 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {categoryError}
            </div>
        )}
      </div>
    );
  };
  // ------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Etsy AI Manager</h1>
        </header>

        {formError && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg flex items-center shadow-md" role="alert">
                <Info className="w-5 h-5 mr-2" />
                <span>{formError}</span>
            </div>
        )}

        <form onSubmit={handleSubmit}>
            {/* Section 1: Initial Image Fetch & Listing Configuration */}
            <Section icon={Image} title="1. Initial Image Processing & Listing Config">
                <ImageTable />
                <ListingConfigurationControls />
            </Section>

            {/* Section 2: AI Photo Customization */}
            <Section icon={PaintBucket} title="2. AI Photo Customization (Image-to-Image)">
                <CustomPhotosSection />
            </Section>

            {/* Section 3: AI Image Upscaling */}
            <Section icon={Zap} title="3. AI Image Upscaling">
                <UpscalePhotosSection />
            </Section>

            {/* Section 4: Image Prompt Updater (Supabase Config) */}
            <Section icon={Tag} title="4. Image Prompt Configuration (Supabase)">
                <CategoryUpdaterTable />
            </Section>
        </form>
      </div>
      <ImageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        imageUrl={modalImageUrl} 
      />
    </div>
  );
};

// Add Plus icon for the new 'Add Row' button
const Plus = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default ProductCreatePage;
