use solana_program::{
    account_info::next_account_info,
    account_info::AccountInfo,
    program_error::ProgramError, 
    sysvar,
    sysvar::Sysvar, 
    entrypoint, 
    entrypoint::ProgramResult, 
    msg, 
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    program::{invoke, invoke_signed},
};

solana_program::declare_id!("MWRTtsXSs2dUDxAbVvREHDVZP8QhK1JE7SGzYbQ7joo");

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!(
        "process_instruction: {}: {} accounts, data={:?}",
        program_id,
        accounts.len(),
        instruction_data
    );

    if instruction_data.len() == 0 {
      msg!("No instruction data");
      return Err(ProgramError::InvalidInstructionData);
    }

    let account_info_iter = &mut accounts.iter();

    /***********************************
     * create author account
     */

    if 1 == instruction_data[0] {

      let funder_info = next_account_info(account_info_iter)?;
      let mint_info = next_account_info(account_info_iter)?;
      let author_account_info = next_account_info(account_info_iter)?;
      let rent_sysvar_info = next_account_info(account_info_iter)?;
      let system_program_info = next_account_info(account_info_iter)?;

      if !funder_info.is_signer {
          msg!("Author (funder) is not signer");
          return Err(ProgramError::MissingRequiredSignature);
      }

      if !sysvar::rent::check_id(rent_sysvar_info.key) {
        msg!("Rent system account is not rent system account");
        return Err(ProgramError::InvalidAccountData);
      }

      let rent = &Rent::from_account_info(rent_sysvar_info)?;

      msg!("writing bytes={:?} data={:?}",
          funder_info.key.to_bytes().len(),
          funder_info.key.to_bytes());

      msg!("Creating author account");
      invoke(
            &system_instruction::create_account_with_seed(
                funder_info.key,
                author_account_info.key,
                mint_info.key,
                "nft_meta_author",
                1.max(rent.minimum_balance(33)),
                33,
                program_id,
            ),
            &[
                funder_info.clone(),
                author_account_info.clone(),
                mint_info.clone(),
                system_program_info.clone(),
            ],
      )?;

      let mut data = author_account_info.try_borrow_mut_data()?;
      data[0] = 1u8;
      data[1..33].clone_from_slice(&funder_info.key.to_bytes());
    }
 
    Ok(())
}

#[cfg(test)]
mod test {
    use {
        super::*,
        assert_matches::*,
        solana_program::instruction::{AccountMeta, Instruction},
        solana_program_test::*,
        solana_sdk::{signature::Signer, transaction::Transaction, signer::keypair::Keypair},
    };

    #[tokio::test]
    async fn test_transaction() {
        let program_id = Pubkey::new_unique();

        let mint_account = Keypair::new();

        let author_account = match Pubkey::create_with_seed(
                &mint_account.pubkey(),
                "nft_meta_author",
                &program_id,
            ) {
                Ok(f) => f,
                Err(e) => { 
                    panic!("Error: {}", e);
                }
            };

        let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
            "bpf-program-meta-writer",
            program_id,
            processor!(process_instruction),
        )
        .start()
        .await;

        let mut transaction = Transaction::new_with_payer(
            &[Instruction {
                program_id,
                accounts: vec![
                  AccountMeta::new(payer.pubkey(), true),
                  AccountMeta::new(mint_account.pubkey(), true),
                  AccountMeta::new(author_account, false),
                  AccountMeta::new_readonly(sysvar::rent::id(), false),
                  AccountMeta::new_readonly(solana_program::system_program::id(), false),
                ],
                data: vec![1],
            }],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer, &mint_account], recent_blockhash);

        assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));
    }
}
