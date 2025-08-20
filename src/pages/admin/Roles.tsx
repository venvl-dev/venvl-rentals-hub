import React, { Suspense } from 'react';

const LazyRolesComponent = React.lazy(() => import('@/components/admin/Roles/RolesPage'));

const Roles = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading roles...</div>
        </div>
      </div>
    }>
      <LazyRolesComponent />
    </Suspense>
  );
};

export default Roles;