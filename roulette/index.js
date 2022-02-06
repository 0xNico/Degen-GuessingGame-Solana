const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const { Keypair } = require('@solana/web3.js');
const web3 = require('@solana/web3.js');

const {getWalletBalance,transferSOL,airDropSol}=require("./solana");
const { getReturnAmount, totalAmtToBePaid, randomNumber } = require('./helper');

const init = () => {
    console.log(
        chalk.green(
        figlet.textSync("888 Anon Games", {
            font: "Standard",
            horizontalLayout: "centered",
            verticalLayout: "default"
        })
        )
    );
    console.log(chalk.yellow`Maximum betting is currently set at: 0.888`);
};


//Ask for Ratio
//Ask for Sol to be Staked
//Check the amount to be available in Wallet 
//Ask Public Key
//Generate a Random Number
//Ask for the generated Number 
//If true return the SOL as per ratio

//const userWallet=web3.Keypair.generate();

// const userPublicKey=[
//     6,  85, 188,  71, 255,  12, 214, 102,
//    84, 170, 129, 127,  64,  57, 133,  22,
//    10,   9, 135,  34,  75, 223, 107, 252,
//   253,  22, 242, 135, 180, 245, 221, 155
// ]
const userSecretKey=[
    147,   2,  75, 175,  59, 125, 140, 216, 200,   5,  51,
   109, 255, 231, 190, 237, 210,  59, 212,   8, 166, 186,
    76, 208, 170,  35,  10, 116, 222, 111,  13, 118, 184,
    224,  75, 185, 223,  43,  29, 181,  45,  12, 224, 143,
   102, 210, 159, 131, 100,  98,  45,  72, 237, 173, 192,
   70, 232, 122, 222, 200, 154, 221, 181, 159
  ]

const userWallet=Keypair.fromSecretKey(Uint8Array.from(userSecretKey));


//Treasury
const secretKey=[
    111, 188,  76, 169,  30, 105, 254,  33, 228,  66,  56,
    215,   9,  37,  51, 188, 188, 188,  20, 224, 228, 115,
     17, 163, 151, 105, 113, 251, 105, 177,  28, 157, 125,
    202, 195, 203, 253, 137,  26, 209,   7,   2,  66, 193,
     76, 241, 203, 168, 213,   5, 226,  11, 142,  44, 125,
    191, 167, 172, 166, 207, 176, 137, 210,  27
]

const treasuryWallet=Keypair.fromSecretKey(Uint8Array.from(secretKey));


const askQuestions = () => {
    const questions = [
        {
            name: "SOL",
            type: "number",
            message: "What is the amount of SOL you want to bet anon?",
        },
        {
            type: "rawlist",
            name: "RATIO",
            message: "Whats your degen ratio anon...?",
            choices: ["1:1.25", "1:1.5", "1.75", "1:2"],
            filter: function(val) {
                const stakeFactor=val.split(":")[1];
                return stakeFactor;
            },
        },
        {
            type:"number",
            name:"RANDOM",
            message:"Guess a random number from 1 to 8 (both 1, 8 included)",
            when:async (val)=>{
                if(parseFloat(totalAmtToBePaid(val.SOL))>1.7){
                    console.log(chalk.red`You have violated the max stake limit anon. Too rich gmi.`)
                    return false;
                }else{
                    // console.log("In when")
                    console.log(`You need to pay ${chalk.green`${totalAmtToBePaid(val.SOL)}`} to move forward anon`)
                    const userBalance=await getWalletBalance(userWallet.publicKey.toString())
                    console.log(`You currently have ${userBalance} SOL anon`);
                    
                    if(userBalance<totalAmtToBePaid(val.SOL)){
                        console.log(chalk.red`You ran out of funds anon... rugged`);
                        return false;
                    }else{
                        console.log(chalk.green`You will get ${getReturnAmount(val.SOL,parseFloat(val.RATIO))} if guessing the number correctly GMI`)
                        return true;    
                    }
                }
            },
        }
    ];
    return inquirer.prompt(questions);
};


const gameExecution=async ()=>{
    init();
    const generateRandomNumber=randomNumber(1,8);
    // console.log("Generated number",generateRandomNumber);
    const answers=await askQuestions();
    if(answers.RANDOM){
        const paymentSignature=await transferSOL(userWallet,treasuryWallet,totalAmtToBePaid(answers.SOL))
        console.log(`Signature of payment for playing the game`,chalk.green`${paymentSignature}`);
        if(answers.RANDOM===generateRandomNumber){
            //AirDrop Winning Amount
            await airDropSol(treasuryWallet,getReturnAmount(answers.SOL,parseFloat(answers.RATIO)));
            //guess is successfull
            console.log(`The winning number is: `,chalk.green`${generateRandomNumber}`);
            console.log(chalk.green`Your guess is absolutely correct anon GMI`)
            const prizeSignature=await transferSOL(treasuryWallet,userWallet,getReturnAmount(answers.SOL,parseFloat(answers.RATIO)))
            console.log(`Here is the winning signature `,chalk.green`${prizeSignature}`);

            const userBalance=await getWalletBalance(userWallet.publicKey.toString())
            console.log(`You now have ${userBalance} SOL anon WINOOORS`);
        }else{
            console.log(`The winning number is: `,chalk.red`${generateRandomNumber}`);
            const userBalance=await getWalletBalance(userWallet.publicKey.toString())
            console.log(`Your balance is now ${userBalance} SOL`);
            //better luck next time
            console.log(chalk.yellowBright`Better luck next time anon`);
        }
    }
}

gameExecution()
