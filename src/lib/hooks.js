import { getUserData } from '@stacks/connect-react';

import { useState, useEffect } from 'react';

export function useStxAddresses(userSession) {
  const [ownerStxAddress, setOwnerStxAddress] = useState();
  useEffect(() => {
    getUserData(userSession).then(userData => {
      setOwnerStxAddress(userData.profile.stxAddress.mainnet);
    });
  }, [userSession]);

  return { ownerStxAddress };
}
