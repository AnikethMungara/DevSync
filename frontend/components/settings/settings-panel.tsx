"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Palette,
  Type,
  FileCode,
  Keyboard,
  RotateCcw,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import {
  useSettingsStore,
  type Theme,
  type FontSize,
  fontSizeValues,
} from "@/lib/state/settings-store"

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

  const [activeTab, setActiveTab] = useState("appearance")

  const handleResetAll = () => {
    if (
      confirm(
        "Are you sure you want to reset all settings to defaults? This cannot be undone."
      )
    ) {
      resetAllSettings()
      toast.success("All settings reset to defaults")
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Settings</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetAll}
          className="bg-[#252526] border-[#3e3e42] text-white hover:bg-[#353537]"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset All
        </Button>
      </div>

      {/* Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        {/* Tabs List */}
        <TabsList className="bg-[#252526] border-b border-[#3e3e42] rounded-none p-0 h-10 justify-start">
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-blue-400 rounded-none"
          >
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-blue-400 rounded-none"
          >
            <FileCode className="h-4 w-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger
            value="keyboard"
            className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-blue-400 rounded-none"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Keyboard Shortcuts
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Theme */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-semibold">Theme</Label>
                  {theme !== "dark" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTheme("dark")}
                      className="h-7 text-xs"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(["dark", "light", "high-contrast"] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t)
                        toast.success(`Theme changed to ${t}`)
                      }}
                      className={`relative p-4 rounded-lg border-2 transition-colors ${
                        theme === t
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-[#3e3e42] bg-[#252526] hover:border-[#4e4e52]"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-12 h-12 rounded ${
                            t === "dark"
                              ? "bg-[#1e1e1e] border border-gray-700"
                              : t === "light"
                              ? "bg-white border border-gray-300"
                              : "bg-black border-2 border-white"
                          }`}
                        />
                        <span className="text-xs text-white capitalize">{t}</span>
                      </div>
                      {theme === t && (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Font Size</Label>
                <Select value={fontSize} onValueChange={(v) => setFontSize(v as FontSize)}>
                  <SelectTrigger className="bg-[#252526] border-[#3e3e42] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252526] border-[#3e3e42]">
                    <SelectItem value="small">Small (12px)</SelectItem>
                    <SelectItem value="medium">Medium (14px)</SelectItem>
                    <SelectItem value="large">Large (16px)</SelectItem>
                    <SelectItem value="x-large">X-Large (18px)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Current size:{" "}
                  <code className="bg-[#252526] px-2 py-1 rounded">
                    {fontSizeValues[fontSize]}
                  </code>
                </p>
              </div>

              {/* Font Family */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Font Family</Label>
                <Input
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-[#252526] border-[#3e3e42] text-white font-mono"
                  placeholder="Font family..."
                />
                <p className="text-xs text-gray-400">
                  Preview:{" "}
                  <span style={{ fontFamily }} className="bg-[#252526] px-2 py-1 rounded">
                    The quick brown fox jumps over the lazy dog
                  </span>
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Indentation */}
              <div className="space-y-4">
                <Label className="text-white font-semibold">Indentation</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Tab Size</Label>
                    <p className="text-xs text-gray-400">
                      Number of spaces per tab
                    </p>
                  </div>
                  <Select
                    value={editorSettings.tabSize.toString()}
                    onValueChange={(v) =>
                      updateEditorSetting("tabSize", parseInt(v))
                    }
                  >
                    <SelectTrigger className="w-24 bg-[#252526] border-[#3e3e42] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252526] border-[#3e3e42]">
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Insert Spaces</Label>
                    <p className="text-xs text-gray-400">
                      Use spaces instead of tabs
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.insertSpaces}
                    onCheckedChange={(checked) =>
                      updateEditorSetting("insertSpaces", checked)
                    }
                  />
                </div>
              </div>

              {/* Display */}
              <div className="space-y-4">
                <Label className="text-white font-semibold">Display</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Word Wrap</Label>
                    <p className="text-xs text-gray-400">
                      Wrap long lines
                    </p>
                  </div>
                  <Select
                    value={editorSettings.wordWrap}
                    onValueChange={(v) =>
                      updateEditorSetting("wordWrap", v as typeof editorSettings.wordWrap)
                    }
                  >
                    <SelectTrigger className="w-32 bg-[#252526] border-[#3e3e42] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252526] border-[#3e3e42]">
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="bounded">Bounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Minimap</Label>
                    <p className="text-xs text-gray-400">
                      Show code overview
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.minimap}
                    onCheckedChange={(checked) =>
                      updateEditorSetting("minimap", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Line Numbers</Label>
                    <p className="text-xs text-gray-400">
                      Show line numbers
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.lineNumbers}
                    onCheckedChange={(checked) =>
                      updateEditorSetting("lineNumbers", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Sticky Scroll</Label>
                    <p className="text-xs text-gray-400">
                      Keep function headers visible
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.stickyScroll}
                    onCheckedChange={(checked) =>
                      updateEditorSetting("stickyScroll", checked)
                    }
                  />
                </div>
              </div>

              {/* Behavior */}
              <div className="space-y-4">
                <Label className="text-white font-semibold">Behavior</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Auto Save</Label>
                    <p className="text-xs text-gray-400">
                      Automatically save changes
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.autoSave}
                    onCheckedChange={(checked) =>
                      updateEditorSetting("autoSave", checked)
                    }
                  />
                </div>

                {editorSettings.autoSave && (
                  <div className="flex items-center justify-between pl-4">
                    <div>
                      <Label className="text-sm text-white">Auto Save Delay</Label>
                      <p className="text-xs text-gray-400">
                        Delay in milliseconds
                      </p>
                    </div>
                    <Input
                      type="number"
                      value={editorSettings.autoSaveDelay}
                      onChange={(e) =>
                        updateEditorSetting("autoSaveDelay", parseInt(e.target.value))
                      }
                      className="w-24 bg-[#252526] border-[#3e3e42] text-white"
                      min={100}
                      max={5000}
                      step={100}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Format on Save</Label>
                    <p className="text-xs text-gray-400">
                      Auto-format when saving
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.formatOnSave}
                    onCheckedChange={(checked) =>
                      updateEditorSetting("formatOnSave", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-white">Bracket Colorization</Label>
                    <p className="text-xs text-gray-400">
                      Color-code matching brackets
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.bracketPairColorization}
                    onCheckedChange={(checked) =>
                      updateEditorSetting("bracketPairColorization", checked)
                    }
                  />
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-[#3e3e42]">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetEditorSettings()
                    toast.success("Editor settings reset to defaults")
                  }}
                  className="w-full bg-[#252526] border-[#3e3e42] text-white hover:bg-[#353537]"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Editor Settings
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Keyboard Shortcuts Tab */}
        <TabsContent value="keyboard" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-400">
                Customize keyboard shortcuts for common actions. Click on a shortcut to
                edit it.
              </p>

              <div className="space-y-3">
                {Object.entries(keyboardShortcuts).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-[#252526] border border-[#3e3e42] rounded"
                  >
                    <div>
                      <Label className="text-sm text-white capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <p className="text-xs text-gray-400">
                        {getShortcutDescription(key)}
                      </p>
                    </div>
                    <Input
                      value={value}
                      onChange={(e) =>
                        updateKeyboardShortcut(
                          key as keyof typeof keyboardShortcuts,
                          e.target.value
                        )
                      }
                      className="w-32 bg-[#1e1e1e] border-[#3e3e42] text-white font-mono text-center"
                      placeholder="Ctrl+S"
                    />
                  </div>
                ))}
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-[#3e3e42]">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetKeyboardShortcuts()
                    toast.success("Keyboard shortcuts reset to defaults")
                  }}
                  className="w-full bg-[#252526] border-[#3e3e42] text-white hover:bg-[#353537]"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Keyboard Shortcuts
                </Button>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <p className="text-xs text-yellow-400">
                  <strong>Note:</strong> Keyboard shortcuts are currently for display
                  only. Full keyboard shortcut customization will be implemented in a
                  future update.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getShortcutDescription(key: string): string {
  const descriptions: Record<string, string> = {
    saveFile: "Save the current file",
    openFile: "Open a file dialog",
    closeFile: "Close the current file",
    newFile: "Create a new file",
    commandPalette: "Open command palette",
    toggleTerminal: "Show/hide terminal",
    toggleSidebar: "Show/hide sidebar",
    findInFiles: "Search across files",
    quickOpen: "Quick file navigation",
    formatDocument: "Format current document",
  }
  return descriptions[key] || ""
}
