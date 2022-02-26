import React, { useRef } from 'react';

import { useNavigate } from '@reach/router';
import PoolInfo from './PoolInfo';

function hasJoined(pool, userInfo) {
  return pool === userInfo?.delegation?.delegatedTo;
}

function isStacking(pool, userInfo) {
  return pool === userInfo?.stacking?.poxAddr;
}

export function Pool({ pool, poolId, userInfo }) {
  const navigate = useNavigate();

  const spinner = useRef();

  return (
    <div className='card m-3 p-2'>
      {pool ? (
        <>
          <PoolInfo pool={pool} />
          {(!userInfo || userInfo.canJoin) && (
            <div className="input-group ">
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  navigate(`/pools/${poolId}`, { state: { pool } });
                }}
              >
                <div
                  ref={spinner}
                  role="status"
                  className="d-none spinner-border spinner-border-sm text-info align-text-top mr-2"
                />
                Join Pool
              </button>
            </div>
          )}
          {userInfo && hasJoined(pool, userInfo) && <>You joined this pool.</>}
          {userInfo && isStacking(pool, userInfo) && <>You are stacking with this pool.</>}
        </>
      ) : (
        <>
          <br />
          Pool does not exist.
          <br />
          <br />
        </>
      )}
    </div>
  );
}
