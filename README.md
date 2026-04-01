# Kindle Stats

This project is very early and still a work in progress. It needs a lot of cleaning up and improving. Amazon also limits a lot of what you can get from your data, so I still need to figure out many things.

Kindle Stats is a tiny web app that turns your Kindle export into an easy reading dashboard.
Upload your data, and it gives you clean charts for reading time, streaks, daily activity, and device usage.

## Get your Kindle data

Before using this app, request your Amazon data export and include Kindle data:

1. Open Amazon Privacy Central: https://www.amazon.com/hz/privacy-central/data-requests/preview.html
2. Submit a data request and select the Kindle-related category (or request all data): https://www.amazon.com/gp/help/customer/display.html?nodeId=GXPU3YPMBZQRWZK2

I have no idea what the actual limit is on how often Amazon lets you request your data, but you probably should not request your Kindle export too often. To stay on the safe side, wait at least a week between requests.

## Run it locally

1. Clone the repo:
   ```bash
   git clone https://github.com/maxoliinyk/kindle-stats.git
   cd kindle-stats
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

4. Open the local URL shown in your terminal (usually `http://localhost:5173`).

## Dependencies

Main libraries:
- `react`
- `react-dom`
- `chart.js`
- `react-chartjs-2`

Tooling:
- `vite`
- `typescript`

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.