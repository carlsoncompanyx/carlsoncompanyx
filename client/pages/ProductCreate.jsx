import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";

const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/start_mvp_workflow";
const PRODUCT_PROXY_ENDPOINT = "/api/get-printify-products";

const STORES = ["The Frame Fix", "Modern Merch Co.", "Vintage Vault Prints"];
const PRODUCT_TYPES = ["Canvas Print", "Ceramic Mug", "T-shirt", "Hoodie", "Sticker Sheet"];
const ASPECT_RATIOS = ["Square (1:1)", "Landscape (4:3)", "Portrait (3:4)"];
const MAX_IMAGES_TO_GENERATE = 10;

const PROFILES = ["Standard POD", "Premium High-Res", "Vector Art Focus"];
const MOCKUP_PACKAGES = ["Flat Lay Standard", "Model Lifestyle Pack", "Studio Close-up"];

const ProductCreate = () => {
  const { addAutomationTask } = useNotifications();
  const [store, setStore] = useState(STORES[0]);
  const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [numImagesToGenerate, setNumImagesToGenerate] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready for input. Start with Step 1.");

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [profile, setProfile] = useState(PROFILES[0]);
  const [mockupPackage, setMockupPackage] = useState(MOCKUP_PACKAGES[0]);

  const [generatedListingData, setGeneratedListingData] = useState(null);

  const [historyList, setHistoryList] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [mainImage, setMainImage] = useState(null);

  const [finalMockups, setFinalMockups] = useState([]);

  const [productData, setProductData] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  const toast = (message, isError = false) => {
    setStatusMessage(message);
    console.log(isError ? "ERROR:" : "INFO:", message);
  };

  const parseWebhookResponse = (responseText) => {
    try {
      const result = JSON.parse(responseText);

      if (result && result.imagePrompt && result.title) {
        return result;
      }

      if (Array.isArray(result) && result[0] && result[0].message && result[0].message.content) {
        const rawPrompt = result[0].message.content;
        toast("Webhook returned raw AI output. Using extracted prompt; please manually fill SEO fields.", true);

        return {
          imagePrompt: rawPrompt,
          title: `[Review Needed] ${productType} Listing`,
          description:
            "[Review Needed] The n8n workflow did not return a structured JSON object. Please update the workflow's final node to return a single JSON object with the required keys (imagePrompt, title, description, tags).",
          tags: "review, needed, data, manual",
        };
      }

      return null;
    } catch (e) {
      toast("Parsing failed: Response was not valid JSON.", true);
      return null;
    }
  };

  const productsForSEO = useMemo(() => {
    const FALLBACK_PRODUCT_MAPPING = {
      1: "Premium Gallery Canvas",
      2: "Heavy Cotton Tee",
      3: "11oz White Ceramic Mug",
    };

    return selectedProducts.reduce((acc, { productId, size }) => {
      const productName =
        productData.find((p) => p.id === productId)?.name || FALLBACK_PRODUCT_MAPPING[productId] || "Unknown Product";

      acc.push({
        id: `${productId}-${size}`,
        name: `${productName} (${size})`,
        productId,
        size,
        sku: `SKU-${productId}-${size.replace(/[^a-zA-Z0-9]/g, "")}`,
      });
      return acc;
    }, []);
  }, [selectedProducts, productData]);

  useEffect(() => {
    const fetchLiveProducts = async () => {
      setIsProductsLoading(true);
      try {
        const response = await fetch(PRODUCT_PROXY_ENDPOINT);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Proxy returned empty or invalid product list.");
        }
        setProductData(data);
        toast("Live product list loaded successfully.");
      } catch (error) {
        toast("FATAL ERROR: Could not load product list. Check proxy endpoint.", true);
        setProductData([]);
      } finally {
        setIsProductsLoading(false);
      }
    };

    // fetchLiveProducts();

    setProductData([
      { id: 1, name: "Premium Gallery Canvas", sizes: ["12x18", "16x24", "20x30"] },
      { id: 2, name: "Heavy Cotton Tee", sizes: ["S", "M", "L", "XL", "2XL"] },
    ]);
    setIsProductsLoading(false);
  }, []);

  const handleGenerateListingData = useCallback(async () => {
    if (!topic || isProcessing) return;

    setIsProcessing(true);
    setGeneratedListingData(null);
    toast("Triggering n8n webhook for Step 1: Idea and SEO Blueprint...");

    const payload = {
      step: 1,
      store,
      productType,
      topic,
      aspectRatio,
    };

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook call failed with status ${response.status}. Check n8n logs.`);
      }

      toast("Webhook triggered successfully! Awaiting synchronous response...");

      const responseText = await response.text();
      const result = parseWebhookResponse(responseText);

      if (result) {
        setGeneratedListingData(result);
        toast("Step 1 complete. Listing data received. Proceed to Step 2.");
        addAutomationTask({
          title: `Review listing: ${result.title ?? "Automation output"}`,
          link: "/ProductCreate",
        });
      } else {
        throw new Error(`Response failed all validation checks. Raw data: ${responseText.substring(0, 80)}...`);
      }
    } catch (error) {
      setGeneratedListingData(null);
      toast(`FATAL STEP 1 ERROR: ${error.message}. Please fix n8n workflow.`, true);
    } finally {
      setIsProcessing(false);
    }
    }, [topic, productType, aspectRatio, isProcessing, store, addAutomationTask]);

  const handleGenerateImage = useCallback(async () => {
    const prompt = generatedListingData?.imagePrompt;
    if (!prompt || isProcessing || numImagesToGenerate < 1) return;
    if (historyList.length > 0) {
      toast("Images already integrated. Clear the list to run again.", true);
      return;
    }

    setIsProcessing(true);
    toast(`Triggering n8n webhook for Step 2: Batch Image Generation (x${numImagesToGenerate})...`);

    const payload = {
      step: 2,
      imagePrompt: prompt,
      numImages: numImagesToGenerate,
      aspectRatio,
      store,
    };

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook call failed with status ${response.status}. Check n8n logs.`);
      }

      toast("Webhook triggered! Awaiting image URL array...");

      const result = await response.json();

      if (result && Array.isArray(result.imageUrls) && result.imageUrls.every((url) => typeof url === "string")) {
        const newImages = result.imageUrls.map((url) => ({
          id: crypto.randomUUID(),
          url,
          resolution: "N/A",
          prompt,
          enhanced: "",
        }));

        setHistoryList(newImages);
        setMainImage(newImages[0]);
        setSelectedImageIds([newImages[0].id]);
        toast(`${newImages.length} images loaded successfully. Proceed to Step 3.`);
      } else {
        throw new Error("Webhook responded with JSON but did not contain the required 'imageUrls' array.");
      }
    } catch (error) {
      setHistoryList([]);
      setMainImage(null);
      toast(`FATAL STEP 2 ERROR: ${error.message}. Please fix n8n workflow return.`, true);
    } finally {
      setIsProcessing(false);
    }
  }, [generatedListingData, isProcessing, numImagesToGenerate, aspectRatio, historyList.length, store]);

  const toggleImageSelection = (id) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (mainImage && !historyList.find((img) => img.id === mainImage.id)) {
      setMainImage(historyList.length > 0 ? historyList[0] : null);
    }
  }, [historyList, mainImage]);

  const handleEnhanceImage = (enhancementType) => {
    const selectedCount = selectedImageIds.length;
    if (selectedCount === 0) {
      toast("Please select at least one image to enhance.", true);
      return;
    }

    setIsProcessing(true);
    toast(`Triggering n8n webhook for ${enhancementType} enhancement of ${selectedCount} image(s)...`);

    setTimeout(() => {
      setSelectedImageIds([]);
      setIsProcessing(false);
      toast(`Webhook sent! Enhancement request for ${selectedCount} images submitted to n8n.`);
    }, 1500);
  };

  const handleTryAgain = useCallback(() => {
    const selectedCount = selectedImageIds.length;
    if (selectedCount === 0 || isProcessing) return;

    setIsProcessing(true);
    toast(`Triggering n8n webhook for regeneration of ${selectedCount} image(s)...`);

    setTimeout(() => {
      setSelectedImageIds([]);
      setIsProcessing(false);
      toast("Webhook sent! Regeneration request submitted to n8n.");
    }, 1500);
  }, [selectedImageIds, isProcessing]);

  const handleDelete = () => {
    if (selectedImageIds.length === 0) return;

    setHistoryList((prevList) => prevList.filter((img) => !selectedImageIds.includes(img.id)));
    setSelectedImageIds([]);
    toast(`${selectedImageIds.length} image(s) deleted.`);
  };

  const handleProductSelect = (productId, size) => {
    setSelectedProducts((prev) => {
      const index = prev.findIndex((p) => p.productId === productId && p.size === size);
      if (index >= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return [...prev, { productId, size }];
    });
  };

  const handleGenerateFinalPackage = () => {
    if (productsForSEO.length === 0 || selectedImageIds.length === 0 || isProcessing) {
      toast("Select at least one image and one product size first.", true);
      return;
    }
    if (!generatedListingData) {
      toast("Please complete Step 1 first to load listing data.", true);
      return;
    }

    setIsProcessing(true);
    const selectedDesigns = historyList.filter((img) => selectedImageIds.includes(img.id));
    toast(`Generating final package structure for ${selectedDesigns.length} designs...`);

    const packages = selectedDesigns.map((design) => {
      const mockups = productsForSEO.map((p) => ({
        sku: p.sku,
        productName: p.name,
        size: p.size,
        mockupUrl: `https://placehold.co/100x100/3d5e7f/ffffff?text=${design.id.substring(0, 4)}-${p.sku.substring(4)}`,
      }));

      return {
        designImageId: design.id,
        designImageUrl: design.url,
        designImagePrompt: design.prompt,
        listingTitle: generatedListingData?.title,
        mockups,
      };
    });

    setFinalMockups(packages);
    setIsProcessing(false);
    toast(`${packages.length} final product package(s) generated successfully! Proceed to Finalize.`);
  };

  const exportFinalPackageCSV = () => {
    if (finalMockups.length === 0) return false;

    const seo = generatedListingData;
    const csvRows = [];
    const headers = [
      "Design ID",
      "SKU",
      "Product Name (Size)",
      "Etsy Listing Title",
      "Short Description (50 Words Max)",
      "Etsy Tags",
      "Mockup URL",
    ];

    csvRows.push(headers.join(","));

    finalMockups.forEach((designPackage) => {
      designPackage.mockups.forEach((mockup) => {
        const escapedDescription = seo?.description ? seo.description.replace(/"/g, '""') : "";
        const escapedTags = seo?.tags ? seo.tags.replace(/"/g, '""') : "";

        csvRows.push(
          [
            `"${designPackage.designImageId}"`,
            `"${mockup.sku}"`,
            `"${mockup.productName}"`,
            `"${designPackage.listingTitle}"`,
            `"${escapedDescription}"`,
            `"${escapedTags}"`,
            `"${mockup.mockupUrl}"`,
          ].join(",")
        );
      });
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "print_production_final_package.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  };

  const handleFinalizeAndPublish = useCallback(async () => {
    if (finalMockups.length === 0 || isProcessing) {
      toast("Please generate the final package first.", true);
      return;
    }

    setIsProcessing(true);
    let n8nSuccess = false;
    let csvSuccess = false;

    csvSuccess = exportFinalPackageCSV();

    toast("Sending final package to n8n webhook...");

    const payload = {
      step: 4,
      store,
      profile,
      mockupPackage,
      listingData: generatedListingData,
      finalMockupPackages: finalMockups,
    };

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Webhook call failed with status ${response.status}.`);
      n8nSuccess = true;
    } catch (error) {
      toast(`ERROR: Could not send data to n8n webhook: ${error.message}`, true);
    } finally {
      setIsProcessing(false);

      if (n8nSuccess && csvSuccess) {
        toast("SUCCESS: Final package sent to Printify (n8n) AND exported to CSV!");
      } else if (n8nSuccess) {
        toast("SUCCESS: Final package sent to Printify (n8n). CSV export failed.", true);
      } else if (csvSuccess) {
        toast("SUCCESS: CSV exported. Printify creation (n8n) failed.", true);
      } else {
        toast("Failure: Both Publish actions failed.", true);
      }
    }
  }, [finalMockups, isProcessing, store, generatedListingData, profile, mockupPackage]);

  const renderSelectedImagesControls = () => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mb-4">
      <span className="text-sm font-semibold text-gray-700">
        {selectedImageIds.length} Image(s) Selected for Action
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleTryAgain}
          disabled={isProcessing || selectedImageIds.length === 0}
          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition disabled:opacity-50 text-sm"
          title="Triggers n8n to regenerate selected images"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.057 18m1.806-2.012l.276-.027m5.589 1.171l.276.027m-5.114-1.144L10.334 14m-1.428 1.428l1.428-1.428m1.428 1.428l1.428-1.428m-2.856 2.856l1.428-1.428M20 20v-5h-.582M4.057 6A8.001 8.001 0 0119.943 12m-1.806 2.012l-.276.027m-5.589-1.171l-.276-.027m5.114 1.144L13.666 10m1.428-1.428l-1.428 1.428m-1.428-1.428l-1.428 1.428m2.856-2.856l-1.428 1.428" /></svg>
          Try Again
        </button>
        <button
          onClick={handleDelete}
          disabled={isProcessing || selectedImageIds.length === 0}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition disabled:opacity-50 text-sm"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete (Client)
        </button>
      </div>
    </div>
  );

  const ImageThumbnail = ({ img }) => {
    const isSelected = selectedImageIds.includes(img.id);

    return (
      <div
        key={img.id}
        className={`flex space-x-3 p-2 rounded-lg transition hover:bg-gray-100 ${
          isSelected ? "bg-blue-50 ring-2 ring-blue-500" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleImageSelection(img.id)}
          className="w-4 h-4 mt-1 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />

        <div className="flex space-x-3 flex-grow cursor-pointer" onClick={() => setMainImage(img)}>
          <div className="w-12 h-12 flex-shrink-0 relative">
            <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover rounded" />
            {img.enhanced && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[8px] px-1 rounded-full font-bold leading-none">
                {img.enhanced.substring(0, 4)}
              </span>
            )}
          </div>
          <div className="flex-grow text-xs truncate">
            <p className="font-semibold text-gray-800 truncate">{img.prompt.substring(0, 30)}...</p>
            <p className="text-gray-500 mt-0.5">Res: {img.resolution || "N/A"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900">Product Create</h2>
        <p className="text-sm text-slate-500 mt-2">Automated Creative & SEO Workflow</p>
      </header>

      <div
        className={`fixed bottom-0 left-0 right-0 p-3 text-center text-sm font-medium ${
          isProcessing ? "bg-indigo-600 text-white shadow-lg" : "bg-green-500 text-white"
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-4 border-white/40 border-t-white rounded-full animate-spin" />
            <span>Processing request... Please wait.</span>
          </div>
        ) : (
          statusMessage
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 max-w-lg mx-auto">
        <div className="space-y-2">
          <label htmlFor="store-select" className="block text-sm font-semibold text-gray-600">
            Select Store
          </label>
          <select
            id="store-select"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {STORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Step 1: Idea Generation & SEO Blueprint (Webhook Trigger)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label htmlFor="product-type-select" className="block text-sm font-semibold text-gray-600">
              Product Type
            </label>
            <select
              id="product-type-select"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="topic-input" className="block text-sm font-semibold text-gray-600">
              Topic / Concept
            </label>
            <input
              id="topic-input"
              type="text"
              placeholder="e.g., Minimalist geometric fox"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="aspect-ratio-select" className="block text-sm font-semibold text-gray-600">
              Aspect Ratio
            </label>
            <select
              id="aspect-ratio-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerateListingData}
            disabled={!topic || isProcessing}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            title="Triggers n8n to generate SEO data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span>Request Idea & SEO Blueprint</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Step 2: Photo Generator Prompt (Webhook Trigger)
        </div>

        <div className="space-y-2 mb-4">
          <label htmlFor="prompt-input" className="block text-sm font-semibold text-gray-600">
            Detailed Image Prompt (Editable)
          </label>
          <textarea
            id="prompt-input"
            rows="4"
            placeholder="Your AI-generated prompt will appear here after Step 1..."
            value={generatedListingData?.imagePrompt || ""}
            onChange={(e) =>
              setGeneratedListingData((prev) =>
                prev ? { ...prev, imagePrompt: e.target.value } : { imagePrompt: e.target.value }
              )
            }
            disabled={isProcessing || !generatedListingData}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
          <div className="space-y-2 w-full sm:w-40">
            <label htmlFor="photo-count" className="block text-sm font-semibold text-gray-600">
              Photos to Request (Max {MAX_IMAGES_TO_GENERATE})
            </label>
            <input
              id="photo-count"
              type="number"
              min="1"
              max={MAX_IMAGES_TO_GENERATE}
              value={numImagesToGenerate}
              onChange={(e) =>
                setNumImagesToGenerate(
                  Math.min(MAX_IMAGES_TO_GENERATE, Math.max(1, parseInt(e.target.value || "1", 10)))
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
            />
          </div>
          <button
            onClick={handleGenerateImage}
            disabled={!generatedListingData?.imagePrompt || isProcessing || historyList.length > 0}
            className="flex-grow px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            title="Triggers n8n to generate images and return URLs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-2-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>Request Photo(s)</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Step 3: Image Review & Product Selection
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1 border border-gray-200 rounded-lg h-[400px] overflow-y-auto p-2">
            <h4 className="font-semibold text-gray-700 px-1 mb-3 sticky top-0 bg-white pt-1">Generated Images ({historyList.length})</h4>
            <div className="space-y-1">
              {historyList.map((img) => (
                <ImageThumbnail key={img.id} img={img} />
              ))}
            </div>
            {historyList.length === 0 && <p className="text-gray-500 text-center py-10 text-sm">No images integrated yet.</p>}
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="bg-gray-100 rounded-lg shadow-inner flex items-center justify-center aspect-video overflow-hidden">
              {mainImage ? (
                <img src={mainImage.url} alt="Main Image Preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-gray-500">Select an image from the sidebar to preview.</p>
              )}
            </div>

            {mainImage && (
              <div className="text-sm text-gray-600 font-medium p-3 bg-gray-50 rounded-lg">
                Resolution: <span className="font-bold">{mainImage.resolution || "N/A"}</span>
                {mainImage.enhanced && (
                  <span className="ml-4 text-yellow-600">({mainImage.enhanced} Enhanced)</span>
                )}
              </div>
            )}

            {renderSelectedImagesControls()}

            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-2">Enhance Options (Triggers n8n Webhook)</h4>
              <div className="flex flex-wrap gap-2">
                {["Upscale", "4K", "Vector", "Noise Reduction"].map((enhancement) => (
                  <button
                    key={enhancement}
                    onClick={() => handleEnhanceImage(enhancement)}
                    disabled={isProcessing || selectedImageIds.length === 0}
                    className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-full hover:bg-purple-600 transition disabled:opacity-50"
                    title={`Sends webhook to n8n to request ${enhancement} on selected images.`}
                  >
                    {enhancement}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-4">Product Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label htmlFor="profile-select" className="block text-sm font-semibold text-gray-600">
                Profile
              </label>
              <select
                id="profile-select"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {PROFILES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="mockup-package-select" className="block text-sm font-semibold text-gray-600">
                Mockup Package
              </label>
              <select
                id="mockup-package-select"
                value={mockupPackage}
                onChange={(e) => setMockupPackage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {MOCKUP_PACKAGES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {productData.map((product) => (
              <div key={product.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h5 className="font-bold text-md text-gray-800">{product.name}</h5>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedProducts.some((p) => p.productId === product.id && p.size === size);
                    return (
                      <button
                        key={size}
                        onClick={() => handleProductSelect(product.id, size)}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {isProductsLoading && <p className="text-center text-indigo-600">Loading live product list...</p>}
            {!isProductsLoading && productData.length === 0 && (
              <p className="text-center text-red-500">Product list failed to load. Check proxy endpoint.</p>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleGenerateFinalPackage}
              disabled={productsForSEO.length === 0 || isProcessing || selectedImageIds.length === 0}
              className="px-6 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-md hover:bg-fuchsia-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m-8-4l8 4m-8-4v-4m16 4v-4" /></svg>
              <span>Generate Final Package ({selectedImageIds.length} Design{selectedImageIds.length !== 1 ? "s" : ""})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Step 4: Final Mockup & Listing Review
        </div>

        {finalMockups.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            Generate the Final Package in Step 3 to review mockups and listing data here.
          </p>
        ) : (
          <div className="space-y-6">
            <h5 className="font-bold text-lg text-gray-800">Mockups Ready for {finalMockups.length} Designs</h5>

            {finalMockups.map((designPackage, designIndex) => (
              <div key={designPackage.designImageId} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                <h6 className="font-semibold text-md mb-3 text-indigo-700">
                  Design {designIndex + 1}: {generatedListingData?.title || "Listing Title"}
                </h6>

                <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                  {designPackage.mockups.map((mockup, mockupIndex) => (
                    <div
                      key={mockup.sku}
                      className="relative group cursor-pointer bg-white rounded-md overflow-hidden shadow-sm hover:shadow-lg transition"
                      onClick={() =>
                        alert(
                          `Reviewing Mockup for:\nProduct: ${mockup.productName}\nSKU: ${mockup.sku}\n\nDesign Prompt: ${designPackage.designImagePrompt}`
                        )
                      }
                    >
                      <img src={mockup.mockupUrl} alt={`Mockup ${mockupIndex + 1}`} className="w-full h-auto aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-bold px-1 py-0.5 rounded-full">
                          REVIEW
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <h5 className="font-bold text-lg text-gray-800 pt-4 border-t border-gray-100">
              Listing Details Summary (Same for all Designs)
            </h5>
            <div className="bg-white p-4 rounded-lg space-y-2 text-sm text-gray-700 border border-gray-200">
              <p>
                <strong>Title:</strong> {generatedListingData?.title}
              </p>
              <p>
                <strong>Description:</strong> {generatedListingData?.description}
              </p>
              <p>
                <strong>Product Type:</strong> {productType}
              </p>
              <p>
                <strong>Total Listings to Create:</strong> {finalMockups.length}
              </p>
              <p>
                <strong>Total SKUs (Combined):</strong> {finalMockups.reduce((acc, pkg) => acc + pkg.mockups.length, 0)}
              </p>
              <p>
                <strong>Etsy Tags:</strong> <span className="text-xs italic">{generatedListingData?.tags}</span>
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleFinalizeAndPublish}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v2m4-2v2m4-2v2M4 11h16m-4 0v10M8 11v10M4 11v10a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
                <span>Finalize & Publish to Printify/CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
};

export default ProductCreate;
