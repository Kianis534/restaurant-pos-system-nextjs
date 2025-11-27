'use client';
import { useState, useMemo } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  getItemTotalPrice: (product: Product, quantity: number) => { price: number; tax: number; total: number };
  disabled: boolean;
}

export default function ProductList({ products, onAddToCart, getItemTotalPrice, disabled }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Menu</h2>
      
      {/* Search and Filter */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredProducts.map(product => {
          const { price: basePrice, total: totalPrice } = getItemTotalPrice(product, 1);
          const isDiscounted = basePrice !== product.price;

          return (
            <Button
              key={product.id}
              onClick={() => onAddToCart(product)}
              disabled={disabled}
              variant="outline"
              className="w-full h-auto p-3 text-left transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-600">{product.category}</div>
                  {product.isDeal && (
                    <div className="text-xs text-gray-500 mt-1">
                      Includes: {product.dealItems?.map(itemId => products.find(p => p.id === itemId)?.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${totalPrice.toFixed(2)}
                  </div>
                  {isDiscounted && (
                    <div className="text-xs text-red-600 line-through">
                      ${product.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}