import type { AppConfig } from './types';

function config(): AppConfig {
  const env = process.env.NODE_ENV || 'development';
  const network = process.env.NETWORK || 'rinkeby';

  // According to GG: "@Wukong for the breeding timer per level - I think we should shorten it to 1 day (originally was 2 by green paper)"
  const BREED_TIME = 1 * 60 * 60 * 24; // 1 day
  // const BREED_TIME = 10 * 60; // 10 min

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
      baseSuccessRate: 10,
      indoorSlotBonusRate: 5,
      breedingPointPerLevel: 15,
      breedingPointToOpenSlot: 42,
      breedingPointToCovertIndoor: 69,
      burnSuccessRate: 60,
      targetLevel: 5, // +1 for the finalize,
    },
    land: {
      price: 140 // breeding points
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
