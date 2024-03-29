import { getUserData } from '@stacks/connect-react';
import { Person } from '@stacks/profile';

import React, { useState, useEffect } from 'react';
import { getUsername } from '../lib/account';
import { useNavigate } from '@reach/router';
import { fetchPools } from '../lib/pools';
import PoolInfo from './PoolInfo';
import { PoXRevoke } from './PoXRevoke';
import { StxProfile } from './StxProfile';

export default function Profile({ stxAddresses, userSession }) {
  const [status, setStatus] = useState('');
  const [pools, setPools] = useState();
  const [nameCV, setNameCV] = useState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (stxAddresses.ownerStxAddress) {
      fetchPools({})
        .then(async pools => {
          setStatus(undefined);
          console.log(pools);
          setPools(pools);
          setNameCV(await getUsername(stxAddresses.ownerStxAddress));
          setLoading(false);
        })
        .catch(e => {
          setStatus('Failed to get pools', e);
          setLoading(false);
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
      {(username || nameCV) && (
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

      {pools && nameCV && (
        <div className="pt-4">
          {pools
            .filter(p => isPoolOwned(p, nameCV))
            .map(p => (
              <div className="pt-4">
                <PoolInfo pool={p} />
                <div className="input-group ">
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      console.log(p.data['pool-id']);
                      navigate(`/me/edit/${p.data['pool-id'].value}`, {
                        state: { pool: p },
                      });
                    }}
                  >
                    Edit Pool
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
      {loading && <>Getting your pools' data and BNS username...</>}
      <div className="input-group pt-4">
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
      <div className="pt-4">
        If you want to revoke your membership of any pool, you can do it here.
        <br />
        <PoXRevoke
          userSession={userSession}
          setStatus={setStatus}
          setTxId={txId => setStatus(`Revoking with transcation ${txId}`)}
        />
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
