"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

interface WalletGateResult {
  /** Whether to show the ConnectWalletModal */
  show:         boolean;
  /** Call this instead of the transaction directly — gates on wallet connection */
  requireWallet: () => void;
  /** Props to spread onto <ConnectWalletModal> */
  modalProps: {
    onConnected: () => void;
    onDismiss:   () => void;
  };
}

/**
 * Wallet gate hook.
 *
 * Usage:
 * ```tsx
 * const gate = useWalletGate(() => handleContribute());
 *
 * <button onClick={gate.requireWallet}>Pay & Join</button>
 * {gate.show && (
 *   <ConnectWalletModal
 *     reason="Connect your wallet to contribute AVAX"
 *     {...gate.modalProps}
 *   />
 * )}
 * ```
 */
export function useWalletGate(onWalletReady: () => void): WalletGateResult {
  const { isConnected } = useAccount();
  const [show, setShow] = useState(false);

  function requireWallet() {
    if (isConnected) {
      onWalletReady();
    } else {
      setShow(true);
    }
  }

  return {
    show,
    requireWallet,
    modalProps: {
      onConnected: () => { setShow(false); onWalletReady(); },
      onDismiss:   () => setShow(false),
    },
  };
}
