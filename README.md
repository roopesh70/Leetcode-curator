# LeetCode Curator

Automated LeetCode email curator that sends a beginner-to-advanced problem set 3-4 days per week and records sent problems so repeats are avoided.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` values into `.env.local`.

3. For Gmail, create an app password and use it as `SMTP_PASS`.

4. Send one email:

   ```bash
   npm run send
   ```

## GitHub Actions Automation

The workflow in `.github/workflows/leetcode-curator.yml` runs on Monday, Wednesday, Friday, and Saturday at `03:30 UTC`.

Add these repository secrets:

- `RECIPIENT_EMAILS`, comma-separated for multiple emails
- `SMTP_HOST` such as `smtp.gmail.com`
- `SMTP_PORT` such as `465`
- `SMTP_SECURE` such as `true`
- `SMTP_USER`
- `SMTP_PASS`
- `OPENAI_API_KEY` optional
- `OPENAI_MODEL` optional, defaults to `gpt-4.1-mini`

The script uses a vetted problem bank first, then optionally asks AI to personalize the next set from that bank. This keeps links real and prevents repeated suggestions through `data/progress.json`.
