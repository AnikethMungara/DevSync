# Settings Guide

## Overview

The Settings panel allows you to customize the DevSync IDE to match your preferences. Access settings from the **Settings** tab in the bottom panel.

## Settings Categories

### 1. Appearance
Customize the look and feel of the IDE

### 2. Editor
Configure editor behavior and display options

### 3. Keyboard Shortcuts
View and customize keyboard shortcuts (coming soon)

---

## Appearance Settings

### Theme

Choose from three built-in themes:

#### **Dark Theme** (Default)
- Dark background with light text
- Easy on the eyes for long coding sessions
- Recommended for low-light environments

#### **Light Theme**
- Light background with dark text
- High contrast for well-lit environments
- Good for daytime coding

#### **High Contrast**
- Maximum contrast for accessibility
- Black background with white text
- Helpful for vision impairments

**How to change:**
1. Open Settings → Appearance tab
2. Click on your preferred theme card
3. Theme applies immediately

### Font Size

Adjust the editor font size to your preference:

| Size | Pixels | Best For |
|------|--------|----------|
| **Small** | 12px | High-density displays, maximizing screen space |
| **Medium** | 14px | Default, balanced readability |
| **Large** | 16px | Comfortable reading, presentations |
| **X-Large** | 18px | Accessibility, large monitors |

**How to change:**
1. Open Settings → Appearance tab
2. Select font size from dropdown
3. Preview shows current size

### Font Family

Customize the monospace font used in the editor.

**Default:** `JetBrains Mono, Consolas, Monaco, 'Courier New', monospace`

**Popular alternatives:**
- `Fira Code, monospace` - Programming ligatures
- `Source Code Pro, monospace` - Clean and readable
- `IBM Plex Mono, monospace` - Modern IBM font
- `Cascadia Code, monospace` - Windows Terminal font
- `Hack, monospace` - Open source coding font

**How to change:**
1. Open Settings → Appearance tab
2. Enter font family in the input field
3. Preview updates in real-time

**Tip:** List multiple fonts as fallbacks:
```
JetBrains Mono, Fira Code, Consolas, monospace
```

---

## Editor Settings

### Indentation

#### Tab Size
Number of spaces per tab level.

- **2 spaces** - Common in JavaScript, React, Vue
- **4 spaces** - Common in Python, Java, C#
- **8 spaces** - Linux kernel style

**Default:** 2 spaces

#### Insert Spaces
Whether to use spaces or actual tab characters.

- **✅ Enabled (Default)** - Use spaces (recommended for consistency)
- **❌ Disabled** - Use tab characters

**Why spaces?**
- Consistent across all editors
- Version control friendly
- No tab/space mixing issues

### Display Options

#### Word Wrap
Control how long lines are displayed:

- **Off (Default)** - Horizontal scrolling required
- **On** - Wrap at viewport edge
- **Bounded** - Wrap at specific column

**When to use:**
- **Off**: Programming (prefer short lines)
- **On**: Markdown, documentation
- **Bounded**: Enforcing line length limits

#### Minimap
Code overview displayed on right side of editor.

- **✅ Enabled (Default)** - Shows code structure
- **❌ Disabled** - More horizontal space

**Benefits:**
- Quick navigation to different parts of file
- Visual sense of file structure
- See which parts of file you've edited

#### Line Numbers
Show line numbers in left gutter.

- **✅ Enabled (Default)** - Show numbers
- **❌ Disabled** - Hide numbers

**Benefits:**
- Easy reference in code reviews
- Jump to specific lines
- Debugging with line numbers

#### Sticky Scroll
Keep function/class headers visible while scrolling.

- **✅ Enabled (Default)** - Headers stick to top
- **❌ Disabled** - Normal scrolling

**Benefits:**
- Always know which function you're in
- Better context when editing large functions
- Helpful in deeply nested code

### Behavior Options

#### Auto Save
Automatically save file changes.

- **✅ Enabled (Default)** - Save automatically
- **❌ Disabled** - Manual save with Ctrl+S

**When enabled, you can set:**
- **Auto Save Delay** - Milliseconds to wait before saving
  - Default: 1000ms (1 second)
  - Range: 100ms - 5000ms

**Benefits:**
- Never lose work
- No need to remember to save
- Seamless experience

#### Format on Save
Automatically format code when saving.

- **✅ Enabled** - Auto-format on save
- **❌ Disabled (Default)** - Manual formatting only

**Benefits:**
- Consistent code style
- No manual formatting needed
- Team coding standards enforced

**Note:** Requires configured formatter (Prettier, etc.)

#### Bracket Colorization
Color-code matching brackets for easier reading.

- **✅ Enabled (Default)** - Rainbow brackets
- **❌ Disabled** - Default bracket color

**Benefits:**
- Easier to match brackets
- Visual nesting depth
- Spot missing brackets quickly

---

## Keyboard Shortcuts

View all available keyboard shortcuts and their functions.

### File Operations
- **Save File** - `Ctrl+S`
- **Open File** - `Ctrl+O`
- **Close File** - `Ctrl+W`
- **New File** - `Ctrl+N`

### Navigation
- **Quick Open** - `Ctrl+P`
- **Find in Files** - `Ctrl+Shift+F`
- **Command Palette** - `Ctrl+Shift+P`

### View
- **Toggle Terminal** - `` Ctrl+` ``
- **Toggle Sidebar** - `Ctrl+B`

### Editing
- **Format Document** - `Shift+Alt+F`

### Customization (Coming Soon)
Full keyboard shortcut customization will be available in a future update. Currently, shortcuts are for reference only.

---

## Tips & Best Practices

### Finding the Right Settings

**For Readability:**
- Increase font size (Large or X-Large)
- Enable line numbers
- Use high contrast theme if needed

**For Screen Real Estate:**
- Disable minimap
- Use small font size
- Disable sticky scroll
- Turn off line numbers

**For Collaboration:**
- Use consistent tab size with team (usually 2 or 4)
- Enable insert spaces
- Enable format on save
- Match team's editor settings

**For Markdown/Documentation:**
- Enable word wrap
- Larger font size
- Disable minimap (more width for text)

### Recommended Setups

#### **JavaScript/React Developer**
```
Tab Size: 2
Insert Spaces: ✅
Word Wrap: Off
Minimap: ✅
Auto Save: ✅
Format on Save: ✅
```

#### **Python Developer**
```
Tab Size: 4
Insert Spaces: ✅
Word Wrap: Off
Minimap: ✅
Auto Save: ✅
Format on Save: ✅
```

#### **Writer/Documentation**
```
Tab Size: 2
Word Wrap: On
Minimap: ❌
Font Size: Large
Auto Save: ✅
```

#### **Pair Programming/Teaching**
```
Font Size: X-Large
Theme: High Contrast
Line Numbers: ✅
Sticky Scroll: ✅
Bracket Colorization: ✅
```

---

## Resetting Settings

### Reset Individual Sections

**Editor Settings:**
1. Open Settings → Editor tab
2. Scroll to bottom
3. Click "Reset Editor Settings"

**Keyboard Shortcuts:**
1. Open Settings → Keyboard Shortcuts tab
2. Scroll to bottom
3. Click "Reset Keyboard Shortcuts"

### Reset All Settings

To reset everything to defaults:

1. Open Settings panel
2. Click "Reset All" button in top-right
3. Confirm the action

**Warning:** This resets:
- Theme to Dark
- Font size to Medium
- All editor settings to defaults
- All keyboard shortcuts to defaults

This action cannot be undone!

---

## Settings Storage

### Where Settings are Stored

Settings are stored in your **browser's local storage** using the key `devsync-settings`.

**Location:**
- Persists across browser sessions
- Unique per browser profile
- Not synced across devices

### Settings Backup

To backup your settings:

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find `devsync-settings`
4. Copy the value

To restore:
1. Paste the value back into local storage
2. Refresh the page

### Clearing Settings

To completely clear settings:

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete `devsync-settings` key
4. Refresh the page

Settings will reset to defaults.

---

## Troubleshooting

### Settings Not Saving

**Symptoms:** Changes revert after refresh

**Solutions:**
1. Check browser local storage is enabled
2. Ensure not in incognito/private mode
3. Check browser storage isn't full
4. Try different browser

### Theme Not Applying

**Symptoms:** Theme doesn't change appearance

**Solutions:**
1. Refresh the page
2. Clear browser cache
3. Check if custom CSS is interfering
4. Try "Reset All" and reapply

### Font Not Changing

**Symptoms:** Font family doesn't update

**Solutions:**
1. Ensure font is installed on your system
2. Use quotes for font names with spaces
3. Include fallback fonts
4. Refresh the page

### Performance Issues

**Symptoms:** IDE feels slow

**Try:**
1. Disable minimap
2. Disable sticky scroll
3. Reduce auto save delay
4. Use smaller font size
5. Disable bracket colorization

---

## Future Enhancements

Planned features for upcoming releases:

- ✨ **Theme Customization** - Create custom color themes
- ✨ **Font Ligatures** - Support for programming ligatures
- ✨ **Keyboard Shortcut Editing** - Full shortcut customization
- ✨ **Settings Sync** - Sync across devices
- ✨ **Settings Profiles** - Quick switch between setups
- ✨ **Import/Export** - Share settings with team
- ✨ **Advanced Editor Options** - More Monaco editor settings
- ✨ **Custom CSS** - Inject custom styles

---

## FAQ

**Q: Will my settings sync across devices?**
A: Not currently. Settings are stored locally in your browser.

**Q: Can I share my settings with my team?**
A: You can export from local storage and share the JSON manually.

**Q: Do settings apply to all projects?**
A: Yes, settings are global across all projects in DevSync.

**Q: Can I have different settings per project?**
A: Not currently. This is planned for a future release.

**Q: Will settings affect other users in collaboration?**
A: No, settings are local to your browser only.

**Q: Can I use custom themes from VS Code?**
A: Not yet. This is planned for a future release.

**Q: Do keyboard shortcuts actually work?**
A: Currently they're for reference only. Full implementation coming soon.

**Q: What happens if I clear browser data?**
A: All settings will be lost. Export them first if you want to keep them.

---

## Related Documentation

- [QUICK_START.md](QUICK_START.md) - Getting started guide
- [TERMINAL_GUIDE.md](TERMINAL_GUIDE.md) - Terminal features
- [README.md](README.md) - Full project documentation

---

**Need help?** Open an issue on GitHub or check the troubleshooting section.
