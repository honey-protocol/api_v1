<h1>🍯 Honey Finance: api V1</h1>

<h2>📜 This document consists of the following topics:</h2>

- <a href="#project_information">Project Information</a>
- <a href="#setup">Running the API | PR conventions</a>
- <a href="#architecture">API Architecture</a>
- <a href="#tech_stack">Tech Stack</a>
- <a href="#api_routes">API Routes</a>
- <a href="#future_work">Future Work</a>

> <h2 id="project_information">ℹ️ Project Information</h2>

This is the documentation for the API of Honey Finance which contains the logic for the liquidate page on <a href="[beta.honey.finance](https://beta.honey.finance/liquidate)">beta.honey.finance</a>. This API contains the following set of functions:

- Placing a bid on a collection (useragent)
- Increasing a bid on a collection (useragent)
- Revoking a bid on a collection (useragent)
- Liquidating positions (automated)

> <h2 id="setup">👷🏼 Running The API | PR Conventions<h2>
This section describes the way you can run an instance of the API locally for dev. purposes and the PR conventions that Honey Finance holds. 
<h3>🎬Setting up shop</h3>
TBA
<h3>🤝PR Conventions</h3>
TBA

> <h2 id="architecture"> 🏛️ API Architecture<h2>
This section describes the architecture of the API, the conventions that are used and the structure / flow of data.

> <h2 id="tech_stack">👩🏻‍💻 Tech Stack<h2>
This section describes the technologies used within this project. From frameworks, module bundlers, core packages, databases and testing software. Below you'll find an overview of the tech-stack:

- NodeJS
- Typescript
<h3>📦 Core Packages<h3>

- Solana: <a href="https://www.npmjs.com/package/@solana/web3.js">@solana/web3.js</a>
- Switchboard: <a href="https://www.npmjs.com/package/@switchboard-xyz/switchboard-v2">@switchboard-xyz/switchboard-v2</a>
- Dialectlabs: <a href="https://www.npmjs.com/package/@dialectlabs/sdk">@dialectlabs/sdk</a>
- Anchor: <a href="https://www.npmjs.com/package/@project-serum/anchor">@project-serum/anchor</a>
- Express: <a href="https://www.npmjs.com/package/express">express</a>
- Mongodb: <a href="https://www.npmjs.com/package/mongodb">mongodb</a>
- Mongoose: <a href="https://www.npmjs.com/package/mongoose">mongoose</a>
- Jest: <a href="https://www.npmjs.com/package/jest">jest</a>

> <h2 id="api_routes">🗺️ API Routes<h2>
This section describes the available routes within the project, expected input and return values.


<b>GET</b>: /bids <br>
Returns an array of objects containing all the current active bids for all markets: <br>
```js
[
  {
    marketId: string,
    bidData: {
      bid: string, // id of obligation
      bidder: string, // id of wallet 
      bidLimit: string, // bid in LAMPORTS_PER_SOL
    }
  },
]
```

<b>GET</b>: /bids/marketId <br>
Returns an array of objects containing all the current active bids for for a specific market: <br>
```js
[
  {
    bid: string, // id of obligation
    bidder: string, // id of wallet
    bidLimit: string, // bid in LAMPORTS_PER_SOL
  }
]
```

The interaction with the LiquidatorClient class actually takes place in the <a href="https://www.npmjs.com/package/@honey-finance/sdk">honey-finance/sdk</a> There are 3 core functions that the user can call upon:
- placeBid <br>
<i>Places a bid on a specifc collection.</i> <br>The expected params are: <br>
```js
{
  bid_limit: number,
  market: PublicKey // of market id
  bidder: PublicKey // of connected wallet
  bid_mint: NATIVE_MINT // imported from: @solana/spl-token-v-0.1.8
}
```
- increaseBid <br>
<i>Increases an outstanding bid of the user on a specific collection.</i><br> The expected params are: <br>
```js
{
  bid_limit: number,
  market: PublicKey // of market id
  bidder: PublicKey // of connected wallet
  bid_mint: NATIVE_MINT // imported from: @solana/spl-token-v-0.1.8
}
```
- revokeBid <br>
<i>Revokes an outstanding bid of the user on a specific collection.</i><br> The expected params are:
```js
{
  market: PublicKey // of market id
  bidder: PublicKey // of connected wallet
  bid_mint: NATIVE_MINT // imported from: @solana/spl-token-v-0.1.8
  withdraw_destination: PublicKey // of connected wallet
}
```
For any suggestions / PR's - you can find the code <a href="https://github.com/honey-protocol/honey-sdk/blob/feature/use-all-markets/src/wrappers/liquidator.ts">here</a>.
> <h2 id="future_work">📦 Future Work<h2>
This section describes the features that we would love to implement within a short period of time. Feel free to open PRs any time!

Any requests or points of discussion? Reach out<br> 📬  <a href="mailto:pyro@honeylabs.io">pyro@honeylabs.io</a>