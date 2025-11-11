# 🚀 Steem Automation

A sophisticated automation platform that aggregates content from Telegram channels, analyzes it using AI, and automatically publishes curated posts to the Steem blockchain. This project demonstrates advanced integration of multiple APIs and real-time data processing.

## ✨ Features

### Core Capabilities
- **🤖 AI-Powered Content Analysis**: Uses GitHub Models (GPT-4o) to intelligently filter and summarize content
- **📱 Telegram Integration**: Connects to Telegram channels to fetch real-time posts
- **⛓️ Steem Blockchain Publishing**: Automatically posts curated content to the Steem blockchain
- **🖼️ Image Management**: 
  - Downloads images from Telegram
  - Uploads to Imgur with automatic deduplication
  - MD5 hash-based caching to prevent duplicate uploads
- **🌐 Web Scraping**: Extracts blog content from URLs using Cheerio
- **📊 Intelligent Filtering**: Categorizes content with confidence scoring
- **🔐 Secure Key Management**: Environment-based credential handling

### Technical Highlights
- **Async/Await Architecture**: Non-blocking operations for optimal performance
- **Error Handling**: Comprehensive retry logic with exponential backoff
- **Rate Limiting**: Handles API rate limits and flood protection gracefully
- **Session Persistence**: Maintains Telegram session state across restarts
- **Comprehensive Logging**: Timestamped logs for debugging and monitoring

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js |
| **Telegram API** | telegram (TDLib client) |
| **Blockchain** | Steem blockchain library |
| **AI/ML** | GitHub Models (OpenAI API compatible) |
| **Web Scraping** | Axios + Cheerio |
| **Image CDN** | Imgur API |
| **Data Processing** | Crypto (MD5 hashing), fs (file system) |
| **Configuration** | dotenv |

## 📋 Prerequisites

Before you begin, ensure you have the following:

### Required Accounts & API Keys
1. **GitHub Token** - For GitHub Models API (AI analysis)
   - Get it from: https://github.com/settings/tokens
   - Scopes needed: repo, gist

2. **Telegram API Credentials**
   - `API_ID` and `API_HASH` from: https://my.telegram.org/apps
   - Telegram account with phone number

3. **Steem Blockchain**
   - Steem account username
   - Private posting key (find it in your Steem wallet)

4. **Imgur API**
   - `IMGUR_CLIENT_ID` from: https://imgur.com/account/settings/apps
   - Optional: `IMGUR_SECRET_KEY` for enhanced uploads

### System Requirements
- **Node.js** v14.0 or higher
- **npm** v6.0 or higher
- **Internet connection** for API calls
- **Windows/Mac/Linux** compatible

## 🚀 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/steem_automation.git
cd steem_automation
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages:
- `axios` - HTTP requests
- `cheerio` - Web scraping
- `dotenv` - Environment variable management
- `openai` - GitHub Models API client
- `steem` - Blockchain interaction
- `telegram` - Telegram client
- `telegraf` - Telegram bot framework (optional)

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Telegram Configuration
API_ID=your_api_id_here
API_HASH=your_api_hash_here
PHONE_NUMBER=+1234567890
PASSWORD=your_2fa_password

# GitHub Models / OpenAI
GITHUB_TOKEN=ghp_your_token_here

# Telegram Channel
CHANNEL_USERNAME=your_channel_username

# Imgur API
IMGUR_CLIENT_ID=your_imgur_client_id
IMGUR_SECRET_KEY=your_imgur_secret_key

# Steem Blockchain
STEEM_PRIVATE_KEY=your_steem_private_key
STEEM_AUTHOR=your_steem_username

# Optional
DEFAULT_IMAGE_URL=https://i.imgur.com/your_image.jpg
```

### Step 4: Set Up Your URLs (Optional)

Create a `urls.txt` file with URLs to scrape:
```
https://example-blog-1.com/article
https://example-blog-2.com/post
https://techcabal.com/2025/08/13/...
```

## 📖 Usage

### Running the Main Application
```bash
node app.js
```

The application will:
1. Connect to your Telegram account
2. Monitor the specified channel for new posts
3. Analyze posts using AI
4. Filter and categorize content
5. Publish to Steem blockchain

### First Run
- You'll be prompted to authenticate with Telegram
- The app will save your session in `session.txt` for future runs
- Press Enter or provide your phone number when prompted

### Posting to Steem Directly
```bash
node postToSteem.js
```

This standalone script posts a simple test post to verify your Steem setup.

### Processing Blog URLs
```bash
# Ensure urls.txt contains your target URLs
node blog.js
```

This processes URLs from `urls.txt`, extracts content, and generates AI-analyzed posts.

## 📁 Project Structure

```
steem_automation/
├── app.js                    # Main application (Telegram → Analysis → Steem)
├── blog.js                   # Blog content scraper and processor
├── postToSteem.js            # Direct Steem posting utility
├── getTeloNews.js            # News fetching module
├── package.json              # Dependencies
├── .env                       # Environment variables (⚠️ Keep secret!)
├── urls.txt                  # URLs to process
├── session.txt               # Telegram session (auto-generated)
├── logs.txt                  # Application logs (auto-generated)
├── image_hashes.json         # Image deduplication cache (auto-generated)
├── images/                   # Temporary image storage (auto-generated)
└── README.md                 # This file
```

## 🔧 Configuration Details

### Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `API_ID` | ✅ | Your Telegram API ID |
| `API_HASH` | ✅ | Your Telegram API Hash |
| `PHONE_NUMBER` | ✅ | Your Telegram phone number (+country_code format) |
| `PASSWORD` | ✅ | Your Telegram 2FA password (if enabled) |
| `GITHUB_TOKEN` | ✅ | GitHub Personal Access Token for Models API |
| `CHANNEL_USERNAME` | ✅ | Target Telegram channel to monitor |
| `STEEM_PRIVATE_KEY` | ✅ | Your Steem posting private key |
| `STEEM_AUTHOR` | ✅ | Your Steem account username |
| `IMGUR_CLIENT_ID` | ✅ | Imgur API Client ID |
| `IMGUR_SECRET_KEY` | ✅ | Imgur API Secret (optional) |
| `DEFAULT_IMAGE_URL` | ❌ | Fallback image when none available |

## 🎯 How It Works

### Content Flow

```
Telegram Channel
      ↓
   Fetch Posts
      ↓
  Extract Images
      ↓
   Analyze with AI
      ↓
    Filter Content
      ↓
  Upload Images to Imgur
      ↓
   Format for Steem
      ↓
Publish to Blockchain
```

### AI Analysis

The application uses GPT-4o to:
- **Summarize** content into engaging summaries
- **Validate** if content is newsworthy
- **Categorize** posts (e.g., "Market Moves", "Regulations", "Project Hype")
- **Score confidence** (0-100) for filtering
- **Generate insights** from raw data

### Image Deduplication

- Calculates MD5 hash of each image
- Stores hash → Imgur URL mappings in `image_hashes.json`
- Reuses Imgur URLs for duplicate images
- **Benefit**: Saves API calls and reduces costs

## 🔒 Security Best Practices

⚠️ **IMPORTANT**: Never commit sensitive information!

- ✅ Add `.env` to `.gitignore`
- ✅ Use strong, unique passwords
- ✅ Rotate API keys regularly
- ✅ Don't share session files
- ✅ Review logs for suspicious activity
- ✅ Use 2FA on Telegram and GitHub

### Example .gitignore
```
.env
session.txt
logs.txt
image_hashes.json
images/
node_modules/
```

## 🐛 Troubleshooting

### Issue: "FLOOD" Error from Telegram
**Solution**: The app handles this automatically, but if persistent:
- Wait a few minutes before running again
- Check your channel for suspicious activity

### Issue: Imgur Upload Fails
**Solution**: 
- Verify `IMGUR_CLIENT_ID` is correct
- Check rate limits (500 requests per day)
- Ensure image file isn't corrupted

### Issue: Steem Post Not Broadcasting
**Solution**:
- Verify private key format (should start with `5`)
- Check account has sufficient RC (resource credits)
- Ensure permlink is unique (timestamps help)

### Issue: GitHub Models Rate Limiting
**Solution**:
- Built-in exponential backoff handles this (2s, 4s, 8s, 16s, 32s)
- Reduce analysis frequency
- Check remaining token quota

### Check Logs
```bash
# View recent logs
tail -f logs.txt

# Search for errors
grep -i "error" logs.txt
```

## 📊 Performance Metrics

The application is designed to handle:
- ✅ **Concurrent requests**: Non-blocking async operations
- ✅ **Rate limiting**: Automatic backoff and retry logic
- ✅ **Image processing**: Efficient base64 encoding for Imgur
- ✅ **Session persistence**: Fast reconnection on restart
- ✅ **Scalability**: Process 100+ posts per run

## 🚦 API Rate Limits

Be aware of these limits:
- **Telegram**: ~30-100 requests/second (sliding window)
- **GitHub Models**: Variable depending on plan
- **Imgur**: 500 requests/day (anonymous)
- **Steem**: ~3 posts per minute per account

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Ideas for Enhancement
- [ ] Add database integration (MongoDB/PostgreSQL)
- [ ] Web dashboard for monitoring
- [ ] Scheduled automation (cron jobs)
- [ ] Multi-channel support
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] Custom AI prompts configuration
- [ ] Content filters and blacklists

## 📝 License

This project is licensed under the ISC License - see the `package.json` file for details.

## 💡 Use Cases

- **Crypto News Aggregator**: Automatically curate and post blockchain news
- **Content Curation**: Monitor multiple Telegram channels, analyze, and republish
- **Blog Automation**: Scrape and reformat blog content for Steem
- **Social Media Bridge**: Connect Telegram communities to blockchain-based platforms
- **News Bot**: Create automated news distribution with AI analysis

## 🔗 Related Resources

- [Telegram API Docs](https://core.telegram.org/)
- [Steem Developer Docs](https://developers.steem.io/)
- [GitHub Models API](https://github.com/marketplace/models)
- [Imgur API Docs](https://apidocs.imgur.com/)

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review logs.txt for detailed error information

## 🌟 Showcase

This project demonstrates expertise in:
- 🔌 **API Integration**: Multiple third-party services
- 🤖 **AI/ML**: GPT-4 analysis and content understanding
- ⛓️ **Blockchain**: Steem protocol interaction
- 🔐 **Security**: Credential management and session handling
- 📊 **Data Processing**: Content analysis and filtering
- 🔄 **Async Programming**: Non-blocking operations
- 🐛 **Error Handling**: Robust retry mechanisms
- 📈 **Scalability**: Efficient resource utilization

---

**Built with ❤️ by [Irehh](https://github.com/Irehh)**

⭐ If you find this useful, consider starring the repository!
