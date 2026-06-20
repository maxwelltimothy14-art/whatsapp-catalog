'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface Product {
  id: number;
  business_name: string;
  whatsapp_number: string;
  product_name: string;
  price: number;
  image_url: string | null;
  description: string | null;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !whatsappNumber || !productName || !price) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      let finalImageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';

      if (imageFile) {
        setUploading(true);
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicUrlData) {
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase.from('products').insert([
        {
          business_name: businessName,
          whatsapp_number: whatsappNumber.replace(/\s+/g, ''),
          product_name: productName,
          price: parseFloat(price),
          image_url: finalImageUrl,
          description: description,
        },
      ]);

      if (error) throw error;

      setProductName('');
      setPrice('');
      setDescription('');
      setImageFile(null);
      
      const fileInput = document.getElementById('product-image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchProducts();
      alert('Product added successfully!');
    } catch (error: any) {
      console.error(error);
      alert(`Error saving product: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // NEW: Deletion Pipeline handler
  const handleDeleteProduct = async (product: Product) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove "${product.product_name}"?`);
    if (!confirmDelete) return;

    try {
      // 1. Try extracting file path from Supabase storage image URL to remove assets
      if (product.image_url && product.image_url.includes('product-images')) {
        // Splitting string to find local filename folder paths structure
        const urlParts = product.image_url.split('/product-images/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1]; // yields 'uploads/filename.jpg'
          
          // Delete binary asset out of Storage cloud bucket
          await supabase.storage
            .from('product-images')
            .remove([storagePath]);
        }
      }

      // 2. Delete database row entity row reference match
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      alert('Item completely removed!');
      fetchProducts(); // refresh UI stream
    } catch (error: any) {
      console.error('Delete routine failed:', error);
      alert(`Failed to delete content: ${error.message}`);
    }
  };

const sendWhatsAppOrder = (product: Product) => {
    const cleanNumber = product.whatsapp_number.replace('+', '');
    const showcaseUrl = `${window.location.origin}/product/${product.id}`;
    
    // Clean string format with zero hidden spaces inside the newline tags
    const imageText = product.image_url ? `\n\nLink: ${showcaseUrl}` : '';

    const message = encodeURIComponent(
      `Hello! I am interested in buying "${product.product_name}" from your store "${product.business_name}".\n\nPrice: ₦${product.price.toLocaleString()}${imageText}\n\nIs this item still available?`
    );
    
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-emerald-600 text-white shadow-md py-6 px-4 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">WhatsApp Link-in-Bio & Catalogue Generator</h1>
            <p className="text-emerald-100 text-sm mt-1">Convert your social media traffic into instant WhatsApp orders.</p>
          </div>
          <div className="bg-emerald-700 px-4 py-2 rounded-full font-medium text-sm">📸 Production Active</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
        {/* Creation Input Form */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">Add New Catalogue Item</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Business Name *</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Divine Fashion Hub" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">WhatsApp Phone Number *</label>
              <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g., 2348031234567" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Product Name *</label>
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Luxury Ankara Gown" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Price (₦) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 25000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Product Image</label>
              <input id="product-image-upload" type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files.length > 0) setImageFile(e.target.files[0]); }} className="w-full px-2 py-1.5 border border-slate-200 border-dashed rounded-lg text-xs bg-slate-50 cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Short Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe item details..." rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <button type="submit" disabled={uploading} className={`w-full text-white font-bold py-2.5 px-4 rounded-lg text-sm ${uploading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {uploading ? 'Uploading Media Asset...' : 'Add to Live Catalogue'}
            </button>
          </form>
        </section>

        {/* Live Grid Stream Layout */}
        <section className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Your Live Micro-Store Display</h2>
            <button onClick={fetchProducts} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">🔄 Refresh Data</button>
          </div>

          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border text-slate-500">Connecting to database...</div>
          ) : products.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border text-slate-400">Catalogue is empty.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col group relative">
                  
                  {/* Absolute Positioned Trash Action Icon Trigger */}
                  <button 
                    onClick={() => handleDeleteProduct(product)}
                    className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-red-500 text-slate-600 hover:text-white p-2 rounded-full shadow-md transition duration-200 opacity-90 lg:opacity-0 group-hover:opacity-100"
                    title="Delete product item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="h-48 w-full bg-slate-100 relative">
                    <img src={product.image_url || ''} alt={product.product_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'; }} />
                    <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-xs font-bold px-2.5 py-1 rounded-full">🏢 {product.business_name}</div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{product.product_name}</h3>
                      <p className="text-2xl font-black text-emerald-600 mb-2">₦{product.price.toLocaleString()}</p>
                      {product.description && <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed">{product.description}</p>}
                    </div>

                    <button onClick={() => sendWhatsAppOrder(product)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xs mt-2">
                      Order on WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}