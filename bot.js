const {config, client, logger} = require("./botAuth");
const http = require('http');
const fs = require('fs');

// getRandomArbitrary
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Get bot Username (can only be called when Twitter wakes up)
async function getUsername() {
    return (await client.v2.me()).data.username;
}

console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
logger.info(`Starting process...`)
// START
// Time for how long until new clip is uploaded
var time = config.time * 60000;
// Start function
function startProcess() {

    // Make video file.
    var bumpNum = getRandomArbitrary(1, 8749);;
    var url = `http://static.bumpworthy.com/bumps/${bumpNum}.d.mp4` // Get bump video file.
    var filepath = `media/${bumpNum}.mp4` // Set export locaiton.

    // Check to see if the video already exists.
    var checkFile = fs.existsSync(filepath)
    if (checkFile = false) {
        logger.error(`Media failed, a video file with the name is in the "media" folder. Restart to try again.`)
        return;
    }

    // Download video.
    const file = fs.createWriteStream(filepath);
    const thing = http.get(url, (response) => {
        response.pipe(file);

        file.on('finish', async () => { // When file is done downloaded.
            file.close();

            if (file.bytesWritten <= 500) {
                logger.error(`The bump received (ID: ${bumpNum}) might be not be an actual file.`)
                logger.error(`At the moment, the only way to solve this is to restart, sorry... :(`)
                return;
            }

            console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
            logger.info('Download Completed');

            console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
            logger.info('Upload Started...');

            var filePath = `./${filepath}`;

            // Upload media first...
            const mediaIds = await Promise.all([
                client.v1.uploadMedia(filePath),
            ]);
            logger.info('Upload Completed');

            // Then we can send in the tweet.
            var mainTweet = await client.v1.tweet('', { media_ids: mediaIds })
            console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
            // get bot username for logs
            var botUsername = await getUsername();
            logger.info(`Sent main tweet; https://twitter.com/${botUsername}/status/${mainTweet.id_str}`);

            // Oh! Don't forget the reply!
            var replyTweet = await client.v1.reply(`[source: https://bumpworthy.com/bumps/${bumpNum}]`, mainTweet.id_str);
            logger.info(`Sent reply tweet; https://twitter.com/${botUsername}/status/${replyTweet.id_str}`);
        });
    });
};

// Start the bot when first loaded.
startProcess();

// After a while, start again.
setInterval(() => {
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    logger.info(`Time hit! Redoing process...`)
    startProcess();
}, time);