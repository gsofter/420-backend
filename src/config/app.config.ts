import type { AppConfig } from './types';

async function config(): Promise<AppConfig> {
  const env = process.env.NODE_ENV || 'development';
  const network = process.env.NETWORK || 'rinkeby';
  const BREED_TIME = 2 * 60 * 60 * 24; // 2 days

  const config = {
    env: {
      name: env,
      isProd: env === 'production',
    },
    network: {
      name: network,
      chainId: network === 'mainnet' ? 1 : 4,
      rpc: 'https://' + network + '.infura.io/v3/' + process.env.INFURA_API_KEY,
    },
    admin: {
      key: process.env.ADMIN_API_KEY,
    },
    db: {
      url: process.env.DATABASE_URL,
    },
    api: {
      port: process.env.PORT || 4000,
    },
    jwt: {
      passPhrase: process.env.JWT_PASS_PHRASE,
    },
    bud: {
      renameAllowedTime: 5 * 60 * 1000 // 5 minutes in millisceonds
    },
    breed: {
      timePeriod: network === 'mainnet' ? BREED_TIME : 10,
      baseSuccessRate: 20,
      indoorSlotBounsRate: 5,
      breedingPointPerLevel: 15,
      breedingPointToOpenSlot: 42,
      breedingPointToCovertIndoor: 69,
      burnSuccessRate: 75,
      targetLevel: 5 + 1, // +1 for the finalize,
    },
    metadataApi: {
      key: process.env.METADATA_API_KEY,
      url: network === 'rinkeby' ? "https://420-dev.looklabs.xyz" : "https://420.looklabs.xyz"
    }
  } as AppConfig;

  if (!config.jwt.passPhrase) {
    throw new Error('JWT_PASS_PHRASE is not defined');
  }

  return config;
}

export default config;
