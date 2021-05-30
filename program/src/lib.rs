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
    program::{invoke},
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
     * initialize accounts
     */

    if 1 == instruction_data[0] {

      if instruction_data.len() != 7 {
        msg!("Expected 7 bytes of instruction data");
        return Err(ProgramError::InvalidInstructionData);
      }

      let funder_info = next_account_info(account_info_iter)?;
      let mint_info = next_account_info(account_info_iter)?;
      let author_account_info = next_account_info(account_info_iter)?;
      let title_account_info = next_account_info(account_info_iter)?;
      let uri_account_info = next_account_info(account_info_iter)?;
      let data_account_info = next_account_info(account_info_iter)?;
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

      msg!("Author -- allocating bytes={:?} and writing data={:?}",
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

      let title_bytes = instruction_data[1];

      msg!("Title -- allocating only bytes={:?}", title_bytes);

      msg!("Creating title account");
      invoke(
            &system_instruction::create_account_with_seed(
                funder_info.key,
                title_account_info.key,
                mint_info.key,
                "nft_meta_title",
                1.max(rent.minimum_balance(title_bytes as usize)),
                title_bytes as u64,
                program_id,
            ),
            &[
                funder_info.clone(),
                title_account_info.clone(),
                mint_info.clone(),
                system_program_info.clone(),
            ],
      )?;

      let uri_bytes = instruction_data[2];

      msg!("URI -- allocating only bytes={:?}", uri_bytes);

      msg!("Creating URI account");
      invoke(
            &system_instruction::create_account_with_seed(
                funder_info.key,
                uri_account_info.key,
                mint_info.key,
                "nft_meta_uri",
                1.max(rent.minimum_balance(uri_bytes as usize)),
                uri_bytes as u64,
                program_id,
            ),
            &[
                funder_info.clone(),
                uri_account_info.clone(),
                mint_info.clone(),
                system_program_info.clone(),
            ],
      )?;

      let mut tmp_bytes:[u8; 4] = [0,0,0,0];
      tmp_bytes[0] = instruction_data[3];
      tmp_bytes[1] = instruction_data[4];
      tmp_bytes[2] = instruction_data[5];
      tmp_bytes[3] = instruction_data[6];

      let data_bytes = u32::from_be_bytes(tmp_bytes);

      msg!("Data -- allocating only bytes={:?}", data_bytes);

      msg!("Creating generic data account");
      invoke(
            &system_instruction::create_account_with_seed(
                funder_info.key,
                data_account_info.key,
                mint_info.key,
                "nft_meta_data",
                1.max(rent.minimum_balance(data_bytes as usize)),
                data_bytes as u64,
                program_id,
            ),
            &[
                funder_info.clone(),
                data_account_info.clone(),
                mint_info.clone(),
                system_program_info.clone(),
            ],
      )?;

    }

    /***********************************
     * set title
     */

    if 2 == instruction_data[0] {

      let funder_info = next_account_info(account_info_iter)?;
      let mint_info = next_account_info(account_info_iter)?;
      let author_account_info = next_account_info(account_info_iter)?;
      let title_account_info = next_account_info(account_info_iter)?;

      if !funder_info.is_signer {
          msg!("Author (funder) is not signer");
          return Err(ProgramError::MissingRequiredSignature);
      }

      let expected_author_account_key = match Pubkey::create_with_seed(
                &mint_info.key,
                "nft_meta_author",
                &program_id,
            ) {
                Ok(a) => a,
                Err(_e) => {
                    msg!("Error deriving author account");
                    return Err(ProgramError::InvalidAccountData);
                }
            };

      if author_account_info.key.to_bytes() != expected_author_account_key.to_bytes() {
         msg!("Author account address not as expected");
         return Err(ProgramError::InvalidAccountData);
      }
 
      let author_data = author_account_info.try_borrow_data()?;

      if 33 != author_data.len() {
         msg!("Author account {} not as expected, length only {}",author_account_info.key,author_data.len());
         return Err(ProgramError::InvalidAccountData);
      }

      if 1 != author_data[0] {
         msg!("Meta data not open for editing");
         return Err(ProgramError::InvalidAccountData);
      }

      if funder_info.key.to_bytes()[..] != author_data[1..33] {
         msg!("Funder is not author");
         return Err(ProgramError::InvalidAccountData);
      }

      let expected_title_account_key = match Pubkey::create_with_seed(
                &mint_info.key,
                "nft_meta_title",
                &program_id,
            ) {
                Ok(a) => a,
                Err(_e) => {
                    msg!("Error deriving title account");
                    return Err(ProgramError::InvalidAccountData);
                }
            };

      if title_account_info.key.to_bytes() != expected_title_account_key.to_bytes() {
         msg!("Title account address not as expected");
         return Err(ProgramError::InvalidAccountData);
      }

      let mut title_data = title_account_info.try_borrow_mut_data()?;

      if instruction_data.len()-1 != title_data.len()  {
        msg!("Title string is {} bytes long, but storage is {} bytes long", 
           instruction_data.len()-1, 
           title_data.len());
        return Err(ProgramError::InvalidInstructionData);
      }

      title_data[..].clone_from_slice(&instruction_data[1..]);

    }

    /***********************************
     * set uri
     */

    if 3 == instruction_data[0] {

      let funder_info = next_account_info(account_info_iter)?;
      let mint_info = next_account_info(account_info_iter)?;
      let author_account_info = next_account_info(account_info_iter)?;
      let uri_account_info = next_account_info(account_info_iter)?;

      if !funder_info.is_signer {
          msg!("Author (funder) is not signer");
          return Err(ProgramError::MissingRequiredSignature);
      }

      let expected_author_account_key = match Pubkey::create_with_seed(
                &mint_info.key,
                "nft_meta_author",
                &program_id,
            ) {
                Ok(a) => a,
                Err(_e) => {
                    msg!("Error deriving author account");
                    return Err(ProgramError::InvalidAccountData);
                }
            };

      if author_account_info.key.to_bytes() != expected_author_account_key.to_bytes() {
         msg!("Author account address not as expected");
         return Err(ProgramError::InvalidAccountData);
      }
 
      let author_data = author_account_info.try_borrow_data()?;

      if 1 != author_data[0] {
         msg!("Meta data not open for editing");
         return Err(ProgramError::InvalidAccountData);
      }

      if funder_info.key.to_bytes()[..] != author_data[1..33] {
         msg!("Funder is not author");
         return Err(ProgramError::InvalidAccountData);
      }

      let expected_uri_account_key = match Pubkey::create_with_seed(
                &mint_info.key,
                "nft_meta_uri",
                &program_id,
            ) {
                Ok(a) => a,
                Err(_e) => {
                    msg!("Error deriving uri account");
                    return Err(ProgramError::InvalidAccountData);
                }
            };

      if uri_account_info.key.to_bytes() != expected_uri_account_key.to_bytes() {
         msg!("URI account address not as expected");
         return Err(ProgramError::InvalidAccountData);
      }

      let mut uri_data = uri_account_info.try_borrow_mut_data()?;

      if instruction_data.len()-1 != uri_data.len()  {
        msg!("URI string is {} bytes long, but storage is {} bytes long", 
           instruction_data.len()-1, 
           uri_data.len());
        return Err(ProgramError::InvalidInstructionData);
      }

      uri_data[..].clone_from_slice(&instruction_data[1..]);

    }

    /***********************************
     * set data
     * 
     * not possible to set all data in one go, 
     * divide into chunks and use multiple transactions
     *
     * first byte is instruction
     * next 4 bytes are u32 as big-endian, which is start position
     * in the on-chain account to write data to, which is rest of instruction
     */

    if 4 == instruction_data[0] {

      let funder_info = next_account_info(account_info_iter)?;
      let mint_info = next_account_info(account_info_iter)?;
      let author_account_info = next_account_info(account_info_iter)?;
      let data_account_info = next_account_info(account_info_iter)?;

      let mut tmp_bytes:[u8; 4] = [0,0,0,0];
      tmp_bytes[0] = instruction_data[1];
      tmp_bytes[1] = instruction_data[2];
      tmp_bytes[2] = instruction_data[3];
      tmp_bytes[3] = instruction_data[4];
      let start_position = u32::from_be_bytes(tmp_bytes) as usize;

      let data_length = instruction_data.len() - 5;

      if !funder_info.is_signer {
          msg!("Author (funder) is not signer");
          return Err(ProgramError::MissingRequiredSignature);
      }

      let expected_author_account_key = match Pubkey::create_with_seed(
                &mint_info.key,
                "nft_meta_author",
                &program_id,
            ) {
                Ok(a) => a,
                Err(_e) => {
                    msg!("Error deriving author account");
                    return Err(ProgramError::InvalidAccountData);
                }
            };

      if author_account_info.key.to_bytes() != expected_author_account_key.to_bytes() {
         msg!("Author account address not as expected");
         return Err(ProgramError::InvalidAccountData);
      }
 
      let author_data = author_account_info.try_borrow_data()?;

      if 1 != author_data[0] {
         msg!("Meta data not open for editing");
         return Err(ProgramError::InvalidAccountData);
      }

      if funder_info.key.to_bytes()[..] != author_data[1..33] {
         msg!("Funder is not author");
         return Err(ProgramError::InvalidAccountData);
      }

      let expected_data_account_key = match Pubkey::create_with_seed(
                &mint_info.key,
                "nft_meta_data",
                &program_id,
            ) {
                Ok(a) => a,
                Err(_e) => {
                    msg!("Error deriving data account");
                    return Err(ProgramError::InvalidAccountData);
                }
            };

      if data_account_info.key.to_bytes() != expected_data_account_key.to_bytes() {
         msg!("Data account address not as expected");
         return Err(ProgramError::InvalidAccountData);
      }

      let mut data = data_account_info.try_borrow_mut_data()?;

      let end_position = start_position + data_length;

      if end_position > data.len() {
        msg!("Attempting to write beyond account size, start at {} end at {}, but storage is {} bytes long", 
           start_position, 
           end_position, 
           data.len());
        return Err(ProgramError::InvalidInstructionData);
      }

      data[start_position..end_position].clone_from_slice(&instruction_data[5..]);

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
    async fn test_big_endian_sanity() {
        assert_eq!(12,u32::from_be_bytes([0b00000000, 0b00000000, 0b00000000, 0b00001100]));
        assert_eq!(5000,u32::from_be_bytes([0b00000000, 0b00000000, 0b00010011, 0b10001000]));
        assert_eq!(10240,u32::from_be_bytes([0b00000000, 0b00000000, 0b00101000, 0b00000000]));
        assert_eq!(123456789,u32::from_be_bytes([0b00000111, 0b01011011, 0b11001101, 0b00010101]));
    }

    #[tokio::test]
    async fn test_transactions() {
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

        let title_account = match Pubkey::create_with_seed(
                &mint_account.pubkey(),
                "nft_meta_title",
                &program_id,
            ) {
                Ok(f) => f,
                Err(e) => { 
                    panic!("Error: {}", e);
                }
            };

        let uri_account = match Pubkey::create_with_seed(
                &mint_account.pubkey(),
                "nft_meta_uri",
                &program_id,
            ) {
                Ok(f) => f,
                Err(e) => { 
                    panic!("Error: {}", e);
                }
            };

        let data_account = match Pubkey::create_with_seed(
                &mint_account.pubkey(),
                "nft_meta_data",
                &program_id,
            ) {
                Ok(f) => f,
                Err(e) => { 
                    panic!("Error: {}", e);
                }
            };

        let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
            "bpf_program_meta_writer",
            program_id,
            processor!(process_instruction),
        )
        .start()
        .await;


        // Initialize

        let mut transaction = Transaction::new_with_payer(
            &[Instruction {
                program_id,
                accounts: vec![
                  AccountMeta::new(payer.pubkey(), true),
                  AccountMeta::new(mint_account.pubkey(), true),
                  AccountMeta::new(author_account, false),
                  AccountMeta::new(title_account, false),
                  AccountMeta::new(uri_account, false),
                  AccountMeta::new(data_account, false),
                  AccountMeta::new_readonly(sysvar::rent::id(), false),
                  AccountMeta::new_readonly(solana_program::system_program::id(), false),
                ],
                data: vec![1, 5, 17, 0b00000000, 0b00000000, 0b00010011, 0b10001000],
            }],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer, &mint_account], recent_blockhash);

        assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));

        // Update title

        let mut transaction = Transaction::new_with_payer(
            &[Instruction {
                program_id,
                accounts: vec![
                  AccountMeta::new(payer.pubkey(), true),
                  AccountMeta::new(mint_account.pubkey(), false),
                  AccountMeta::new(author_account, false),
                  AccountMeta::new(title_account, false),
                ],
                data: vec![2, 72, 69, 76, 76, 79],
            }],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer], recent_blockhash);

        assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));
    
        // Update uri

        let mut transaction = Transaction::new_with_payer(
            &[Instruction {
                program_id,
                accounts: vec![
                  AccountMeta::new(payer.pubkey(), true),
                  AccountMeta::new(mint_account.pubkey(), false),
                  AccountMeta::new(author_account, false),
                  AccountMeta::new(uri_account, false),
                ],
                data: vec![3, 104, 116, 116, 112, 115, 58, 47, 47, 109, 99, 102, 46, 114, 111, 99, 107, 115,],
            }],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer], recent_blockhash);

        assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));
    
        // Update data

        let mut transaction = Transaction::new_with_payer(
            &[Instruction {
                program_id,
                accounts: vec![
                  AccountMeta::new(payer.pubkey(), true),
                  AccountMeta::new(mint_account.pubkey(), false),
                  AccountMeta::new(author_account, false),
                  AccountMeta::new(data_account, false),
                ],
                data: vec![4, 0, 0, 0, 5, 65, 66, 67, 68, 69 ],
            }],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer], recent_blockhash);

        assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));
    }

}
