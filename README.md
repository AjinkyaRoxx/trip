# Trip Splitter App

A web application for managing and splitting trip expenses among participants.

## Features

- User authentication with Supabase
- Create and manage multiple trips
- Add participants to trips
- Add expenses with various split options (equal, shares, percentage, exact amounts)
- View balances and suggested settlements
- Responsive design for mobile and desktop

## Project Structure
trip-splitter-app/
├── index.html
├── styles/
│   ├── main.css
│   ├── components/
│   │   ├── cards.css
│   │   ├── forms.css
│   │   ├── modals.css
│   │   └── notifications.css
│   └── utilities/
│       ├── variables.css
│       └── helpers.css
├── scripts/
│   ├── app.js
│   ├── auth.js
│   ├── database.js
│   ├── ui.js
│   ├── utilities.js
│   └── components/
│       ├── expenses.js
│       ├── participants.js
│       ├── trips.js
│       └── settlements.js
├── assets/
│   ├── images/
│   └── icons/
└── README.md


## Setup

1. Clone or download the project
2. Open `index.html` in a web browser
3. Sign up for a new account or login with existing credentials

## Dependencies

- Supabase JS client (loaded from CDN)
- Font Awesome icons (loaded from CDN)

## Configuration

Update the Supabase URL and API key in `scripts/auth.js` with your own Supabase project details.

## Browser Support

This app works in all modern browsers that support ES6 modules.