import React, { useRef, useState, useEffect } from 'react';

import {
  CONTRACT_ADDRESS,
  GENESIS_CONTRACT_ADDRESS,
  NETWORK,
  POOL_REGISTRY_CONTRACT_NAME,
} from '../lib/constants';
import { TxStatus } from '../lib/transactions';
import { fetchAccount } from '../lib/account';
import { useConnect } from '@stacks/connect-react';
import {
  contractPrincipalCV,
  FungibleConditionCode,
  listCV,
  makeStandardSTXPostCondition,
  noneCV,
  PostConditionMode,
  someCV,
  standardPrincipalCV,
  stringAsciiCV,
  uintCV,
} from '@stacks/transactions';
import * as c32 from 'c32check';
import { nameToUsernameCV } from '../lib/pools';
import { poxAddrCVFromBitcoin } from '../lib/pools-utils';
import BN from 'bn.js';

export function PoolRegister({ ownerStxAddress, username }) {
  const { doContractCall } = useConnect();
  const name = useRef();
  const delegateeAddress = useRef();
  const url = useRef();
  const rewardBtcAddress = useRef();
  const contract = useRef();
  const minimum = useRef();
  const lockingPeriod = useRef();
  const payout = useRef();
  const dateOfPayout = useRef();
  const fees = useRef();
  const extendedCheckbox = useRef();

  const spinner = useRef();
  const [status, setStatus] = useState();
  const [txId, setTxId] = useState();

  const btcAddressFromOwnerStxAddress = ownerStxAddress ? c32.c32ToB58(ownerStxAddress) : '';
  useEffect(() => {
    if (ownerStxAddress) {
      fetchAccount(ownerStxAddress)
        .catch(e => {
          setStatus('Failed to access your account', e);
          console.log(e);
        })
        .then(async acc => {
          setStatus(undefined);
          console.log({ acc });
        });
    }
  }, [ownerStxAddress]);

  const registerAction = async () => {
    spinner.current.classList.remove('d-none');
    const useExt = extendedCheckbox.current.checked;
    const usernameCV = nameToUsernameCV(name.current.value.trim());
    if (!usernameCV) {
      setStatus('username must contain exactly one dot (.)');
      return;
    }
    const delegateeParts = delegateeAddress.current.value.trim().split('.');

    const delegateeCV =
      delegateeParts.length === 1
        ? standardPrincipalCV(delegateeParts[0])
        : contractPrincipalCV(delegateeParts[0], delegateeParts[1]);
    const poxAddressCV = listCV(
      rewardBtcAddress.current.value.split(',').map(addr => poxAddrCVFromBitcoin(addr.trim()))
    );
    const urlCV = stringAsciiCV(url.current.value.trim());
    let minimumCV;
    if (minimum.current.value) {
      minimumCV = someCV(uintCV(parseInt(minimum.current.value)));
    } else {
      minimumCV = noneCV();
    }

    console.log(lockingPeriod.current.value.trim());
    console.log(lockingPeriod.current.value.split(',').map(lp => uintCV(parseInt(lp.trim()))));
    const lockingPeriodCV = lockingPeriod.current.value.trim()
      ? listCV(lockingPeriod.current.value.split(',').map(lp => uintCV(parseInt(lp.trim()))))
      : listCV([]);
    const payoutCV = stringAsciiCV(payout.current.value.trim());
    const dateOfPayoutCV = stringAsciiCV(dateOfPayout.current.value.trim());
    const feesCV = stringAsciiCV(fees.current.value.trim());
    const [poolCtrAddress, poolCtrName] = contract.current.value.trim().split('.');
    const contractCV = contractPrincipalCV(poolCtrAddress, poolCtrName);
    const statusCV = uintCV(1);
    const functionName = useExt ? 'register-ext' : 'register';
    console.log({ functionName, lockingPeriodCV, poxAddressCV });
    try {
      setStatus(`Sending transaction`);

      await doContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: POOL_REGISTRY_CONTRACT_NAME,
        functionName,
        functionArgs: [
          usernameCV,
          delegateeCV,
          poxAddressCV,
          urlCV,
          contractCV,
          minimumCV,
          lockingPeriodCV,
          payoutCV,
          dateOfPayoutCV,
          feesCV,
          statusCV,
        ],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [
          makeStandardSTXPostCondition(
            ownerStxAddress,
            FungibleConditionCode.GreaterEqual,
            new BN(0)
          ),
        ],
        network: NETWORK,
        finished: data => {
          console.log(data);
          setStatus(undefined);
          setTxId(data.txId);
          spinner.current.classList.add('d-none');
        },
      });
    } catch (e) {
      console.log(e);
      setStatus(e.toString());
      spinner.current.classList.add('d-none');
    }
  };

  return (
    <div>
      <h5>Register a pool</h5>
      <div className="NoteField">
        <b>Pool admin's user name</b>
        <br />
        A BNS name that is used to protect pool's data. Only the owner of this name can update the
        data. The name must contain exactly 1 dot. e.g. alice.id. Subdomain names are not supported
        by the UI.
        <br />
        The name is registered and paid for during the `register` function call if not yet owned by
        the caller. (Costs around 0.1 STX for friedgerpool.id)
        <input
          type="text"
          ref={name}
          className="form-control"
          defaultValue={username}
          placeholder="Name, e.g. alice.id"
          onKeyUp={e => {
            if (e.key === 'Enter') delegateeAddress.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Delegatee address</b>
        <br />
        Pool's Stacks address for delegation
        <input
          type="text"
          ref={delegateeAddress}
          className="form-control"
          defaultValue={ownerStxAddress}
          placeholder="Stacks address"
          onKeyUp={e => {
            if (e.key === 'Enter') url.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Pool's Website</b>
        <input
          type="text"
          ref={url}
          className="form-control"
          defaultValue={username}
          placeholder="Url"
          onKeyUp={e => {
            if (e.key === 'Enter') rewardBtcAddress.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Reward BTC addresses</b>
        <br />
        One or more BTC addresses, comma separated list
        <input
          type="text"
          ref={rewardBtcAddress}
          className="form-control"
          defaultValue={btcAddressFromOwnerStxAddress}
          placeholder="Pool's reward BTC address"
          onKeyUp={e => {
            if (e.key === 'Enter') contract.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Contract ID</b>
        <br />
        This could be the genesis pox contract or a custom pool contract.
        <input
          type="text"
          ref={contract}
          className="form-control"
          defaultValue={`${GENESIS_CONTRACT_ADDRESS}.pox`}
          placeholder="Pool's Contract ID"
          onKeyUp={e => {
            if (e.key === 'Enter') extendedCheckbox.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <input
          name="extendedContract"
          type="checkbox"
          ref={extendedCheckbox}
          className="checkbox"
          defaultChecked={false}
          placeholder="Use extended trait"
          onKeyUp={e => {
            if (e.key === 'Enter') minimum.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <label htmlFor="extendedContract">
          <b>Extended Contract</b>
        </label>
        <br />
        Check this box if the pool uses a pool contract with the extended trait. The extended trait
        has a `delegte-stx` function that allows users to specify the user's reward address and the
        locking period.
        <br />
        <br />
        <b>Minimum STX</b> required to join
        <input
          type="number"
          ref={minimum}
          className="form-control"
          defaultValue=""
          placeholder="Minimum STX required for joining"
          onKeyUp={e => {
            if (e.key === 'Enter') lockingPeriod.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Locking period</b>
        <br />
        Number of locking cycles (comma separated list of cycles). <br />
        <del>Leave empty if variable.</del> At least one entry required due to{' '}
        <a href="https://github.com/blockstack/stacks-wallet-web/issues/1111">#1111</a>.
        <input
          type="text"
          ref={lockingPeriod}
          className="form-control"
          placeholder="Leave empty if not fixed by contract"
          onKeyUp={e => {
            if (e.key === 'Enter') payout.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Pool payouts</b> <br />
        Currency of pool payouts
        <input
          type="text"
          ref={payout}
          className="form-control"
          defaultValue="BTC"
          placeholder="e.g. BTC, STX, WMNO"
          onKeyUp={e => {
            if (e.key === 'Enter') dateOfPayout.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Date of Payout</b>
        <br />
        When the Pool payouts rewards (optional, max 80 char.)
        <input
          type="text"
          ref={dateOfPayout}
          className="form-control"
          defaultValue=""
          placeholder="e.g. end of cycle, instant"
          onKeyUp={e => {
            if (e.key === 'Enter') fees.current.focus();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <b>Fees</b>
        <br />
        What are the fees (optional, max 80 char.)
        <input
          type="text"
          ref={fees}
          className="form-control"
          defaultValue=""
          placeholder="e.g. 10%, 5 STX"
          onKeyUp={e => {
            if (e.key === 'Enter') registerAction();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <br />
        <div className="input-group-append">
          <button className="btn btn-outline-secondary" type="button" onClick={registerAction}>
            <div
              ref={spinner}
              role="status"
              className="d-none spinner-border spinner-border-sm text-info align-text-top mr-2"
            />
            Register
          </button>
        </div>
      </div>
      <div>
        <TxStatus txId={txId} resultPrefix="Order placed in block " />
      </div>
      {status && (
        <>
          <div>{status}</div>
        </>
      )}
    </div>
  );
}
