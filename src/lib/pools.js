import {
  bufferCVFromString,
  callReadOnlyFunction,
  ClarityType,
  falseCV,
  listCV,
  trueCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import { CONTRACT_ADDRESS, NETWORK, POOL_REGISTRY_CONTRACT_NAME } from './constants';

const contractAddress = CONTRACT_ADDRESS;
const contractName = POOL_REGISTRY_CONTRACT_NAME;

export async function fetchPool(poolId) {
  const receipt = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-pool',
    functionArgs: [uintCV(poolId)],
    network: NETWORK,
    senderAddress: contractAddress,
  });
  console.log(receipt);
  if (receipt.type === ClarityType.OptionalNone) {
    return undefined;
  } else {
    return receipt.value;
  }
}

export async function fetchPools({ verify = false, offset = 0 }) {
  console.log({ verify, offset });
  const idsCV = [...Array(10).keys()].map(i => uintCV(i + 1 + offset));
  const receipt = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-pools',
    functionArgs: [listCV(idsCV)],
    network: NETWORK,
    senderAddress: contractAddress,
  });

  const verifiedPools = await Promise.all(
    receipt.list.map(async (cv, index) => {
      if (cv.type === ClarityType.OptionalNone) {
        return cv;
      } else {
        const poolCV = cv.value;
        poolCV.data['pool-id'] = idsCV[index];
        if (verify) {
          const verified = await verifyUrl(
            poolCV.data.url.data,
            usernameCVToName(poolCV.data.name)
          );
          poolCV.data['verified'] = verified ? trueCV() : falseCV();
          return poolCV;
        } else {
          return poolCV;
        }
      }
    })
  );

  return verifiedPools.reduce((result, cv) => {
    if (cv.type === ClarityType.OptionalNone) {
      return result;
    } else {
      result.push(cv);
      return result;
    }
  }, []);
}

export function nameToUsernameCV(fullQualifiedName) {
  const parts = fullQualifiedName.split('.');
  if ((parts.length = 2)) {
    const [name, namespace] = parts;
    console.log(parts);
    return tupleCV({ name: bufferCVFromString(name), namespace: bufferCVFromString(namespace) });
  } else {
    return undefined;
  }
}

export function usernameCVToName(usernameCV) {
  return `${usernameCV.data.name.buffer.toString()}.${usernameCV.data.namespace.buffer.toString()}`;
}

const whiteListedUrls = {
  'https://pool.friedger.de': 'friedgerpool.id',
};

export async function verifyUrl(url, username) {
  const whiteListedUsername = whiteListedUrls[url];
  if (whiteListedUsername) {
    return whiteListedUsername === username;
  } else {
    try {
      const result = await fetch(url + '/manifest.json');
      const manifest = await result.json();
      console.log({ manifest, username }, manifest.author === username);
      if (manifest.author) {
        whiteListedUrls[url] = manifest.author;
      }
      return manifest.author === username;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
