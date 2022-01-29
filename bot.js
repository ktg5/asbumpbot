const Twit = require('twit')
var config = require('./config.json')
const http = require('http');
const fs = require('fs');
var logger = require('winston');


// Verify bot. 
var bot = new Twit({
  consumer_key:         config.consumer_key,
  consumer_secret:      config.consumer_key_secret,
  access_token:         config.access_token,
  access_token_secret:  config.access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';


// getRandomArbitrary
function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Make video file.
var bumpNum = getRandomArbitrary(1, 8749);
var url = `http://static.bumpworthy.com/bumps/${bumpNum}.d.mp4` // Get bump video file.
var filepath = `media/${bumpNum}.mp4` // Set export locaiton.

// Check to see if the video already exists.
var checkFile = fs.existsSync(filepath)
console.log(checkFile)
if (checkFile = false) {
  logger.error(`Media failed, a video file with the name is in the "media" folder. Restart to try again.`)
  return;
}

const file = fs.createWriteStream(filepath);
const request = http.get(url, (response) => {
  response.pipe(file);

  file.on('finish',() => { // When file is done downloaded.

    file.close();
    console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
    logger.info('Download Completed');

    var filePath = `./${filepath}`
    bot.postMediaChunked({ file_path: filePath }, function (err, data, response) {
      console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
      if (err) {
        logger.error("postMediaChunked error")
        console.log(err)
        return;
      }

      // Log media chunk info. (FOR DEBUG)
      // logger.info("postMediaChunked data:")
      // console.log(data)

      const mediaIdStr = data.media_id_string;
      const meta_params = { media_id: mediaIdStr };
  
      pollStatus(bot, mediaIdStr, 0, function() {
        // Create media metadata.
        bot.post('media/metadata/create', meta_params, function (err, data, response) {
          console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);
          if (!err) {
            // Make the tweet params.
            var params = { media_ids: [mediaIdStr] }
      
            bot.post('statuses/update', params, function (err, data, response) {
              logger.info(`Main tweet posted: https://twitter.com/${config.botUsername}/status/${data.id_str}`)

              // Log tweet data (FOR DEBUG)
              // logger.info("statuses/update data:")
              // console.log(data)

              var mainTweet = data.id_str;

              bot.post('statuses/update', {status: `[source: https://bumpworthy.com/bumps/${bumpNum}]`, in_reply_to_status_id: mainTweet}, function (err, data, response) {
                logger.info(`Reply tweet posted: https://twitter.com/${config.botUsername}/status/${data.id_str}`)
              
                // Log tweet data (FOR DEBUG)
                // logger.info("statuses/update data:")
                // console.log(data)
              });
            });
          } else {
            // If something happened.
            logger.error("media/metadata/create error:")
            console.log(err)
          }
        });
      });
    });
  });
});

console.log(`ｰｰｰｰｰｰｰｰｰｰ✄ｰｰｰｰｰｰｰｰｰｰ`);


// Get media status from Twitter for uploading media.
function pollStatus(bot, mediaIdStr, progressPercent, callback) {
  bot.get("media/upload", { command: "STATUS", media_id: mediaIdStr }, function(err, data, response) {
    // Log media data (FOR DEBUG)
    // console.log(data)

    if (progressPercent == 2) {
      logger.error(`Media failed, the video can not be uploaded. Restart to try again.`)
      return
    }

    if (err) {
      // If something happened.
      logger.error("pollStatus error:")
      console.log(err)
      return
    } else {
      if (data && data.processing_info && data.processing_info.state === "succeeded") { // When the media is uploaded.
        logger.info("Media uploaded.")
        callback(); // Go back to main code.
      } else {
        logger.info(`Media is uploading. Progress: ${data.processing_info.progress_percent}, retrying...`)

        if (data.processing_info.progress_percent == "100") {
          progressPercent++
        }

        setTimeout(() => {pollStatus(bot, mediaIdStr, progressPercent, callback, err)}, 1000); // Retry after the secs provided by Twitter.
      }
    }
  })
}