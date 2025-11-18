import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: wishlist, isLoading, error } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  // Redirect to auth if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleRemove = (propertyId: string) => {
    removeFromWishlist.mutate({ propertyId });
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500 fill-current" />
                <h1 className="text-2xl font-semibold">My Wishlist</h1>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                {wishlist && wishlist.length > 0
                  ? `${wishlist.length} saved ${
                      wishlist.length === 1 ? 'property' : 'properties'
                    }`
                  : 'Save your favorite properties to view later'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Failed to load your wishlist. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlist && wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <Card
                key={item.wishlist_id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div
                  onClick={() => handlePropertyClick(item.property_id)}
                  className="relative"
                >
                  {/* Property Image */}
                  <div className="aspect-video w-full overflow-hidden bg-gray-200">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.property_id);
                    }}
                    disabled={removeFromWishlist.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <CardContent
                  className="p-4"
                  onClick={() => handlePropertyClick(item.property_id)}
                >
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {item.city} • {item.property_type}
                  </p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-bold">
                      EGP {item.price_per_night.toLocaleString()}
                    </span>
                    <span className="text-gray-600 text-sm">/ night</span>
                  </div>
                  {item.action_source && (
                    <p className="text-xs text-gray-500">
                      Added from: {item.action_source.replace('_', ' ')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start exploring properties and save your favorites to plan your
              perfect trip.
            </p>
            <Button onClick={() => navigate('/')}>
              Explore Properties
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
