
// require('dotenv').config();
// const { TelegramClient } = require('telegram');
// const { StringSession } = require('telegram/sessions');
// const OpenAI = require('openai'); // Ensure `npm install openai` is run
// const fs = require('fs');
// const readline = require('readline');

// const apiId = parseInt(process.env.API_ID);
// const apiHash = process.env.API_HASH;
// const phoneNumber = process.env.PHONE_NUMBER;
// const password = process.env.PASSWORD;
// const githubToken = process.env.GITHUB_TOKEN; // Use GitHub PAT
// const channelUsername = process.env.CHANNEL_USERNAME;

// const sessionFile = 'session.txt';
// let sessionString = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, 'utf8').trim() : '';
// const stringSession = new StringSession(sessionString);

// // Initialize OpenAI client for GitHub Models
// const openai = new OpenAI({
//   baseURL: 'https://models.inference.ai.azure.com', // GitHub Models endpoint
//   apiKey: githubToken, // Use GitHub PAT
// });

// const logFile = 'logs.txt';

// const client = new TelegramClient(stringSession, apiId, apiHash, {
//   connectionRetries: 5,
//   timeout: 30000,
//   useWSS: false,
// });

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// const askQuestion = (question) =>
//   new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

// async function handleErrorWithDelay(error) {
//   if (error.errorMessage === 'FLOOD' && error.seconds) {
//     console.log(`FloodWaitError: Waiting for ${error.seconds} seconds...`);
//     await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
//     return true;
//   } else if (error.code === 420 || error.errorMessage.includes('TOO_MANY')) {
//     const waitTime = error.seconds || 60;
//     console.log(`Rate Limit Error: Waiting for ${waitTime} seconds...`);
//     await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
//     return true;
//   } else if (error.message === 'TIMEOUT' || error.message === 'Not connected') {
//     console.log('Connection Issue: Waiting 10 seconds before retrying...');
//     await new Promise((resolve) => setTimeout(resolve, 10000));
//     return true;
//   }
//   return false;
// }

// async function connectToTelegram() {
//   try {
//     if (!sessionString) {
//       await client.start({
//         phoneNumber: async () => phoneNumber,
//         password: async () => password || (await askQuestion('Enter your 2FA password (if any): ')),
//         phoneCode: async () => await askQuestion('Enter the code you received: '),
//         onError: (err) => console.log('Auth Error:', err),
//       });
//       const newSession = client.session.save();
//       fs.writeFileSync(sessionFile, newSession, 'utf8');
//       console.log('Session saved to session.txt');
//     } else {
//       await client.connect();
//     }
//     client._updateLoop = () => {}; // Disable update loop
//     console.log('Connected to Telegram!');
//     rl.close();
//     return true;
//   } catch (error) {
//     if (await handleErrorWithDelay(error)) {
//       return await connectToTelegram();
//     } else {
//       console.error('Error connecting to Telegram:', error);
//       rl.close();
//       return false;
//     }
//   }
// }

// async function fetchLatestPost() {
//   try {
//     const channel = await client.getEntity(channelUsername);
//     const messages = await client.getMessages(channel, { limit: 1 });

//     if (messages.length > 0) {
//       const message = messages[0];
//       const text = message.message || '';
//       const image = message.photo ? await downloadImage(message.photo) : null;
//       const sourceLink = extractSourceLink(text);

//       console.log('Text:', text);
//       console.log('Image:', image);
//       console.log('Source Link:', sourceLink);

//       const analyzedText = await analyzeWithAI(text);
//       console.log('Analyzed Text:', analyzedText);

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
//       await fetchLatestPost();
//     } else {
//       console.error('Error fetching post:', error);
//     }
//   }
// }

// async function downloadImage(photo) {
//   const buffer = await client.downloadMedia(photo, {});
//   return buffer.toString('base64');
// }

// function extractSourceLink(text) {
//   const sourceRegex = /Source \((https?:\/\/[^\s]+)\)/;
//   const match = text.match(sourceRegex);
//   return match ? match[1] : null;
// }

// async function analyzeWithAI(text) {
//   let retries = 0;
//   const maxRetries = 5;
//   while (retries < maxRetries) {
//     try {
//       const response = await openai.chat.completions.create({
//         model: 'gpt-4o', // Available in GitHub Models freemium
//         messages: [
//           { role: 'system', content: '' },
//           { role: 'user', content: `Analyze this text: ${text}` },
//         ],
//         temperature: 1,
//         max_tokens: 4096,
//         top_p: 1,
//       });
//       return response.choices[0].message.content;
//     } catch (error) {
//       if (error.status === 429 || error.message.includes('rate limit')) {
//         const waitTime = Math.pow(2, retries) * 1000;
//         console.log(`GitHub Models Rate Limit: Waiting for ${waitTime / 1000} seconds...`);
//         await new Promise((resolve) => setTimeout(resolve, waitTime));
//         retries++;
//       } else if (error.status === 401) {
//         console.error('Authentication Error: Check your GitHub PAT in GITHUB_TOKEN.');
//         return null;
//       } else {
//         console.error('Error analyzing text:', error);
//         return null;
//       }
//     }
//   }
//   console.error('Max retries reached for GitHub Models API');
//   return null;
// }

// (async () => {
//   const connected = await connectToTelegram();
//   if (connected) {
//     await fetchLatestPost();
//   }
// })();

require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const OpenAI = require('openai');
const fs = require('fs');
const readline = require('readline');
const steem = require('steem');

// Set Steem API endpoint
steem.api.setOptions({ url: 'https://api.steemit.com' });

// Configuration
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const phoneNumber = process.env.PHONE_NUMBER;
const password = process.env.PASSWORD;
const githubToken = process.env.GITHUB_TOKEN;
const channelUsername = process.env.CHANNEL_USERNAME;
const steemPrivateKey = '5JHY52X6HqVeVbCuxnT9JaeDaxAZJyTec6cEmzZJ2TbgmxaZgJU'; // Your private posting key
const steemAuthor = 'ireh'; // Your Steem username

const sessionFile = 'session.txt';
const logFile = 'logs.txt';
const imageDir = './images'; // Directory to save images
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);

let sessionString = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, 'utf8').trim() : '';
const stringSession = new StringSession(sessionString);

const openai = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: githubToken,
});

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
  timeout: 30000,
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
    client._updateLoop = () => {};
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

async function downloadImage(photo, messageId) {
  const buffer = await client.downloadMedia(photo, {});
  const filePath = `${imageDir}/post_${messageId}.jpg`; // Save as JPG
  fs.writeFileSync(filePath, buffer);
  return filePath; // Return local file path (to be replaced with hosted URL later)
}

function extractSourceLink(text) {
  const sourceRegex = /Source \((https?:\/\/[^\s]+)\)/;
  const match = text.match(sourceRegex);
  return match ? match[1] : null;
}

async function analyzeAndFilterPost(text, messageId) {
  let retries = 0;
  const maxRetries = 5;
  while (retries < maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `
              You are an AI that filters news posts for a Steem blog. Your task is to:
              1. Remove or replace any references to "telo news" or channel-specific branding (e.g., "▪ Telegram ▪ X ▪ Community") with "Follow our Steem account: @${steemAuthor}".
              2. Determine if the post is relevant to the blockchain or crypto community (e.g., mentions crypto, blockchain, Bitcoin, exchanges, etc.).
              3. Return the filtered text and a boolean indicating if it should be posted.
            `,
          },
          { role: 'user', content: `Filter this text: ${text}` },
        ],
        temperature: 1,
        max_tokens: 4096,
        top_p: 1,
      });
      const result = response.choices[0].message.content.split('\n');
      const filteredText = result[0] || text;
      const shouldPost = result[1] ? result[1].toLowerCase().includes('true') : false;
      return { filteredText, shouldPost };
    } catch (error) {
      if (error.status === 429 || error.message.includes('rate limit')) {
        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`GitHub Models Rate Limit: Waiting for ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        retries++;
      } else if (error.status === 401) {
        console.error('Authentication Error: Check your GitHub PAT in GITHUB_TOKEN.');
        return { filteredText: text, shouldPost: false };
      } else {
        console.error('Error analyzing text:', error);
        return { filteredText: text, shouldPost: false };
      }
    }
  }
  console.error('Max retries reached for GitHub Models API');
  return { filteredText: text, shouldPost: false };
}

async function fetchAndProcessPosts() {
  try {
    const channel = await client.getEntity(channelUsername);
    const messages = await client.getMessages(channel, { limit: 10 }); // Fetch last 10 posts (adjust as needed)
    const filteredPosts = [];

    for (const message of messages) {
      const text = message.message || '';
      const messageId = message.id;
      const telegramLink = `https://t.me/${channelUsername}/${messageId}`;
      const image = message.photo ? await downloadImage(message.photo, messageId) : null;
      const sourceLink = extractSourceLink(text);

      const { filteredText, shouldPost } = await analyzeAndFilterPost(text, messageId);

      if (shouldPost) {
        const postEntry = {
          text: filteredText,
          link: telegramLink,
          image: image ? `![Image](file://${image})` : '', // Placeholder; replace with hosted URL later
          sourceLink,
        };
        filteredPosts.push(postEntry);
      }

      console.log(`Post ID: ${messageId}`);
      console.log('Original Text:', text);
      console.log('Filtered Text:', filteredText);
      console.log('Should Post:', shouldPost);
      console.log('Image:', image);
      console.log('Telegram Link:', telegramLink);
      console.log('Source Link:', sourceLink);
      console.log('---');
    }

    return filteredPosts;
  } catch (error) {
    if (await handleErrorWithDelay(error)) {
      return await fetchAndProcessPosts();
    } else {
      console.error('Error fetching posts:', error);
      return [];
    }
  }
}

function formatBlogPost(posts) {
  const date = new Date().toISOString().split('T')[0];
  const title = `Crypto News Digest - ${date}`;
  const caption = `
    Stay ahead in the blockchain world with today's top crypto news! From exchange updates to regulatory shifts, here’s what’s shaping the future of digital assets. Follow our Steem account: @${steemAuthor} for more insights!
  `;
  const postList = posts
    .map((post) => {
      const textWithLink = `${post.text} ([Source](${post.link}))`;
      return `${post.image ? post.image + '\n' : ''}⚫ ${textWithLink}`;
    })
    .join('\n');

  const body = `${caption}\n\n${postList}`;
  const mainTag = 'cryptocurrency';
  const additionalTags = ['blockchain', 'news', 'crypto', 'steemit'];
  const permlink = `${mainTag}-${title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
  const jsonMetadata = JSON.stringify({
    tags: [mainTag, ...additionalTags],
    app: 'crypto-news-bot/1.0',
  });

  return { title, body, permlink, mainTag, jsonMetadata };
}

async function postToSteem({ title, body, permlink, mainTag, jsonMetadata }) {
  return new Promise((resolve, reject) => {
    steem.broadcast.comment(
      steemPrivateKey,
      '',
      mainTag,
      steemAuthor,
      permlink,
      title,
      body,
      jsonMetadata,
      (err, result) => {
        if (err) {
          console.error('Error posting to Steem:', err);
          reject(err);
        } else {
          console.log('Successfully posted to Steem!');
          console.log('Post URL:', `https://steemit.com/${mainTag}/@${steemAuthor}/${permlink}`);
          resolve(result);
        }
      }
    );
  });
}

(async () => {
  const connected = await connectToTelegram();
  if (connected) {
    const filteredPosts = await fetchAndProcessPosts();
    if (filteredPosts.length > 0) {
      const blogPost = formatBlogPost(filteredPosts);
      await postToSteem(blogPost);
    } else {
      console.log('No posts met the criteria for posting.');
    }
  }
})();