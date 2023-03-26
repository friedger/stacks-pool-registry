import React from 'react';
import { useConnect } from '../lib/auth';
import { CONTRACT_ADDRESS, POOL_REGISTRY_CONTRACT_NAME } from '../lib/constants';

// Landing page demonstrating Blockstack connect for registration

export default function Landing(props) {
  const { handleOpenAuth } = useConnect();

  return (
    <div className="Landing">
      <div className="jumbotron jumbotron-fluid pt-3 mb-0">
        <div className="container">
          <div className="panel-landing text-center mt-3">
            <h1 className="landing-heading">Pool Registry</h1>
            <p>This app only works for Stacks 2.0.</p>
            <div className="card mt-4 border-info">
              <div className="card-header">
                <h5 className="card-title">About Delegated Stacking</h5>
              </div>
              <div className="row">
                <div className="col col-md-12 p-4">
                  Delegated Stacking is a way to participate in the Proof of Transfer consensus
                  algorithm with small amounts of STX.
                </div>
              </div>
            </div>

            <div className="card mt-4 border-info">
              <div className="card-header">
                <h5 className="card-title">Pool Registry (Stacks 2.0)</h5>
              </div>
              <div className="card-body">
                <p className="card-text mb-3">
                  Pool Registry is a web interface to the pool registry smart contract{' '}
                  <a
                    href={`https://explorer.stacks.co/txid/${CONTRACT_ADDRESS}.${POOL_REGISTRY_CONTRACT_NAME}?chain=mainnet`}
                  >
                    {CONTRACT_ADDRESS}.{POOL_REGISTRY_CONTRACT_NAME}
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="card mt-4 border-info">
              <div className="card-header">
                <h5 className="card-title">New Stacking app</h5>
              </div>
              <div className="card-body">
                <p className="card-text mb-3">
                  The new stacking app is available at{' '}
                  <a href="https://github.com/hirosystems/btcweb3">
                    github.com/hirosystems/btcweb3
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
