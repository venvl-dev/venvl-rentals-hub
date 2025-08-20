import { useQueryClient } from '@tanstack/react-query';

export const useAdminQueryClient = () => {
  const queryClient = useQueryClient();

  const invalidateAdminQueries = (queryKeys?: string[][]) => {
    if (queryKeys) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    } else {
      // Invalidate all admin queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    }
  };

  return {
    queryClient,
    invalidateAdminQueries,
  };
};