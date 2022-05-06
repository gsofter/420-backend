export type AppConfig = {
  env: {
    name: 'development' | 'production';
    network: 'rinkeby' | 'mainnet';
    isProd: boolean;
  };
  network: {
    name: 'rinkeby' | 'mainnet';
    chainId: number;
    rpc: string;
  };
  admin: {
    key: string;
  };
  db: {
    url: string;
  };
  api: {
    port: number;
  };
  jwt: {
    passPhrase: string;
  };
  bud: {
    renameAllowedTime: number;
  },
  breed: {
    timePeriod: number;
    baseSuccessRate: number;
    breedingPointPerLevel: number;
    breedingPointToOpenSlot: number;
    breedingPointToCovertIndoor: number;
    burnSuccessRate: number;
    targetLevel: number;
  };
  rpc: string;
  metadataApi: {
    key: string;
    url: string;
  }
};
