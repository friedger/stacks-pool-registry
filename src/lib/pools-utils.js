import { decodeBtcAddress, poxAddressToBtcAddress } from '@stacks/stacking';
import { AddressHashMode, bufferCV, tupleCV } from '@stacks/transactions';
import * as c32 from 'c32check';

export function addressHashModeToBtcVersion(hashMode, mainnet = true) {
  switch (hashMode) {
    case AddressHashMode.SerializeP2PKH:
      return mainnet ? 0 : 111;
    case AddressHashMode.SerializeP2SH:
      return mainnet ? 5 : 196;
    default:
      throw new Error('Invalid hash mode');
  }
}

function decodeStxAddress(stxAddress) {
  const btcAddress = c32.c32ToB58(stxAddress);
  return decodeBtcAddress(btcAddress);
}

export function poxAddrCVFromBitcoin(btcAddress) {
  const { version, data } = decodeBtcAddress(btcAddress);
  return tupleCV({
    hashbytes: bufferCV(data),
    version: bufferCV([version]),
  });
}

export function poxAddrCV(stxAddress) {
  const { version, data } = decodeStxAddress(stxAddress);
  console.log({ version, data });
  return tupleCV({
    hashbytes: bufferCV(data),
    version: bufferCV([version]),
  });
}

export function poxCVToBtcAddress(poxAddrCV) {
  return poxAddressToBtcAddress(poxAddrCV, 'mainnet');
}
