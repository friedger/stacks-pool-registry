import React, { useRef, useState, useEffect } from 'react';

import { accountsApi, NETWORK, smartContractsApi } from '../lib/constants';
import { TxStatus } from '../lib/transactions';
import { fetchAccount } from '../lib/account';
import { useConnect as useStacksJsConnect } from '@stacks/connect-react';
import {
  bufferCV,
  ClarityType,
  contractPrincipalCV,
  cvToHex,
  cvToString,
  hexToCV,
  noneCV,
  PostConditionMode,
  someCV,
  standardPrincipalCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import * as c32 from 'c32check';
import { poxAddrCV, poxAddrCVFromBitcoin } from '../lib/pools-utils';
import { StackingClient } from '@stacks/stacking';
import { Amount } from './Amount';

function getPayoutAddress(payout, stxAddress) {
  console.log({ payout, stxAddress });
  if (!stxAddress) return undefined;
  switch (payout) {
    case 'BTC':
      return c32.c32ToB58(stxAddress);
    case 'STX':
      return stxAddress;
    default:
      return stxAddress;
  }
}

function getPayoutAddressCV(payout, address) {
  switch (payout) {
    case 'BTC':
      return poxAddrCVFromBitcoin(address);
    case 'STX':
      return poxAddrCV(address);
    default:
      return tupleCV({
        hashbytes: bufferCV(Buffer.from([0])),
        version: bufferCV(Buffer.from([0])),
      });
  }
}

export function PoolJoinSimple({ delegatee, ownerStxAddress, userSession }) {
  console.log({ ownerStxAddress, userSession });
  const { doContractCall } = useStacksJsConnect();
  const amount = useRef();
  const duration = useRef();
  const payoutAddress = useRef();
  const lockingPeriod = useRef();

  const spinner = useRef();
  const [status, setStatus] = useState();
  const [txId, setTxId] = useState();
  const [stackingStatus, setStackingStatus] = useState();
  const [delegationState, setDelegationState] = useState();
  const [suggestedAmount, setSuggestedAmount] = useState();
  const [loading, setLoading] = useState(false);

  const contractId = 'SP000000000000000000002Q6VF78.pox';

  useEffect(() => {
    if (ownerStxAddress) {
      setLoading(true);
      fetchAccount(ownerStxAddress)
        .catch(e => {
          setStatus('Failed to access your account', e);
          console.log(e);
        })
        .then(async acc => {
          setStatus(undefined);
          console.log({ acc });
        });
      accountsApi.getAccountBalance({ principal: ownerStxAddress }).then(balance => {
        console.log(balance);
        const stxBalance = (parseInt(balance.stx.balance) - parseInt(balance.stx.locked)) / 1000000;
        setSuggestedAmount(Math.min(stxBalance, 100));
      });

      const client = new StackingClient(ownerStxAddress, NETWORK);
      client.getStatus().then(s => {
        setStackingStatus(s);
        smartContractsApi
          .getContractDataMapEntry({
            contractAddress: 'SP000000000000000000002Q6VF78',
            contractName: 'pox',
            mapName: 'delegation-state',
            key: cvToHex(tupleCV({ stacker: standardPrincipalCV(ownerStxAddress) })),
            network: NETWORK,
          })
          .then(result => {
            console.log(result);
            const mapEntry = hexToCV(result.data);

            if (mapEntry.type === ClarityType.OptionalNone) {
              setDelegationState({ state: undefined });
            } else {
              setDelegationState({ state: mapEntry.value });
            }
            setLoading(false);
          });
      });
    }
  }, [ownerStxAddress, setSuggestedAmount]);

  const isSimple = true;
  const [contractAddress, contractName] = contractId.split('.');
  const parts = delegatee.split('.');
  const delegateeCV =
    parts.length < 2 ? standardPrincipalCV(parts[0]) : contractPrincipalCV(parts[0], parts[1]);
  const rewardBtcAddressCV = noneCV();
  const payout = 'STX';
  const userPayoutAddress = getPayoutAddress(payout, ownerStxAddress);

  const joinAction = async () => {
    setLoading(true);
    const amountCV = uintCV(amount.current.value.trim() * 1000000); // convert to uSTX
    const durationCV = duration.current.value.trim()
      ? someCV(uintCV(duration.current.value.trim()))
      : noneCV();
    const payoutAddressCV = getPayoutAddressCV(payout, payoutAddress.current.value.trim());
    const lockingPeriodCV = uintCV(lockingPeriod.current.value.trim);
    try {
      setStatus(`Sending transaction`);
      const functionArgs = isSimple
        ? [amountCV, delegateeCV, durationCV, rewardBtcAddressCV]
        : [amountCV, delegateeCV, durationCV, rewardBtcAddressCV, payoutAddressCV, lockingPeriodCV];
      console.log({ functionArgs });
      await doContractCall({
        contractAddress,
        contractName,
        functionName: 'delegate-stx',
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

  const revokeAction = async () => {
    setLoading(true);
    try {
      setStatus(`Sending transaction`);
      const functionArgs = [];
      console.log({ functionArgs });
      await doContractCall({
        contractAddress,
        contractName,
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
    <div>
      <section>
        {delegationState &&
          (delegationState.state ? (
            <>
              You have joined the pool {cvToString(delegationState.state.data['delegated-to'])} with{' '}
              <Amount ustx={delegationState.state.data['amount-ustx'].value} />.
              <br />
              <button className="btn btn-outline-secondary" type="button" onClick={revokeAction}>
                <div
                  role="status"
                  className={`${
                    loading ? '' : 'd-none'
                  } spinner-border spinner-border-sm text-info align-text-top mr-2`}
                />
                Cancel pool membership
              </button>
            </>
          ) : (
            <>You are not delegating to any pool.</>
          ))}
      </section>
      <section>
        {stackingStatus &&
          (stackingStatus.stacked ? (
            <>
              You stacked <Amount ustx={stackingStatus.details.amount_microstx} /> until cycle #
              {stackingStatus.details.first_reward_cycle + stackingStatus.details.lock_period}.
            </>
          ) : (
            <>Your Stacks tokens are not locked.</>
          ))}
        {!stackingStatus && loading && (
          <div
            role="status"
            className="spinner-border spinner-border-sm text-info align-text-top mr-2"
          />
        )}
      </section>
      {stackingStatus && !stackingStatus.stacked && delegationState && !delegationState.state && (
        <>
          <h5>Join the pool</h5>
          Pool address: <strong>{delegatee}</strong>
          <div className="NoteField">
            Choose an amount, how much you would like to "delegately" stack through this pool (can
            be higher than your balance to compound future rewards if stacking indefinitely).
            <input
              type="number"
              step="any"
              min="100"
              ref={amount}
              defaultValue={suggestedAmount}
              className="form-control"
              placeholder="Amount in STX"
              onKeyUp={e => {
                if (e.key === 'Enter') duration.current.focus();
              }}
              onBlur={e => {
                setStatus(undefined);
              }}
            />
            <br />
            Duration of your pool membership
            <input
              type="text"
              ref={duration}
              className="form-control"
              placeholder="Leave empty for indefinite duration"
              onKeyUp={e => {
                if (e.key === 'Enter') lockingPeriod.current.focus();
              }}
              onBlur={e => {
                setStatus(undefined);
              }}
            />
            <br />
            {delegatee === 'SPSTX06BNGJ2CP1F6WA8V49B6MYD784N6YZMK95G' && (
              <>
                Locking Period (how long do you want to swim this time?)
                <input
                  type="text"
                  ref={lockingPeriod}
                  className="form-control"
                  placeholder="Number of cycles"
                  disabled={isSimple}
                  defaultValue={2}
                  onKeyUp={e => {
                    if (e.key === 'Enter') payoutAddress.current.focus();
                  }}
                  onBlur={e => {
                    setStatus(undefined);
                  }}
                />
                <br />
                Payout address (how would you like to get your rewards)
                <input
                  type="text"
                  ref={payoutAddress}
                  className="form-control"
                  defaultValue={userPayoutAddress}
                  disabled={isSimple}
                  onKeyUp={e => {
                    if (e.key === 'Enter') joinAction();
                  }}
                  onBlur={e => {
                    setStatus(undefined);
                  }}
                />
                <br />
              </>
            )}
            <div className="input-group-append">
              <button className="btn btn-outline-secondary" type="button" onClick={joinAction}>
                <div
                  ref={spinner}
                  role="status"
                  className={`${
                    loading ? '' : 'd-none'
                  } spinner-border spinner-border-sm text-info align-text-top mr-2`}
                />
                Delegate
              </button>
            </div>
          </div>
          <div>
            <TxStatus txId={txId} resultPrefix="You joined the pool " />
          </div>
          {status && (
            <>
              <div>{status}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
