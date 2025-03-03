


//     const { TelegramClient } = require('telegram');
// const { StringSession } = require('telegram/sessions');
// const { OpenAI } = require('openai');
// const fs = require('fs');

// // Telegram API credentials
// const apiId = 20534768; // Replace with your API ID (as a number)
// const apiHash = 'e60df455305aa7ee597523f9ef65f5cc'; // Replace with your API hash
// const stringSession = new StringSession(''); // Leave empty for now

// // OpenAI API key
// const openai = new OpenAI({
//   apiKey: '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', // Replace with your OpenAI API key
// });

// // Telegram channel username
// const channelUsername = 'telonews'; // Replace with the channel username

// // Log file
// const logFile = 'logs.txt';

// // Initialize Telegram client
// const client = new TelegramClient(stringSession, apiId, apiHash, {
//   connectionRetries: 5,
// });

// // Function to handle FloodWaitError
// async function handleFloodWaitError(error) {
//   if (error.errorMessage === 'FLOOD' && error.seconds) {
//     console.log(`FloodWaitError: Waiting for ${error.seconds} seconds...`);
//     await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
//     return true; // Retry after waiting
//   }
//   return false; // Do not retry
// }

// // Connect to Telegram
// (async () => {
//   try {
//     await client.start({
//       phoneNumber: '+2348104441382', // Replace with your phone number
//       password: async () => 'TelegraM+419666', // Replace with your 2FA password (if any)
//       phoneCode: async () => '25106', // Replace with the code sent to your phone
//       onError: (err) => console.log(err),
//     });
//     console.log('Connected to Telegram!');

//     // Fetch and process the latest post
//     await fetchLatestPost();
//   } catch (error) {
//     if (await handleFloodWaitError(error)) {
//       // Retry after waiting
//       await fetchLatestPost();
//     } else {
//       console.error('Error connecting to Telegram:', error);
//     }
//   }
// })();

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

//       // Append the log entry to the file
//       fs.appendFileSync(logFile, logEntry, 'utf-8');
//       console.log('Log written to file!');
//     }
//   } catch (error) {
//     if (await handleFloodWaitError(error)) {
//       // Retry after waiting
//       await fetchLatestPost();
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
//     console.error('Error analyzing text:', error);
//     return null;
//   }
// }


const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { OpenAI } = require('openai');
const fs = require('fs');
const readline = require('readline'); // Add this for user input

// Telegram API credentials
const apiId = 20534768; // Replace with your API ID (as a number)
const apiHash = 'e60df455305aa7ee597523f9ef65f5cc'; // Replace with your API hash
const stringSession = new StringSession(''); // Leave empty for first run

// OpenAI API key
const openai = new OpenAI({
  apiKey: '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', // Replace with your OpenAI API key
});

// Telegram channel username
const channelUsername = 'telonews'; // Replace with the channel username

// Log file
const logFile = 'logs.txt';

// Initialize Telegram client
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt user for input
const askQuestion = (question) =>
  new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer.trim()))
  );

// Function to handle FloodWaitError
async function handleFloodWaitError(error) {
  if (error.errorMessage === 'FLOOD' && error.seconds) {
    console.log(`FloodWaitError: Waiting for ${error.seconds} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
    return true; // Retry after waiting
  }
  return false; // Do not retry
}

// Connect to Telegram
(async () => {
  try {
    await client.start({
      phoneNumber: async () => await askQuestion('Enter your phone number (e.g., +2348104441382): '),
      password: async () => await askQuestion('Enter your 2FA password (if any): '),
      phoneCode: async () => await askQuestion('Enter the code you received: '),
      onError: (err) => console.log(err),
    });

    // Save the session string for future use
    console.log('Connected to Telegram!');
    console.log('Session string:', client.session.save()); // Save this for reuse
    rl.close();

    // Fetch and process the latest post
    await fetchLatestPost();
  } catch (error) {
    if (await handleFloodWaitError(error)) {
      await fetchLatestPost(); // Retry after waiting
    } else {
      console.error('Error connecting to Telegram:', error);
      rl.close();
    }
  }
})();

// Function to fetch the latest post from the channel
async function fetchLatestPost() {
  try {
    const channel = await client.getEntity(channelUsername);
    const messages = await client.getMessages(channel, { limit: 1 }); // Fetch the latest post

    if (messages.length > 0) {
      const message = messages[0];
      const text = message.message || '';
      const image = message.photo ? await downloadImage(message.photo) : null;
      const sourceLink = extractSourceLink(text);

      console.log('Text:', text);
      console.log('Image:', image);
      console.log('Source Link:', sourceLink);

      // Analyze the text with AI
      const analyzedText = await analyzeWithAI(text);
      console.log('Analyzed Text:', analyzedText);

      // Log the results to a file
      const logEntry = `
        Date: ${new Date().toISOString()}
        Text: ${text}
        Image: ${image ? 'Available' : 'Not Available'}
        Source Link: ${sourceLink}
        Analyzed Text: ${analyzedText}
        ------------------------------------------
      `;

      fs.appendFileSync(logFile, logEntry, 'utf-8');
      console.log('Log written to file!');
    }
  } catch (error) {
    if (await handleFloodWaitError(error)) {
      await fetchLatestPost(); // Retry after waiting
    } else {
      console.error('Error fetching post:', error);
    }
  }
}

// Function to download image (if any)
async function downloadImage(photo) {
  const buffer = await client.downloadMedia(photo, {});
  return buffer.toString('base64'); // Return base64 encoded image
}

// Function to extract the source link from the text
function extractSourceLink(text) {
  const sourceRegex = /Source \((https?:\/\/[^\s]+)\)/;
  const match = text.match(sourceRegex);
  return match ? match[1] : null;
}

// Function to analyze text with OpenAI
async function analyzeWithAI(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Analyze this text: ${text}` }],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing text:', error);
    return null;
  }
}