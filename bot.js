const { client, logger } = require("./botAuth");
const https = require('https');
const fs = require('fs');
const schedule = require('node-schedule');
const config = require('./config.json');

// getRandomArbitrary
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Check if the user is stupid
if (config.hours.includes('.')) {
    logger.error(`Don't put dots in the f**kin' hours value in your config! Use the "minutes" value instead!!!`);
    process.exit();
}

console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
logger.info(config.everyHourandaHour ? "Starting process when it hits every hour and a half..." : `Starting process when it hits every ${config.hours} hour(s)...`);


// Make sure the media folder exists
const mediaFolder = fs.existsSync('media/');
if (mediaFolder === false) {
    logger.info('Creating "media" folder...');
    fs.mkdirSync('media');
    logger.info('Created "media" folder!');
}


var currentMedia;
var restartCount = 0;

// Start function
function startProcess(defiendClip) {

    // Make video file.
    var bumpNum = getRandomArbitrary(1, 8749);;
    var url = `https://static.bumpworthy.com/bumps/${bumpNum}.d.mp4` // Get bump video file.
    var filepath = `media/${bumpNum}.mp4` // Set export locaiton.

    // If the proccess was possibly restarted, we'll skip another download
    if (!defiendClip) {
        // Download video.
        const file = fs.createWriteStream(filepath);
        const thing = https.get(url, (res) => {
            res.pipe(file);

            file.on('finish', async () => { // When file is done downloaded.
                file.close();

                if (file.bytesWritten <= 500) {
                    logger.error(`The bump received (ID: ${bumpNum}) might be not be an actual file.`)
                    if (restartCount >= 5) {
                        logger.error(`Too many restarts! Not going to continue.`);
                        return restartCount = 0;
                    } else {
                        logger.error(`Restarting...`);
                        startProcess();
                        restartCount++;
                    }
                } else currentMedia = filepath;

                console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
                logger.info(`Download Completed - Bump #${bumpNum}`);

                getToTweeting(filepath);
            });
        });
    } else getToTweeting(defiendClip);


    async function getToTweeting(filepath) {
        console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
        logger.info('Upload Started...');

        var dotfilepath = `./${filepath}`;

        // Now we're gonna try to upload the media & tweets.
        try {
            
            // Upload media first...
            let mediaId = await client.v1.uploadMedia(dotfilepath);
            logger.info('Upload Completed -', mediaId);

            // Add alt text.
            let altTxt = '';
            if (!config.addReplyInsteadofAlt || config.addReplyInsteadofAlt != true) altTxt = `[source: https://bumpworthy.com/bumps/${bumpNum}]`;

            // Then we can send in the tweet.
            var mainTweet = await client.v2.tweet(altTxt, { media: { media_ids: [mediaId] } });
            console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
            logger.info(`Sent main tweet; https://twitter.com/${config.username}/status/${mainTweet.data.id}`);

            // Reply if user wants to use up rate limits.
            if (config.addReplyInsteadofAlt == true) {
                var replyTweet = await client.v2.reply(`[source: https://bumpworthy.com/bumps/${bumpNum}]`, mainTweet.data.id);
                logger.info(`Sent reply tweet; https://twitter.com/${config.username}/status/${replyTweet.data.id}`);
            }
        
        } catch (error) {
            logger.error(`Tweet failed! "${error.message}"`);
            if (restartCount >= 5) {
                logger.error(`Too many restarts! Not going to continue.`);
                return restartCount = 0;
            } else {
                logger.error(`Restarting...`);
                startProcess(filepath);
                restartCount++;
            }
            return;
        }
    }
};

// Start the process for dev purposes.
// startProcess();

// After it hits the every hour the user defined, start again.
let nodeSchedule = `* */${config.hours} * * *`;
if (config.everyHourandaHour) nodeSchedule = `0 */3 * * *`;
var j = schedule.scheduleJob(nodeSchedule, () => {  // this for one hour
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    logger.info(`Time hit! Redoing process...`)
    startProcess();
});
if (config.everyHourandaHour) {
    var l = schedule.scheduleJob("30 1-23/3 * * *", () => {  // this for one hour
        console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
        logger.info(`Time hit! Redoing process...`)
        startProcess();
    });
}
