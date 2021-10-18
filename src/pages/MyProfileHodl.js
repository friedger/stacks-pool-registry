import { StacksMainnet } from '@stacks/network';
import { broadcastTransaction, makeSTXTokenTransfer } from '@stacks/transactions';
import React, {useState} from 'react';
import Profile from '../components/Profile';
import { fetchAccount } from '../lib/account';
import { useStxAddresses } from '../lib/hooks';
import BN from "bn.js"

export default function MyProfile({ userSession }) {
  const { ownerStxAddress, appStxAddress, appPrivateKey } = useStxAddresses(userSession);
  const [status, setStatus] = useState();
  const [preview, setPreview] = useState(false);

  const transferToOwnerAddress = async () => {
    const stxBalance = await fetchAccount(appStxAddress);
    if (stxBalance.balance === 0) {
      setStatus("Amount is 0");
      return;
    }
    const network = new StacksMainnet()
   const tx = await makeSTXTokenTransfer({
     amount: new BN(stxBalance.balance),
     recipient: ownerStxAddress,
     network,
     senderKey: appPrivateKey,
   })
   if (preview) {
     setStatus(`transfer ${stxBalance.balance} from ${appStxAddress} to ${ownerStxAddress}`)
     setPreview(false);
   } else {
   const txId = await broadcastTransaction(tx, network)
   setStatus("Transfer has been submitted " + txId)
   }
  }


  return (
    <main className="panel-welcome mt-5 container">
      <div className="row">
        <div className="mx-auto col-sm-10 col-md-8 px-4">
          <Profile
            stxAddresses={{
              appStxAddress: appStxAddress,
              ownerStxAddress: ownerStxAddress,
            }}
            userSession={userSession}
          />
          <hr/>
          Transfer from Hodl account address to Stx account address
          <button className="btn btn-outline-secondary mt-1"
          onClick={transferToOwnerAddress}>{preview ? "Preview" : "Transfer"}</button>
          <div>
            {status}
          </div>
        </div>
      </div>
    </main>
  );
}
