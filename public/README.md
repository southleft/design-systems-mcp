# Public Assets Directory

This directory contains static assets that are served by the Cloudflare Worker.

## Required Files

### 📸 **og-image.png** (Social Media Thumbnail)
- **Required:** Save your "MCP Powered Design Systems Assistant by SOUTHLEFT" thumbnail image here
- **Dimensions:** Recommended 1200x630px for optimal social media display
- **Format:** PNG or JPG
- **Usage:** Used for Open Graph and Twitter Card previews when sharing links

### 🔸 **favicon.png** (Website Icon)
- **Optional:** Website favicon/icon
- **Dimensions:** 32x32px or 16x16px
- **Format:** PNG or ICO
- **Usage:** Browser tab icon

## Adding Your Thumbnail

1. Save your thumbnail image as `og-image.png` in this directory
2. Optionally add a `favicon.png` for the browser icon
3. The HTML files are already configured to reference these assets
4. When deployed, these will be accessible at:
   - `https://your-domain.com/og-image.png`
   - `https://your-domain.com/favicon.png`

## Meta Tags Configured

The following meta tags are already set up in both HTML files:

```html
<!-- Open Graph -->
<meta property="og:image" content="/og-image.png">

<!-- Twitter Card -->
<meta name="twitter:image" content="/og-image.png">

<!-- Favicon -->
<link rel="icon" type="image/png" href="/favicon.png">
```

## Testing

After adding the image:
1. Restart your development server: `npm run dev`
2. Visit `http://localhost:8787/og-image.png` to verify the image loads
3. Test social media previews using tools like:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
