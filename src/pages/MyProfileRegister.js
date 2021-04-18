import React from 'react';
import { PoolRegister } from '../components/PoolRegister';
import { useStxAddresses } from '../lib/hooks';

export default function MyProfileRegister({ userSession }) {
  console.log(userSession);
  const { ownerStxAddress } = useStxAddresses(userSession);

  return (
    <main className="panel-welcome mt-5 container">
      <div className="row">
        <div className="mx-auto col-sm-10 col-md-8 px-4">
          <PoolRegister ownerStxAddress={ownerStxAddress} />
        </div>
      </div>
    </main>
  );
}
