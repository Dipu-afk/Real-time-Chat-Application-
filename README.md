# Real-time Chat Application

A modern, responsive real-time chat application built with React, Node.js, and WebSocket. Features include dark mode, typing indicators, and message history.

## Features

- Real-time messaging using WebSocket
- Responsive design with Tailwind CSS
- Dark mode support
- Typing indicators
- Message history
- User join/leave notifications
- Modern UI with smooth animations

## Tech Stack

- Frontend:
  - React.js
  - Tailwind CSS
  - Vite
  - date-fns
  - react-icons

- Backend:
  - Node.js
  - Express
  - WebSocket (ws)
  - UUID

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd real-time-chat-app
```

2. Install dependencies:
```bash
npm run install-all
```

This will install dependencies for both frontend and backend.

## Running the Application

1. Start both frontend and backend servers:
```bash
npm start
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

2. Open your browser and navigate to http://localhost:3000

## Usage

1. Enter your username when prompted
2. Start chatting with other users in real-time
3. Toggle dark mode using the sun/moon icon
4. See typing indicators when other users are typing
5. Messages are displayed with timestamps and user names

## Development

- Frontend code is in the `frontend` directory
- Backend code is in the `backend` directory
- The application uses WebSocket for real-time communication
- Message history is stored in memory on the backend

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 