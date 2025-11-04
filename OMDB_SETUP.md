# OMDB API Setup for TV Show Search

TurboPi uses the OMDB (Open Movie Database) API to search for TV shows by title. This provides a smooth user experience where you can search "Breaking Bad" instead of needing to know IMDB IDs.

## Getting Your Free API Key

1. **Visit OMDB API Website**
   - Go to: https://www.omdbapi.com/apikey.aspx

2. **Select Free Tier**
   - Choose "FREE! (1,000 daily limit)"
   - This is perfect for personal use

3. **Enter Your Email**
   - Provide your email address
   - Check the "I'm not a robot" box
   - Click "Submit"

4. **Check Your Email**
   - You'll receive an email with subject "OMDb API Key"
   - Click the activation link in the email

5. **Get Your API Key**
   - After activating, you'll see your API key
   - It will look something like: `a1b2c3d4`

## Adding the API Key to TurboPi

1. **Open your `.env` file**
   ```bash
   nano /path/to/turbopi/.env
   ```

2. **Add your API key**
   ```env
   OMDB_API_KEY=a1b2c3d4
   ```
   Replace `a1b2c3d4` with your actual API key

3. **Restart TurboPi**
   ```bash
   npm run dev
   ```

## How It Works

When you search for a TV show:
1. TurboPi queries OMDB for shows matching your search term
2. Gets IMDB IDs and poster images from OMDB
3. Checks EZTV for episode availability using the IMDB IDs
4. Returns only shows that have episodes available on EZTV

## Free Tier Limits

- **1,000 requests per day**
- More than enough for personal use
- Searches are cached where possible

## Example Searches

With OMDB API configured, you can now search for:
- "Breaking Bad"
- "Game of Thrones"
- "Stranger Things"
- "The Office"
- And any other TV show by name!

No more need to look up IMDB IDs manually!
