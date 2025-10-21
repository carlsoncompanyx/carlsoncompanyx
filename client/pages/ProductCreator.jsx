import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, Download, Store, Search, Zap, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const STORES = [
  { id: 'ds', name: 'Dreamscape Designs' },
  { id: 'cc', name: 'Coastal Collections' },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Minimalist Floral Print', sizes: ['8x10"', '12x18"', '24x36"'] },
  { id: 2, name: 'Abstract Geometric Canvas', sizes: ['16x16"', '20x20"', '30x30"'] },
  { id: 3, name: 'Vintage Space Poster', sizes: ['A4', 'A3', 'A2'] },
  { id: 4, name: 'Coastal Sunset Watercolor', sizes: ['11x14"', '18x24"', '20x30"'] },
  { id: 5, name: 'Cyberpunk Cityscape', sizes: ['13x19"', '22x28"', '40x60"'] },
  { id: 6, name: 'Monochrome Portrait', sizes: ['5x7"', '16x20"', '24x36"'] },
];

export default function ProductCreator() {
  const queryClient = useQueryClient();

  // State
  const [selectedStore, setSelectedStore] = useState(STORES[0].id);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('https://placehold.co/400x300/e0e0e0/555?text=Image+Preview');
  const [imageResolution, setImageResolution] = useState('N/A');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState({});
  const [seoData, setSeoData] = useState([]);

  // Loading states
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);

  const [message, setMessage] = useState(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return MOCK_PRODUCTS;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return MOCK_PRODUCTS.filter(product =>
      product.name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreviewUrl(event.target.result);

      const img = new window.Image();
      img.onload = () => {
        setImageResolution(`${img.width}x${img.height} pixels (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const generateImageFromPrompt = async () => {
    if (!description.trim()) {
      setMessage({ type: "error", text: "Please enter a description first!" });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Product image for print-on-demand: ${description}. High quality, professional, suitable for wall art.`
      });

      setImagePreviewUrl(result.url);
      setImageResolution("AI Generated Image");
      setMessage({ type: "success", text: "Image generated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate image." });
    }
    setIsGeneratingImage(false);
  };

  const enhanceImage = async (enhancementType) => {
    setIsEnhancingImage(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Enhance this image to ${enhancementType} quality: ${description}. Professional, high-resolution.`
      });

      setImagePreviewUrl(result.url);
      setMessage({ type: "success", text: `Image enhanced to ${enhancementType}!` });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to enhance image." });
    }
    setIsEnhancingImage(false);
  };

  const generateDescription = async () => {
    if (!imagePreviewUrl || imagePreviewUrl.includes('placehold')) {
      setMessage({ type: "error", text: "Please upload or generate an image first!" });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this product image and generate a compelling product description for an Etsy/print-on-demand listing. 
        Include style, mood, potential use cases, and target audience. Make it engaging and SEO-friendly.
        Current description: ${description}`,
        add_context_from_internet: false,
        file_urls: [imagePreviewUrl]
      });

      setDescription(result);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate description." });
    }
    setIsGeneratingDescription(false);
  };

  const handleProductSelection = (productId, size) => {
    setSelectedProducts(prev => {
      const product = MOCK_PRODUCTS.find(p => p.id === productId);
      if (!product) return prev;

      const currentSizes = prev[productId] || [];
      let newSizes;

      if (currentSizes.includes(size)) {
        newSizes = currentSizes.filter(s => s !== size);
      } else {
        newSizes = [...currentSizes, size];
      }

      const newState = { ...prev, [productId]: newSizes.sort() };

      if (newSizes.length === 0) {
        delete newState[productId];
      }

      return newState;
    });
  };

  const generateSEO = async () => {
    if (Object.keys(selectedProducts).length === 0) {
      setMessage({ type: "error", text: "Please select at least one product!" });
      return;
    }

    setIsGeneratingSEO(true);
    const generatedData = [];

    try {
      for (const [productId, sizes] of Object.entries(selectedProducts)) {
        const product = MOCK_PRODUCTS.find(p => p.id === parseInt(productId));

        for (const size of sizes) {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate SEO-optimized Etsy listing metadata for:
            Product: ${product.name}
            Size: ${size}
            Description: ${description}
            Store: ${STORES.find(s => s.id === selectedStore)?.name}
            
            Generate: title (max 140 chars), tags (13 tags), and category suggestion.`,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                category: { type: "string" }
              }
            }
          });

          generatedData.push({
            product: product.name,
            size,
            ...result
          });
        }
      }

      setSeoData(generatedData);
      setMessage({ type: "success", text: `Generated SEO for ${generatedData.length} products!` });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate SEO data." });
    }

    setIsGeneratingSEO(false);
  };

  const downloadCSV = () => {
    if (seoData.length === 0) return;

    const headers = ['Product', 'Size', 'Title', 'Tags', 'Category'];
    const rows = seoData.map(item => [
      item.product,
      item.size,
      item.title,
      item.tags.join('; '),
      item.category
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo_export_${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          Product Creator & SEO Generator
        </h1>
        <p className="text-slate-600">Create and optimize print-on-demand products for your online stores.</p>
      </div>

      {message && (
        <Alert className={`${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Image & Description */}
        <div className="space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Product Image
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="relative aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden">
                <img src={imagePreviewUrl} alt="Product" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm text-slate-600">{imageResolution}</p>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => document.getElementById('image-upload').click()}>
                  Upload Image
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  onClick={generateImageFromPrompt}
                  disabled={isGeneratingImage}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGeneratingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Enhance Image</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => enhanceImage('4K')}
                    disabled={isEnhancingImage}
                  >
                    4K
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => enhanceImage('8K')}
                    disabled={isEnhancingImage}
                  >
                    8K
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => enhanceImage('Professional')}
                    disabled={isEnhancingImage}
                  >
                    Pro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
                rows={6}
              />
              <Button
                onClick={generateDescription}
                disabled={isGeneratingDescription}
                className="w-full"
                variant="outline"
              >
                {isGeneratingDescription ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    AI Generate Description
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Products & SEO */}
        <div className="space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store & Products
                </CardTitle>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORES.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredProducts.map(product => (
                  <div key={product.id} className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-slate-900">{product.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(size => (
                        <label
                          key={size}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedProducts[product.id]?.includes(size) || false}
                            onCheckedChange={() => handleProductSelection(product.id, size)}
                          />
                          <span className="text-sm">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={generateSEO}
                disabled={isGeneratingSEO || Object.keys(selectedProducts).length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingSEO ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating SEO...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate SEO ({Object.values(selectedProducts).flat().length} items)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {seoData.length > 0 && (
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle>SEO Results</CardTitle>
                  <Button onClick={downloadCSV} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {seoData.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.product}</Badge>
                        <Badge variant="secondary">{item.size}</Badge>
                      </div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 5).map((tag, tagIdx) => (
                          <span key={tagIdx} className="text-xs px-2 py-1 bg-slate-100 rounded">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 5 && (
                          <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                            +{item.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
