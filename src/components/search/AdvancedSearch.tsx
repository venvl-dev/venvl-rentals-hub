import React from 'react';
import { Search, Mic, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  recentSearches?: string[];
  popularSearches?: string[];
  isActive?: boolean;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  recentSearches = [],
  popularSearches = ['Downtown NYC', 'Beach House', 'Mountain Cabin', 'City Apartment'],
  isActive = false
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    onSearch();
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`
          relative overflow-hidden transition-all duration-300 
          ${isFocused ? 'ring-2 ring-primary shadow-elegant' : 'shadow-soft'}
          ${isActive ? 'bg-gradient-primary text-primary-foreground' : ''}
        `}>
          <div className="flex items-center p-4">
            <Search className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            <Input
              type="text"
              placeholder="Search destinations, property types, or experiences..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className={`
                flex-1 border-0 bg-transparent focus:ring-0 text-lg
                ${isActive ? 'text-primary-foreground placeholder:text-primary-foreground/70' : ''}
              `}
            />
            <div className="flex items-center space-x-2 ml-3">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${isActive ? 'text-primary-foreground hover:bg-white/20' : ''}`}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${isActive ? 'text-primary-foreground hover:bg-white/20' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <Button
                onClick={onSearch}
                className={`
                  ${isActive 
                    ? 'bg-white text-primary hover:bg-white/90' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  } transition-colors
                `}
              >
                Search
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && (searchQuery.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="p-4 bg-white/95 backdrop-blur-sm border shadow-elegant">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Popular Searches</h4>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};