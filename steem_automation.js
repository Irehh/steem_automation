// require('dotenv').config(); // Load environment variables from .env
// const { TelegramClient } = require('telegram');
// const { StringSession } = require('telegram/sessions');
// const { OpenAI } = require('openai');
// const fs = require('fs');
// const readline = require('readline');

// // Load environment variables
// const apiId = parseInt(process.env.API_ID); // Ensure it's a number
// const apiHash = process.env.API_HASH;
// const phoneNumber = process.env.PHONE_NUMBER;
// const password = process.env.PASSWORD;
// const openaiApiKey = process.env.OPENAI_API_KEY;
// const channelUsername = process.env.CHANNEL_USERNAME;

// // Session file
// const sessionFile = 'session.txt';
// let sessionString = '';
// if (fs.existsSync(sessionFile)) {
//   sessionString = fs.readFileSync(sessionFile, 'utf8').trim();
// }
// const stringSession = new StringSession(sessionString);

// // OpenAI client
// const openai = new OpenAI({ apiKey: openaiApiKey });

// // Log file
// const logFile = 'logs.txt';

// // Initialize Telegram client
// const client = new TelegramClient(stringSession, apiId, apiHash, {
//   connectionRetries: 5,
// });

// // Create readline interface for user input
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// // Function to prompt user for input
// const askQuestion = (question) =>
//   new Promise((resolve) =>
//     rl.question(question, (answer) => resolve(answer.trim()))
//   );

// // Function to handle errors with delays (e.g., FloodWaitError)
// async function handleErrorWithDelay(error) {
//   if (error.errorMessage === 'FLOOD' && error.seconds) {
//     console.log(`FloodWaitError: Waiting for ${error.seconds} seconds...`);
//     await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
//     return true; // Retry after delay
//   } else if (error.code === 420 || error.errorMessage.includes('TOO_MANY')) {
//     // Handle other rate-limiting errors (e.g., 420 Too Many Requests)
//     const waitTime = error.seconds || 60; // Default to 60 seconds if unspecified
//     console.log(`Rate Limit Error: Waiting for ${waitTime} seconds...`);
//     await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
//     return true; // Retry after delay
//   }
//   return false; // Do not retry
// }

// // Connect to Telegram
// async function connectToTelegram() {
//   try {
//     if (!sessionString) {
//       // First-time login
//       await client.start({
//         phoneNumber: async () => phoneNumber,
//         password: async () => password || (await askQuestion('Enter your 2FA password (if any): ')),
//         phoneCode: async () => await askQuestion('Enter the code you received: '),
//         onError: (err) => console.log('Auth Error:', err),
//       });

//       // Save the session string to file
//       const newSession = client.session.save();
//       fs.writeFileSync(sessionFile, newSession, 'utf8');
//       console.log('Session saved to session.txt');
//     } else {
//       await client.connect(); // Use existing session
//     }

//     console.log('Connected to Telegram!');
//     rl.close();
//     return true;
//   } catch (error) {
//     if (await handleErrorWithDelay(error)) {
//       return await connectToTelegram(); // Retry after delay
//     } else {
//       console.error('Error connecting to Telegram:', error);
//       rl.close();
//       return false;
//     }
//   }
// }

// // Function to fetch the latest post from the channel
// async function fetchLatestPost() {
//   try {
//     const channel = await client.getEntity(channelUsername);
//     const messages = await client.getMessages(channel, { limit: 1 }); // Fetch the latest post

//     if (messages.length > 0) {
//       const message = messages[0];
//       const text = message.message || '';
//       const image = message.photo ? await downloadImage(message.photo) : null;
//       const sourceLink = extractSourceLink(text);

//       console.log('Text:', text);
//       console.log('Image:', image);
//       console.log('Source Link:', sourceLink);

//       // Analyze the text with AI
//       const analyzedText = await analyzeWithAI(text);
//       console.log('Analyzed Text:', analyzedText);

//       // Log the results to a file
//       const logEntry = `
//         Date: ${new Date().toISOString()}
//         Text: ${text}
//         Image: ${image ? 'Available' : 'Not Available'}
//         Source Link: ${sourceLink}
//         Analyzed Text: ${analyzedText}
//         ------------------------------------------
//       `;

//       fs.appendFileSync(logFile, logEntry, 'utf8');
//       console.log('Log written to file!');
//     }
//   } catch (error) {
//     if (await handleErrorWithDelay(error)) {
//       await fetchLatestPost(); // Retry after delay
//     } else {
//       console.error('Error fetching post:', error);
//     }
//   }
// }

// // Function to download image (if any)
// async function downloadImage(photo) {
//   const buffer = await client.downloadMedia(photo, {});
//   return buffer.toString('base64'); // Return base64 encoded image
// }

// // Function to extract the source link from the text
// function extractSourceLink(text) {
//   const sourceRegex = /Source \((https?:\/\/[^\s]+)\)/;
//   const match = text.match(sourceRegex);
//   return match ? match[1] : null;
// }

// // Function to analyze text with OpenAI
// async function analyzeWithAI(text) {
//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: `Analyze this text: ${text}` }],
//     });
//     return response.choices[0].message.content;
//   } catch (error) {
//     if (error.status === 429 || error.message.includes('rate limit')) {
//       console.log('OpenAI Rate Limit: Waiting for 60 seconds...');
//       await new Promise((resolve) => setTimeout(resolve, 60000));
//       return await analyzeWithAI(text); // Retry after delay
//     }
//     console.error('Error analyzing text:', error);
//     return null;
//   }
// }

// // Main execution
// (async () => {
//   const connected = await connectToTelegram();
//   if (connected) {
//     await fetchLatestPost();
//   }
// })();

require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { OpenAI } = require('openai');
const fs = require('fs');
const readline = require('readline');

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const phoneNumber = process.env.PHONE_NUMBER;
const password = process.env.PASSWORD;
const openaiApiKey = process.env.OPENAI_API_KEY;
const channelUsername = process.env.CHANNEL_USERNAME;

const sessionFile = 'session.txt';
let sessionString = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, 'utf8').trim() : '';
const stringSession = new StringSession(sessionString);

const openai = new OpenAI({ apiKey: openaiApiKey });
const logFile = 'logs.txt';

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
  timeout: 30000, // Increased timeout
  useWSS: false,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question) =>
  new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

async function handleErrorWithDelay(error) {
  if (error.errorMessage === 'FLOOD' && error.seconds) {
    console.log(`FloodWaitError: Waiting for ${error.seconds} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
    return true;
  } else if (error.code === 420 || error.errorMessage.includes('TOO_MANY')) {
    const waitTime = error.seconds || 60;
    console.log(`Rate Limit Error: Waiting for ${waitTime} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    return true;
  } else if (error.message === 'TIMEOUT' || error.message === 'Not connected') {
    console.log('Connection Issue: Waiting 10 seconds before retrying...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return true;
  }
  return false;
}

async function connectToTelegram() {
  try {
    if (!sessionString) {
      await client.start({
        phoneNumber: async () => phoneNumber,
        password: async () => password || (await askQuestion('Enter your 2FA password (if any): ')),
        phoneCode: async () => await askQuestion('Enter the code you received: '),
        onError: (err) => console.log('Auth Error:', err),
      });
      const newSession = client.session.save();
      fs.writeFileSync(sessionFile, newSession, 'utf8');
      console.log('Session saved to session.txt');
    } else {
      await client.connect();
    }
    client._updateLoop = () => {}; // Disable update loop
    console.log('Connected to Telegram!');
    rl.close();
    return true;
  } catch (error) {
    if (await handleErrorWithDelay(error)) {
      return await connectToTelegram();
    } else {
      console.error('Error connecting to Telegram:', error);
      rl.close();
      return false;
    }
  }
}

async function fetchLatestPost() {
  try {
    const channel = await client.getEntity(channelUsername);
    const messages = await client.getMessages(channel, { limit: 1 });

    if (messages.length > 0) {
      const message = messages[0];
      const text = message.message || '';
      const image = message.photo ? await downloadImage(message.photo) : null;
      const sourceLink = extractSourceLink(text);

      console.log('Text:', text);
      console.log('Image:', image);
      console.log('Source Link:', sourceLink);

      const analyzedText = await analyzeWithAI(text);
      console.log('Analyzed Text:', analyzedText);

      const logEntry = `
        Date: ${new Date().toISOString()}
        Text: ${text}
        Image: ${image ? 'Available' : 'Not Available'}
        Source Link: ${sourceLink}
        Analyzed Text: ${analyzedText}
        ------------------------------------------
      `;
      fs.appendFileSync(logFile, logEntry, 'utf8');
      console.log('Log written to file!');
    }
  } catch (error) {
    if (await handleErrorWithDelay(error)) {
      await fetchLatestPost();
    } else {
      console.error('Error fetching post:', error);
    }
  }
}

async function downloadImage(photo) {
  const buffer = await client.downloadMedia(photo, {});
  return buffer.toString('base64');
}

function extractSourceLink(text) {
  const sourceRegex = /Source \((https?:\/\/[^\s]+)\)/;
  const match = text.match(sourceRegex);
  return match ? match[1] : null;
}

async function analyzeWithAI(text) {
  let retries = 0;
  const maxRetries = 5;
  while (retries < maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Analyze this text: ${text}` }],
      });
      return response.choices[0].message.content;
    } catch (error) {
      if (error.status === 429 || error.message.includes('rate limit')) {
        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`OpenAI Rate Limit: Waiting for ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        retries++;
      } else {
        console.error('Error analyzing text:', error);
        return null;
      }
    }
  }
  console.error('Max retries reached for OpenAI API');
  return null;
}

(async () => {
  const connected = await connectToTelegram();
  if (connected) {
    await fetchLatestPost();
  }
})();