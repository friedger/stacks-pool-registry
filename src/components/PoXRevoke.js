import { useState } from 'react';
import { useConnect as useStacksJsConnect } from '@stacks/connect-react';
import { NETWORK } from '../lib/constants';
import { PostConditionMode } from '@stacks/transactions';


export function PoXRevoke({ userSession, setStatus, setTxId }) {
  const [loading, setLoading] = useState();
  const { doContractCall } = useStacksJsConnect();

  const revokeAction = async () => {
    setLoading(true);
    try {
      setStatus(`Sending transaction`);
      const functionArgs = [];
      await doContractCall({
        contractAddress: "SP000000000000000000002Q6VF78",
        contractName: "pox",
        functionName: 'revoke-delegate-stx',
        functionArgs,
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        userSession,
        network: NETWORK,
        onFinish: data => {
          console.log(data);
          setStatus(undefined);
          setTxId(data.txId);
          setLoading(false);
        },
      });
    } catch (e) {
      console.log(e);
      setStatus(e.toString());
      setLoading(false);
    }
  };

  return (
    <button className="btn btn-outline-secondary" type="button" onClick={revokeAction}>
      <div
        role="status"
        className={`${
          loading ? '' : 'd-none'
        } spinner-border spinner-border-sm text-info align-text-top mr-2`}
      />
      Cancel pool membership
    </button>
  );
}
