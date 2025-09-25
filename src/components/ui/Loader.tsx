import React from 'react';

export default function Loader() {
  return (
    <div className='relative inset-0 flex flex-col items-center justify-center w-full h-full '>
      <div className='p-8 flex flex-col  items-center justify-center space-y-4 animate-pulse'>
        <img
          className='min-h16 max-h-[50%] aspect-square '
          src={'/logo/2.svg'}
          alt='Loading icon'
        />
      </div>
    </div>
  );
}
