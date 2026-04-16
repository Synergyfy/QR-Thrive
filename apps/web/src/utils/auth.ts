/**
 * Utility to determine the correct dashboard path based on user status
 */
export const getDashboardPath = (user: any): string => {
  if (user.role === 'ADMIN') {
    return '/admin';
  }

  const isTrialValid = user.subscriptionStatus === 'trialing' && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const isSubscriber = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'non-renewing' || isTrialValid || (!!user.planId && !user.subscriptionStatus);

  if (!isSubscriber) {
    return '/dashboard?tab=pricing';
  }

  return '/dashboard';
};
