import { AppConfig } from '@stacks/auth';

export const appConfig = new AppConfig(['store_write']);

export const finished =
  onDidConnect =>
  ({ userSession }) => {
    onDidConnect({ userSession });
    console.log(userSession.loadUserData());
  };
