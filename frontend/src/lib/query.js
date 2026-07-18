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
  adminDashboardV2: ['admin', 'dashboard-v2'],
  adminProducts: ['admin', 'products'],
  adminRentals: ['admin', 'rentals'],
  adminReturns: ['admin', 'returns'],
  adminDeposits: ['admin', 'deposits'],
  adminReports: ['admin', 'reports'],
  adminMoney: ['admin', 'money'],
  adminPickup: (filter) => ['admin', 'pickup', filter],
  adminVendors: ['admin', 'vendors'],
  adminUsers: ['admin', 'users'],
  adminReviews: ['admin', 'reviews'],
  adminNotifications: ['admin', 'notifications'],
  adminPlatform: ['admin', 'platform'],
  adminAds: ['admin', 'ads'],
  adminFraud: ['admin', 'fraud'],
  adminFraudOverview: ['admin', 'fraud-overview'],
  adminControlCenter: ['admin', 'control-center'],
  adminSettlements: ['admin', 'settlements'],
  adminSettlementDash: ['admin', 'settlement-dash'],
  adminQuotations: ['admin', 'quotations'],
  userDashboard: ['user', 'dashboard'],
  userProducts: (params) => ['user', 'products', params],
  userProduct: (id) => ['user', 'product', String(id)],
  userRentals: ['user', 'rentals'],
  userRental: (id) => ['user', 'rental', String(id)],
  userProfile: ['user', 'profile'],
  userCart: ['user', 'cart'],
  userWishlist: ['user', 'wishlist'],
  userWallet: ['user', 'wallet'],
  userNotifications: ['user', 'notifications'],
  ads: (placement) => ['ads', placement],
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
