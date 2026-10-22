export interface NetworkConfig {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorers: { name: string; url: string };
  testnet: boolean;
}
