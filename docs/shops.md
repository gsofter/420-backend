## Shop Requirement Plans

- Call `balanceOfBatch` of https://etherscan.io/address/0x300b3C45f90744a219DEe4c7441Eae15cE42ef84#readContract, with 1 - 5 token ids for each address
- Call `burntAmount` of https://etherscan.io/address/0x8EAa25F71D059293a8bFF0Da7974ea29a77D4154#readProxyContract, to get the number of Gen0 buds burnt for each address
- Use `multicall` lib to run this for 100 addresses
- Combine the SQL data with the result
- Share possibility
