import React, { useEffect } from 'react';
import Landing from './pages/Landing';
import Overview from './pages/Overview';
import { Connect } from '@stacks/connect-react';
import { Link, Router } from '@reach/router';
import { NETWORK } from './lib/constants';
import Auth from './components/Auth';
import { userDataState, userSessionState, useConnect } from './lib/auth';
import { useAtom } from 'jotai';
import PoolRegistry from './pages/PoolRegistry';
import PoolDetails from './pages/PoolDetails';
import MyProfile from './pages/MyProfile';
import MyProfileRegister from './pages/MyProfileRegister';
import MyProfileEdit from './pages/MyProfileEdit';

export default function App(props) {
  const { authOptions } = useConnect();
  const [userSession] = useAtom(userSessionState);
  const [, setUserData] = useAtom(userDataState);
  useEffect(() => {
    if (userSession?.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    } else if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn();
    }
  }, [userSession, setUserData]);

  return (
    <Connect authOptions={authOptions}>
      <nav className="navbar sticky-top navbar-dark bg-dark text-light">
        <a className="navbar-brand" href="/">
          <img src="/mainnet.png" alt="Logo" />
        </a>
        <Auth className="ml-auto" userSession={userSession} />
      </nav>

      <Content userSession={userSession} />
    </Connect>
  );
}

const NavLink = props => {
  return (
    <Link
      {...props}
      getProps={({ isCurrent }) => {
        // the object returned here is passed to the
        // anchor element's props
        if (isCurrent) {
          return {
            className: 'nav-item nav-link px-4 active',
          };
        } else {
          return { className: 'nav-item nav-link px-4' };
        }
      }}
    />
  );
};

function AppBody(props) {
  return (
    <div>
      <nav className="navbar navbar-expand-md nav-pills nav-justified mx-auto">
        <NavLink to="/">Overview</NavLink>
        <NavLink to="/pools">Pools</NavLink>
        <NavLink to="/me">Profile</NavLink>
      </nav>
      {props.children}
      <div>{NETWORK.coreApiUrl}</div>
    </div>
  );
}
function Content({ userSession }) {
  const authenticated = userSession && userSession.isUserSignedIn();
  const decentralizedID =
    userSession && userSession.isUserSignedIn() && userSession.loadUserData().decentralizedID;
  return (
    <>
      {!authenticated && <Landing />}
      {decentralizedID && (
        <>
          <Router>
            <AppBody path="/">
              <Overview path="/" decentralizedID={decentralizedID} />

              <PoolRegistry
                path="/pools"
                decentralizedID={decentralizedID}
                userSession={userSession}
              />
              <PoolDetails
                path="/pools/:poolId"
                decentralizedID={decentralizedID}
                userSession={userSession}
              />
              <MyProfile path="/me" decentralizedID={decentralizedID} userSession={userSession} />
              <MyProfileRegister
                path="/me/register"
                decentralizedID={decentralizedID}
                userSession={userSession}
              />
              <MyProfileEdit
                path="/me/edit/:poolId"
                decentralizedID={decentralizedID}
                userSession={userSession}
              />
            </AppBody>
          </Router>
        </>
      )}
    </>
  );
}
