
require("dotenv").config()
const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")
const OpenAI = require("openai")
const fs = require("fs")
const path = require("path")
const readline = require("readline")
const steem = require("steem")
const axios = require("axios")
const crypto = require("crypto")

// Set Steem API endpoint
steem.api.setOptions({ url: "https://api.steemit.com" })

// Configuration
const apiId = Number.parseInt(process.env.API_ID)
const apiHash = process.env.API_HASH
const phoneNumber = process.env.PHONE_NUMBER
const password = process.env.PASSWORD
const githubToken = process.env.GITHUB_TOKEN
const channelUsername = process.env.CHANNEL_USERNAME
const steemPrivateKey = process.env.STEEM_PRIVATE_KEY // Your private posting key
const steemAuthor = process.env.STEEM_AUTHOR || "ireh" // Your Steem username
const imgurClientId = process.env.IMGUR_CLIENT_ID
const defaultImageUrl = process.env.DEFAULT_IMAGE_URL || "https://i.imgur.com/default.jpg" // Default image URL

// File paths and directories
const sessionFile = "session.txt"
const logFile = "logs.txt"
const imageDir = "./images" // Directory to save images temporarily
const imageHashFile = "image_hashes.json" // File to store image hashes for deduplication

// Create image directory if it doesn't exist
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir)

// Load session
const sessionString = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, "utf8").trim() : ""
const stringSession = new StringSession(sessionString)

// Load image hash database for deduplication
let imageHashDb = {}
if (fs.existsSync(imageHashFile)) {
  try {
    imageHashDb = JSON.parse(fs.readFileSync(imageHashFile, "utf8"))
  } catch (e) {
    console.error("Error loading image hash database:", e)
    imageHashDb = {}
  }
}

// Initialize clients
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: githubToken,
})

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
  timeout: 30000,
  useWSS: false,
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper functions
const askQuestion = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())))

const logMessage = (message) => {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}\n`
  console.log(message)
  fs.appendFileSync(logFile, logEntry)
}

// Calculate MD5 hash of an image file for deduplication
function calculateImageHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath)
  return crypto.createHash("md5").update(fileBuffer).digest("hex")
}

// Handle errors with appropriate delays
async function handleErrorWithDelay(error) {
  if (error.errorMessage === "FLOOD" && error.seconds) {
    logMessage(`FloodWaitError: Waiting for ${error.seconds} seconds...`)
    await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000))
    return true
  } else if (error.code === 420 || (error.errorMessage && error.errorMessage.includes("TOO_MANY"))) {
    const waitTime = error.seconds || 60
    logMessage(`Rate Limit Error: Waiting for ${waitTime} seconds...`)
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000))
    return true
  } else if (error.message === "TIMEOUT" || error.message === "Not connected") {
    logMessage("Connection Issue: Waiting 10 seconds before retrying...")
    await new Promise((resolve) => setTimeout(resolve, 10000))
    return true
  }
  return false
}

// Connect to Telegram
async function connectToTelegram() {
  try {
    if (!sessionString) {
      await client.start({
        phoneNumber: async () => phoneNumber,
        password: async () => password || (await askQuestion("Enter your 2FA password (if any): ")),
        phoneCode: async () => await askQuestion("Enter the code you received: "),
        onError: (err) => logMessage("Auth Error: " + JSON.stringify(err)),
      })
      const newSession = client.session.save()
      fs.writeFileSync(sessionFile, newSession, "utf8")
      logMessage("Session saved to session.txt")
    } else {
      await client.connect()
    }
    client._updateLoop = () => {}
    logMessage("Connected to Telegram!")
    rl.close()
    return true
  } catch (error) {
    if (await handleErrorWithDelay(error)) {
      return await connectToTelegram()
    } else {
      logMessage("Error connecting to Telegram: " + JSON.stringify(error))
      rl.close()
      return false
    }
  }
}

// Download image from Telegram
async function downloadImage(photo, messageId) {
  try {
    logMessage(`Downloading image for message ${messageId}...`)
    const buffer = await client.downloadMedia(photo, {})
    const filePath = path.join(imageDir, `post_${messageId}.jpg`)
    fs.writeFileSync(filePath, buffer)
    logMessage(`Image saved to ${filePath}`)
    return filePath
  } catch (error) {
    logMessage(`Error downloading image for message ${messageId}: ${error.message}`)
    return null
  }
}

// Upload image to Imgur using Buffer directly
async function uploadToImgur(filePath, messageId) {
  if (!filePath) return null

  try {
    // Check if we've already uploaded this image (deduplication)
    const imageHash = calculateImageHash(filePath)

    // If we've seen this image before, return the cached URL
    if (imageHashDb[imageHash]) {
      logMessage(`Using cached Imgur URL for duplicate image: ${imageHashDb[imageHash]}`)
      return imageHashDb[imageHash]
    }

    // Read file as base64
    const fileBuffer = fs.readFileSync(filePath)
    const base64Image = fileBuffer.toString("base64")

    logMessage(`Uploading image to Imgur for message ${messageId}...`)

    // Upload to Imgur using base64 data
    const response = await axios({
      method: "post",
      url: "https://api.imgur.com/3/image",
      headers: {
        Authorization: `Client-ID ${imgurClientId}`,
        "Content-Type": "application/json",
      },
      data: {
        image: base64Image,
        type: "base64",
      },
    })

    if (response.data && response.data.success) {
      const imgurUrl = response.data.data.link

      // Save the hash -> URL mapping for future deduplication
      imageHashDb[imageHash] = imgurUrl
      fs.writeFileSync(imageHashFile, JSON.stringify(imageHashDb, null, 2))

      logMessage(`Successfully uploaded image to Imgur: ${imgurUrl}`)
      return imgurUrl
    } else {
      logMessage(`Imgur upload failed: ${JSON.stringify(response.data)}`)
      return null
    }
  } catch (error) {
    logMessage(`Error uploading to Imgur: ${error.message}`)
    if (error.response) {
      logMessage(`Response data: ${JSON.stringify(error.response.data)}`)
    }
    return null
  }
}

// Extract source link from text with improved pattern matching
function extractSourceLink(text) {
  // Try to find source link in various formats with improved pattern matching
  const patterns = [
    /Source\s*$$([^()]+?https?:\/\/[^\s)]+[^()]*?)$$/i,
    /Source:\s*(https?:\/\/[^\s)]+)/i,
    /\bSource\b[^\n]*?(https?:\/\/[^\s)]+)/i,
    /\[Source\]$$(https?:\/\/[^\s)]+)$$/i,
    /▪\s*Source\s*$$(https?:\/\/[^\s)]+)$$/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      // Clean up the URL if it has trailing characters
      const url = match[1].trim()
      // Extract just the URL if there's text around it
      const urlMatch = url.match(/(https?:\/\/[^\s)]+)/)
      return urlMatch ? urlMatch[0] : url
    }
  }

  // Look for URLs near the end of the message, especially after "Source" text
  const endOfTextPattern = /Source.*?(https?:\/\/[^\s)]+)/i
  const endMatch = text.match(endOfTextPattern)
  if (endMatch && endMatch[1]) {
    return endMatch[1]
  }

  return null
}

// Analyze and filter post using OpenAI with improved prompt for professional formatting
async function analyzeAndFilterPost(text, messageId, imgurUrl) {
  let retries = 0
  const maxRetries = 5

  while (retries < maxRetries) {
    try {
      const hasImage = imgurUrl ? true : false

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `
              You are a professional crypto news editor for a high-quality publication. Your task is to:
              
              1. Determine if this is a legitimate news post about cryptocurrency or blockchain.
              2. Reformat and edit the content to be well-structured, professional, and engaging.
              3. Add appropriate headings, subheadings, and formatting.
              4. Remove any channel-specific branding (e.g., "▪ Telegram ▪ X ▪ Community").
              5. DO NOT add any "Follow our Steem account" text - this will be added separately.
              6. Extract any embedded source links from the text.
              
              Return a JSON object with these fields:
              - "title": A catchy, professional title for this news item
              - "filteredText": The professionally edited and formatted text in Markdown
              - "isNews": Boolean indicating if this is legitimate crypto/blockchain news
              - "confidence": Number from 0-100 indicating your confidence this is newsworthy
              - "extractedSource": Any source URL you found in the original text
              - "category": The category of crypto news (e.g., "Market Analysis", "Regulation", "Project Update")
            `,
          },
          {
            role: "user",
            content: `Analyze and format this crypto news post${hasImage ? " (which has an accompanying image)" : ""}:\n\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      })

      try {
        const result = JSON.parse(response.choices[0].message.content)
        return {
          title: result.title || "Crypto News Update",
          filteredText: result.filteredText || text,
          shouldPost: result.isNews === true,
          confidence: result.confidence || 0,
          extractedSource: result.extractedSource,
          category: result.category || "Cryptocurrency",
        }
      } catch (parseError) {
        logMessage(`Error parsing AI response: ${parseError.message}`)
        return {
          title: "Crypto News Update",
          filteredText: text,
          shouldPost: false,
          confidence: 0,
          extractedSource: null,
          category: "Cryptocurrency",
        }
      }
    } catch (error) {
      if (error.status === 429 || (error.message && error.message.includes("rate limit"))) {
        const waitTime = Math.pow(2, retries) * 1000
        logMessage(`GitHub Models Rate Limit: Waiting for ${waitTime / 1000} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        retries++
      } else if (error.status === 401) {
        logMessage("Authentication Error: Check your GitHub PAT in GITHUB_TOKEN.")
        return {
          title: "Crypto News Update",
          filteredText: text,
          shouldPost: false,
          confidence: 0,
          extractedSource: null,
          category: "Cryptocurrency",
        }
      } else {
        logMessage(`Error analyzing text: ${error.message}`)
        return {
          title: "Crypto News Update",
          filteredText: text,
          shouldPost: false,
          confidence: 0,
          extractedSource: null,
          category: "Cryptocurrency",
        }
      }
    }
  }

  logMessage("Max retries reached for GitHub Models API")
  return {
    title: "Crypto News Update",
    filteredText: text,
    shouldPost: false,
    confidence: 0,
    extractedSource: null,
    category: "Cryptocurrency",
  }
}

// Fetch and process posts from Telegram
async function fetchAndProcessPosts() {
  try {
    const channel = await client.getEntity(channelUsername)
    const messages = await client.getMessages(channel, { limit: 10 }) // Fetch last 10 posts
    const filteredPosts = []

    for (const message of messages) {
      const text = message.message || ""
      const messageId = message.id
      const telegramLink = `https://t.me/${channelUsername}/${messageId}`

      // Download image if available
      let localImagePath = null
      if (message.photo) {
        localImagePath = await downloadImage(message.photo, messageId)
      }

      // Upload to Imgur if we have a local image
      let imgurUrl = null
      if (localImagePath) {
        imgurUrl = await uploadToImgur(localImagePath, messageId)
      }

      // Extract source link from text
      const manualSourceLink = extractSourceLink(text)
      logMessage(`Extracted source link: ${manualSourceLink || "None"}`)

      // Analyze and format the post
      const { title, filteredText, shouldPost, confidence, extractedSource, category } = await analyzeAndFilterPost(
        text,
        messageId,
        imgurUrl,
      )

      // Use extracted source or manually parsed source
      const sourceLink = extractedSource || manualSourceLink

      if (shouldPost) {
        const postEntry = {
          title,
          text: filteredText,
          link: telegramLink,
          image: imgurUrl || "", // Use Imgur URL or empty string
          sourceLink,
          confidence,
          category,
        }
        filteredPosts.push(postEntry)
      }

      logMessage(`Post ID: ${messageId}`)
      logMessage(`Title: ${title}`)
      logMessage(`Original Text: ${text.substring(0, 100)}...`)
      logMessage(`Filtered Text: ${filteredText.substring(0, 100)}...`)
      logMessage(`Should Post: ${shouldPost} (Confidence: ${confidence}%)`)
      logMessage(`Category: ${category}`)
      logMessage(`Image: ${imgurUrl || "None"}`)
      logMessage(`Telegram Link: ${telegramLink}`)
      logMessage(`Source Link: ${sourceLink || "None"}`)
      logMessage("---")

      // Clean up local image file
      if (localImagePath && fs.existsSync(localImagePath)) {
        fs.unlinkSync(localImagePath)
      }
    }

    return filteredPosts
  } catch (error) {
    if (await handleErrorWithDelay(error)) {
      return await fetchAndProcessPosts()
    } else {
      logMessage(`Error fetching posts: ${error.message}`)
      return []
    }
  }
}

// Format blog post for Steem with professional layout
function formatBlogPost(posts) {
  const date = new Date().toISOString().split("T")[0]

  // Group posts by category
  const postsByCategory = {}
  posts.forEach((post) => {
    if (!postsByCategory[post.category]) {
      postsByCategory[post.category] = []
    }
    postsByCategory[post.category].push(post)
  })

  // Create a title based on the top categories
  const categories = Object.keys(postsByCategory)
  let title = `Crypto News Digest - ${date}`
  if (categories.length > 0) {
    const topCategories = categories.slice(0, Math.min(2, categories.length))
    title = `Crypto ${topCategories.join(" & ")} News - ${date}`
  }

  // Create a professional introduction
  const introduction = `
## Today's Cryptocurrency Highlights

Welcome to your daily crypto news digest. Here's what's making waves in the blockchain world today.

`

  // Use default image if no posts have images
  const hasImages = posts.some((post) => post.image)
  const headerImage = hasImages ? "" : `![Crypto News](${defaultImageUrl})\n\n`

  // Format posts by category
  let formattedContent = ""

  Object.entries(postsByCategory).forEach(([category, categoryPosts]) => {
    formattedContent += `\n## ${category}\n\n`

    categoryPosts.forEach((post) => {
      // Format each post with its title as a subheading
      formattedContent += `### ${post.title}\n\n`

      // Add image if available
      if (post.image) {
        formattedContent += `![${post.title}](${post.image})\n\n`
      }

      // Add the formatted content
      formattedContent += `${post.text}\n\n`

      // Add source attribution
      if (post.sourceLink) {
        formattedContent += `*Source: [Original Article](${post.sourceLink})*\n\n`
      }

      formattedContent += `---\n\n`
    })
  })

  // Add footer with single Steem account mention ONLY ONCE at the very end
  const footer = `
*Follow our Steem account [@${steemAuthor}](https://steemit.com/@${steemAuthor}) for daily crypto updates and insights.*
`

  const body = `${headerImage}${introduction}${formattedContent}${footer}`
  const mainTag = "cryptocurrency"
  const additionalTags = ["blockchain", "news", "crypto", "steemit"]

  // Add category tags
  const categoryTags = categories
    .map((cat) => cat.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((tag) => tag && tag.length > 0 && !additionalTags.includes(tag))
    .slice(0, 3) // Take up to 3 category tags

  const allTags = [mainTag, ...additionalTags, ...categoryTags].slice(0, 8) // Max 8 tags

  const permlink = `${mainTag}-${date.replace(/-/g, "")}-${Date.now().toString().substring(7, 13)}`

  const jsonMetadata = JSON.stringify({
    tags: allTags,
    app: "crypto-news-bot/1.1",
    format: "markdown",
    images: posts
      .filter((p) => p.image)
      .map((p) => p.image)
      .concat(hasImages ? [] : [defaultImageUrl]),
  })

  return { title, body, permlink, mainTag, jsonMetadata }
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
          logMessage(`Error posting to Steem: ${err.message || JSON.stringify(err)}`)
          reject(err)
        } else {
          logMessage("Successfully posted to Steem!")
          logMessage(`Post URL: https://steemit.com/${mainTag}/@${steemAuthor}/${permlink}`)
          resolve(result)
        }
      },
    )
  })
}

// Main function
async function main() {
  // Validate required environment variables
  const requiredEnvVars = ["API_ID", "API_HASH", "PHONE_NUMBER", "GITHUB_TOKEN", "CHANNEL_USERNAME", "IMGUR_CLIENT_ID"]

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])
  if (missingVars.length > 0) {
    logMessage(`Missing required environment variables: ${missingVars.join(", ")}`)
    logMessage("Please add these to your .env file and try again.")
    return
  }

  const connected = await connectToTelegram()
  if (connected) {
    const filteredPosts = await fetchAndProcessPosts()
    if (filteredPosts.length > 0) {
      // Sort posts by confidence score (highest first)
      filteredPosts.sort((a, b) => b.confidence - a.confidence)

      // Take top 5 posts or all if less than 5
      const topPosts = filteredPosts.slice(0, Math.min(5, filteredPosts.length))

      const blogPost = formatBlogPost(topPosts)
      await postToSteem(blogPost)
    } else {
      logMessage("No posts met the criteria for posting.")
    }
  }
}

// Run the script
main().catch((error) => {
  logMessage(`Unhandled error in main: ${error.message}`)
  process.exit(1)
})

