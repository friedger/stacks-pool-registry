import { ClarityType, cvToString } from '@stacks/transactions';
import { poxCVToBtcAddress } from '../lib/pools-utils';

export default function PoolInfo({ pool }) {
  const useExt = pool.data.contract.type === ClarityType.OptionalNone;
  const contractId = useExt
    ? cvToString(pool.data['extended-contract'].value)
    : cvToString(pool.data.contract.value);

  return (
    <>
      <h5>
        {pool.data.url.data ? (
          <a href={pool.data.url.data}>
            {pool.data.name.data.name.buffer.toString()}.
            {pool.data.name.data.namespace.buffer.toString()}
          </a>
        ) : (
          <>
            {pool.data.name.data.name.buffer.toString()}.
            {pool.data.name.data.namespace.buffer.toString()}
          </>
        )}
      </h5>
      <p>
        {pool.data['locking-period'].type === ClarityType.List
          ? `Locking for ${pool.data['locking-period'].list
              .map(lp => lp.value.toString(10))
              .join(', ')} cycles.`
          : 'Variable locking period'}
        <br />
        {pool.data['minimum-ustx'].type === ClarityType.OptionalSome
          ? `Minimum amount required to join: ${
              pool.data['minimum-ustx'].value.value.toNumber() / 1000000
            } STX`
          : 'No minimum STX required'}
        <br />
        Payout in {pool.data['payout'].data}.
        <br />
        {pool.data['date-of-payout'].data ? (
          <>When payout? {pool.data['date-of-payout'].data}.</>
        ) : (
          <>No information about payout date available.</>
        )}
        <br />
        {pool.data['fees'].data
          ? `Fees: ${pool.data['fees'].data}`
          : 'No information about fees available.'}
        <br />
        Reward addresses:
        <br />
        {pool.data['pox-address'].list.map(address => {
          return (
            <>
              {poxCVToBtcAddress(address)}
              <br />
            </>
          );
        })}
        Using contract:
        <br />
        {contractId}
        <br />
      </p>
    </>
  );
}
