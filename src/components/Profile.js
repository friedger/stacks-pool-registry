import { getUserData } from '@stacks/connect-react';
import { Person } from '@stacks/profile';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { fetchAccount, getUsername } from '../lib/account';
import { useNavigate } from '@reach/router';
import { STACK_API_URL } from '../lib/constants';
import { fetchPools } from '../lib/pools';
import { TxStatus } from '../lib/transactions';
import PoolInfo from './PoolInfo';

// Demonstrating BlockstackContext for legacy React Class Components.

export default function Profile({ stxAddresses, userSession }) {
  const [status, setStatus] = useState('');
  const [pools, setPools] = useState();
  const [nameCV, setNameCV] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    if (stxAddresses.ownerStxAddress) {
      fetchPools()
        .then(async pools => {
          setStatus(undefined);
          console.log(pools);
          setPools(pools);
          setNameCV(await getUsername(stxAddresses.ownerStxAddress));
        })
        .catch(e => {
          setStatus('Failed to get pools', e);
          console.log(e);
        });
    }
  }, [stxAddresses.ownerStxAddress]);

  if (!userSession || !stxAddresses.ownerStxAddress) {
    return <div>Loading</div>;
  }

  const { userData } = getUserData(userSession);
  const person = userData && new Person(userData.profile);
  const username = userData && userData.username;

  const updateStatus = status => {
    setStatus(status);
    setTimeout(() => {
      setStatus(undefined);
    }, 2000);
  };

  const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';
  const proxyUrl = url => '/proxy/' + url.replace(/^https?:\/\//i, '');

  return (
    <div className="Profile">
      <div className="avatar-section text-center">
        <img
          src={proxyUrl((person && person.avatarUrl()) || avatarFallbackImage)}
          className="img-rounded avatar"
          id="avatar-image"
          alt="Avatar"
        />
      </div>
      <div className="text-center mt-2">
        Hello, <span id="heading-name">{(person && person.name()) || username || 'Stacker'}</span>!
      </div>
      {username && (
        <>
          Your Blockstack username is{' '}
          {username ||
            `${nameCV.data['name'].buffer.toString()}.${nameCV.data[
              'namespace'
            ].buffer.toString()}`}{' '}
          <br />
        </>
      )}
      <div className="pt-4">
        Your own Stacks address:
        <br />
        <StxProfile
          stxAddress={stxAddresses.ownerStxAddress}
          updateStatus={updateStatus}
          showAddress
        ></StxProfile>
      </div>
      <div className="pt-4">
        Your STX hold address for this pool app:
        <br />
        <StxProfile
          stxAddress={stxAddresses.appStxAddress}
          updateStatus={updateStatus}
          showAddress
        ></StxProfile>
      </div>

      {pools &&
        nameCV &&
        pools
          .filter(p => isPoolOwned(p, nameCV))
          .map(p => (
            <>
              <PoolInfo pool={p} />
              <div className="input-group ">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    console.log(p.data['pool-id']);
                    navigate(`/me/edit/${p.data['pool-id'].value.toNumber()}`, {
                      state: { pool: p },
                    });
                  }}
                >
                  Edit Pool
                </button>
              </div>
            </>
          ))}

      <div className="input-group ">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => {
            navigate(`/me/register`);
          }}
        >
          Register New Pool
        </button>
      </div>
      {status && (
        <>
          <br />
          <div>{status}</div>
        </>
      )}
    </div>
  );
}

function isPoolOwned(pool, nameCV) {
  console.log({ nameCV, pool });
  return (
    nameCV.data['namespace'].buffer.toString() ===
      pool.data.name.data.namespace.buffer.toString() &&
    nameCV.data['name'].buffer.toString() === pool.data.name.data.name.buffer.toString()
  );
}

function StxProfile({ stxAddress, updateStatus, showAddress }) {
  const [txId, setTxId] = useState();
  const spinner = useRef();
  const faucetSpinner = useRef();

  const [profileState, setProfileState] = useState({
    account: undefined,
  });

  const onRefreshBalance = useCallback(
    async stxAddress => {
      updateStatus(undefined);
      spinner.current.classList.remove('d-none');

      fetchAccount(stxAddress)
        .then(acc => {
          setProfileState({ account: acc });
          spinner.current.classList.add('d-none');
        })
        .catch(e => {
          updateStatus('Refresh failed');
          console.log(e);
          spinner.current.classList.add('d-none');
        });
    },
    [updateStatus]
  );

  useEffect(() => {
    fetchAccount(stxAddress).then(acc => {
      setProfileState({ account: acc });
    });
  }, [stxAddress]);

  const claimTestTokens = async stxAddr => {
    updateStatus(undefined);
    faucetSpinner.current.classList.remove('d-none');

    fetch(`${STACK_API_URL}/extended/v1/faucets/stx?address=${stxAddr}`, {
      method: 'POST',
    })
      .then(r => {
        if (r.status === 200) {
          r.json().then(faucetResponse => {
            setTxId(faucetResponse.txId.substr(2));
          });

          updateStatus('Tokens will arrive soon.');
        } else {
          updateStatus('Claiming tokens failed.');
        }
        console.log(r);
        faucetSpinner.current.classList.add('d-none');
      })
      .catch(e => {
        updateStatus('Claiming tokens failed.');
        console.log(e);
        faucetSpinner.current.classList.add('d-none');
      });
  };

  return (
    <>
      {stxAddress && showAddress && (
        <>
          {stxAddress} <br />
        </>
      )}
      {profileState.account && (
        <>
          You balance: {profileState.account.balance}uSTX.
          <br />
        </>
      )}
      <button
        className="btn btn-outline-secondary mt-1"
        onClick={e => {
          onRefreshBalance(stxAddress);
        }}
      >
        <div
          ref={spinner}
          role="status"
          className="d-none spinner-border spinner-border-sm text-info align-text-top mr-2"
        />
        Refresh balance
      </button>
      {showAddress && (
        <>
          <button
            className="btn btn-outline-secondary mt-1"
            onClick={() => {
              claimTestTokens(stxAddress);
            }}
          >
            <div
              ref={faucetSpinner}
              role="status"
              className="d-none spinner-border spinner-border-sm text-info align-text-top mr-2"
            />
            Claim test tokens from faucet
          </button>
          <br />
          <TxStatus txId={txId} resultPrefix="Tokens transferred? " />
        </>
      )}
    </>
  );
}
