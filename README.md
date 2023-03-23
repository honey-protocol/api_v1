<h1>🍯 Honey Finance: api V1</h1>

<h2>📜 This document consists of the following topics:</h2>

- <a href="#project_information">Project Information</a>
- <a href="#setup">Running the API</a>
- <a href="#architecture">API Architecture</a>
- <a href="#tech_stack">Tech Stack</a>
- <a href="#api_routes">API Routes</a>
- <a href="#prs">PRs / Conventions</a>
- <a href="#future_work">Future Work</a>

> <h2 id="project_information">ℹ️ Project Information</h2>

This is the documentation for the API of Honey Finance which contains the logic for the liquidate page on <a href="[beta.honey.finance](https://beta.honey.finance/liquidate)">beta.honey.finance</a>. This API contains the following set of functions / listeners:

- Listener; placing a bid on a collection (useragent)
- Listener; increasing a bid on a collection (useragent)
- Listener; revoking a bid on a collection (useragent)
- Execution; Liquidating positions (automated)

> <h2 id="setup">👷🏼 Running The API<h2>
This section describes the way you can run an instance of the API locally for dev. purposes and the PR conventions that Honey Finance holds. 
<h3>🎬Setting up shop</h3>

In order to run a local instance of the API, you will need to create a mongo db account and configure the .example.env in the root. Also - rename the .example.env to .env. Make sure to have a RPC endpoint, and specify this in the .env
After having done so, make sure to navigate to the preferred folder, and execute the following steps:

```bash
git clone https://github.com/honey-protocol/api_v1.git
cd api_v1
yarn
yarn dev
```
You should be good to go!


> <h2 id="architecture"> 🏛️ API Architecture<h2>
This section describes the architecture of the API, the conventions that are used and the structure / flow of data.

> <h3>API Structure</h3>
The structure of the API is created according the MVC pattern, containing a Model, View, and a Controller. The root of the api can be found at src/index.ts. Here the server is initialised, middleware / security configured and the router initliased. Also, an init program function is called which loads all the markets, and spins up a cron job that fires every 2 minutes to check for liquidations. 

> <h3>Data Flow</h3>
The flow of data for this API is rather simplistic. Each time a user agent calls upon a market trigger, being: place_bid, increase_bid, revoke_bid, a handler in the API is called that fetches the latest on chain data of this specific market. This on chain market data is then being formatted according the model and stored in the database. This way the API provides a latest and accurate representation of the market data.

> <h2 id="tech_stack">👩🏻‍💻 Tech Stack<h2>
This section describes the technologies used within this project. From frameworks, module bundlers, core packages, databases and testing software. Below you'll find an overview of the tech-stack:

- NodeJS
- Typescript
- Mongoose
<h3>📦 Core Packages<h3>

- Solana: <a href="https://www.npmjs.com/package/@solana/web3.js">@solana/web3.js</a>
- Switchboard: <a href="https://www.npmjs.com/package/@switchboard-xyz/switchboard-v2">@switchboard-xyz/switchboard-v2</a>
- Dialectlabs: <a href="https://www.npmjs.com/package/@dialectlabs/sdk">@dialectlabs/sdk</a>
- Anchor: <a href="https://www.npmjs.com/package/@project-serum/anchor">@project-serum/anchor</a>
- Express: <a href="https://www.npmjs.com/package/express">express</a>
- Mongoose: <a href="https://www.npmjs.com/package/mongoose">mongoose</a>
- Jest: <a href="https://www.npmjs.com/package/jest">jest</a>

> <h2 id="api_routes">🗺️ API Routes<h2><br>
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

<h2 id="prs">🤝 PRs / Conventions</h2>

For any suggestions / PR's - you can find the code <a href="https://github.com/honey-protocol/honey-sdk/blob/feature/use-all-markets/src/wrappers/liquidator.ts">here</a>.

As described in this documentation, the API follows the MVC structure. PRs not following this structure will not be reviewed, so please consider the architecture when submitting a PR. Say we wanted to add the coinmarketcap API to create an overview of current prices of X coins, we then would;

- create a separate routing file
- create a controller file for this route
- init the router in src/index.js
- place helper functions inside a standalone helper.ts file inside /helpers
- write tests for the expected outcome in a separate test file

Once that's done, open a PR!

Note*
Since this API currently does not render any views / no view engine is specified, if required - please pick a well suported / documented templating engine, e.g: EJS / HBS / doT.js etc.

> <h2 id="future_work">📦 Future Work<h2>
This section describes the features that we would love to implement within a short period of time. Feel free to open PRs any time!

Any requests or points of discussion? Reach out<br> 📬  <a href="mailto:pyro@honeylabs.io">pyro@honeylabs.io</a>