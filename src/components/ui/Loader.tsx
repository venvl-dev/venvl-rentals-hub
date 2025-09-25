import React from 'react';

export default function Loader() {
  return (
    <div className='relative inset-0 flex flex-col items-center justify-center w-full h-full '>
      <div className='p-8 flex flex-col items-center justify-center space-y-4'>
        {/* <img
          className='w-32 h-32  absolute top-[25%] animate-pulse'
          src={'/lovable-uploads/6b90bd6a-9b4a-4cfe-89f0-5a06cd21ab9a.png'}
          alt='Loading icon'
        /> */}
        {/* TODO: use logo instead of text */}
        <p className=' text-2xl font-bold text-white animate-pulse'>
          loading...
        </p>
      </div>
    </div>
  );
}
