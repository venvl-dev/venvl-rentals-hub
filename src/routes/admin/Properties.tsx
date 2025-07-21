import React, { Suspense } from 'react';

const LazyPropertiesComponent = React.lazy(() => import('@/components/admin/Properties/EnhancedPropertiesPage'));

const PropertyManagement = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading properties...</div>
        </div>
      </div>
    }>
      <LazyPropertiesComponent />
    </Suspense>
  );
};

export default PropertyManagement;