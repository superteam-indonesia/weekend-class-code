import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("escrow", () => {
  // Configure the provider from environment (uses localnet by default).
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program<Escrow>;
  const connection = provider.connection;

  // Test wallets — separate keypairs so tests are isolated from the payer wallet.
  const maker = Keypair.generate();
  const taker = Keypair.generate();

  // Token mints created in `before()`.
  let mintA: PublicKey;
  let mintB: PublicKey;

  // Mint authority — a throwaway keypair just for tests.
  const mintAuthority = Keypair.generate();

  // Initial token amounts for test setup.
  const MAKER_MINT_A_AMOUNT = 1_000_000; // maker holds 1,000,000 token_a
  const TAKER_MINT_B_AMOUNT = 1_000_000; // taker holds 1,000,000 token_b

  // Escrow parameters used in the main make/take test pair.
  const ESCROW_SEED = new BN(42);
  const DEPOSIT_AMOUNT = new BN(500_000); // maker deposits 500,000 token_a
  const RECEIVE_AMOUNT = new BN(250_000); // maker wants 250,000 token_b in return

  // ---------------------------------------------------------------------------
  // Setup: fund wallets, create mints, create ATAs, mint initial balances
  // ---------------------------------------------------------------------------

  before(async () => {
    // Airdrop SOL to maker and taker so they can pay for transactions and rent.
    const airdropMaker = await connection.requestAirdrop(
      maker.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropMaker, "confirmed");

    const airdropTaker = await connection.requestAirdrop(
      taker.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropTaker, "confirmed");

    const airdropMintAuth = await connection.requestAirdrop(
      mintAuthority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropMintAuth, "confirmed");

    // Create mint_a (6 decimals) — the token the maker will offer.
    mintA = await createMint(
      connection,
      mintAuthority,     // payer for the transaction
      mintAuthority.publicKey, // mint authority
      null,              // freeze authority (none)
      6                  // decimals
    );

    // Create mint_b (6 decimals) — the token the maker wants in return.
    mintB = await createMint(
      connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6
    );

    // Create ATAs for maker (token_a) and taker (token_b).
    await createAssociatedTokenAccount(connection, maker, mintA, maker.publicKey);
    await createAssociatedTokenAccount(connection, taker, mintB, taker.publicKey);

    // Fund maker's token_a ATA.
    const makerAtaA = getAssociatedTokenAddressSync(mintA, maker.publicKey);
    await mintTo(
      connection,
      mintAuthority,
      mintA,
      makerAtaA,
      mintAuthority,
      MAKER_MINT_A_AMOUNT
    );

    // Fund taker's token_b ATA.
    const takerAtaB = getAssociatedTokenAddressSync(mintB, taker.publicKey);
    await mintTo(
      connection,
      mintAuthority,
      mintB,
      takerAtaB,
      mintAuthority,
      TAKER_MINT_B_AMOUNT
    );
  });

  // ---------------------------------------------------------------------------
  // Helper: derive the escrow PDA address for a given maker + seed
  // ---------------------------------------------------------------------------
  function getEscrowPda(makerKey: PublicKey, seed: BN): PublicKey {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        makerKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    return escrowPda;
  }

  // ---------------------------------------------------------------------------
  // Test 1: Make escrow — maker deposits token_a into the vault
  // ---------------------------------------------------------------------------

  it("Make escrow — deposits token A into vault", async () => {
    const escrowPda = getEscrowPda(maker.publicKey, ESCROW_SEED);

    // The vault is an ATA for mint_a owned by the escrow PDA.
    const vault = getAssociatedTokenAddressSync(mintA, escrowPda, true);
    const makerAtaA = getAssociatedTokenAddressSync(mintA, maker.publicKey);

    // Record maker's balance before the transaction.
    const makerAtaABefore = await getAccount(connection, makerAtaA);
    const makerBalanceBefore = Number(makerAtaABefore.amount);

    await program.methods
      .make(ESCROW_SEED, DEPOSIT_AMOUNT, RECEIVE_AMOUNT)
      .accounts({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc({ commitment: "confirmed" });

    // Verify: vault should now hold the deposited amount.
    const vaultAccount = await getAccount(connection, vault);
    assert.equal(
      Number(vaultAccount.amount),
      DEPOSIT_AMOUNT.toNumber(),
      "Vault should hold the deposited token_a amount"
    );

    // Verify: maker's token_a balance decreased by the deposit amount.
    const makerAtaAAfter = await getAccount(connection, makerAtaA);
    assert.equal(
      Number(makerAtaAAfter.amount),
      makerBalanceBefore - DEPOSIT_AMOUNT.toNumber(),
      "Maker's token_a balance should decrease by deposit amount"
    );

    // Verify: escrow state is stored correctly on-chain.
    const escrowState = await program.account.escrowState.fetch(escrowPda);
    assert.equal(
      escrowState.maker.toBase58(),
      maker.publicKey.toBase58(),
      "Escrow maker should match"
    );
    assert.equal(
      escrowState.mintA.toBase58(),
      mintA.toBase58(),
      "Escrow mint_a should match"
    );
    assert.equal(
      escrowState.mintB.toBase58(),
      mintB.toBase58(),
      "Escrow mint_b should match"
    );
    assert.equal(
      escrowState.receiveAmount.toNumber(),
      RECEIVE_AMOUNT.toNumber(),
      "Escrow receive_amount should match"
    );

    console.log("  Vault balance:", Number(vaultAccount.amount));
    console.log("  Escrow PDA:", escrowPda.toBase58());
  });

  // ---------------------------------------------------------------------------
  // Test 2: Take escrow — taker sends token_b to maker, receives token_a
  // ---------------------------------------------------------------------------

  it("Take escrow — taker receives token A, maker receives token B", async () => {
    const escrowPda = getEscrowPda(maker.publicKey, ESCROW_SEED);

    const vault = getAssociatedTokenAddressSync(mintA, escrowPda, true);
    const takerAtaA = getAssociatedTokenAddressSync(mintA, taker.publicKey);
    const takerAtaB = getAssociatedTokenAddressSync(mintB, taker.publicKey);
    const makerAtaB = getAssociatedTokenAddressSync(mintB, maker.publicKey);

    // Record balances before take.
    const takerAtaBBefore = await getAccount(connection, takerAtaB);
    const takerBalanceBBefore = Number(takerAtaBBefore.amount);

    await program.methods
      .take()
      .accounts({
        taker: taker.publicKey,
        maker: maker.publicKey,
        mintA,
        mintB,
        takerAtaA,
        takerAtaB,
        makerAtaB,
        escrow: escrowPda,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc({ commitment: "confirmed" });

    // Verify: taker now holds token_a (received from vault).
    const takerAtaAAfter = await getAccount(connection, takerAtaA);
    assert.equal(
      Number(takerAtaAAfter.amount),
      DEPOSIT_AMOUNT.toNumber(),
      "Taker should have received the full deposited amount of token_a"
    );

    // Verify: maker now holds token_b (received from taker).
    const makerAtaBAfter = await getAccount(connection, makerAtaB);
    assert.equal(
      Number(makerAtaBAfter.amount),
      RECEIVE_AMOUNT.toNumber(),
      "Maker should have received the agreed amount of token_b"
    );

    // Verify: taker's token_b balance decreased by receive_amount.
    const takerAtaBAfter = await getAccount(connection, takerAtaB);
    assert.equal(
      Number(takerAtaBAfter.amount),
      takerBalanceBBefore - RECEIVE_AMOUNT.toNumber(),
      "Taker's token_b balance should decrease by receive_amount"
    );

    // Verify: escrow PDA is closed (account should no longer exist).
    try {
      await program.account.escrowState.fetch(escrowPda);
      assert.fail("Escrow account should have been closed after take");
    } catch (err) {
      // Expected — the account was closed and rent returned to maker.
      assert.include(
        err.message,
        "Account does not exist",
        "Escrow account should not exist after take"
      );
    }

    console.log("  Taker received token_a:", Number(takerAtaAAfter.amount));
    console.log("  Maker received token_b:", Number(makerAtaBAfter.amount));
  });

  // ---------------------------------------------------------------------------
  // Test 3: Cancel escrow — maker reclaims deposited token_a
  // ---------------------------------------------------------------------------

  it("Cancel escrow — maker reclaims token A", async () => {
    // Use a different seed for this test so it's independent of test 1/2.
    const cancelSeed = new BN(99);
    const cancelDeposit = new BN(100_000);
    const cancelReceive = new BN(50_000);

    const escrowPda = getEscrowPda(maker.publicKey, cancelSeed);
    const vault = getAssociatedTokenAddressSync(mintA, escrowPda, true);
    const makerAtaA = getAssociatedTokenAddressSync(mintA, maker.publicKey);

    // First, create a new escrow to cancel.
    await program.methods
      .make(cancelSeed, cancelDeposit, cancelReceive)
      .accounts({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc({ commitment: "confirmed" });

    // Record maker's balance after make (before cancel).
    const makerAtaAMid = await getAccount(connection, makerAtaA);
    const makerBalanceMid = Number(makerAtaAMid.amount);

    // Verify vault received tokens.
    const vaultMid = await getAccount(connection, vault);
    assert.equal(
      Number(vaultMid.amount),
      cancelDeposit.toNumber(),
      "Vault should hold deposited tokens before cancel"
    );

    // Now cancel the escrow — maker should get tokens back.
    await program.methods
      .cancel()
      .accounts({
        maker: maker.publicKey,
        mintA,
        makerAtaA,
        escrow: escrowPda,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc({ commitment: "confirmed" });

    // Verify: maker's token_a balance is restored.
    const makerAtaAAfter = await getAccount(connection, makerAtaA);
    assert.equal(
      Number(makerAtaAAfter.amount),
      makerBalanceMid + cancelDeposit.toNumber(),
      "Maker should have reclaimed the full deposited amount"
    );

    // Verify: escrow PDA is closed.
    try {
      await program.account.escrowState.fetch(escrowPda);
      assert.fail("Escrow account should have been closed after cancel");
    } catch (err) {
      assert.include(
        err.message,
        "Account does not exist",
        "Escrow account should not exist after cancel"
      );
    }

    console.log(
      "  Maker reclaimed token_a:",
      Number(makerAtaAAfter.amount)
    );
    console.log("  Escrow PDA closed successfully.");
  });
});
