# Antigravity & Gemini Rules

## Browser Subagent Guidelines

1. **Ask Before Launching Browser**:
   - Always ask the user for explicit permission before invoking or launching the `browser_subagent` or opening the browser.
   - Do not trigger browser sessions autonomously unless explicitly requested or confirmed by the user in the prompt.

2. **Complete Media & Artifact Cleanup**:
   - Every time browser tasks are executed, ensure that **all browser media and captured assets** are deleted before completing the prompt turn.
   - This includes:
     - All session videos (`.webp`, `.mp4`, etc.)
     - All browser screenshots (`.png`, `.jpg`, `.jpeg`)
     - All click feedback images and temporary captures (e.g. in `.system_generated/click_feedback/`, `.tempmediaStorage/`, or the brain directory)
     - All browser scratchpads and temporary inspection files
