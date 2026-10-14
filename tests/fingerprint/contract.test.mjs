import test from "node:test";
import assert from "node:assert/strict";
import ganache from "ganache";
import { createPublicClient, createWalletClient, custom, keccak256, stringToHex } from "viem";
import { compile } from "../../scripts/compile-fingerprint.mjs";
import { sampleMarket } from "../../web/fingerprint/data.js";
import { createEdition } from "../../web/fingerprint/nft.js";

test("ERC-721: deploy, full metadata mint, digest, duplicates, transfer and invalid input", async () => {
  const rpc = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 968, hardfork: "merge" },
    wallet: { totalAccounts: 2 },
    miner: { blockGasLimit: 30000000, defaultTransactionGasLimit: "estimate" },
  });
  const chain = { id: 968, name: "local EVM", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [] } } };
  const transport = custom(rpc);
  const client = createPublicClient({ chain, transport, pollingInterval: 20 });
  const wallet = createWalletClient({ chain, transport });
  try {
    assert.equal(await client.getChainId(), 968);
    const [signer, other] = await wallet.getAddresses(),
      a = compile();
    const deployed = await client.waitForTransactionReceipt({
      hash: await wallet.deployContract({ abi: a.abi, bytecode: a.bytecode, account: signer }),
    });
    const address = deployed.contractAddress;
    const read = (functionName, args = []) => client.readContract({ address, abi: a.abi, functionName, args });
    const write = async (functionName, args, account = signer) => {
      const { request } = await client.simulateContract({ address, abi: a.abi, functionName, args, account });
      return client.waitForTransactionReceipt({ hash: await wallet.writeContract(request) });
    };
    assert.equal((await client.getCode({ address })).toLowerCase(), a.deployedBytecode.toLowerCase());
    assert.equal(await read("supportsInterface", ["0x80ac58cd"]), true);
    const m = sampleMarket(),
      edition = createEdition(m.coins[0], m.sentiment);
    const receipt = await write("mint", [edition.uri]);
    assert.equal(receipt.status, "success");
    assert.equal(await read("ownerOf", [1n]), signer);
    assert.equal(await read("tokenURI", [1n]), edition.uri);
    assert.equal(await read("metadataHash", [1n]), keccak256(stringToHex(edition.uri)));
    await assert.rejects(write("mint", [edition.uri]));
    await assert.rejects(write("mint", ["https://mutable.example/metadata.json"]));
    await assert.rejects(write("mint", ["data:application/json;base64," + "a".repeat(18000)]));
    await write("transferFrom", [signer, other, 1n]);
    assert.equal(await read("ownerOf", [1n]), other);
    assert.equal(await read("tokenURI", [1n]), edition.uri);
    console.log(
      JSON.stringify({
        network: "local EVM 968, NOT public BOT",
        uriBytes: edition.uri.length,
        mintGas: receipt.gasUsed.toString(),
        tokenId: "1",
        transferred: true,
      }),
    );
  } finally {
    await rpc.disconnect();
  }
});
