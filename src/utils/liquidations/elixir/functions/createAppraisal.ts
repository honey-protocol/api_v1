import { PublicKey, SYSVAR_CLOCK_PUBKEY, SystemProgram, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { AnchorState, BRIDGESPLIT_API, May, PROGRAM_IDS } from "../utils";
import { Vault } from "../program";
import * as fetch from "node-fetch";


import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// const require = createRequire(import.meta.url);
// const elixir_idl = require("./idl/idl.json");

export async function createAppraisal(
    anchorState: AnchorState<Vault>,
    poolMint: PublicKey,
    externalAccount: PublicKey,
    nftMint: PublicKey,
    poolAccount: PublicKey,
    appraisalAccount: PublicKey,
    send: boolean
): Promise<May<Transaction>> {
    try {
        await anchorState.program.account.appraisal.fetch(appraisalAccount);
        console.log("ALREADY APPRAISED");
    } catch (error) {
        console.log("NEED TO APPRAISE", {
            appraiser: PROGRAM_IDS.appraiser.toString(),
            initializer: anchorState.wallet?.publicKey.toString(),
            index_mint: poolMint.toString(),
            index: poolAccount.toString(),
            external_account: externalAccount.toString(),
            asset_mint: nftMint.toString(),
            appraisal: appraisalAccount.toString(),
            system: SystemProgram.programId.toString(),
            clock: SYSVAR_CLOCK_PUBKEY.toString()
        });
        const appraiserQuery = await fetch(BRIDGESPLIT_API + "appraiser/ix", {
            method: "POST",
            body: JSON.stringify({
                appraiser: PROGRAM_IDS.appraiser,
                initializer: anchorState.wallet?.publicKey.toString(),
                index_mint: poolMint.toString(),
                index: poolAccount.toString(),
                external_account: externalAccount.toString(),
                asset_mint: nftMint.toString(),
                appraisal: appraisalAccount.toString(),
                system: SystemProgram.programId.toString(),
                clock: SYSVAR_CLOCK_PUBKEY.toString()
            })
        })
            .then(async (response) => {
                // Need to format this response and add this ixn to the txn
                return await response.text();
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.log("Error creating an appraisal", err);
                return null;
            });

        console.log('appraiserQuery', appraiserQuery);
        if (appraiserQuery && appraiserQuery !== "false") {
            let recoveredTransaction: Transaction | undefined = Transaction.from(Buffer.from(appraiserQuery, "base64"));
            if (send) {
                recoveredTransaction = await anchorState.provider.wallet?.signTransaction(recoveredTransaction);
                const blockhash = (await anchorState.provider.connection.getLatestBlockhash()).blockhash;
                recoveredTransaction.recentBlockhash = blockhash;
                if(recoveredTransaction){
                    console.log("feePayer = ", recoveredTransaction.feePayer.toString());
                    console.log("sig = ", JSON.stringify(recoveredTransaction.signatures));
                    const tx = await anchorState.provider.connection.sendRawTransaction(
                        recoveredTransaction.serialize({ verifySignatures: false, requireAllSignatures: false }),
                        // {skipPreflight: true}
                    );

                    // recoveredTransaction &&
                    // (await anchorState.provider.connection.sendRawTransaction(
                    //     recoveredTransaction.serialize({ verifySignatures: false, requireAllSignatures: false })
                    // ));
                    console.log("appraiser tx", tx);
                    await anchorState.provider.connection.confirmTransaction(tx, "confirmed");

                }
            }
            else {
                return recoveredTransaction;
            }
        }
    }
    return;
}
