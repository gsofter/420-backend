# 420 Backend

## Stack

- Postgres
- Prisma
- TypeScript
- Nest.js
## Setup

### Install packages

```
yarn
cp .env.example .env
```

### DB

Reset or create a DB, apply inital migrations and seed data:

```
yarn init:dev
```

To apply migrats:

```
npx prisma migrate dev
```

To get Prisma client generated:
```
npx prisma generate
```

### Run

Local development:

```
yarn dev
```

Production:

```
yarn build
yarn start:prod
```

### Secrets

When deployed with Elastic Beanstalk, secrets are read from AWS Secrets Manager.
Refer to the `.ebextensions/01secrets.config` file for more information.

## Resources

- Check out the [Prisma docs](https://www.prisma.io/docs)
- Share your feedback in the [`prisma2`](https://prisma.slack.com/messages/CKQTGR6T0/) channel on the [Prisma Slack](https://slack.prisma.io/)
- Create issues and ask questions on [GitHub](https://github.com/prisma/prisma/)
- Watch our biweekly "What's new in Prisma" livestreams on [Youtube](https://www.youtube.com/channel/UCptAHlN1gdwD89tFM3ENb6w)


## Shop Requirement Plans

- Call `balanceOfBatch` of https://etherscan.io/address/0x300b3C45f90744a219DEe4c7441Eae15cE42ef84#readContract, with 1 - 5 token ids for each address
- Call `burntAmount` of https://etherscan.io/address/0x8EAa25F71D059293a8bFF0Da7974ea29a77D4154#readProxyContract, to get the number of Gen0 buds burnt for each address
- Use `multicall` lib to run this for 100 addresses
- Combine the SQL data with the result
- Share possibility
