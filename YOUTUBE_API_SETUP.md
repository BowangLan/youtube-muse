# YouTube Data API v3 Setup Guide

This project uses the official Google YouTube Data API v3 to fetch channel and video information. Follow these steps to set up your API key.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project (required for API access)

## 2. Enable YouTube Data API v3

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "YouTube Data API v3"
3. Click on it and press **Enable**

## 3. Create API Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials** and select **API Key**
3. Copy the generated API key
4. (Optional) Restrict the API key:
   - Click on the API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3" from the dropdown
   - Under "Application restrictions", you can restrict by HTTP referrer or IP address

## 4. Add API Key to Your Project

1. Open the `.env.local` file in the root of your project (it was created automatically)
2. Add your API key:
   ```
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```
3. Save the file

## 5. Restart Your Development Server

```bash
npm run dev
```

## API Quota Limits

The YouTube Data API v3 has usage quotas:
- **Free tier**: 10,000 units per day
- Different operations consume different amounts:
  - Search: 100 units per request
  - Videos list: 1 unit per request
  - Channels list: 1 unit per request

### Cost Estimates for This App

Each channel stream refresh uses approximately:
- Channel search: ~100 units per channel
- Video search: ~100 units per channel
- Video details: ~1 unit per request

**Example**: Refreshing a stream with 3 channels fetching 10 videos each would use approximately:
- 3 channels × 100 units (search) = 300 units
- 1 video details request × 1 unit = 1 unit
- **Total**: ~301 units per refresh

With the default 10,000 units/day, you can refresh streams approximately 30+ times per day.

## Troubleshooting

### "YouTube API key not configured" Error

Make sure:
1. The `.env.local` file exists in the project root
2. The environment variable is named exactly `YOUTUBE_API_KEY`
3. There are no quotes around the API key value
4. You've restarted the development server after adding the key

### "Failed to search channels" Error

Check:
1. Your API key is valid
2. YouTube Data API v3 is enabled in your Google Cloud project
3. You haven't exceeded your daily quota
4. Your API key restrictions (if any) allow requests from your domain

### Quota Exceeded

If you hit the quota limit:
1. Wait until the quota resets (daily at midnight Pacific Time)
2. Request a quota increase in the Google Cloud Console
3. Consider implementing caching to reduce API calls

## Best Practices

1. **Never commit your API key** - The `.env.local` file is gitignored by default
2. **Use API key restrictions** - Limit by HTTP referrer or IP address
3. **Monitor your usage** - Check the Google Cloud Console for quota usage
4. **Implement caching** - Store results to minimize API calls
5. **Handle errors gracefully** - The app shows user-friendly messages when API calls fail

## Additional Resources

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
