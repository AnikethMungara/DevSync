import { useCallback } from "react"
import { toast } from "sonner"
import { executeCode, detectLanguageFromPath } from "@/lib/api/execution"
import { useExecutionStore } from "@/lib/state/execution-store"
import { useEditors } from "@/features/editor/use-editors"
import { useUIStore } from "@/lib/state/ui-store"

export function useCodeExecution() {
  const { startExecution, finishExecution, isExecuting } = useExecutionStore()
  const { getActiveTab } = useEditors()
  const { setActiveBottomTab, setBottomPanelHeight, bottomPanelVisible } = useUIStore()

  const runActiveFile = useCallback(async () => {
    if (isExecuting) {
      toast.warning("Code is already executing")
      return
    }

    const activeTab = getActiveTab()

    if (!activeTab) {
      toast.error("No file is currently open")
      return
    }

    const language = detectLanguageFromPath(activeTab.path)

    if (!language) {
      toast.error(`Unsupported file type: ${activeTab.path}`)
      return
    }

    // Show the output panel
    if (!bottomPanelVisible) {
      setBottomPanelHeight(200)
    }
    setActiveBottomTab("output")

    startExecution(activeTab.path, language)

    try {
      toast.loading(`Running ${activeTab.name}...`, { id: "execution" })

      const result = await executeCode({
        filePath: activeTab.path,
        language,
      })

      finishExecution(result)

      if (result.success && result.result?.success) {
        toast.success(`Execution completed successfully`, { id: "execution" })
      } else if (result.error) {
        toast.error(`Execution failed: ${result.error}`, { id: "execution" })
      } else if (result.result?.stderr) {
        toast.warning(`Execution completed with warnings`, { id: "execution" })
      } else {
        toast.error(`Execution failed with exit code ${result.result?.exitCode}`, { id: "execution" })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      finishExecution({
        success: false,
        error: errorMessage,
      })

      toast.error(`Execution error: ${errorMessage}`, { id: "execution" })
    }
  }, [isExecuting, getActiveTab, startExecution, finishExecution, setActiveBottomTab, setBottomPanelHeight, bottomPanelVisible])

  const runCode = useCallback(async (code: string, language: string) => {
    if (isExecuting) {
      toast.warning("Code is already executing")
      return
    }

    // Show the output panel
    if (!bottomPanelVisible) {
      setBottomPanelHeight(200)
    }
    setActiveBottomTab("output")

    startExecution(undefined, language)

    try {
      toast.loading(`Running ${language} code...`, { id: "execution" })

      const result = await executeCode({
        code,
        language,
      })

      finishExecution(result)

      if (result.success && result.result?.success) {
        toast.success(`Execution completed successfully`, { id: "execution" })
      } else if (result.error) {
        toast.error(`Execution failed: ${result.error}`, { id: "execution" })
      } else {
        toast.error(`Execution failed with exit code ${result.result?.exitCode}`, { id: "execution" })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      finishExecution({
        success: false,
        error: errorMessage,
      })

      toast.error(`Execution error: ${errorMessage}`, { id: "execution" })
    }
  }, [isExecuting, startExecution, finishExecution, setActiveBottomTab, setBottomPanelHeight, bottomPanelVisible])

  return {
    runActiveFile,
    runCode,
    isExecuting,
  }
}
