"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Settings, Palette, Code, Terminal, Keyboard, Save, RotateCcw, Search } from "lucide-react"
import { useSettingsStore } from "@/lib/state/settings-store"
import { ShortcutRecorder } from "@/components/settings/shortcut-recorder"
import { detectShortcutConflicts, formatShortcutForDisplay } from "@/hooks/use-keyboard-shortcuts"

const SHORTCUT_LABELS: Record<string, string> = {
  saveFile: "Save File",
  openFile: "Open File",
  closeFile: "Close File",
  newFile: "New File",
  commandPalette: "Command Palette",
  toggleTerminal: "Toggle Terminal",
  toggleSidebar: "Toggle Sidebar",
  findInFiles: "Find in Files",
  quickOpen: "Quick Open",
  formatDocument: "Format Document",
  runFile: "Run File",
  toggleBottomPanel: "Toggle Bottom Panel",
  nextTab: "Next Tab",
  previousTab: "Previous Tab",
  closeTab: "Close Tab",
  duplicateLine: "Duplicate Line",
  deleteLine: "Delete Line",
  moveLineUp: "Move Line Up",
  moveLineDown: "Move Line Down",
  toggleComment: "Toggle Comment",
}

export function SettingsPanel() {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    editorSettings,
    updateEditorSetting,
    resetEditorSettings,
    keyboardShortcuts,
    updateKeyboardShortcut,
    resetKeyboardShortcuts,
    resetAllSettings,
  } = useSettingsStore()

  const [searchQuery, setSearchQuery] = useState("")

  const conflicts = detectShortcutConflicts(keyboardShortcuts)

  const getConflictsForAction = (action: string): string[] => {
    return conflicts
      .filter(([a, b]) => a === action || b === action)
      .map(([a, b]) => (a === action ? b : a))
  }

  // Filter shortcuts based on search
  const filteredShortcuts = Object.entries(SHORTCUT_LABELS).filter(
    ([key, label]) =>
      label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      keyboardShortcuts[key as keyof typeof keyboardShortcuts]
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h2 className="font-semibold">Settings</h2>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={resetAllSettings}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset All
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Editor Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Editor</h3>
            </div>

            <div className="space-y-4 ml-6">
              <div className="grid gap-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={fontSize}
                  onValueChange={(value: any) => setFontSize(value)}
                >
                  <SelectTrigger id="fontSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (12px)</SelectItem>
                    <SelectItem value="medium">Medium (14px)</SelectItem>
                    <SelectItem value="large">Large (16px)</SelectItem>
                    <SelectItem value="x-large">X-Large (18px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="JetBrains Mono, Consolas, Monaco"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tabSize">Tab Size</Label>
                <Select
                  value={editorSettings.tabSize.toString()}
                  onValueChange={(value) => updateEditorSetting("tabSize", parseInt(value))}
                >
                  <SelectTrigger id="tabSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 spaces</SelectItem>
                    <SelectItem value="4">4 spaces</SelectItem>
                    <SelectItem value="8">8 spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="lineNumbers">Line Numbers</Label>
                <Switch
                  id="lineNumbers"
                  checked={editorSettings.lineNumbers}
                  onCheckedChange={(checked) => updateEditorSetting("lineNumbers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="wordWrap">Word Wrap</Label>
                <Switch
                  id="wordWrap"
                  checked={editorSettings.wordWrap === "on"}
                  onCheckedChange={(checked) =>
                    updateEditorSetting("wordWrap", checked ? "on" : "off")
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="minimap">Minimap</Label>
                <Switch
                  id="minimap"
                  checked={editorSettings.minimap}
                  onCheckedChange={(checked) => updateEditorSetting("minimap", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoSave">Auto Save</Label>
                <Switch
                  id="autoSave"
                  checked={editorSettings.autoSave}
                  onCheckedChange={(checked) => updateEditorSetting("autoSave", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="formatOnSave">Format on Save</Label>
                <Switch
                  id="formatOnSave"
                  checked={editorSettings.formatOnSave}
                  onCheckedChange={(checked) => updateEditorSetting("formatOnSave", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="bracketPairColorization">Bracket Pair Colorization</Label>
                <Switch
                  id="bracketPairColorization"
                  checked={editorSettings.bracketPairColorization}
                  onCheckedChange={(checked) =>
                    updateEditorSetting("bracketPairColorization", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="stickyScroll">Sticky Scroll</Label>
                <Switch
                  id="stickyScroll"
                  checked={editorSettings.stickyScroll}
                  onCheckedChange={(checked) => updateEditorSetting("stickyScroll", checked)}
                />
              </div>
            </div>

            <div className="ml-6 pt-2">
              <Button size="sm" variant="outline" onClick={resetEditorSettings}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Editor Settings
              </Button>
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Appearance</h3>
            </div>

            <div className="space-y-4 ml-6">
              <div className="grid gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="high-contrast">High Contrast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Keyboard Shortcuts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              </div>
              <Button size="sm" variant="outline" onClick={resetKeyboardShortcuts}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Shortcuts
              </Button>
            </div>

            <div className="ml-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Shortcuts List */}
              <div className="space-y-3">
                {filteredShortcuts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No shortcuts found</p>
                ) : (
                  filteredShortcuts.map(([key, label]) => {
                    const actionKey = key as keyof typeof keyboardShortcuts
                    const conflictsWith = getConflictsForAction(key)

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={`shortcut-${key}`} className="text-sm">
                              {label}
                            </Label>
                            {conflictsWith.length > 0 && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
                                Conflicts with: {conflictsWith.map((c) => SHORTCUT_LABELS[c]).join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="w-64">
                            <ShortcutRecorder
                              value={keyboardShortcuts[actionKey]}
                              onValueChange={(value) => updateKeyboardShortcut(actionKey, value)}
                              conflictsWith={conflictsWith}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
