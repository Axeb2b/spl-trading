-- A single BSC settlement transaction cannot complete multiple payout requests.
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawal_requests_tx_hash_unique
  ON withdrawal_requests(tx_hash)
  WHERE tx_hash IS NOT NULL;
