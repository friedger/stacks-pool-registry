import React from 'react';
import { useStxAddresses } from '../lib/hooks';
import { PoolJoinSimple } from '../components/PoolJoinSimple';

export default function PoolDetailsSimple({ delegatee, location, userSession }) {
  const { ownerStxAddress } = useStxAddresses(userSession);

  return (
    <main className="panel-welcome mt-5 container">
      <div className="lead row mt-5">
        <div className="col-xs-10 col-md-8 mx-auto px-4">
          <h1 className="card-title">Pool</h1>
        </div>

        <div className="col-xs-10 col-md-8 mx-auto mb-4 px-4">
          <PoolJoinSimple
            delegatee={delegatee}
            ownerStxAddress={ownerStxAddress}
            userSession={userSession}
          />
        </div>

        <div className="card col-md-8 mx-auto mt-5 mb-5 text-center px-0 border-warning">
          <div className="card-header">
            <h5 className="card-title">Instructions</h5>
          </div>
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              If you have not yet locked any Stacks tokens and if you haven't joined a pool yet,
              join now.
            </li>
            <li className="list-group-item">
              Enter the amount, duration, and reward address to define how you would like to stack
              and click delegate.
            </li>
            <li className="list-group-item">
              Wait for the pool admin to do the necessary and collect your rewards.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
