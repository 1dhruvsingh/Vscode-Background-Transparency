const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Store original CSS content to restore on deactivation
let originalCss = null;
let cssFilePath = null;
let transparencyEnabled = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Extension "vscode-background-transparency" is now active!');

    // Initialize paths and settings
    const appDirectory = getVSCodeAppDirectory();
    cssFilePath = path.join(appDirectory, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.css');
    
    // Check if we're in a newer VS Code version
    if (!fs.existsSync(cssFilePath)) {
        cssFilePath = path.join(appDirectory, 'out', 'vs', 'workbench', 'workbench.desktop.main.css');
    }
    
    // Check if we're in VSCode Insiders
    if (!fs.existsSync(cssFilePath)) {
        cssFilePath = path.join(appDirectory, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.web.main.css');
    }
    
    // For newer Electron versions
    if (!fs.existsSync(cssFilePath)) {
        cssFilePath = path.join(appDirectory, 'resources', 'app', 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.js');
    }

    // Last resort
    if (!fs.existsSync(cssFilePath)) {
        // Try to find the CSS file by searching for it
        const possiblePaths = findWorkbenchCssFiles(appDirectory);
        if (possiblePaths.length > 0) {
            cssFilePath = possiblePaths[0];
        } else {
            vscode.window.showErrorMessage("Could not find VS Code CSS file to modify. Please check the extension documentation.");
            return;
        }
    }

    // Register commands
    let adjustCommand = vscode.commands.registerCommand('backgroundTransparency.adjust', () => {
        adjustTransparency(context);
    });

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('backgroundTransparency.level') || 
                event.affectsConfiguration('backgroundTransparency.enabled')) {
                applyTransparency();
            }
        })
    );

    context.subscriptions.push(adjustCommand);

    // Backup original CSS if it hasn't been backed up
    const backupPath = path.join(context.extensionPath, 'original.css.backup');
    if (!fs.existsSync(backupPath)) {
        try {
            originalCss = fs.readFileSync(cssFilePath, 'utf8');
            fs.writeFileSync(backupPath, originalCss);
        } catch (err) {
            console.error('Failed to backup original CSS:', err);
            vscode.window.showErrorMessage('Failed to backup original CSS. The extension may not work correctly.');
        }
    } else {
        originalCss = fs.readFileSync(backupPath, 'utf8');
    }

    // Apply transparency on activation if enabled
    const config = vscode.workspace.getConfiguration('backgroundTransparency');
    if (config.get('enabled')) {
        applyTransparency();
    }

    // Show startup message with platform-specific instructions
    showStartupInstructions();
}

/**
 * Find the VS Code application directory based on the platform
 */
function getVSCodeAppDirectory() {
    const platform = process.platform;
    let appDirectory;

    switch (platform) {
        case 'win32':
            appDirectory = path.dirname(process.execPath);
            break;
        case 'darwin':
            appDirectory = path.join(path.dirname(process.execPath), '..', 'Resources');
            break;
        case 'linux':
            appDirectory = path.join(path.dirname(process.execPath), '..');
            break;
        default:
            appDirectory = path.dirname(process.execPath);
    }

    return appDirectory;
}

/**
 * Find workbench CSS files by searching recursively
 */
function findWorkbenchCssFiles(startDir) {
    const results = [];
    
    function search(dir) {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                search(filePath);
            } else if (file.includes('workbench') && (file.endsWith('.css') || file.endsWith('.js'))) {
                results.push(filePath);
            }
        }
    }
    
    search(startDir);
    return results;
}

/**
 * Show platform-specific instructions when the extension starts
 */
function showStartupInstructions() {
    const platform = process.platform;
    let message = '';
    
    switch (platform) {
        case 'win32':
            message = 'For full transparency effect, you need to use TranslucentTB or similar tool, and run VS Code with --enable-proposed-api --disable-gpu flags.';
            break;
        case 'darwin':
            message = 'For better transparency, consider using a window manager like yabai or adjusting macOS transparency settings.';
            break;
        case 'linux':
            message = 'For transparency to work, you need a compositor like Picom, Compton, or xcompmgr running.';
            break;
    }
    
    vscode.window.showInformationMessage(message, 'Show Documentation').then(selection => {
        if (selection === 'Show Documentation') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/yourusername/vscode-background-transparency#readme'));
        }
    });
}

/**
 * Apply transparency based on current settings
 */
async function applyTransparency() {
    const config = vscode.workspace.getConfiguration('backgroundTransparency');
    const level = config.get('level');
    const enabled = config.get('enabled');
    
    if (!enabled) {
        // Restore original CSS if transparency is disabled
        if (transparencyEnabled && originalCss) {
            try {
                await fs.writeFile(cssFilePath, originalCss);
                transparencyEnabled = false;
                vscode.window.showInformationMessage('Background transparency disabled. Restart VS Code to apply changes.');
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to disable transparency: ${err.message}`);
            }
        }
        return;
    }
    
    try {
        // Read current CSS
        let css = await fs.readFile(cssFilePath, 'utf8');
        
        // Generate transparency CSS
        const alpha = level;
        const transparencyCSS = `
/* VS Code Background Transparency */
body {
    background-color: rgba(30, 30, 30, ${alpha}) !important;
    opacity: ${alpha} !important;
}
.monaco-workbench {
    background-color: rgba(30, 30, 30, ${alpha}) !important;
}
.editor-container {
    background-color: rgba(30, 30, 30, ${alpha}) !important;
}
.part.editor {
    background-color: rgba(30, 30, 30, ${alpha}) !important;
}
`;
        
        // Check if transparency has already been applied
        if (css.includes('VS Code Background Transparency')) {
            // Replace existing transparency CSS
            css = css.replace(/\/\* VS Code Background Transparency \*\/[\s\S]*?}/g, transparencyCSS);
        } else {
            // Add transparency CSS at the end
            css += transparencyCSS;
        }
        
        // Write modified CSS
        await fs.writeFile(cssFilePath, css);
        transparencyEnabled = true;
        
        vscode.window.showInformationMessage(`Background transparency set to ${level * 100}%. Restart VS Code to apply changes.`);
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to apply transparency: ${err.message}`);
        console.error(err);
    }
}

/**
 * Show transparency adjustment input box
 */
async function adjustTransparency(context) {
    const config = vscode.workspace.getConfiguration('backgroundTransparency');
    const currentLevel = config.get('level');
    
    const input = await vscode.window.showInputBox({
        prompt: 'Enter transparency level (0.1 to 1.0)',
        placeHolder: '0.1 = most transparent, 1.0 = fully opaque',
        value: currentLevel.toString()
    });
    
    if (input === undefined) {
        return; // User cancelled
    }
    
    const newLevel = parseFloat(input);
    
    if (isNaN(newLevel) || newLevel < 0.1 || newLevel > 1.0) {
        vscode.window.showErrorMessage('Please enter a valid number between 0.1 and 1.0');
        return;
    }
    
    await config.update('level', newLevel, vscode.ConfigurationTarget.Global);
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    
    // Apply transparency will be triggered by the configuration change event
}

/**
 * This method is called when your extension is deactivated
 */
function deactivate() {
    // Restore original CSS
    if (originalCss && cssFilePath) {
        try {
            fs.writeFileSync(cssFilePath, originalCss);
            console.log('Restored original CSS');
        } catch (err) {
            console.error('Failed to restore original CSS:', err);
        }
    }
}

module.exports = {
    activate,
    deactivate
};