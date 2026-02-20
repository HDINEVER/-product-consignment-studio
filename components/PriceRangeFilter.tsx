import React, { useState } from 'react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Filter } from 'lucide-react';

interface PriceRangeFilterProps {
  min?: number;
  max?: number;
  defaultMin?: number;
  defaultMax?: number;
  onApply?: (min: number, max: number) => void;
}

export default function PriceRangeFilter({ 
  min = 0, 
  max = 2000, 
  defaultMin = 200, 
  defaultMax = 800,
  onApply 
}: PriceRangeFilterProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([defaultMin, defaultMax]);
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    if (onApply) {
      onApply(priceRange[0], priceRange[1]);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setPriceRange([min, max]);
    if (onApply) {
      onApply(min, max);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative"
          title="价格筛选"
        >
          <Filter size={20} />
          {(priceRange[0] !== min || priceRange[1] !== max) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-brutal-pink rounded-full border-2 border-black" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-6">
          <div>
            <h3 className="font-black text-lg mb-2">价格范围</h3>
            <p className="text-sm text-gray-500 mb-4">
              设置您的预算范围 (¥{priceRange[0]} - ¥{priceRange[1]})
            </p>
          </div>

          <div className="space-y-4">
            <Slider
              min={min}
              max={max}
              step={10}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              className="w-full"
            />
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">最低价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold">¥</span>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = Math.min(Math.max(min, Number(e.target.value)), priceRange[1]);
                      setPriceRange([val, priceRange[1]]);
                    }}
                    aria-label="最低价格"
                    className="w-full h-10 pl-7 pr-3 border-2 border-black rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">最高价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold">¥</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = Math.max(priceRange[0], Math.min(max, Number(e.target.value)));
                      setPriceRange([priceRange[0], val]);
                    }}
                    aria-label="最高价格"
                    className="w-full h-10 pl-7 pr-3 border-2 border-black rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t-2 border-gray-100">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="flex-1"
            >
              重置
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleApply}
              className="flex-1"
            >
              应用
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
