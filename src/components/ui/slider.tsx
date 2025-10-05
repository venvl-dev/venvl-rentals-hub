import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const values =
    (Array.isArray(props.value) && props.value) ||
    (Array.isArray(props.defaultValue) && props.defaultValue);
  const thumbs = Array.from({ length: values ? values.length : 1 });

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full select-none items-center',
        className,
      )}
      style={{ touchAction: 'none' }}
      {...props}
    >
      <SliderPrimitive.Track className='relative h-4 w-full grow overflow-hidden rounded-full bg-secondary touch-manipulation'>
        <SliderPrimitive.Range className='absolute h-full bg-primary' />
      </SliderPrimitive.Track>
      {thumbs.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={i === 0 ? 'Minimum price' : 'Maximum price'}
          className='block h-7 w-7 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation cursor-pointer active:scale-110'
          style={{ touchAction: 'none' }}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
