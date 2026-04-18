/**
 * Utility to determine the correct dashboard path based on user status
 */
export const getDashboardPath = (user: any, isSignup: boolean = false): string => {
  if (user.role === 'ADMIN') {
    return '/admin';
  }

  // Always take to pricing tab on first signup
  if (isSignup) {
    return '/dashboard?tab=pricing';
  }

  const isTrialValid = user.subscriptionStatus === 'trialing' && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const hasPaidPlan = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'non-renewing' || isTrialValid;
  const hasFreePlan = !!user.plan?.isFree;

  // If they have any valid plan (Paid or Free), take them to dashboard overview
  if (hasPaidPlan || hasFreePlan) {
    return '/dashboard';
  }

  // Otherwise (no plan or expired/inactive), take them to pricing
  return '/dashboard?tab=pricing';
};
