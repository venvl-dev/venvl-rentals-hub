export const getBookingTypeColor = (type: string, status: string) => {
  if (status === 'cancelled') return 'bg-gray-200 text-gray-600';
  switch (type) {
    case 'daily':
      return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
    case 'monthly':
      return 'bg-green-100 text-green-800 border-l-4 border-green-500';
    default:
      return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
