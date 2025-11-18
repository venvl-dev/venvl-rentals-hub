import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface WishlistButtonProps {
  propertyId: string;
  listName?: string;
  actionSource?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export const WishlistButton = ({
  propertyId,
  listName = 'default',
  actionSource,
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false,
}: WishlistButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isInWishlist, isLoading } = useIsInWishlist(
    propertyId,
    listName
  );
  const toggleWishlist = useToggleWishlist();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (!user) {
      toast.error('Please sign in to add properties to your wishlist');
      navigate('/auth');
      return;
    }

    // Toggle wishlist
    toggleWishlist.mutate({
      propertyId,
      listName,
      actionSource,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        isInWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
      onClick={handleClick}
      disabled={isLoading || toggleWishlist.isPending}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all',
          isInWishlist && 'fill-current',
          (isLoading || toggleWishlist.isPending) && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="ml-2">
          {isInWishlist ? 'Saved' : 'Save'}
        </span>
      )}
    </Button>
  );
};
