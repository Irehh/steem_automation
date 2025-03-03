// // Import the steem library
// const steem = require('steem');

// // Set the API endpoint (Steem node)
// steem.api.setOptions({ url: 'https://api.steemit.com' });

// // Configuration - Replace these with your details
// const privatePostingKey = '5JHY52X6HqVeVbCuxnT9JaeDaxAZJyTec6cEmzZJ2TbgmxaZgJU'; // Replace with your private posting key
// const author = 'ireh';                        // Replace with your Steem username
// const title = 'My First Programmatic Post';           // Predefined post title
// const body = 'Hello, this is a test post created programmatically using JavaScript!'; // Predefined post content
// const mainTag = 'test';                               // Main tag (category) for the post
// const additionalTags = ['javascript', 'automation'];  // Additional tags (up to 4 more)

// // Generate a unique permlink (slug) based on timestamp and title
// const permlink = `${mainTag}-${title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

// // Metadata for the post (tags and app info)
// const jsonMetadata = JSON.stringify({
//   tags: [mainTag, ...additionalTags],
//   app: 'my-script/1.0' // Optional: identifies your app
// });

// // Function to post to Steem
// function postToSteem() {
//   steem.broadcast.comment(
//     privatePostingKey, // Private key for signing
//     '',                // Parent author (empty for a root post)
//     mainTag,           // Parent permlink (main tag for a root post)
//     author,            // Author of the post
//     permlink,          // Unique permlink for this post
//     title,             // Post title
//     body,              // Post content
//     jsonMetadata,      // Metadata with tags
//     (err, result) => {
//       if (err) {
//         console.error('Error posting to Steem:', err);
//       } else {
//         console.log('Successfully posted to Steem!');
//         console.log('Post URL:', `https://steemit.com/${mainTag}/@${author}/${permlink}`);
//       }
//     }
//   );
// }

// // Execute the posting function
// postToSteem();