# Nook

Nook is a lightweight, minimalist habit and daily focus tracker designed for simplicity, clarity, and daily consistency. It operates entirely client-side, requiring no accounts, databases, or external dependencies.

Live Demo: [https://archonnn67.github.io/Nook/](https://archonnn67.github.io/Nook/)

## Key Features

- Minimalist Interface: Clean, distraction-free design built for speed and ease of use.
- Streak Tracking: Tracks daily streaks for individual habits as well as an overall consistency streak.
- Progress Visualization: Real-time progress bar and completion percentage for today's tasks.
- Curated Habit Packs: Built-in collections for Programming, Health & Fitness, Learning, Mindfulness & Rest, and Creativity.
- Local-First Architecture: All data is saved directly in your browser via localStorage, ensuring total privacy.
- Automated Daily Reset: Automatically unchecks daily items and updates streaks at midnight or upon returning to the app.
- Task Filtering: Quickly switch between All, Active, and Completed views.
- Keyboard Friendly: Full keyboard navigation and shortcuts for quick management.

## Tech Stack

- Semantic HTML5
- Modern CSS (Custom properties, Flexbox, CSS Grid)
- Vanilla JavaScript (ES6+, zero dependencies)
- Inter font (Google Fonts)

## Getting Started

### Live Demo

You can try the live application directly in your browser:
[https://archonnn67.github.io/Nook/](https://archonnn67.github.io/Nook/)

### Prerequisites

No installation, build step, or package manager is required. You only need a modern web browser.

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/archonnn67/Nook.git
```

2. Open the project folder:
```bash
cd Nook
```

3. Open `index.html` in your browser:
- Double-click `index.html`, or
- Use a local development server:
```bash
# Python 3
python3 -m http.server 8000

# or Node.js
npx serve .
```

4. Navigate to `http://localhost:8000` in your browser.

## Project Structure

```text
Nook/
|-- index.html     # Application structure and semantic markup
|-- style.css      # Styling, layout, and theme variables
|-- app.js         # Core application logic, state, and storage handling
|-- licence        # License markup and attribution
`-- README.md      # Project documentation
```

## How It Works

- Adding Habits: Type a habit in the input field and press Enter or click Add.
- Marking Complete: Click on any habit or checkbox to toggle its state. Completed habits update your streak and progress bar.
- Using Packs: Click the "Packs" button to select and import curated habits tailored to specific routines.
- Data Persistence: Every modification is synced to `localStorage`. You can safely close or refresh your browser without losing progress.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC BY-NC-ND 4.0).

See the [licence](licence) file for full details and attribution.

## Author

Velihovetchi Bogdan - [GitHub](https://github.com/archonnn67)