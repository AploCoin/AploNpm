# AploNpm Scouting Report

**Date:** 2026-05-21  
**Task:** Preflight discovery для TypeScript библиотеки AploNpm  
**Sources:** WebMiner (feat/aplo-staking-before-mining), AploNode builtin contracts

---

## 1. Текущее состояние AploNpm

### Репозиторий
- **Path:** `/home/hermes/projects/aplosdk/aplonpm`
- **Remote:** `https://github.com/AploCoin/AploNpm.git`
- **Branch:** `main` (no commits yet)
- **Status:** Пустой репозиторий, только `.git/`

### Вывод
Проект начинается с нуля. Нет package.json, tsconfig, структуры директорий.

---

## 2. API Surface — Извлечено из WebMiner и AploNode

### 2.1 RPC Endpoints (константы)

```typescript
const RPC_NODES = {
  pub1: "https://pub1.aplocoin.com",
  pub2: "https://pub2.aplocoin.com"
};
```

**Используемые RPC методы (Web3.js):**
- `eth_getBalance(address)`
- `eth_getBlockNumber()`
- `eth_getTransactionCount(address, "pending")`
- `eth_sendRawTransaction(signedTx)`
- `eth_call` (для contract view methods)
- `eth_estimateGas(txData)`
- `eth_gasPrice()`

### 2.2 Contract Addresses

```typescript
const MINING_CONTRACT = "0x0000000000000000000000000000000000001234";
const STAKING_CONTRACT = "0x0000000000000000000000000000000000001235";
```

### 2.3 Staking Contract ABI (0x...1235)

**Адрес:** `0x0000000000000000000000000000000000001235`  
**Реализация:** AploNode builtin contract (`aplonode/builtin/aplo/aplo.go`)

#### Функции:

**State-mutating:**
```solidity
function stake(uint256 amount) external
function unstake() external
function transfer(address to, uint256 value) external returns (bool)
```

**View:**
```solidity
function getStake(address account) external view returns (uint256)
function getMultiplier(address account) external view returns (uint256)
function balanceOf(address account) external view returns (uint256)
function name() external view returns (string) // "Aplo native"
function symbol() external view returns (string) // "APLO"
function decimals() external view returns (uint8) // 18
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

#### Staking механика:
- **Минимальный стейк:** 1000 APLO (1000 * 10^18 wei)
- **Tier система:**
  - < 1000 APLO → multiplier = 0 (майнинг невозможен)
  - 1000-1999 APLO → multiplier = 10 (1.0x)
  - 2000-2999 APLO → multiplier = 11 (1.1x)
  - ...
  - ≥ 8000 APLO → multiplier = 17 (1.7x, максимум)
- **Формула:** `tier = floor(stakedAmount / 1000 APLO) - 1`, max tier = 7
- **Multiplier возвращается scaled by 10:** `getMultiplier()` возвращает 0, 10, 11, ..., 17

#### События:
```solidity
event Staked(address indexed staker, uint256 amount, uint256 newTotal)
event Unstaked(address indexed staker, uint256 amount)
event Transfer(address indexed from, address indexed to, uint256 value)
```

### 2.4 Mining Contract ABI (0x...1234)

**Адрес:** `0x0000000000000000000000000000000000001234`  
**Реализация:** Builtin logic в `aplonode/core/state_transition.go` (строки 449-466)

#### Функции:

**State-mutating:**
```solidity
function mine(bytes32 nonce) external
```

**View:**
```solidity
function miner_params(address miner) external view returns (
  uint256 last_block,
  uint256 current_difficulty,
  uint256 total_mined,
  uint256 prev_hash
)
function BLOCK_REWARD() external view returns (uint256)
function DEFAULT_DIFFICULTY() external view returns (uint256)
function MINE_SELECTOR() external view returns (bytes4)
```

**ERC20-like (для GAplo токена):**
```solidity
function balanceOf(address account) external view returns (uint256)
function transfer(address to, uint256 value) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 value) external returns (bool)
function allowance(address owner, address spender) external view returns (uint256)
function increaseAllowance(address spender, uint256 addedValue) external returns (bool)
function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool)
function name() external view returns (string)
function symbol() external view returns (string)
function decimals() external view returns (uint8)
function totalSupply() external view returns (uint256)
function refund(address to, uint256 value) external returns (bool)
function takeFee(uint256 value) external returns (bool)
```

#### События:
```solidity
event Mined(address indexed miner, bytes32 nonce, uint256 prev_hash)
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)
```

#### Mining механика:

**Function selector:** `0x2fdc505e` (keccak256("mine(bytes32)")[:4])

**Proof-of-Work алгоритм (из WebMiner):**
```typescript
// 1. Получить miner_params(address)
const { currentDifficulty, prevHash, totalMined } = await contract.methods.miner_params(address).call();

// 2. Генерировать nonce и хешировать
function hashNonce(nonce: bigint, sender: string, difficulty: bigint, prevHash: bigint, totalMined: number): bigint {
  const packedData = web3.utils.encodePacked(
    { value: sender, type: "address" },
    { value: web3.utils.padLeft(web3.utils.toHex(nonce), 64), type: "bytes32" },
    { value: difficulty.toString(), type: "uint256" },
    { value: prevHash.toString(), type: "uint256" },
    { value: totalMined.toString(), type: "uint256" }
  );
  const hash = web3.utils.sha3(packedData);
  return BigInt("0x" + hash.slice(2));
}

// 3. Проверить: hashResult < currentDifficulty
if (hashResult < currentDifficulty) {
  // Найден валидный nonce, отправить транзакцию
  await contract.methods.mine(nonceHex).send({ from: address });
}
```

**Cooldown:** 20 блоков между mining attempts для одного адреса

**Reward calculation (из state_transition.go):**
```go
// Награда выдаётся только если:
// 1. Вызван mine(bytes32) на GAploContractAddress
// 2. У caller есть stake >= 1000 APLO (mult > 0)

gaploUsed := gasUsed * gasPrice
gaploReward := gaploUsed / 66  // GAploRewardCoef = 66
gaploReward = (gaploReward * mult) / 10  // Применить tier multiplier

// Если caller != coinbase:
gaploReward += gaploUsed

// Итоговая награда добавляется к remaining gas refund
```

**DEFAULT_DIFFICULTY:** `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff` (max uint256)

### 2.5 Wallet Management

**Private Key → Address:**
```typescript
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
// account.address, account.privateKey
```

**Transaction Signing:**
```typescript
const txData = {
  from: address,
  to: contractAddress,
  data: contract.methods.mine(nonce).encodeABI(),
  gas: estimatedGas + buffer,
  gasPrice: currentGasPrice,
  nonce: txNonce
};
const signedTx = await web3.eth.accounts.signTransaction(txData, privateKey);
await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
```

---

## 3. Зависимости WebMiner (референс)

**package.json:**
```json
{
  "dependencies": {
    "web3": "^4.16.0",
    "next": "15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20"
  }
}
```

**Для AploNpm нужно:**
- `web3` (или альтернатива: ethers.js, viem)
- TypeScript типы
- Возможно: `@noble/hashes` для keccak256 (если не использовать web3.utils)

---

## 4. Предлагаемая структура src/

```
aplonpm/
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── LICENSE
├── src/
│   ├── index.ts                    # Главный экспорт
│   ├── client/
│   │   ├── AploClient.ts           # Основной клиент (RPC + contracts)
│   │   └── types.ts                # Общие типы
│   ├── providers/
│   │   ├── HttpProvider.ts         # HTTP RPC provider
│   │   ├── WebSocketProvider.ts    # (опционально) WS provider
│   │   └── types.ts
│   ├── contracts/
│   │   ├── MiningContract.ts       # Обёртка для 0x...1234
│   │   ├── StakingContract.ts      # Обёртка для 0x...1235
│   │   ├── abis/
│   │   │   ├── mining.json
│   │   │   └── staking.json
│   │   └── types.ts
│   ├── wallet/
│   │   ├── Wallet.ts               # Wallet abstraction (privateKey → address, sign)
│   │   ├── Signer.ts               # Transaction signing
│   │   └── types.ts
│   ├── mining/
│   │   ├── Miner.ts                # Mining loop logic
│   │   ├── pow.ts                  # PoW hash computation
│   │   └── types.ts
│   ├── staking/
│   │   ├── StakingManager.ts       # Stake/unstake helpers
│   │   └── types.ts
│   ├── utils/
│   │   ├── encoding.ts             # ABI encoding helpers
│   │   ├── formatting.ts           # Wei/Ether conversion, display
│   │   ├── validation.ts           # Address/key validation
│   │   └── constants.ts            # Contract addresses, RPC URLs
│   └── errors/
│       └── AploError.ts            # Custom error classes
├── examples/
│   ├── basic-mining.ts
│   ├── staking.ts
│   └── wallet-management.ts
└── tests/
    ├── unit/
    │   ├── wallet.test.ts
    │   ├── pow.test.ts
    │   └── encoding.test.ts
    └── integration/
        ├── mining.test.ts
        └── staking.test.ts
```

---

## 5. Ключевые интерфейсы (draft)

### 5.1 AploClient

```typescript
interface AploClientConfig {
  rpcUrl: string;
  miningContractAddress?: string;
  stakingContractAddress?: string;
  timeout?: number;
}

class AploClient {
  constructor(config: AploClientConfig);
  
  // RPC methods
  getBalance(address: string): Promise<bigint>;
  getBlockNumber(): Promise<bigint>;
  getTransactionCount(address: string, block?: string): Promise<number>;
  sendRawTransaction(signedTx: string): Promise<TransactionReceipt>;
  estimateGas(tx: TransactionRequest): Promise<bigint>;
  getGasPrice(): Promise<bigint>;
  
  // Contract accessors
  get mining(): MiningContract;
  get staking(): StakingContract;
}
```

### 5.2 MiningContract

```typescript
class MiningContract {
  // View methods
  getMinerParams(address: string): Promise<MinerParams>;
  getBlockReward(): Promise<bigint>;
  getDefaultDifficulty(): Promise<bigint>;
  getMineSelector(): Promise<string>;
  balanceOf(address: string): Promise<bigint>;
  
  // State-mutating
  mine(nonce: string, signer: Signer): Promise<TransactionReceipt>;
  
  // Events
  onMined(callback: (event: MinedEvent) => void): void;
}

interface MinerParams {
  lastBlock: bigint;
  currentDifficulty: bigint;
  totalMined: bigint;
  prevHash: bigint;
}
```

### 5.3 StakingContract

```typescript
class StakingContract {
  // View methods
  getStake(address: string): Promise<bigint>;
  getMultiplier(address: string): Promise<number>;
  balanceOf(address: string): Promise<bigint>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  
  // State-mutating
  stake(amount: bigint, signer: Signer): Promise<TransactionReceipt>;
  unstake(signer: Signer): Promise<TransactionReceipt>;
  transfer(to: string, amount: bigint, signer: Signer): Promise<TransactionReceipt>;
  
  // Events
  onStaked(callback: (event: StakedEvent) => void): void;
  onUnstaked(callback: (event: UnstakedEvent) => void): void;
}
```

### 5.4 Wallet

```typescript
class Wallet {
  constructor(privateKey: string);
  
  get address(): string;
  get privateKey(): string;
  
  signTransaction(tx: TransactionRequest): Promise<string>;
  
  static fromPrivateKey(key: string): Wallet;
  static generate(): Wallet;
}
```

### 5.5 Miner

```typescript
interface MinerConfig {
  client: AploClient;
  wallet: Wallet;
  onBlockFound?: (nonce: string, hash: bigint) => void;
  onError?: (error: Error) => void;
}

class Miner {
  constructor(config: MinerConfig);
  
  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  get isRunning(): boolean;
  get stats(): MinerStats;
}

interface MinerStats {
  hashrate: number;
  totalAttempts: bigint;
  blocksFound: number;
  uptime: number;
}
```

### 5.6 PoW Helper

```typescript
function computeHash(
  nonce: bigint,
  sender: string,
  difficulty: bigint,
  prevHash: bigint,
  totalMined: number
): bigint;

function generateNonce(): bigint;

function isValidNonce(
  hash: bigint,
  difficulty: bigint
): boolean;
```

---

## 6. Риски и неопределённости

### 6.1 Критические риски

1. **Mining contract ABI неполный**
   - В WebMiner используется полный ERC20-like ABI для mining contract, но реализация в AploNode показывает только логику reward calculation в state_transition.go
   - **Неясно:** Где реализованы `miner_params()`, `BLOCK_REWARD()`, `DEFAULT_DIFFICULTY()`, `MINE_SELECTOR()`?
   - **Предположение:** Это тоже builtin contract (как staking), но код не найден в `aplonode/builtin/`
   - **Действие:** Нужно либо найти реализацию, либо протестировать RPC вызовы напрямую

2. **Nonce encoding**
   - WebMiner использует `web3.utils.padLeft(web3.utils.toHex(nonce), 64)` для bytes32
   - **Риск:** Неправильный padding приведёт к invalid hash
   - **Действие:** Написать unit тесты для encoding/decoding

3. **Gas estimation**
   - WebMiner добавляет buffer: `gas: estimatedGas + 1000` (для mine), `+ 10000` (для stake)
   - **Риск:** Недостаточный gas → transaction reverted
   - **Действие:** Протестировать на testnet/devnet, задокументировать рекомендуемые buffers

### 6.2 Средние риски

4. **RPC node availability**
   - pub1/pub2 могут быть недоступны или rate-limited
   - **Действие:** Реализовать retry logic, fallback между nodes, exponential backoff

5. **Private key management**
   - Библиотека будет работать с raw private keys
   - **Риск:** Утечка ключей через логи, ошибки
   - **Действие:** Никогда не логировать privateKey, использовать secure memory (если возможно в JS)

6. **BigInt compatibility**
   - Используем native BigInt (ES2020+)
   - **Риск:** Старые Node.js версии (<10.4) не поддерживают
   - **Действие:** Указать `engines: { node: ">=14" }` в package.json

### 6.3 Низкие риски

7. **TypeScript версия**
   - WebMiner использует TS 5
   - **Действие:** Использовать TS 5.x, target ES2020

8. **Web3.js vs alternatives**
   - WebMiner использует web3.js 4.16
   - **Альтернативы:** ethers.js, viem
   - **Решение:** Начать с web3.js (parity с WebMiner), позже можно добавить adapter pattern для других библиотек

---

## 7. Команды тестов (для coder cards)

### 7.1 Unit тесты

```bash
# Wallet
npm test -- wallet.test.ts

# PoW encoding
npm test -- pow.test.ts

# ABI encoding
npm test -- encoding.test.ts

# Validation
npm test -- validation.test.ts
```

### 7.2 Integration тесты (требуют RPC node)

```bash
# Mining flow
npm test -- integration/mining.test.ts

# Staking flow
npm test -- integration/staking.test.ts

# Full cycle (stake → mine → unstake)
npm test -- integration/full-cycle.test.ts
```

### 7.3 Example scripts

```bash
# Basic mining
npm run example:mining

# Staking
npm run example:staking

# Wallet management
npm run example:wallet
```

---

## 8. Рекомендации для coder cards

### Card 1: Project scaffolding
- Создать package.json (name: `@aplocoin/aplonpm`, version: `0.1.0`)
- Настроить tsconfig.json (target: ES2020, module: ESNext, strict: true)
- Добавить .gitignore (node_modules, dist, .env)
- Установить зависимости: web3, typescript, @types/node
- Настроить build script (tsc)
- Настроить test framework (vitest или jest)

### Card 2: Core types и constants
- Создать `src/utils/constants.ts` (contract addresses, RPC URLs, selectors)
- Создать `src/client/types.ts` (TransactionRequest, TransactionReceipt, etc.)
- Создать `src/contracts/types.ts` (MinerParams, StakedEvent, MinedEvent)
- Создать `src/errors/AploError.ts` (custom error hierarchy)

### Card 3: Wallet implementation
- Реализовать `src/wallet/Wallet.ts` (privateKey → address, sign)
- Реализовать `src/wallet/Signer.ts` (transaction signing)
- Написать unit тесты для wallet
- **TDD:** Тест сначала, затем реализация

### Card 4: PoW implementation
- Реализовать `src/mining/pow.ts` (computeHash, generateNonce, isValidNonce)
- Использовать web3.utils.encodePacked + sha3
- Написать unit тесты (известные nonce/hash пары из WebMiner)
- **TDD:** Тест сначала

### Card 5: Contract ABIs
- Создать `src/contracts/abis/mining.json` (полный ABI из WebMiner)
- Создать `src/contracts/abis/staking.json` (полный ABI из WebMiner)
- Сгенерировать TypeScript типы из ABI (typechain или вручную)

### Card 6: HTTP Provider
- Реализовать `src/providers/HttpProvider.ts` (fetch-based RPC calls)
- Поддержка JSON-RPC 2.0
- Retry logic, timeout handling
- Написать unit тесты (mock fetch)

### Card 7: AploClient
- Реализовать `src/client/AploClient.ts` (основной класс)
- RPC методы: getBalance, getBlockNumber, sendRawTransaction, etc.
- Contract accessors: mining, staking
- Написать integration тесты (требуют RPC node)

### Card 8: StakingContract
- Реализовать `src/contracts/StakingContract.ts`
- View methods: getStake, getMultiplier, balanceOf
- State-mutating: stake, unstake, transfer
- Event listeners (опционально)
- Написать integration тесты

### Card 9: MiningContract
- Реализовать `src/contracts/MiningContract.ts`
- View methods: getMinerParams, getBlockReward, etc.
- State-mutating: mine
- Event listeners (опционально)
- Написать integration тесты

### Card 10: Miner
- Реализовать `src/mining/Miner.ts` (mining loop)
- Start/stop, stats tracking
- Cooldown handling (20 blocks)
- Error handling, retry logic
- Написать integration тесты

### Card 11: StakingManager
- Реализовать `src/staking/StakingManager.ts` (high-level helpers)
- ensureMinimumStake() (как в WebMiner)
- getTierInfo() (stake → tier → multiplier)
- Написать unit тесты

### Card 12: Examples
- Создать `examples/basic-mining.ts`
- Создать `examples/staking.ts`
- Создать `examples/wallet-management.ts`
- Все примеры должны быть runnable

### Card 13: Documentation
- Написать README.md (installation, quick start, API reference)
- Написать API.md (полная документация всех классов/методов)
- Добавить JSDoc комментарии ко всем public API

### Card 14: CI/CD setup
- Создать .github/workflows/test.yml (run tests on push)
- Создать .github/workflows/publish.yml (publish to npm on tag)
- Настроить GitHub secrets: NPM_TOKEN

---

## 9. Недостающая информация (блокеры)

### 9.1 Mining contract implementation
**Вопрос:** Где реализованы view methods mining contract (`miner_params`, `BLOCK_REWARD`, etc.)?  
**Статус:** Не найдено в `aplonode/builtin/`, только reward logic в `state_transition.go`  
**Действие:** Либо найти код, либо протестировать RPC вызовы напрямую на pub1/pub2

### 9.2 Testnet/Devnet availability
**Вопрос:** Есть ли testnet для безопасного тестирования?  
**Статус:** Неизвестно  
**Действие:** Спросить у пользователя или использовать pub1/pub2 с минимальными суммами

### 9.3 NPM package name
**Вопрос:** Доступно ли `@aplocoin/aplonpm` на npm?  
**Статус:** Неизвестно  
**Действие:** Проверить перед публикацией, возможно использовать другое имя

---

## 10. Итоговый чеклист для начала кодинга

- [ ] Создать package.json с зависимостями (web3, typescript)
- [ ] Настроить tsconfig.json (ES2020, strict mode)
- [ ] Создать структуру директорий src/
- [ ] Скопировать ABIs из WebMiner в src/contracts/abis/
- [ ] Реализовать constants.ts (addresses, RPC URLs)
- [ ] Реализовать Wallet (TDD)
- [ ] Реализовать PoW helpers (TDD)
- [ ] Реализовать HttpProvider
- [ ] Реализовать AploClient
- [ ] Реализовать StakingContract
- [ ] Реализовать MiningContract
- [ ] Реализовать Miner
- [ ] Написать examples
- [ ] Написать README.md
- [ ] Настроить CI/CD

---

## Приложение A: Референсные файлы

### WebMiner
- `/home/hermes/projects/aplosdk/webminer/src/components/webMiner.tsx` — полная реализация mining/staking flow
- `/home/hermes/projects/aplosdk/webminer/package.json` — зависимости

### AploNode
- `/home/hermes/projects/aplosdk/aplonode/builtin/aplo/aplo.go` — staking contract implementation
- `/home/hermes/projects/aplosdk/aplonode/core/state_transition.go` (строки 449-466) — mining reward logic
- `/home/hermes/projects/aplosdk/aplonode/params/bootnodes.go` — contract addresses, selectors, constants

---

**Конец отчёта**
