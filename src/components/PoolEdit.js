import React, { useRef, useState, useEffect } from 'react';

import {
  CONTRACT_ADDRESS,
  GENESIS_CONTRACT_ADDRESS,
  NETWORK,
  POOL_REGISTRY_CONTRACT_NAME,
} from '../lib/constants';
import { TxStatus } from '../lib/transactions';
import { fetchAccount, getUsername } from '../lib/account';
import { useConnect } from '@stacks/connect-react';
import {
  ClarityType,
  contractPrincipalCV,
  cvToString,
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
import { fetchPool, nameToUsernameCV } from '../lib/pools';
import { poxAddrCVFromBitcoin, poxCVToBtcAddress } from '../lib/pools-utils';
import BN from 'bn.js';

export function PoolEdit({ ownerStxAddress, poolId }) {
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
  const poolStatus = useRef();

  const spinner = useRef();
  const [status, setStatus] = useState();
  const [txId, setTxId] = useState();
  const [username, setUsername] = useState();
  const [pool, setPool] = useState();

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

      getUsername(ownerStxAddress).then(resultCV => {
        if (resultCV) {
          setUsername(
            `${resultCV.data['name'].buffer.toString()}.${resultCV.data[
              'namespace'
            ].buffer.toString()}`
          );
        } else {
          setUsername(undefined);
        }
      });

      fetchPool(poolId).then(pool => {
        console.log({ pool });
        setPool(pool);
      });
    }
  }, [ownerStxAddress, poolId]);

  const updateAction = async () => {
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
    let minimumUstxCV;
    if (minimum.current.value) {
      minimumUstxCV = someCV(uintCV(parseFloat(minimum.current.value) * 1000000));
    } else {
      minimumUstxCV = noneCV();
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
    const statusCV = uintCV(poolStatus.current.value);
    const functionName = useExt ? 'update-ext' : 'update';
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
          minimumUstxCV,
          lockingPeriodCV,
          payoutCV,
          dateOfPayoutCV,
          feesCV,
          statusCV,
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
          makeStandardSTXPostCondition(
            ownerStxAddress,
            FungibleConditionCode.Equal,
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
      <h5>Edit Pool</h5>
      {pool && username && (
        <div className="NoteField">
          <b>Pool admin's user name</b>
          <input
            type="text"
            ref={name}
            className="form-control"
            defaultValue={username}
            placeholder="Name, e.g. alice.id"
            readOnly
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
            defaultValue={cvToString(pool.data['delegatee'])}
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
            defaultValue={pool.data['url'].data}
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
            defaultValue={pool.data['pox-address'].list.map(cv => poxCVToBtcAddress(cv)).join(',')}
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
            defaultValue={
              pool.data['contract'].type === ClarityType.OptionalSome
                ? cvToString(pool.data['contract'].value)
                : cvToString(pool.data['contract-ext'].value)
            }
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
            defaultChecked={pool.data['extended-contract'].type === ClarityType.OptionalSome}
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
          Check this box if the pool uses a pool contract with the extended trait. The extended
          trait has a `delegte-stx` function that allows users to specify the user's reward address
          and the locking period.
          <br />
          <br />
          <b>Minimum STX</b> required to join
          <input
            type="number"
            ref={minimum}
            className="form-control"
            defaultValue={
              pool.data['minimum-ustx'].type === ClarityType.OptionalSome
                ? pool.data['minimum-ustx'].value.value.toNumber() / 1000000
                : undefined
            }
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
            defaultValue={pool.data['locking-period'].list
              .map(cv => cv.value.toString(10))
              .join(',')}
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
            defaultValue={pool.data['payout'].data}
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
            defaultValue={pool.data['date-of-payout'].data}
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
            defaultValue={pool.data['fees'].data}
            placeholder="e.g. 10%, 5 STX"
            onKeyUp={e => {
              if (e.key === 'Enter') poolStatus.current.focus();
            }}
            onBlur={e => {
              setStatus(undefined);
            }}
          />
          <br />
          <b>Status</b>
          <br />
          One of "In development", "In production", "Open to join", "Closed for next cycle",
          "Retired"
          <select
            ref={poolStatus}
            className="form-control"
            defaultValue={pool.data['status'].value.toNumber()}
            onKeyUp={e => {
              if (e.key === 'Enter') updateAction();
            }}
            onBlur={e => {
              setStatus(undefined);
            }}
          >
            <option value="0">In development</option>
            <option value="1">In production</option>
            <option value="11">Open to join for next cycle</option>
            <option value="21">Closed for next cycle</option>
            <option value="99">Retired</option>
          </select>
          <br />
          <div className="input-group-append">
            <button className="btn btn-outline-secondary" type="button" onClick={updateAction}>
              <div
                ref={spinner}
                role="status"
                className="d-none spinner-border spinner-border-sm text-info align-text-top mr-2"
              />
              Update
            </button>
          </div>
        </div>
      )}
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
