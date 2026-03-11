use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{
        self, close_account, transfer, CloseAccount, Mint, Token, TokenAccount, Transfer,
    },
};

// This program ID is the placeholder used during development.
// After `anchor build`, replace this with the actual program ID from target/deploy/escrow-keypair.json.
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod escrow {
    use super::*;

    /// Make: the maker creates an escrow, deposits token_a into a vault,
    /// and specifies how much token_b they want in return.
    ///
    /// Think of this as a maker walking up to a notary (the program),
    /// handing over an item (token_a), and saying:
    /// "Hold this for me. Release it only when someone gives me X amount of token_b."
    pub fn make(ctx: Context<Make>, seed: u64, deposit_amount: u64, receive_amount: u64) -> Result<()> {
        // Validate inputs — we don't want a zero-value escrow
        require!(deposit_amount > 0, EscrowError::ZeroDepositAmount);
        require!(receive_amount > 0, EscrowError::ZeroReceiveAmount);

        // Store all escrow state into the PDA account.
        // This state is what the program will use later in `take` and `cancel`
        // to verify that the right parties are involved and amounts are correct.
        ctx.accounts.escrow.set_inner(EscrowState {
            seed,
            maker: ctx.accounts.maker.key(),
            mint_a: ctx.accounts.mint_a.key(),
            mint_b: ctx.accounts.mint_b.key(),
            receive_amount,
            bump: ctx.bumps.escrow,
        });

        // Transfer token_a from the maker's ATA to the vault.
        // The vault is an ATA owned by the escrow PDA — not by a human,
        // so only the program itself (via PDA signing) can move tokens out.
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.maker_ata_a.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.maker.to_account_info(),
                },
            ),
            deposit_amount,
        )?;

        Ok(())
    }

    /// Take: a taker fulfills the escrow by sending token_b to the maker,
    /// then receives token_a from the vault in return.
    ///
    /// The program acts as the trusted intermediary — it first checks that
    /// the taker is sending the correct token and amount, then atomically
    /// releases the vault tokens. Both sides of the trade happen in one
    /// transaction; there is no risk of one party cheating the other.
    pub fn take(ctx: Context<Take>) -> Result<()> {
        // The seeds used to derive the escrow PDA so we can sign CPIs on its behalf.
        // A PDA has no private key, so we "sign" by re-deriving it with these seeds.
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"escrow",
            ctx.accounts.maker.key.as_ref(),
            &ctx.accounts.escrow.seed.to_le_bytes(),
            &[ctx.accounts.escrow.bump],
        ]];

        // Step 1: Transfer token_b from taker to maker.
        // The taker pays the maker the agreed amount of token_b.
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.taker_ata_b.to_account_info(),
                    to: ctx.accounts.maker_ata_b.to_account_info(),
                    authority: ctx.accounts.taker.to_account_info(),
                },
            ),
            ctx.accounts.escrow.receive_amount,
        )?;

        // Step 2: Transfer token_a from vault to taker.
        // The program signs on behalf of the escrow PDA using signer_seeds.
        // This is a CPI (Cross-Program Invocation) — the escrow program calls
        // the Token program, authorizing the transfer from the vault it controls.
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.taker_ata_a.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.vault.amount,
        )?;

        // Step 3: Close the vault ATA to reclaim its rent lamports.
        // The rent goes back to the maker since they paid to open the vault.
        close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.maker.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ))?;

        // The escrow PDA itself is closed by the `close = maker` constraint
        // in the Take account context, automatically returning rent to the maker.

        Ok(())
    }

    /// Cancel: the maker reclaims their deposited token_a and closes the escrow.
    ///
    /// If no taker has fulfilled the escrow yet, the maker can cancel at any time.
    /// The program transfers token_a from the vault back to the maker and
    /// closes all accounts, returning all rent lamports.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        // Derive the PDA signer seeds — same pattern as in `take`.
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"escrow",
            ctx.accounts.maker.key.as_ref(),
            &ctx.accounts.escrow.seed.to_le_bytes(),
            &[ctx.accounts.escrow.bump],
        ]];

        // Transfer all token_a back from the vault to the maker's ATA.
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.maker_ata_a.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.vault.amount,
        )?;

        // Close the vault ATA, returning its rent to the maker.
        close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.maker.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ))?;

        // The escrow PDA is closed by `close = maker` constraint below.

        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Account Contexts
// ---------------------------------------------------------------------------

/// Accounts required to create (make) an escrow.
#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    /// The maker initiates and pays for the escrow. Must be a signer.
    #[account(mut)]
    pub maker: Signer<'info>,

    /// The mint of token_a — what the maker is offering.
    pub mint_a: Account<'info, Mint>,

    /// The mint of token_b — what the maker wants in return.
    pub mint_b: Account<'info, Mint>,

    /// The maker's ATA for token_a. Tokens will be transferred out of here.
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_ata_a: Account<'info, TokenAccount>,

    /// The escrow state PDA. Stores all information about this escrow.
    /// Seeds: ["escrow", maker_pubkey, seed_as_le_bytes]
    /// This makes every escrow unique per maker+seed combination.
    #[account(
        init,
        payer = maker,
        space = 8 + EscrowState::INIT_SPACE,
        seeds = [b"escrow", maker.key().as_ref(), &seed.to_le_bytes()],
        bump,
    )]
    pub escrow: Account<'info, EscrowState>,

    /// The vault: an ATA for token_a owned by the escrow PDA.
    /// Only the program (via PDA signing) can move tokens in or out.
    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Accounts required to fulfill (take) an escrow.
#[derive(Accounts)]
pub struct Take<'info> {
    /// The taker fulfills the escrow by providing token_b.
    #[account(mut)]
    pub taker: Signer<'info>,

    /// The maker who created the escrow. Receives token_b and rent refunds.
    /// Verified by the `has_one` constraint on the escrow account.
    #[account(mut)]
    pub maker: SystemAccount<'info>,

    /// Mint of token_a — what the taker will receive.
    pub mint_a: Account<'info, Mint>,

    /// Mint of token_b — what the taker must provide.
    pub mint_b: Account<'info, Mint>,

    /// Taker's ATA for token_a. Created if it doesn't exist yet.
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
    )]
    pub taker_ata_a: Account<'info, TokenAccount>,

    /// Taker's ATA for token_b. Must have sufficient balance to pay maker.
    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = taker,
    )]
    pub taker_ata_b: Account<'info, TokenAccount>,

    /// Maker's ATA for token_b. Created if it doesn't exist yet.
    /// The maker will receive token_b here.
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_b,
        associated_token::authority = maker,
    )]
    pub maker_ata_b: Account<'info, TokenAccount>,

    /// The escrow state PDA. Anchor verifies:
    /// - has_one = maker    → escrow.maker must match the maker account passed in
    /// - has_one = mint_a   → escrow.mint_a must match the mint_a account passed in
    /// - has_one = mint_b   → escrow.mint_b must match the mint_b account passed in
    /// - close = maker      → on success, close this account and send rent to maker
    #[account(
        mut,
        has_one = maker,
        has_one = mint_a,
        has_one = mint_b,
        seeds = [b"escrow", maker.key().as_ref(), &escrow.seed.to_le_bytes()],
        bump = escrow.bump,
        close = maker,
    )]
    pub escrow: Account<'info, EscrowState>,

    /// The vault holding the deposited token_a.
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Accounts required to cancel an escrow and reclaim deposited tokens.
#[derive(Accounts)]
pub struct Cancel<'info> {
    /// Only the maker who created the escrow can cancel it.
    #[account(mut)]
    pub maker: Signer<'info>,

    /// Mint of token_a — the token the maker deposited.
    pub mint_a: Account<'info, Mint>,

    /// Maker's ATA for token_a. Tokens will be returned here.
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_ata_a: Account<'info, TokenAccount>,

    /// The escrow state PDA. Anchor verifies:
    /// - has_one = maker    → only the original maker can cancel
    /// - has_one = mint_a   → ensures we're closing the right vault
    /// - close = maker      → sends rent back to the maker
    #[account(
        mut,
        has_one = maker,
        has_one = mint_a,
        seeds = [b"escrow", maker.key().as_ref(), &escrow.seed.to_le_bytes()],
        bump = escrow.bump,
        close = maker,
    )]
    pub escrow: Account<'info, EscrowState>,

    /// The vault ATA that holds the deposited token_a.
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/// The on-chain state for a single escrow instance.
/// Stored in a PDA so it can be verified and closed by the program.
#[account]
#[derive(InitSpace)]
pub struct EscrowState {
    /// A nonce chosen by the maker, making each escrow unique per maker.
    pub seed: u64,

    /// The public key of the maker (the party offering token_a).
    pub maker: Pubkey,

    /// The mint address of the token being offered (token_a).
    pub mint_a: Pubkey,

    /// The mint address of the token being requested (token_b).
    pub mint_b: Pubkey,

    /// The amount of token_b the maker wants in exchange.
    pub receive_amount: u64,

    /// The canonical bump for this PDA — stored so we don't have to re-derive it.
    pub bump: u8,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum EscrowError {
    /// Raised when the maker tries to deposit zero tokens.
    #[msg("Jumlah deposit tidak boleh nol")]
    ZeroDepositAmount,

    /// Raised when the maker sets a receive amount of zero.
    #[msg("Jumlah yang diminta tidak boleh nol")]
    ZeroReceiveAmount,
}
