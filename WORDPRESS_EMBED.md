# WordPress Embedding Guide

## How to Embed the Zombie Face Transformer in WordPress

### Option 1: Using iFrame (Recommended)

Add this HTML code to your WordPress page using the "Custom HTML" block:

```html
<iframe
  src="http://your-server-url:3000"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; max-width: 650px; margin: 0 auto; display: block;">
</iframe>
```

Replace `http://your-server-url:3000` with your actual server URL.

### Option 2: Using Embed Code Block

1. In WordPress editor, add a new block
2. Search for "Custom HTML" block
3. Paste the iframe code above
4. Click "Preview" to see it in action

### Option 3: Deploy and Embed

For best results, deploy your app to a hosting service:

#### Deploy to Vercel (Free):
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts
4. Use the provided URL in your iframe

#### Deploy to Heroku:
1. Create a Heroku account
2. Install Heroku CLI
3. Run:
   ```bash
   heroku create
   git push heroku main
   ```
4. Use the Heroku URL in your iframe

### Important Notes:

1. **HTTPS Required**: For production, use HTTPS (secure connection)
2. **CORS**: The app is already configured to work in iframes
3. **Transparent Background**: The app now has a transparent background that will blend with your WordPress theme
4. **Responsive**: The design is mobile-friendly and responsive

### Example WordPress Code:

```html
<div style="max-width: 650px; margin: 40px auto; padding: 20px;">
  <iframe
    src="https://your-app-url.com"
    width="100%"
    height="800"
    frameborder="0"
    style="border: none;">
  </iframe>
</div>
```

### Testing Locally:

1. Start your server: `npm start`
2. Use `http://localhost:3000` as the iframe src
3. Note: Local URLs won't work on live WordPress sites - you need to deploy first

### Styling Tips:

To match your WordPress theme, you can wrap the iframe in a custom div:

```html
<div class="zombie-transformer-wrapper">
  <iframe src="your-url-here" width="100%" height="800" frameborder="0"></iframe>
</div>
```

Then add custom CSS in WordPress → Appearance → Customize → Additional CSS:

```css
.zombie-transformer-wrapper {
  max-width: 650px;
  margin: 40px auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.zombie-transformer-wrapper iframe {
  border: none;
  border-radius: 16px;
}
```
