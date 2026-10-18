-- A confirmed BSC transaction can only fund one deposit order.
-- NULL provider references remain valid for unpaid/manual-pending orders.
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_orders_provider_ref_unique
  ON deposit_orders(provider_ref)
  WHERE provider_ref IS NOT NULL;
