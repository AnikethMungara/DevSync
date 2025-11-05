"use client"

import { useState, useEffect } from "react"
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
import { Settings, Palette, Code, Terminal, Keyboard, Save } from "lucide-react"

interface SettingsState {
  // Editor Settings
  fontSize: number
  tabSize: number
  lineNumbers: boolean
  wordWrap: boolean
  minimap: boolean
  autoSave: boolean
  formatOnSave: boolean

  // Theme Settings
  theme: "light" | "dark" | "auto"
  colorTheme: string

  // Terminal Settings
  terminalFontSize: number
  terminalCursorStyle: "block" | "line" | "underline"

  // Keybindings
  keymap: "default" | "vim" | "emacs"
}

const DEFAULT_SETTINGS: SettingsState = {
  fontSize: 14,
  tabSize: 2,
  lineNumbers: true,
  wordWrap: false,
  minimap: true,
  autoSave: false,
  formatOnSave: true,
  theme: "dark",
  colorTheme: "monokai",
  terminalFontSize: 13,
  terminalCursorStyle: "block",
  keymap: "default",
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("devsync-settings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Failed to load settings:", e)
      }
    }
  }, [])

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    localStorage.setItem("devsync-settings", JSON.stringify(settings))
    setHasChanges(false)

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent("settings-updated", { detail: settings }))
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    setHasChanges(true)
  }

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
            <Button size="sm" variant="outline" onClick={resetToDefaults}>
              Reset
            </Button>
            <Button size="sm" onClick={saveSettings} disabled={!hasChanges}>
              <Save className="h-3 w-3 mr-1" />
              Save
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
                <Input
                  id="fontSize"
                  type="number"
                  min={8}
                  max={32}
                  value={settings.fontSize}
                  onChange={(e) =>
                    updateSetting("fontSize", parseInt(e.target.value) || 14)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tabSize">Tab Size</Label>
                <Select
                  value={settings.tabSize.toString()}
                  onValueChange={(value) => updateSetting("tabSize", parseInt(value))}
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
                  checked={settings.lineNumbers}
                  onCheckedChange={(checked) => updateSetting("lineNumbers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="wordWrap">Word Wrap</Label>
                <Switch
                  id="wordWrap"
                  checked={settings.wordWrap}
                  onCheckedChange={(checked) => updateSetting("wordWrap", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="minimap">Minimap</Label>
                <Switch
                  id="minimap"
                  checked={settings.minimap}
                  onCheckedChange={(checked) => updateSetting("minimap", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoSave">Auto Save</Label>
                <Switch
                  id="autoSave"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSetting("autoSave", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="formatOnSave">Format on Save</Label>
                <Switch
                  id="formatOnSave"
                  checked={settings.formatOnSave}
                  onCheckedChange={(checked) => updateSetting("formatOnSave", checked)}
                />
              </div>
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
                <Select
                  value={settings.theme}
                  onValueChange={(value: any) => updateSetting("theme", value)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="colorTheme">Color Theme</Label>
                <Select
                  value={settings.colorTheme}
                  onValueChange={(value) => updateSetting("colorTheme", value)}
                >
                  <SelectTrigger id="colorTheme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monokai">Monokai</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="dracula">Dracula</SelectItem>
                    <SelectItem value="solarized-light">Solarized Light</SelectItem>
                    <SelectItem value="solarized-dark">Solarized Dark</SelectItem>
                    <SelectItem value="nord">Nord</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Terminal Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Terminal</h3>
            </div>

            <div className="space-y-4 ml-6">
              <div className="grid gap-2">
                <Label htmlFor="terminalFontSize">Terminal Font Size</Label>
                <Input
                  id="terminalFontSize"
                  type="number"
                  min={8}
                  max={24}
                  value={settings.terminalFontSize}
                  onChange={(e) =>
                    updateSetting("terminalFontSize", parseInt(e.target.value) || 13)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="terminalCursor">Cursor Style</Label>
                <Select
                  value={settings.terminalCursorStyle}
                  onValueChange={(value: any) => updateSetting("terminalCursorStyle", value)}
                >
                  <SelectTrigger id="terminalCursor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="underline">Underline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Keybindings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Keybindings</h3>
            </div>

            <div className="space-y-4 ml-6">
              <div className="grid gap-2">
                <Label htmlFor="keymap">Keymap</Label>
                <Select
                  value={settings.keymap}
                  onValueChange={(value: any) => updateSetting("keymap", value)}
                >
                  <SelectTrigger id="keymap">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="vim">Vim</SelectItem>
                    <SelectItem value="emacs">Emacs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
