# TimeLog JIRA

A simple menu bar application for macOS and Windows to track time spent on JIRA tasks and export logs to CSV format.

## Features

- **Menu Bar App** - Runs in the system tray for quick access
- **JIRA Task Selection** - Choose from predefined task list or enter custom ticket numbers
- **Timer** - Track time with start/stop functionality
- **CSV Export** - Save logs to CSV with customizable storage location
- **Work Hours Alert** - Get notified during weekdays (10 AM - 5 PM) if timer is not running
- **Cross-Platform** - Available for macOS and Windows

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (comes with Node.js)

### Development Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the app:
   ```bash
   npm start
   ```

### Building for Production

#### macOS
```bash
npm run build:mac
```
Creates a DMG installer in the `dist` folder.

#### Windows
```bash
npm run build:win
```
Creates:
- `TimeLog JIRA Setup.exe` - Windows installer
- `TimeLog JIRA.exe` - Portable version

#### Both Platforms
```bash
npm run build:all
```

## Usage

### First Run

1. Launch the application
2. On first run, you'll be prompted to select a folder for storing CSV files
3. Choose your preferred location (defaults to Documents folder)
4. The app will appear in your menu bar/system tray

### Daily Use

1. **Click the menu bar icon** (shows "T") to open the app
2. **Select JIRA Task**:
   - Choose from the dropdown list of predefined tasks, OR
   - Check "Manual input" and type any JIRA ticket number (e.g., "PROJ-123")
3. **Click "Start Timer"** to begin tracking
4. **Add a comment** (optional) describing the work
5. **Click "Stop & Save"** when finished
6. CSV file is automatically saved with the log entry

### CSV Output Format

Files are saved as `task_log_YYYY-MM-DD.csv` in your selected folder:

```csv
Ticket No,Start Date,Timespent,Comment
TDBU-22,05-Feb-2026 16:10:10,1w 2d 3h 4m,Logs 59 hours and 4 mins
```

**Time Format**:
- `w` = weeks (5-day work weeks)
- `d` = days (8-hour work days)
- `h` = hours
- `m` = minutes

### Changing Storage Folder

**Option 1 - From the app:**
- Click the "Change Folder" button in the app window

**Option 2 - From menu bar:**
- Right-click the menu bar icon
- Select "Change Storage Folder"

### Work Hours Alert

The app checks every 5 minutes during weekdays (Monday-Friday) between 10 AM and 5 PM. If the timer is not running, you'll receive a system notification reminding you to track your time.

## Predefined JIRA Tasks

The app includes 31 tasks organized into 7 categories:

### TDBU-1 Team Meeting
- TDBU-22: Checklist Deploy
- TDBU-23: Retro
- TDBU-24: Weekly Lead
- TDBU-25: Weekly per Team
- TDBU-26: Weekly with Product
- TDBU-27: Internal Discussion (Brainstorming)
- TDBU-28: Deployment
- TDBU-32: Special Event Support

### TDBU-2 Administrative Work
- TDBU-15: One-on-one Meeting
- TDBU-16: Timesheet Submission
- TDBU-17: Email & Communication
- TDBU-18: Documentation
- TDBU-19: Procurement
- TDBU-20: Recruitment
- TDBU-21: Schedulling

### TDBU-3 Performance & Competency
- TDBU-10: Internal Training
- TDBU-11: External Training
- TDBU-12: Seminar / Webinar / Workshop
- TDBU-13: Learning Journey / LinkedIn Learning
- TDBU-14: PP / PR / PA

### TDBU-4 Company Event
- TDBU-9: Company Event

### TDBU-5 Time Off
- TDBU-6: Izin
- TDBU-7: Cuti
- TDBU-8: Sick Leave

### TDBU-29 Process Support
- TDBU-30: Audit Support
- TDBU-31: Budgeting Support
- TDBU-33: Research
- TDBU-34: Issue Analysis
- TDBU-39: Standby & Support

### TDBU-35 External Meeting
- TDBU-36: Training
- TDBU-37: Workshop
- TDBU-38: Vendor Meeting

## File Structure

```
timelog/
├── main.js          # Main Electron process (menu bar, CSV handling)
├── renderer.js      # UI logic and timer
├── index.html       # App interface
├── package.json     # Dependencies and build config
└── README.md        # This file
```

## Configuration

Settings are stored using `electron-store` and saved to:
- **macOS**: `~/Library/Application Support/timelog-jira/`
- **Windows**: `%APPDATA%/timelog-jira/`

Stored settings:
- `storageFolder` - Path to CSV storage location
- `hasRunBefore` - Whether app has been run before

## Keyboard Shortcuts

- **Enter** (in manual input field) - Start timer
- **Click outside window** - Close app window (keeps running in menu bar)

## Troubleshooting

### App won't start
- Ensure Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again

### CSV files not saving
- Check that the selected storage folder exists and is writable
- Try selecting a different folder (e.g., Desktop)

### Notifications not working
- On macOS: Check System Preferences > Notifications > TimeLog JIRA
- On Windows: Check Settings > System > Notifications

### Build fails
- Ensure you have the necessary build tools installed
- On Windows: Install Visual Studio Build Tools
- On macOS: Install Xcode Command Line Tools

## Development

### Project Structure

- **main.js**: Main process handling menu bar, window management, CSV operations
- **renderer.js**: Renderer process handling UI interactions and timer
- **index.html**: User interface markup and styling

### Adding New Tasks

To add more JIRA tasks to the dropdown:

1. Open `index.html`
2. Find the `<select id="jiraTask">` element
3. Add new `<option>` elements within the appropriate `<optgroup>`
4. Format: `<option value="TICKET-NUMBER">TICKET-NUMBER Task Name</option>`

### Customizing Time Calculations

Default work schedule assumptions:
- 8 hours per day
- 5 days per week

To modify these values, edit the `formatTimeSpent()` function in `renderer.js`:
```javascript
const days = Math.floor(hours / 8);  // Change 8 to your hours per day
const weeks = Math.floor(days / 5);  // Change 5 to your days per week
```

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues or feature requests, please create an issue in the repository.

---

**Happy Time Tracking!** ⏱️
