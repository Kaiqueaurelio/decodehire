// Mapping between Supabase plan_type and Stripe price/product IDs
export const STRIPE_PLANS = {
  starter: {
    price_id: "price_1TBZHQA7LGxvDCVtAVMd4pE8",
    product_id: "prod_U9t35K8xmNcXJF",
  },
  pro: {
    price_id: "price_1TBZHZA7LGxvDCVtkfFdCWCH",
    product_id: "prod_U9t3a8mzq6HA2y",
  },
  business: {
    price_id: "price_1TBZHeA7LGxvDCVtUlmx7XUm",
    product_id: "prod_U9t3Fv0nzKQsve",
  },
} as const;

export type StripePlanType = keyof typeof STRIPE_PLANS;

export function getPlanTypeByProductId(productId: string): StripePlanType | null {
  for (const [planType, ids] of Object.entries(STRIPE_PLANS)) {
    if (ids.product_id === productId) return planType as StripePlanType;
  }
  return null;
}

export function getPlanTypeByPriceId(priceId: string): StripePlanType | null {
  for (const [planType, ids] of Object.entries(STRIPE_PLANS)) {
    if (ids.price_id === priceId) return planType as StripePlanType;
  }
  return null;
}
