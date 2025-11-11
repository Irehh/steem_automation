// require("dotenv").config();
// const axios = require("axios");
// const cheerio = require("cheerio");
// const OpenAI = require("openai");
// const fs = require("fs");
// const path = require("path");
// const steem = require("steem");
// const crypto = require("crypto");

// // Set Steem API endpoint
// steem.api.setOptions({ url: "https://api.steemit.com" });

// // Configuration
// const githubToken = process.env.GITHUB_TOKEN;
// const steemPrivateKey = process.env.STEEM_PRIVATE_KEY;
// const steemAuthor = process.env.STEEM_AUTHOR || "ireh";
// const imgurClientId = process.env.IMGUR_CLIENT_ID;
// const defaultImageUrl = process.env.DEFAULT_IMAGE_URL || "https://i.imgur.com/default.jpg";
// const addControversial = process.env.ADD_CONTROVERSIAL_STATEMENT === "true";
// const urlsFile = "urls.txt";
// const logFile = "logs.txt";
// const imageDir = "./images";
// const imageHashFile = "image_hashes.json";

// // Create image directory
// if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);

// // Load image hash database for deduplication
// let imageHashDb = {};
// if (fs.existsSync(imageHashFile)) {
//   try {
//     imageHashDb = JSON.parse(fs.readFileSync(imageHashFile, "utf8"));
//   } catch (e) {
//     logMessage("Error loading image hash database: " + e.message);
//     imageHashDb = {};
//   }
// }

// // Initialize OpenAI client
// const openai = new OpenAI({
//   baseURL: "https://models.inference.ai.azure.com",
//   apiKey: githubToken,
// });

// // Helper functions
// const logMessage = (message) => {
//   const timestamp = new Date().toISOString();
//   const logEntry = `[${timestamp}] ${message}\n`;
//   console.log(message);
//   fs.appendFileSync(logFile, logEntry);
// };

// // Calculate MD5 hash for image deduplication
// function calculateImageHash(buffer) {
//   return crypto.createHash("md5").update(buffer).digest("hex");
// }

// // Upload image to Imgur
// async function uploadToImgur(buffer, url) {
//   try {
//     const imageHash = calculateImageHash(buffer);
//     if (imageHashDb[imageHash]) {
//       logMessage(`Using cached Imgur URL for ${url}: ${imageHashDb[imageHash]}`);
//       return imageHashDb[imageHash];
//     }

//     const base64Image = buffer.toString("base64");
//     logMessage(`Uploading image for ${url} to Imgur...`);
//     const response = await axios({
//       method: "post",
//       url: "https://api.imgur.com/3/image",
//       headers: {
//         Authorization: `Client-ID ${imgurClientId}`,
//         "Content-Type": "application/json",
//       },
//       data: { image: base64Image, type: "base64" },
//     });

//     if (response.data?.success) {
//       const imgurUrl = response.data.data.link;
//       imageHashDb[imageHash] = imgurUrl;
//       fs.writeFileSync(imageHashFile, JSON.stringify(imageHashDb, null, 2));
//       logMessage(`Uploaded to Imgur: ${imgurUrl}`);
//       return imgurUrl;
//     } else {
//       logMessage(`Imgur upload failed for ${url}`);
//       return null;
//     }
//   } catch (error) {
//     logMessage(`Error uploading to Imgur for ${url}: ${error.message}`);
//     return null;
//   }
// }

// // Load URLs from urls.txt
// const loadUrls = () => {
//   if (fs.existsSync(urlsFile)) {
//     return fs.readFileSync(urlsFile, "utf8")
//       .split("\n")
//       .map(url => url.trim())
//       .filter(url => url && url.startsWith("http"));
//   }
//   logMessage("urls.txt not found or empty");
//   return [];
// };

// // Fetch and parse blog content
// async function fetchBlogContent(url) {
//   try {
//     const response = await axios.get(url, { timeout: 10000, responseType: "arraybuffer" });
//     const $ = cheerio.load(response.data.toString("utf8"));

//     // Extract headline
//     const headline = $("h1").first().text().trim() ||
//                     $("title").text().trim() ||
//                     "No Headline Found";

//     // Extract content
//     const contentSelectors = [
//       "article",
//       ".post-content",
//       ".entry-content",
//       "main",
//       ".content",
//       "div[class*='article']",
//       "div[class*='post']",
//     ];
//     let content = "";
//     for (const selector of contentSelectors) {
//       const text = $(selector).text().trim();
//       if (text.length > 100) {
//         content = text;
//         break;
//       }
//     }
//     if (!content) content = $("body").text().trim();

//     // Extract first image
//     let imageUrl = $("img").first().attr("src");
//     let imageBuffer = null;
//     if (imageUrl) {
//       if (!imageUrl.startsWith("http")) {
//         imageUrl = new URL(imageUrl, url).href;
//       }
//       try {
//         const imgResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
//         imageBuffer = Buffer.from(imgResponse.data);
//       } catch (error) {
//         logMessage(`Error fetching image for ${url}: ${error.message}`);
//       }
//     }

//     return {
//       headline,
//       content: content.substring(0, 5000),
//       url,
//       imageBuffer,
//     };
//   } catch (error) {
//     logMessage(`Error fetching ${url}: ${error.message}`);
//     return null;
//   }
// }

// // Analyze and summarize post
// async function analyzeAndSummarizePost({ headline, content, url, imageBuffer }) {
//   let retries = 0;
//   const maxRetries = 5;

//   while (retries < maxRetries) {
//     try {
//       const prompt = `
//         You're a crypto bro with strong opinions, breaking down blog posts for your crew. For this post:
//         1. Write a short, hype summary (100-150 words) that's straight-up, bold, and sounds like you're talking to your buddies. No boring formal stuff.
//         2. ${addControversial ? "Drop a spicy hot take (1-2 sentences) to get people riled up." : ""}
//         3. Pick a category (like "Market Moves", "Regulations", "Project Hype").
//         4. Return JSON with:
//            - "summary": Your hype summary
//            - "isNews": True if it's legit news
//            - "confidence": 0-100 on how newsworthy it is
//            - "category": The category
//            ${addControversial ? '- "hotTake": Your spicy take' : ""}
//       `;
//       const response = await openai.chat.completions.create({
//         model: "gpt-4o",
//         messages: [
//           { role: "system", content: prompt },
//           { role: "user", content: `Headline: ${headline}\n\nContent: ${content}\n\nSource: ${url}` },
//         ],
//         temperature: 0.8,
//         max_tokens: 500,
//         response_format: { type: "json_object" },
//       });

//       const result = JSON.parse(response.choices[0].message.content);
//       const imgurUrl = imageBuffer ? await uploadToImgur(imageBuffer, url) : null;
//       return {
//         title: headline,
//         summary: result.summary || content.substring(0, 150),
//         shouldPost: result.isNews === true,
//         confidence: result.confidence || 0,
//         category: result.category || "Crypto",
//         hotTake: result.hotTake || "",
//         sourceLink: url,
//         image: imgurUrl || defaultImageUrl,
//       };
//     } catch (error) {
//       if (error.status === 429 || error.message.includes("rate limit")) {
//         const waitTime = Math.pow(2, retries) * 1000;
//         logMessage(`Rate Limit for ${url}: Waiting ${waitTime / 1000} seconds...`);
//         await new Promise(resolve => setTimeout(resolve, waitTime));
//         retries++;
//       } else {
//         logMessage(`Error analyzing ${url}: ${error.message}`);
//         return {
//           title: headline,
//           summary: content.substring(0, 150),
//           shouldPost: false,
//           confidence: 0,
//           category: "Crypto",
//           hotTake: "",
//           sourceLink: url,
//           image: defaultImageUrl,
//         };
//       }
//     }
//   }
//   logMessage(`Max retries reached for ${url}`);
//   return {
//     title: headline,
//     summary: content.substring(0, 150),
//     shouldPost: false,
//     confidence: 0,
//     category: "Crypto",
//     hotTake: "",
//     sourceLink: url,
//     image: defaultImageUrl,
//   };
// }

// // Fetch and process posts
// async function fetchAndProcessPosts() {
//   const urls = loadUrls();
//   if (urls.length === 0) {
//     logMessage("No URLs in urls.txt");
//     return [];
//   }

//   const filteredPosts = [];
//   for (const url of urls) {
//     const blogData = await fetchBlogContent(url);
//     if (!blogData) continue;

//     const post = await analyzeAndSummarizePost(blogData);
//     if (post.shouldPost) {
//       filteredPosts.push(post);
//       logMessage(`Processed: ${post.title} (Confidence: ${post.confidence}%, Category: ${post.category})`);
//     } else {
//       logMessage(`Skipped: ${post.title} (Not newsworthy)`);
//     }
//   }
//   return filteredPosts;
// }

// // Format blog post for Steem
// function formatBlogPost(posts) {
//   const date = new Date().toISOString().split("T")[0];
  
//   // Group posts by category
//   const postsByCategory = {};
//   posts.forEach(post => {
//     if (!postsByCategory[post.category]) postsByCategory[post.category] = [];
//     postsByCategory[post.category].push(post);
//   });

//   // Create title
//   const categories = Object.keys(postsByCategory);
//   const title = categories.length > 0
//     ? `Crypto ${categories.slice(0, 2).join(" & ")} Vibes - ${date}`
//     : `Crypto Digest - ${date}`;

//   // Introduction
//   const introduction = `
// ## What's Good in Crypto?

// Yo, here's the latest crypto heat from the blogs we’re vibing with. Let’s dive in!

// `;

//   // Format posts
//   let formattedContent = "";
//   Object.entries(postsByCategory).forEach(([category, categoryPosts]) => {
//     formattedContent += `## ${category}\n\n`;
//     categoryPosts.forEach(post => {
//       formattedContent += `### ${post.title}\n\n`;
//       if (post.image) formattedContent += `![${post.title}](${post.image})\n\n`;
//       formattedContent += `${post.summary}\n\n`;
//       if (post.hotTake && addControversial) {
//         formattedContent += `**Hot Take**: ${post.hotTake}\n\n`;
//       }
//       formattedContent += `*Source: [Check It Out](${post.sourceLink})*\n\n`;
//       formattedContent += `---\n\n`;
//     });
//   });

//   // Footer
//   const footer = `
// *Stay in the loop with [@${steemAuthor}](https://steemit.com/@${steemAuthor}) for daily crypto drops!*
// `;

//   const body = `${introduction}${formattedContent}${footer}`;
//   const mainTag = "cryptocurrency";
//   const additionalTags = ["blockchain", "news", "crypto", "steemit"];
//   const categoryTags = categories
//     .map(cat => cat.toLowerCase().replace(/[^a-z0-9]/g, ""))
//     .filter(tag => tag && !additionalTags.includes(tag))
//     .slice(0, 3);
//   const allTags = [mainTag, ...additionalTags, ...categoryTags].slice(0, 8);
//   const permlink = `${mainTag}-${date.replace(/-/g, "")}-${Date.now().toString().substring(7, 13)}`;
//   const jsonMetadata = JSON.stringify({
//     tags: allTags,
//     app: "steem_automation/1.0",
//     format: "markdown",
//     images: posts.map(p => p.image).filter(Boolean),
//   });

//   return { title, body, permlink, mainTag, jsonMetadata };
// }

// // Post to Steem
// async function postToSteem({ title, body, permlink, mainTag, jsonMetadata }) {
//   return new Promise((resolve, reject) => {
//     steem.broadcast.comment(
//       steemPrivateKey,
//       "",
//       mainTag,
//       steemAuthor,
//       permlink,
//       title,
//       body,
//       jsonMetadata,
//       (err, result) => {
//         if (err) {
//           logMessage(`Error posting to Steem: ${err.message}`);
//           reject(err);
//         } else {
//           logMessage(`Posted to Steem: https://steemit.com/${mainTag}/@${steemAuthor}/${permlink}`);
//           resolve(result);
//         }
//       }
//     );
//   });
// }

// // Main function
// async function main() {
//   // Validate environment variables
//   const requiredVars = ["GITHUB_TOKEN", "STEEM_PRIVATE_KEY", "STEEM_AUTHOR", "IMGUR_CLIENT_ID"];
//   const missingVars = requiredVars.filter(varName => !process.env[varName]);
//   if (missingVars.length > 0) {
//     logMessage(`Missing env vars: ${missingVars.join(", ")}`);
//     return;
//   }

//   const posts = await fetchAndProcessPosts();
//   if (posts.length > 0) {
//     const blogPost = formatBlogPost(posts);
//     await postToSteem(blogPost);
//   } else {
//     logMessage("No posts to drop.");
//   }
// }

// // Run the script
// main().catch(error => {
//   logMessage(`Main error: ${error.message}`);
//   process.exit(1);
// });


require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const steem = require("steem");
const crypto = require("crypto");

// Set Steem API endpoint
steem.api.setOptions({ url: "https://api.steemit.com" });

// Configuration
const githubToken = process.env.GITHUB_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY; // Fallback
const steemPrivateKey = process.env.STEEM_PRIVATE_KEY;
const steemAuthor = process.env.STEEM_AUTHOR || "ireh";
const imgurClientId = process.env.IMGUR_CLIENT_ID;
const defaultImageUrl = process.env.DEFAULT_IMAGE_URL || "https://i.imgur.com/default.jpg";
const addControversial = process.env.ADD_CONTROVERSIAL_STATEMENT === "true";
const urlsFile = "urls.txt";
const logFile = "logs.txt";
const imageDir = "./images";
const imageHashFile = "image_hashes.json";

// Create image directory
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);

// Load image hash database for deduplication
let imageHashDb = {};
if (fs.existsSync(imageHashFile)) {
  try {
    imageHashDb = JSON.parse(fs.readFileSync(imageHashFile, "utf8"));
  } catch (e) {
    logMessage("Error loading image hash database: " + e.message);
    imageHashDb = {};
  }
}

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: githubToken ? "https://models.inference.ai.azure.com" : "https://api.openai.com/v1",
  apiKey: githubToken || openaiApiKey,
});

// Helper functions
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logEntry);
};

// Calculate MD5 hash for image deduplication
function calculateImageHash(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

// Upload image to Imgur
async function uploadToImgur(buffer, url) {
  try {
    const imageHash = calculateImageHash(buffer);
    if (imageHashDb[imageHash]) {
      logMessage(`Using cached Imgur URL for ${url}: ${imageHashDb[imageHash]}`);
      return imageHashDb[imageHash];
    }

    const base64Image = buffer.toString("base64");
    logMessage(`Uploading image for ${url} to Imgur...`);
    const response = await axios({
      method: "post",
      url: "https://api.imgur.com/3/image",
      headers: {
        Authorization: `Client-ID ${imgurClientId}`,
        "Content-Type": "application/json",
      },
      data: { image: base64Image, type: "base64" },
    });

    if (response.data?.success) {
      const imgurUrl = response.data.data.link;
      imageHashDb[imageHash] = imgurUrl;
      fs.writeFileSync(imageHashFile, JSON.stringify(imageHashDb, null, 2));
      logMessage(`Uploaded to Imgur: ${imgurUrl}`);
      return imgurUrl;
    } else {
      logMessage(`Imgur upload failed for ${url}`);
      return null;
    }
  } catch (error) {
    logMessage(`Error uploading to Imgur for ${url}: ${error.message}`);
    return null;
  }
}

// Load URLs from urls.txt
const loadUrls = () => {
  if (fs.existsSync(urlsFile)) {
    return fs.readFileSync(urlsFile, "utf8")
      .split("\n")
      .map(url => url.trim())
      .filter(url => url && url.startsWith("http"));
  }
  logMessage("urls.txt not found or empty");
  return [];
};

// Fetch and parse blog content
async function fetchBlogContent(url) {
  try {
    const response = await axios.get(url, { timeout: 10000, responseType: "arraybuffer" });
    const $ = cheerio.load(response.data.toString("utf8"));

    // Extract headline
    const headline = $("h1").first().text().trim() ||
                    $("title").text().trim() ||
                    "No Headline Found";

    // Extract content
    const contentSelectors = [
      "article",
      ".post-content",
      ".entry-content",
      "main",
      ".content",
      "div[class*='article']",
      "div[class*='post']",
    ];
    let content = "";
    for (const selector of contentSelectors) {
      const text = $(selector).text().trim();
      if (text.length > 100) {
        content = text;
        break;
      }
    }
    if (!content) content = $("body").text().trim();

    // Extract first image
    let imageUrl = $("img").first().attr("src");
    let imageBuffer = null;
    if (imageUrl) {
      if (!imageUrl.startsWith("http")) {
        imageUrl = new URL(imageUrl, url).href;
      }
      try {
        const imgResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        imageBuffer = Buffer.from(imgResponse.data);
      } catch (error) {
        logMessage(`Error fetching image for ${url}: ${error.message}`);
      }
    }

    return {
      headline,
      content: content.substring(0, 5000),
      url,
      imageBuffer,
    };
  } catch (error) {
    logMessage(`Error fetching ${url}: ${error.message}`);
    return null;
  }
}

// Analyze and summarize post
async function analyzeAndSummarizePost({ headline, content, url, imageBuffer }) {
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      const prompt = `
        Yo, you're a crypto bro dropping knowledge for your squad. For this blog post:
        1. Write a short, hype summary (100-150 words) that's straight-up, bold, and sounds like you're hyping up your crew. No lame formal vibes.
        2. ${addControversial ? "Throw in a spicy hot take (1-2 sentences) to stir the pot." : ""}
        3. Pick a category (like "Market Moves", "Regulations", "Project Hype").
        4. Return JSON with:
           - "summary": Your hype summary
           - "category": The category
           ${addControversial ? '- "hotTake": Your spicy take' : ""}
      `;
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Headline: ${headline}\n\nContent: ${content}\n\nSource: ${url}` },
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      const imgurUrl = imageBuffer ? await uploadToImgur(imageBuffer, url) : null;
      return {
        title: headline,
        summary: result.summary || content.substring(0, 150),
        shouldPost: true, // All URLs are newsworthy
        confidence: 90, // Fixed high confidence
        category: result.category || "Crypto",
        hotTake: result.hotTake || "",
        sourceLink: url,
        image: imgurUrl || defaultImageUrl,
      };
    } catch (error) {
      if (error.status === 429 || error.message.includes("rate limit")) {
        const waitTime = Math.pow(2, retries) * 1000;
        logMessage(`Rate Limit for ${url}: Waiting ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } else if (error.status === 401) {
        logMessage(`Auth error for ${url}: Check GITHUB_TOKEN or OPENAI_API_KEY`);
        return {
          title: headline,
          summary: content.substring(0, 150),
          shouldPost: true,
          confidence: 90,
          category: "Crypto",
          hotTake: "",
          sourceLink: url,
          image: imageBuffer ? await uploadToImgur(imageBuffer, url) : defaultImageUrl,
        };
      } else {
        logMessage(`Error analyzing ${url}: ${error.message}`);
        return {
          title: headline,
          summary: content.substring(0, 150),
          shouldPost: true,
          confidence: 90,
          category: "Crypto",
          hotTake: "",
          sourceLink: url,
          image: imageBuffer ? await uploadToImgur(imageBuffer, url) : defaultImageUrl,
        };
      }
    }
  }
  logMessage(`Max retries reached for ${url}`);
  return {
    title: headline,
    summary: content.substring(0, 150),
    shouldPost: true,
    confidence: 90,
    category: "Crypto",
    hotTake: "",
    sourceLink: url,
    image: imageBuffer ? await uploadToImgur(imageBuffer, url) : defaultImageUrl,
  };
}

// Fetch and process posts
async function fetchAndProcessPosts() {
  const urls = loadUrls();
  if (urls.length === 0) {
    logMessage("No URLs in urls.txt");
    return [];
  }

  const filteredPosts = [];
  for (const url of urls) {
    const blogData = await fetchBlogContent(url);
    if (!blogData) continue;

    const post = await analyzeAndSummarizePost(blogData);
    filteredPosts.push(post); // All posts are included
    logMessage(`Processed: ${post.title} (Category: ${post.category})`);
  }
  return filteredPosts;
}

// Format blog post for Steem
function formatBlogPost(posts) {
  const date = new Date().toISOString().split("T")[0];
  
  // Group posts by category
  const postsByCategory = {};
  posts.forEach(post => {
    if (!postsByCategory[post.category]) postsByCategory[post.category] = [];
    postsByCategory[post.category].push(post);
  });

  // Create title
  const categories = Object.keys(postsByCategory);
  const title = categories.length > 0
    ? `Crypto ${categories.slice(0, 2).join(" & ")} Vibes - ${date}`
    : `Crypto Digest - ${date}`;

  // Introduction
  const introduction = `
## What's Poppin' in Crypto?

Yo, here's the latest crypto fire from the blogs we’re vibin’ with. Let’s get into it!

`;

  // Format posts
  let formattedContent = "";
  Object.entries(postsByCategory).forEach(([category, categoryPosts]) => {
    formattedContent += `## ${category}\n\n`;
    categoryPosts.forEach(post => {
      formattedContent += `### ${post.title}\n\n`;
      if (post.image) formattedContent += `![${post.title}](${post.image})\n\n`;
      formattedContent += `${post.summary}\n\n`;
      if (post.hotTake && addControversial) {
        formattedContent += `**Hot Take**: ${post.hotTake}\n\n`;
      }
      formattedContent += `*Source: [Check It Out](${post.sourceLink})*\n\n`;
      formattedContent += `---\n\n`;
    });
  });

  // Footer
  const footer = `
*Stay locked in with [@${steemAuthor}](https://steemit.com/@${steemAuthor}) for daily crypto heat!*
`;

  const body = `${introduction}${formattedContent}${footer}`;
  const mainTag = "cryptocurrency";
  const additionalTags = ["blockchain", "news", "crypto", "steemit"];
  const categoryTags = categories
    .map(cat => cat.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(tag => tag && !additionalTags.includes(tag))
    .slice(0, 3);
  const allTags = [mainTag, ...additionalTags, ...categoryTags].slice(0, 8);
  const permlink = `${mainTag}-${date.replace(/-/g, "")}-${Date.now().toString().substring(7, 13)}`;
  const jsonMetadata = JSON.stringify({
    tags: allTags,
    app: "steem_automation/1.0",
    format: "markdown",
    images: posts.map(p => p.image).filter(Boolean),
  });

  return { title, body, permlink, mainTag, jsonMetadata };
}

// Post to Steem
async function postToSteem({ title, body, permlink, mainTag, jsonMetadata }) {
  return new Promise((resolve, reject) => {
    steem.broadcast.comment(
      steemPrivateKey,
      "",
      mainTag,
      steemAuthor,
      permlink,
      title,
      body,
      jsonMetadata,
      (err, result) => {
        if (err) {
          logMessage(`Error posting to Steem: ${err.message}`);
          reject(err);
        } else {
          logMessage(`Posted to Steem: https://steemit.com/${mainTag}/@${steemAuthor}/${permlink}`);
          resolve(result);
        }
      }
    );
  });
}

// Main function
async function main() {
  // Validate environment variables
  const requiredVars = ["STEEM_PRIVATE_KEY", "STEEM_AUTHOR", "IMGUR_CLIENT_ID"];
  if (!githubToken && !openaiApiKey) requiredVars.push("GITHUB_TOKEN or OPENAI_API_KEY");
  const missingVars = requiredVars.filter(varName => !process.env[varName.split(" or ")[0]]);
  if (missingVars.length > 0) {
    logMessage(`Missing env vars: ${missingVars.join(", ")}`);
    return;
  }

  const posts = await fetchAndProcessPosts();
  if (posts.length > 0) {
    const blogPost = formatBlogPost(posts);
    await postToSteem(blogPost);
  } else {
    logMessage("No posts to drop.");
  }
}

// Run the script
main().catch(error => {
  logMessage(`Main error: ${error.message}`);
  process.exit(1);
});