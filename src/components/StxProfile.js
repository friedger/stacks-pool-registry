import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAccount } from "../lib/account";

export function StxProfile({ stxAddress, updateStatus, showAddress }) {
  const spinner = useRef();

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

  return (
    <>
      {stxAddress && showAddress && (
        <>
          {stxAddress} <br />
        </>
      )}
      {profileState.account && (
        <>
          Your balance: {(parseInt(profileState.account.balance) / 1000000).toFixed(6)} STX.
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
    </>
  );
}
