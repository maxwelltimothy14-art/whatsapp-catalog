export const dynamic = 'force-dynamic';

import { supabase } from '@/utils/supabase';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

// 1. DYNAMIC METADATA GENERATOR FOR WHATSAPP CRAWLER BOTS
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!product || !product.image_url) {
    return { title: 'Product Showcase' };
  }

  const numericPrice = Number(product.price) || 0;

  return {
    title: `${product.product_name} - ₦${numericPrice.toLocaleString()}`,
    description: `Buy ${product.product_name} from ${product.business_name} on our WhatsApp Catalog.`,
    openGraph: {
      title: `${product.product_name} | ₦${numericPrice.toLocaleString()}`,
      description: `Vendor: ${product.business_name}. Tap to view product details and secure your order.`,
      url: `https://whatsapp-catalog-kh7azpnz-tim05.vercel.app/product/${resolvedParams.id}`,
      siteName: 'WhatsApp Catalog Generator',
      images: [
        {
          url: product.image_url,
          width: 1200,
          height: 630,
          alt: product.product_name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.product_name} | ₦${numericPrice.toLocaleString()}`,
      description: `Vendor: ${product.business_name}.`,
      images: [product.image_url],
    },
  };
}

// 2. PUBLIC BRANDED CUSTOMER DETAIL VIEW LAYOUT
export default async function ProductShowcase({ params }: Props) {
  const resolvedParams = await params;
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm mx-4">
          <h1 className="text-xl font-bold text-red-500 mb-2">Item Not Found</h1>
          <p className="text-slate-500 text-sm">This product entry may have been archived or removed by the business manager.</p>
        </div>
      </div>
    );
  }

  const numericPrice = Number(product.price) || 0;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
        
        {/* Media Block Asset Showcase Container */}
        <div className="h-80 bg-slate-100 relative">
          <img 
            src={product.image_url} 
            alt={product.product_name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs">
            🏢 {product.business_name}
          </div>
        </div>
        
        {/* Descriptive Specifications Matrix Block */}
        <div className="p-6">
          <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
            {product.product_name}
          </h1>
          <p className="text-3xl font-extrabold text-emerald-600 mb-5">
            ₦{numericPrice.toLocaleString()}
          </p>
          
          {product.description && (
            <div className="mb-6 border-t border-slate-100 pt-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Product Details
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Secure Outbound WhatsApp Communication Routing Action Button */}
          <a 
            href={`https://wa.me/${product.whatsapp_number.replace('+', '')}?text=${encodeURIComponent(
              `Hello! I am viewing your catalog online and want to confirm my order for "${product.product_name}" (₦${numericPrice.toLocaleString()}).`
            )}`}
            className="block text-center w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-xs tracking-wide"
          >
            💬 Message Vendor to Purchase
          </a>
        </div>
        
      </div>
    </div>
  );
}
