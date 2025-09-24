import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PropertyVideoPlayerProps {
  videos: string[];
  className?: string;
}

const PropertyVideoPlayer = ({
  videos,
  className = '',
}: PropertyVideoPlayerProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Debug logging
  console.log('PropertyVideoPlayer received videos:', {
    videos,
    videosType: typeof videos,
    videosLength: videos?.length,
    isArray: Array.isArray(videos),
    firstVideo: videos?.[0],
  });

  if (!videos || videos.length === 0) {
    console.log(
      'PropertyVideoPlayer: No videos or empty array, returning null',
    );
    return null;
  }

  const currentVideo = videos[currentVideoIndex];

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    setIsPlaying(false);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsPlaying(false);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={currentVideo}
        className='w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg'
        onEnded={handleVideoEnd}
        poster='' // You can add a poster image if needed
      />

      {/* Video Controls Overlay */}
      <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center'>
        {/* Play/Pause Button */}
        <Button
          variant='secondary'
          size='icon'
          className='bg-white/90 hover:bg-white text-black w-16 h-16 rounded-full'
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className='h-8 w-8' />
          ) : (
            <Play className='h-8 w-8 ml-1' />
          )}
        </Button>
      </div>

      {/* Navigation Arrows (for multiple videos) */}
      {videos.length > 1 && (
        <>
          <Button
            variant='secondary'
            size='icon'
            className='absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200'
            onClick={prevVideo}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <Button
            variant='secondary'
            size='icon'
            className='absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200'
            onClick={nextVideo}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </>
      )}

      {/* Video Counter */}
      {videos.length > 1 && (
        <div className='absolute top-4 right-4'>
          <Badge className='bg-black/60 text-white border-0 backdrop-blur-sm'>
            {currentVideoIndex + 1} / {videos.length}
          </Badge>
        </div>
      )}

      {/* Bottom Controls */}
      <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
        <div className='flex items-center gap-2'>
          <Button
            variant='secondary'
            size='icon'
            className='bg-white/80 hover:bg-white/90 backdrop-blur-sm w-8 h-8'
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className='h-4 w-4' />
            ) : (
              <Volume2 className='h-4 w-4' />
            )}
          </Button>
        </div>

        <Button
          variant='secondary'
          size='icon'
          className='bg-white/80 hover:bg-white/90 backdrop-blur-sm w-8 h-8'
          onClick={toggleFullscreen}
        >
          <Maximize className='h-4 w-4' />
        </Button>
      </div>

      {/* Video Indicators (for multiple videos) */}
      {videos.length > 1 && (
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
          {videos.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentVideoIndex
                  ? 'bg-white shadow-md'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => {
                setCurrentVideoIndex(index);
                setIsPlaying(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyVideoPlayer;
