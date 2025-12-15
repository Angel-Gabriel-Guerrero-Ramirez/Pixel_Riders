import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { AptosConfig, Network } from '@aptos-labs/ts-sdk'

const config = new AptosConfig({
  network: Network.TESTNET,
  fullnode: 'https://testnet.movementnetwork.xyz/v1',
  faucet: 'https://faucet.testnet.movementnetwork.xyz/'
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AptosWalletAdapterProvider
    autoConnect={true}
    dappConfig={config}
    optInWallets={["Nightly", "Petra", "Pontem Wallet", "Gate Wallet"]}
    onError={(error) => {console.log("error", error);}}
    >
      <App />
    </AptosWalletAdapterProvider>
    
  </StrictMode>,
)
