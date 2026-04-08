# [adult swim] bump bot
A Twitter bot that posts random Adult Swim bumps.

## v3 is out!!
Since X/Twitter has been a**-f**king everyone with a free API tier in change of the "pay-per-use" tiers, in protest, the bot is now using [emusks](https://emusks.tiago.zip/)! Go show 'em some love.

The bot has also transferred to Typescript, 'cause it's cool & I've been trying to use that instead. You'll also need to install [Bun](https://bun.sh/), which serves as a Node + npm replacement & also handles the Typescript stuff.

## How to work.
1. Clone the repo - `git clone https://github.com/ktg5/asbumpbot`
2. Install [bun](https://bun.sh/)
3. Install required packages - `bun i`
4. Open `auth.json` and replace the `auth_token` by [following the instructions here](https://emusks.tiago.zip/getting-started/authentication.html#finding-your-auth-token). You will be getting the token cookie for your Twitter account, so when it says to log in, do so with your Twitter account's normal log in information
5. Start the bot - `bun start`

## `config.json` information
* `hours` - Make a post every whatever this is set to
* `minutes` - If not set to `0`, posts will be in minutes instead of hours. As of currently, the `hours` variable will not be used when `minutes` is set.
* `addReplyInsteadofAlt` - If set to `true`, the bot will make a reply to the main tweet with the bump information.
