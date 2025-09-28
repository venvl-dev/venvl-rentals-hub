import React from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  MouseSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface DragDropImageListProps {
  imageUrls: string[];
  onReorder: (newUrls: string[]) => void;
  onRemove?: (index: number) => void;
  showCoverBadge?: boolean;
}

interface SortableImageProps {
  url: string;
  index: number;
  onRemove?: (index: number) => void;
  showCoverBadge?: boolean;
}

const SortableImage: React.FC<SortableImageProps> = ({
  url,
  index,
  onRemove,
  showCoverBadge = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className='relative group cursor-move'
      >
        <img
          src={url}
          alt={`Property ${index + 1}`}
          className='w-full h-48 object-cover rounded-xl border border-gray-200'
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
          }}
        />
        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-xl flex items-center justify-center'>
          {onRemove && (
            <Button
              type='button'
              variant='destructive'
              size='sm'
              onClick={(e) => {
                console.log('removing', index);
                e.preventDefault();
                e.stopPropagation();
                onRemove(index);
              }}
              onClickCapture={(e) => {
                console.log('click capte');
              }}
              className='opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-8 h-8 p-0 '
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
        {index === 0 && showCoverBadge && (
          <div className='absolute top-2 left-2'>
            <Badge className='bg-blue-600 text-white text-xs'>
              Cover Photo
            </Badge>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const DragDropImageList: React.FC<DragDropImageListProps> = ({
  imageUrls,
  onReorder,
  onRemove,
  showCoverBadge = true,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = imageUrls.indexOf(active.id as string);
      const newIndex = imageUrls.indexOf(over?.id as string);
      const newUrls = arrayMove(imageUrls, oldIndex, newIndex);
      onReorder(newUrls);
    }
  };

  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={imageUrls} strategy={verticalListSortingStrategy}>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {imageUrls.map((url, index) => (
            <SortableImage
              key={url}
              url={url}
              index={index}
              onRemove={onRemove}
              showCoverBadge={showCoverBadge}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
