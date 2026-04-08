import { client, logger } from "./botAuth.js";
import https from 'https';
import fs from 'fs';
import schedule from 'node-schedule';
import config from './config.json' with { type: "json" };

// getRandomArbitrary
function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}


console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
if (config.minutes !== 0) logger.warn('"config.minutes" set! Using minutes instead of hours');
logger.info(`Starting process when it hits every ${config.minutes ? `${config.minutes} minute(s)...` : `${config.hours} hour(s)...`}`);


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
function startProcess(defiendClip?: string) {

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


    async function getToTweeting(filepath: string) {
        console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
        logger.info('Upload Started...');

        var dotfilepath = `./${filepath}`;

        // Now we're gonna try to upload the media & tweets.
        try {
            
            // Upload media first...
            let media = await client.media.create(dotfilepath);
            logger.info('Upload Completed -', media);

            // Add alt text.
            let altTxt = '';
            if (!config.addReplyInsteadofAlt || config.addReplyInsteadofAlt != true) altTxt = `[source: https://bumpworthy.com/bumps/${bumpNum}]`;

            // Then we can send in the tweet.
            var mainTweet = await client.tweets.create(altTxt, {
                mediaIds: [media.media_id_string],
            });
            console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
            const me = await client.account.viewer();
            logger.info(`Sent main tweet; https://twitter.com/${me.username}/status/${mainTweet.id}`);

            // Reply if user wants to use up rate limits.
            if (config.addReplyInsteadofAlt == true) {
                var replyTweet = await client.tweets.create(`[source: https://bumpworthy.com/bumps/${bumpNum}]`, {
                    replyTo: mainTweet.id
                });
                logger.info(`Sent reply tweet; https://twitter.com/${me.username}/status/${replyTweet.id}`);
            }
        
        } catch (error: any) {
            logger.error(`Tweet failed! "${error.message}"`);
            console.error(error);
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

// Get time and convert it for use for the schedule
let nodeSchedule = `0 */${config.hours} * * *`;
if (config.minutes !== 0) nodeSchedule = `*/${config.minutes} * * * *`;
var j = schedule.scheduleJob(nodeSchedule, () => {  // this for one hour
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    logger.info(`Time hit! Redoing process...`)
    startProcess();
});
