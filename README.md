# RedeemWise: Points Redemption Calculator

Designed by Jiyu. Developed by Gemini.

RedeemWise is a smart, modern tool specifically designed for travelers to evaluate the worth of their airline miles and hotel points. It helps you determine whether a points redemption is a "good deal" by comparing your redemption value (Cents Per Point) against real-time market valuations.

## 🌟 Features

Financial Value Analysis (CPP): Instantly calculates the Cents Per Point (CPP) of any redemption and compares it to a benchmark value.

Cost Efficiency Analysis (PPM): For airlines, it calculates the Points Per Mile (PPM) cost to see if you are overspending on a short flight.

Flight Distance Calculator: Built-in Haversine formula to calculate Great Circle distances between major global airports (JFK, LHR, HND, etc.).

Smart Add via AI: A simulated AI feature that "searches" a knowledge base to let you add new airline or hotel programs dynamically.

Multi-Currency Support: Input cash prices in USD, EUR, GBP, JPY, and more, with automatic conversion to USD for standardized comparison.

Responsive Design: Fully optimized for smartphones, tablets, and desktops.

## 🚀 Getting Started

### Prerequisites

Node.js (LTS version recommended)

### Installation

Clone the repository:

git clone [https://github.com/YOUR_USERNAME/points-tool.git](https://github.com/YOUR_USERNAME/points-tool.git)
cd points-tool


### Install dependencies:

npm install
# Ensure Tailwind CSS is installed correctly
npm install -D tailwindcss@3 postcss autoprefixer


### Run the development server:

npm run dev


Open http://localhost:5173 in your browser.

## 🛠️ Tech Stack

Frontend: React (TypeScript)

Styling: Tailwind CSS

Build Tool: Vite

Icons: Lucide React

## 📱 Mobile Compatibility

The application is built with a "Mobile-First" approach using Tailwind CSS.

Adaptive Layouts: The program list automatically resizes on smaller screens to keep the calculator visible.

Touch Targets: Buttons and inputs are sized (44px+) for easy tapping.

Viewport Protection: Input text size is set to 16px to prevent auto-zooming on iOS devices.

## 📄 License & Copyright

2025 Copyright.
Designed by Jiyu. Developed by Gemini.

All rights reserved.
