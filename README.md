# [adult swim] bump bot
A Twitter bot that posts random Adult Swim bumps.

## V2 is out!!
Since `twit.js` ain't workin' on my end, I gotta rewrite the bot usin' the `twitter-api-v2` npm module!!

Just download the latest version whenever you can `:)`

I've also made the bot do Twitter authentication in another file, `botAuth.js`, which is now how I authorize clients for my bots...

## How to work.
1. Clone the repo - `git clone https://github.com/ktg5/asbumpbot`
2. Install required packages - `npm i`
3. Open `auth.json` and replace all the listed keys (api & access) with your own. 
* ⚠⚠ Remember to **make sure your access keys are "`Created with Read, and Write permissions`" by enabling "`User authentication`" in your Twitter app's page!**
4. Start the bot - `npm start`
