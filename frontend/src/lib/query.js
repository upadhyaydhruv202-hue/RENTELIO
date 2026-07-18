import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

/** Shared query keys so admin + shop invalidate the same lifecycle data */
export const qk = {
  adminDashboard: ['admin', 'dashboard'],
  adminProducts: ['admin', 'products'],
  adminRentals: ['admin', 'rentals'],
  adminReturns: ['admin', 'returns'],
  adminDeposits: ['admin', 'deposits'],
  userDashboard: ['user', 'dashboard'],
  userProducts: (params) => ['user', 'products', params],
  userProduct: (id) => ['user', 'product', String(id)],
  userRentals: ['user', 'rentals'],
  userRental: (id) => ['user', 'rental', String(id)],
  userProfile: ['user', 'profile'],
};

/** Invalidate all rental-lifecycle queries after a booking/return/product change */
export async function invalidateLifecycle(client = queryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['admin'] }),
    client.invalidateQueries({ queryKey: ['user'] }),
  ]);
}

export const POLL_MS = 5000;

export function displayRentalStatus(status) {
  const map = {
    Requested: 'New Rental Request',
    Approved: 'Approved',
    Active: 'Active Rental',
    'Return Pending': 'Return Pending',
    Overdue: 'Return Pending',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
  };
  return map[status] || status;
}
