import { supabase } from '@/utils/supabase';
import { Metadata } from 'next';

interface Props {
  params: { id: string };
}

// 1. This function builds the specific preview data card that WhatsApp reads!
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.product_name} - ₦${product.price.toLocaleString()}`,
    description: product.description || `Buy from ${product.business_name} on our WhatsApp Catalog.`,
    openGraph: {
      title: `${product.product_name} | ${product.business_name}`,
      description: `Price: ₦${product.price.toLocaleString()} - Tap to view product details.`,
      images: [
        {
          url: product.image_url || '',
          width: 800,
          height: 600,
          alt: product.product_name,
        },
      ],
      type: 'website',
    },
  };
}

// 2. This is the real webpage your buyers land on when clicking the WhatsApp link card!
export default async function ProductShowcase({ params }: Props) {
  const resolvedParams = await params;
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border max-w-sm">
          <h1 className="text-xl font-bold text-red-500 mb-2">Item Not Found</h1>
          <p className="text-slate-500 text-sm">This item may have been deleted or moved by the vendor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
        <div className="h-72 bg-slate-100 relative">
          <img 
            src={product.image_url || ''} 
            alt={product.product_name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full">
            🏢 {product.business_name}
          </div>
        </div>
        
        <div className="p-6">
          <h1 className="text-2xl font-black text-slate-900 mb-1">{product.product_name}</h1>
          <p className="text-3xl font-extrabold text-emerald-600 mb-4">₦{product.price.toLocaleString()}</p>
          
          {product.description && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Item Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          <a 
            href={`https://wa.me/${product.whatsapp_number}?text=${encodeURIComponent(`Hello! I want to confirm my order for "${product.product_name}" (₦${product.price.toLocaleString()}).`)}`}
            className="block text-center w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition shadow-xs"
          >
            💬 Message Vendor to Secure Order
          </a>
        </div>
      </div>
    </div>
  );
}
