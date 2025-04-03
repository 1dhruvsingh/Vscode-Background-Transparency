# VS Code Background Transparency

This extension lets you adjust the background transparency of Visual Studio Code. Control the level of transparency with a simple slider and make your code editor blend in with your desktop.

## Features

- Adjust background transparency from 10% to 100%
- Simple interface to control transparency level
- Works across Windows, macOS, and Linux (with some platform-specific requirements)

## Installation

1. Install from VS Code Marketplace
2. Restart VS Code
3. Run the command "Adjust Background Transparency" from the command palette (Ctrl+Shift+P)

## Platform-Specific Requirements

### Windows

For the best transparency effect on Windows:

1. Install [TranslucentTB](https://github.com/TranslucentTB/TranslucentTB) from the Microsoft Store
2. Create a shortcut to VS Code with these parameters:
   ```
   "C:\Program Files\Microsoft VS Code\Code.exe" --enable-proposed-api --disable-gpu
   ```
3. Open VS Code using this shortcut
4. Adjust transparency using the extension

### macOS

Transparency should work more naturally on macOS:

1. You may want to adjust the system's transparency settings in System Preferences → Accessibility → Display
2. For enhanced control, consider using [yabai](https://github.com/koekeishiya/yabai) window manager

### Linux

On Linux, you need a compositor running:

1. Install and run a compositor like Picom, Compton, or xcompmgr
   ```bash
   # Example for installing Picom on Ubuntu/Debian
   sudo apt install picom
   picom --backend glx --vsync
   ```
2. Make sure your window manager supports transparency
3. For Gnome users, you may need to adjust settings in Gnome Tweaks

## Usage

1. Open the command palette (Ctrl+Shift+P or Cmd+Shift+P on Mac)
2. Type "Adjust Background Transparency" and select the command
3. Enter a value between 0.1 (10% opacity) and 1.0 (100% opacity)
4. Restart VS Code to apply changes

You can also change the transparency level in VS Code settings:
```json
"backgroundTransparency.level": 0.8,
"backgroundTransparency.enabled": true
```

## How It Works

This extension modifies VS Code's CSS files to apply transparency to the editor background. It works best when combined with platform-specific tools that enable window transparency at the OS level.

## Troubleshooting

If transparency doesn't work:

1. Make sure you've met the platform-specific requirements
2. Try restarting VS Code after changing settings
3. If you see errors, check the developer console (Help → Toggle Developer Tools)
4. Make sure you're using a version of VS Code that supports Electron transparency

## Known Issues

- Some VS Code UI elements may remain opaque
- Transparency settings require a restart to take effect
- May conflict with certain themes that explicitly set background colors

## Extension Settings

This extension contributes the following settings:

* `backgroundTransparency.level`: Controls the level of transparency (0.1-1.0)
* `backgroundTransparency.enabled`: Enables or disables transparency

## Release Notes

### 1.0.0

- Initial release
- Support for Windows, macOS, and Linux
- Adjustable transparency level

## License

MIT

## For Developers

If you want to build this extension yourself:

1. Clone the repository
2. Run `npm install`
3. Package with `vsce package`

## Credits

This extension combines several approaches to achieve the best possible transparency effect in VS Code.