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
        <a href={pool.data.url.data}>
          {pool.data.name.data.name.buffer.toString()}.
          {pool.data.name.data.namespace.buffer.toString()}
        </a>
      </h5>
      <p>
        {contractId}
        <br />
        {pool.data['locking-period'].type === ClarityType.List
          ? `Locking for ${pool.data['locking-period'].list.map(lp => lp.value.toString(10)).join(", ")} cycles.`
          : 'Variable locking period'}
        <br />
        {pool.data['minimum-ustx'].type === ClarityType.OptionalSome
          ? `${pool.data['minimum-ustx'].value.value.toNumber()} STX`
          : 'No minimum STX required'}
        <br />
        {
          pool.data['pox-address'].list.map(address => {
            return (
              <>
                {poxCVToBtcAddress(address)}
                <br />
              </>
            );
          }
        )}
      </p>
    </>
  );
}
