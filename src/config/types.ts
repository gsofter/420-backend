export type AppConfig = {
  env: {
    name: 'development' | 'production';
    network: 'goerli' | 'mainnet';
    isProd: boolean;
  };
  network: {
    name: 'goerli' | 'mainnet';
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
    indoorSlotBonusRate: number;
    breedingPointPerLevel: number;
    breedingPointToOpenSlot: number;
    breedingPointToCovertIndoor: number;
    burnSuccessRate: number;
    targetLevel: number;
  };
  land: {
    price: number
  },
  rpc: string;
  metadataApi: {
    key: string;
    url: string;
  }
};
