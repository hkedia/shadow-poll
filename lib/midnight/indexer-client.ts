/**
 * Midnight Indexer GraphQL Client — Shadow Poll
 *
 * A lightweight, server-side GraphQL client for querying the Midnight Preview
 * indexer directly. This is an **additional** data access path alongside the
 * SDK's `IndexerPublicDataProvider` — it does not replace it.
 *
 * Architecture note:
 *   - The SDK provider (lib/midnight/indexer.ts) is used for wallet-gated,
 *     client-side operations (deploy, call, watch) where Apollo + WS subscriptions
 *     are required.
 *   - This module is used for server-side, read-only queries (API routes, stats,
 *     poll listings) where a plain fetch is cheaper and has no browser dependencies.
 *
 * Endpoint discovery:
 *   The Midnight Preview indexer GraphQL HTTP endpoint is:
 *     https://indexer.preview.midnight.network/api/v3/graphql
 *
 *   This URL was discovered from:
 *     1. deployment.json (recorded during contract deploy)
 *     2. SDK source (midnight-js-indexer-public-data-provider) which uses the
 *        queryURL passed by the 1am wallet's api.getConfiguration()
 *     3. Live introspection confirming { block { height hash } } works
 *
 * Usage:
 *   import { indexerQuery, fetchLatestBlock, fetchContractAction } from "@/lib/midnight/indexer-client";
 *
 *   // Generic query helper
 *   const data = await indexerQuery<{ block: BlockInfo }>(
 *     `query { block { height hash timestamp } }`
 *   );
 *
 *   // Convenience wrappers
 *   const block = await fetchLatestBlock();
 *   const action = await fetchContractAction("03207a5c...");
 *   const txInfo = await fetchContractDeployTransaction("03207a5c...");
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * The Midnight Preview indexer GraphQL HTTP endpoint.
 *
 * To override for testnet/local development, set INDEXER_URL in your environment.
 * The URL recorded in deployment.json is the canonical source during deploy time.
 */
const DEFAULT_INDEXER_URL =
  process.env.INDEXER_URL ?? "https://indexer.preview.midnight.network/api/v3/graphql";

// ---------------------------------------------------------------------------
// TypeScript response shapes
// ---------------------------------------------------------------------------

/** A Midnight block header as returned by the `block` query. */
export interface BlockInfo {
  height: number;
  hash: string;
  timestamp?: number;
  author?: string;
}

/** A token balance for an unshielded contract. */
export interface TokenBalance {
  tokenType: string;
  amount: string;
}

/** Core fields shared across all contract action variants. */
export interface ContractActionBase {
  /** Serialized contract state (hex-encoded CBOR). Null when the action is a ContractCall. */
  state?: string | null;
  /** ZSwap chain state, if requested. */
  zswapState?: string | null;
  /** Unshielded token balances held by the contract. */
  unshieldedBalances?: TokenBalance[];
}

/** A ContractDeploy action (first transaction that created the contract). */
export interface ContractDeploy extends ContractActionBase {
  __typename: "ContractDeploy";
  transaction?: TransactionInfo;
}

/** A ContractUpdate action (state-mutating call). */
export interface ContractUpdate extends ContractActionBase {
  __typename: "ContractUpdate";
  transaction?: TransactionInfo;
}

/** A ContractCall action (links back to its original deploy). */
export interface ContractCall {
  __typename: "ContractCall";
  deploy?: ContractDeploy;
}

/** Union of all contract action variants. */
export type ContractAction = ContractDeploy | ContractUpdate | ContractCall;

/** Block info embedded in transaction results. */
export interface TransactionBlock {
  height: number;
  hash: string;
  author?: string;
  timestamp?: number;
}

/** Core transaction fields. */
export interface TransactionInfo {
  id?: string;
  hash?: string;
  protocolVersion?: string;
  raw?: string;
  /** For RegularTransaction — ZK segment identifiers. */
  identifiers?: string[];
  block?: TransactionBlock;
  contractActions?: Array<{
    address: string;
    state?: string;
  }>;
  unshieldedCreatedOutputs?: UnshieldedOutput[];
  unshieldedSpentOutputs?: UnshieldedOutput[];
  fees?: {
    estimatedFees: string;
    paidFees: string;
  };
  transactionResult?: {
    status: string;
    segments: Array<{ id: string; success: boolean }>;
  };
}

/** An unshielded UTXO output in a transaction. */
export interface UnshieldedOutput {
  owner: string;
  intentHash: string;
  tokenType: string;
  value: string;
}

/** Response shape of the `block` query. */
export interface BlockQueryResponse {
  block: BlockInfo | null;
}

/** Response shape of the `contractAction` query (state only). */
export interface ContractStateQueryResponse {
  contractAction: { state: string | null } | null;
}

/** Response shape of the `contractAction` query with full deploy tx info. */
export interface ContractDeployTxQueryResponse {
  contractAction: ContractAction | null;
}

/** Response shape of the `contractAction` query for deploy block height. */
export interface ContractBlockHeightQueryResponse {
  contractAction: {
    transaction: {
      block: {
        height: number;
      };
    };
  } | null;
}

/** Error returned by the GraphQL server. */
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

/** A successful GraphQL response envelope. */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

// ---------------------------------------------------------------------------
// Core query helper
// ---------------------------------------------------------------------------

/**
 * Executes a GraphQL query against the Midnight indexer.
 *
 * @param query - A GraphQL query string (not a DocumentNode — plain string for
 *   zero-dependency server-side usage; no Apollo, no graphql-tag required).
 * @param variables - Optional query variables.
 * @param url - Override the indexer URL (defaults to Preview network endpoint).
 * @returns The `data` field of the GraphQL response.
 * @throws {@link IndexerQueryError} on network failure, HTTP error, or GraphQL errors.
 *
 * @example
 * const data = await indexerQuery<{ block: BlockInfo }>(
 *   `query { block { height hash timestamp } }`
 * );
 * console.log(data.block.height); // e.g. 214108
 */
export async function indexerQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  url: string = DEFAULT_INDEXER_URL,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (cause) {
    throw new IndexerQueryError(
      `Network error connecting to Midnight indexer at ${url}`,
      cause,
    );
  }

  if (!response.ok) {
    throw new IndexerQueryError(
      `Midnight indexer returned HTTP ${response.status} (${response.statusText}) for ${url}`,
    );
  }

  let json: GraphQLResponse<T>;
  try {
    json = (await response.json()) as GraphQLResponse<T>;
  } catch (cause) {
    throw new IndexerQueryError("Failed to parse Midnight indexer response as JSON", cause);
  }

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join("; ");
    throw new IndexerQueryError(`Midnight indexer GraphQL error(s): ${messages}`, json.errors);
  }

  if (json.data === undefined) {
    throw new IndexerQueryError("Midnight indexer returned no data and no errors");
  }

  return json.data;
}

/**
 * Error thrown by {@link indexerQuery} on any failure.
 */
export class IndexerQueryError extends Error {
  cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "IndexerQueryError";
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Convenience query wrappers
// ---------------------------------------------------------------------------

/**
 * Fetches the latest confirmed block from the Midnight indexer.
 *
 * @example
 * const block = await fetchLatestBlock();
 * console.log(`Current block: ${block.height} (${block.hash})`);
 */
export async function fetchLatestBlock(url?: string): Promise<BlockInfo> {
  const data = await indexerQuery<BlockQueryResponse>(
    `query {
      block {
        height
        hash
        timestamp
        author
      }
    }`,
    undefined,
    url,
  );

  if (!data.block) {
    throw new IndexerQueryError("Indexer returned null for block query");
  }

  return data.block;
}

/**
 * Fetches the serialized contract state for the given contract address.
 *
 * The state is returned as a hex-encoded CBOR blob. The Midnight SDK's
 * `ContractState.deserialize()` can decode it, but for most server-side uses
 * (checking existence, forwarding to client) the raw hex is sufficient.
 *
 * @param address - 64-character lowercase hex contract address.
 * @returns The hex-encoded state string, or `null` if the contract has no state.
 *
 * @example
 * const state = await fetchContractState(
 *   "03207a5c6eab8f88b18fcd4661daa6a9f66b74c553862c39f4359d831b14e73c"
 * );
 * console.log(state ? `State: ${state.slice(0, 40)}...` : "No state found");
 */
export async function fetchContractState(address: string, url?: string): Promise<string | null> {
  const data = await indexerQuery<ContractStateQueryResponse>(
    `query ContractStateQuery($address: HexEncoded!) {
      contractAction(address: $address) {
        state
      }
    }`,
    { address },
    url,
  );

  return data.contractAction?.state ?? null;
}

/**
 * Fetches the full deploy transaction info for a contract address.
 *
 * Returns the polymorphic ContractAction union — callers should discriminate
 * on `__typename` to handle ContractDeploy, ContractUpdate, and ContractCall.
 *
 * For typical Shadow Poll use (checking deploy block height, confirming the
 * contract exists) only `ContractDeploy` is relevant:
 *
 * @example
 * const action = await fetchContractAction(contractAddress);
 * if (action?.__typename === "ContractDeploy") {
 *   console.log(`Deployed at block ${action.transaction?.block?.height}`);
 * }
 */
export async function fetchContractAction(address: string, url?: string): Promise<ContractAction | null> {
  const data = await indexerQuery<ContractDeployTxQueryResponse>(
    `query ContractDeployTxQuery($address: HexEncoded!) {
      contractAction(address: $address) {
        __typename
        ... on ContractDeploy {
          state
          transaction {
            id
            hash
            block {
              height
              hash
              author
              timestamp
            }
          }
        }
        ... on ContractUpdate {
          state
          transaction {
            id
            hash
            block {
              height
              hash
              author
              timestamp
            }
          }
        }
        ... on ContractCall {
          deploy {
            transaction {
              id
              hash
              block {
                height
                hash
                author
                timestamp
              }
            }
          }
        }
      }
    }`,
    { address },
    url,
  );

  return data.contractAction ?? null;
}

/**
 * Fetches the block height at which a contract was last updated.
 *
 * Useful for checking if a contract has been updated recently without fetching
 * the full (potentially large) contract state.
 *
 * @param address - 64-character lowercase hex contract address.
 * @returns Block height, or `null` if the contract address has no recorded action.
 */
export async function fetchContractLatestBlockHeight(
  address: string,
  url?: string,
): Promise<number | null> {
  const data = await indexerQuery<ContractBlockHeightQueryResponse>(
    `query LatestContractTxBlockHeightQuery($address: HexEncoded!) {
      contractAction(address: $address) {
        transaction {
          block {
            height
          }
        }
      }
    }`,
    { address },
    url,
  );

  return data.contractAction?.transaction?.block?.height ?? null;
}

// ---------------------------------------------------------------------------
// Shadow Poll–specific convenience helpers
// ---------------------------------------------------------------------------

/**
 * Returns a summary of the deployed poll contract's on-chain status.
 *
 * Combines a block height check, contract existence check, and latest block
 * in a single response — useful for the `/api/indexer/status` health endpoint.
 *
 * @param contractAddress - The poll contract address (hex, no 0x prefix).
 */
export interface ContractStatusSummary {
  /** Current block height at query time. */
  currentBlockHeight: number;
  /** Latest block hash. */
  currentBlockHash: string;
  /** Block height when the contract was last updated. null = not found. */
  contractLastBlockHeight: number | null;
  /** Whether the contract address exists in the indexer. */
  contractExists: boolean;
  /** Raw contract state hex (first 40 chars for preview). Null if not found. */
  contractStatePreview: string | null;
}

export async function fetchPollContractStatus(
  contractAddress: string,
  url?: string,
): Promise<ContractStatusSummary> {
  const [block, contractLastBlockHeight, contractState] = await Promise.all([
    fetchLatestBlock(url),
    fetchContractLatestBlockHeight(contractAddress, url),
    fetchContractState(contractAddress, url),
  ]);

  return {
    currentBlockHeight: block.height,
    currentBlockHash: block.hash,
    contractLastBlockHeight,
    contractExists: contractState !== null,
    contractStatePreview: contractState ? contractState.slice(0, 40) : null,
  };
}
