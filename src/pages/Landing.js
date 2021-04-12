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
            <p className="lead">A simple app to join and register Stacking Pools</p>

            <p className="alert alert-info  border-info">
              Pool Registry is an{' '}
              <a
                href="https://github.com/friedger/starter-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                open source
              </a>{' '}
              web app with the purpose of{' '}
              <strong>helping everybody quickly find and join a Stacking Pool.</strong>
            </p>

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
                <h5 className="card-title">Pool Registry</h5>
              </div>
              <div className="card-body">
                <p className="card-text mb-3">
                  Pool Registry is a web interface to the pool registry smart contract{' '}
                  <a href="https://explorer.stacks.co/txid/0x89cff4241836c31c6a47bc268225b379f076a04709a27ec4665b7747d191d9c2?chain=mainnet">
                    {CONTRACT_ADDRESS}.{POOL_REGISTRY_CONTRACT_NAME}
                  </a>
                  .
                </p>
              </div>

              <p className="card-link mb-5">
                <button className="btn btn-outline-primary" type="button" onClick={handleOpenAuth}>
                  Start now
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
