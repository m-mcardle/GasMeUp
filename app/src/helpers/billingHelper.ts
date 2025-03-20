import Purchases from 'react-native-purchases';

import { Platform } from 'react-native';

import { User } from 'firebase/auth';

export const offeringNames = [
  '$rc_annual',
];

export const entitlementIdentifiers = [
  'pro',
];

export const loginBillingUser = async (firebaseUser: User) => {
  await Purchases.logIn(firebaseUser.uid);

  Purchases.setAttributes({
    $email: firebaseUser.email,
    $displayName: firebaseUser.displayName,
    firebaseUID: firebaseUser.uid,
    $device: Platform.OS,
  });
};

export const checkEntitlementStatus = async (entitlementIdentifier: string): Promise<boolean> => {
  const customerInfo = await Purchases.getCustomerInfo();

  return typeof customerInfo.entitlements.active[entitlementIdentifier] !== 'undefined';
};

export async function promptPurchase(
  offeringsName: string,
  offeringIdentifier: string,
): Promise<boolean> {
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all[offeringsName];

  if (!offering) {
    console.error('Offering not found');
    return false;
  }

  const productToBuy = offering.availablePackages.find(
    (p) => p.identifier === offeringIdentifier,
  )?.product;

  if (!productToBuy) {
    console.warn('Product not found');
    return false;
  }
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(productToBuy);
    if (
      typeof customerInfo.entitlements.active.my_entitlement_identifier
      !== 'undefined'
    ) {
      // TODO: Unlock that great "pro" content
      console.log('Pro content unlocked');
    }
  } catch (e: any) {
    if (!e?.userCancelled) {
      console.error(e);
    } else {
      console.log('User cancelled');
    }
  }

  return true;
}

export default {
  offeringNames,
  entitlementIdentifiers,
  loginBillingUser,
  checkEntitlementStatus,
  promptPurchase,
};
