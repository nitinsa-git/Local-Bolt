import { create } from "zustand";

export interface FileEntry {
  path: string;
  content: string;
  original_content: string;
  size: number;
}

export interface AgentStep {
  step_id: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  detail: string;
  iteration: number;
  timestamp: string;
}

export interface ContainerGovernance {
  project_id: string;
  container_id: string;
  status: string;
  memory_usage_mb: number;
  memory_limit_mb: number;
  cpu_percent: number;
  preview_port: number;
  mode: string;
  env_vars: Record<string, string>;
}

export interface LLMSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  instructions: string;
  tags: string[];
  source: string;
}

export interface WorkspaceSummary {
  project_id: string;
  file_count: number;
  has_git: boolean;
  skills?: string[];
  last_modified: string;
  preview_url: string;
}

export interface ChatHistoryItem {
  id: string;
  project_id: string;
  prompt: string;
  template: string;
  skills?: string[];
  status: string;
  iterations: number;
  files_changed: string[];
  timestamp: string;
}

export type ThemeTone =
  | "obsidian-dark"
  | "taste-monochrome"
  | "midnight-carbon"
  | "alabaster-light"
  | "warm-ivory";

export interface ThemeToneMeta {
  id: ThemeTone;
  name: string;
  mode: "dark" | "light";
  tagline: string;
  swatchBg: string;
  swatchAccent: string;
}

export const STUDIO_THEMES: ThemeToneMeta[] = [
  {
    id: "obsidian-dark",
    name: "Obsidian Pro",
    mode: "dark",
    tagline: "Precision obsidian & 1px specular hairlines",
    swatchBg: "#040711",
    swatchAccent: "#6366f1",
  },
  {
    id: "taste-monochrome",
    name: "Swiss Monochrome",
    mode: "dark",
    tagline: "TasteSkill warm zinc editorial monochrome",
    swatchBg: "#09090b",
    swatchAccent: "#e4e4e7",
  },
  {
    id: "midnight-carbon",
    name: "Carbon Matte",
    mode: "dark",
    tagline: "High-contrast carbon zinc & cyan beam",
    swatchBg: "#09090b",
    swatchAccent: "#06b6d4",
  },
  {
    id: "alabaster-light",
    name: "Alabaster Daylight",
    mode: "light",
    tagline: "Crisp porcelain glass & royal indigo",
    swatchBg: "#f8fafc",
    swatchAccent: "#4f46e5",
  },
  {
    id: "warm-ivory",
    name: "Warm Ivory",
    mode: "light",
    tagline: "Low-glare editorial paper & violet",
    swatchBg: "#f5f3ef",
    swatchAccent: "#7c3aed",
  },
];

interface StudioState {
  projectId: string;
  workspaces: WorkspaceSummary[];
  template: string;
  templateLocked: boolean;
  themeTone: ThemeTone;
  commandPaletteOpen: boolean;
  availableSkills: LLMSkill[];
  selectedSkills: string[];
  chatHistory: ChatHistoryItem[];
  files: FileEntry[];
  activeFilePath: string;
  openTabs: string[];
  showDiffView: boolean;
  showEditor: boolean;
  showPreviewConsole: boolean;
  showWorkspaceFiles: boolean;
  showSteppedProgress: boolean;
  showSandboxShell: boolean;
  showSelectedSkills: boolean;
  steps: AgentStep[];
  isRunningAgent: boolean;
  previewUrl: string;
  previewRefreshKey: number;
  consoleLogs: string[];
  governanceOpen: boolean;
  workspaceModalOpen: boolean;
  gitModalOpen: boolean;
  skillsModalOpen: boolean;
  containerStats: ContainerGovernance | null;
  setProjectId: (id: string) => void;
  setWorkspaces: (workspaces: WorkspaceSummary[]) => void;
  setTemplate: (t: string) => void;
  setTemplateLocked: (locked: boolean) => void;
  setThemeTone: (tone: ThemeTone) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAvailableSkills: (skills: LLMSkill[]) => void;
  setSelectedSkills: (skills: string[]) => void;
  toggleSkill: (skillId: string) => void;
  setChatHistory: (history: ChatHistoryItem[]) => void;
  setFiles: (files: FileEntry[]) => void;
  upsertFileDiff: (path: string, content: string, original: string) => void;
  setActiveFilePath: (path: string) => void;
  closeTab: (path: string) => void;
  setShowDiffView: (show: boolean) => void;
  setShowEditor: (show: boolean) => void;
  setShowPreviewConsole: (show: boolean) => void;
  setShowWorkspaceFiles: (show: boolean) => void;
  setShowSteppedProgress: (show: boolean) => void;
  setShowSandboxShell: (show: boolean) => void;
  setShowSelectedSkills: (show: boolean) => void;
  upsertStep: (step: AgentStep) => void;
  resetSteps: () => void;
  setIsRunningAgent: (running: boolean) => void;
  setPreviewUrl: (url: string) => void;
  bumpPreviewRefresh: () => void;
  appendConsoleLog: (log: string) => void;
  clearConsoleLogs: () => void;
  setGovernanceOpen: (open: boolean) => void;
  setWorkspaceModalOpen: (open: boolean) => void;
  setGitModalOpen: (open: boolean) => void;
  setSkillsModalOpen: (open: boolean) => void;
  setContainerStats: (stats: ContainerGovernance) => void;
}

const isBrowser = typeof window !== "undefined";
const isLocalhost =
  isBrowser &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const BACKEND_HTTP = isBrowser
  ? isLocalhost
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8700"
    : window.location.origin
  : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8700";

export const BACKEND_WS = isBrowser
  ? isLocalhost
    ? process.env.NEXT_PUBLIC_BACKEND_WS || "ws://localhost:8700"
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
  : process.env.NEXT_PUBLIC_BACKEND_WS || "ws://localhost:8700";

export function resolvePreviewUrl(rawUrl: string): string {
  if (!rawUrl) return `${BACKEND_HTTP}/api/projects/default/preview`;
  const norm = rawUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i, "");
  if (norm.startsWith("/")) {
    return `${BACKEND_HTTP}${norm}`;
  }
  return rawUrl;
}

export const useStudioStore = create<StudioState>((set) => ({
  projectId: "default",
  workspaces: [],
  template: "nextjs",
  templateLocked: false,
  themeTone: "obsidian-dark",
  commandPaletteOpen: false,
  availableSkills: [],
  selectedSkills: ["tokless"],
  chatHistory: [],
  files: [],
  activeFilePath: "app/page.tsx",
  openTabs: ["app/page.tsx", "index.html", "package.json"],
  showDiffView: false,
  showEditor: false,
  showPreviewConsole: false,
  showWorkspaceFiles: false,
  showSteppedProgress: false,
  showSandboxShell: false,
  showSelectedSkills: false,
  steps: [],
  isRunningAgent: false,
  previewUrl: `${BACKEND_HTTP}/api/projects/default/preview`,
  previewRefreshKey: 1,
  consoleLogs: [
    "[VibeForge] Preview viewport initialized.",
    "[Sandbox] Waiting for live container output...",
  ],
  governanceOpen: false,
  workspaceModalOpen: false,
  gitModalOpen: false,
  skillsModalOpen: false,
  containerStats: null,

  setProjectId: (projectId) =>
    set((state) => ({
      projectId,
      steps: [],
      previewUrl: `${BACKEND_HTTP}/api/projects/${projectId}/preview`,
      previewRefreshKey: state.previewRefreshKey + 1,
    })),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setTemplate: (template) =>
    set((state) => (state.templateLocked ? state : { template })),
  setTemplateLocked: (templateLocked) => set({ templateLocked }),
  setThemeTone: (themeTone) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("local-dev-studio-theme", themeTone);
        document.documentElement.setAttribute("data-theme", themeTone);
      } catch {
        // ignore storage errors
      }
    }
    set({ themeTone });
  },
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setAvailableSkills: (availableSkills) => set({ availableSkills }),
  setSelectedSkills: (selectedSkills) => set({ selectedSkills }),
  toggleSkill: (skillId) =>
    set((state) => ({
      selectedSkills: state.selectedSkills.includes(skillId)
        ? state.selectedSkills.filter((id) => id !== skillId)
        : [...state.selectedSkills, skillId],
    })),
  setChatHistory: (chatHistory) => set({ chatHistory }),
  setFiles: (files) =>
    set((state) => {
      const paths = files.map((f) => f.path);
      const active = paths.includes(state.activeFilePath)
        ? state.activeFilePath
        : paths[0] || "index.html";
      const tabs = Array.from(
        new Set([...state.openTabs.filter((t) => paths.includes(t)), active])
      ).filter(Boolean);
      return {
        files,
        activeFilePath: active,
        openTabs: tabs.length ? tabs : paths.slice(0, 3),
      };
    }),
  upsertFileDiff: (path, content, original) =>
    set((state) => {
      const existing = state.files.find((f) => f.path === path);
      const updatedFile: FileEntry = {
        path,
        content,
        original_content: original,
        size: content.length,
      };
      const files = existing
        ? state.files.map((f) => (f.path === path ? updatedFile : f))
        : [...state.files, updatedFile];
      const openTabs = state.openTabs.includes(path)
        ? state.openTabs
        : [...state.openTabs, path];
      return { files, openTabs, activeFilePath: path };
    }),
  setActiveFilePath: (path) =>
    set((state) => ({
      activeFilePath: path,
      openTabs: state.openTabs.includes(path)
        ? state.openTabs
        : [...state.openTabs, path],
    })),
  closeTab: (path) =>
    set((state) => {
      const nextTabs = state.openTabs.filter((t) => t !== path);
      const nextActive =
        state.activeFilePath === path
          ? nextTabs[nextTabs.length - 1] || ""
          : state.activeFilePath;
      return { openTabs: nextTabs, activeFilePath: nextActive };
    }),
  setShowDiffView: (showDiffView) => set({ showDiffView }),
  setShowEditor: (showEditor) => set({ showEditor }),
  setShowPreviewConsole: (showPreviewConsole) => set({ showPreviewConsole }),
  setShowWorkspaceFiles: (showWorkspaceFiles) => set({ showWorkspaceFiles }),
  setShowSteppedProgress: (showSteppedProgress) => set({ showSteppedProgress }),
  setShowSandboxShell: (showSandboxShell) => set({ showSandboxShell }),
  setShowSelectedSkills: (showSelectedSkills) => set({ showSelectedSkills }),
  upsertStep: (step) =>
    set((state) => {
      const idx = state.steps.findIndex((s) => s.step_id === step.step_id);
      if (idx >= 0) {
        const next = [...state.steps];
        next[idx] = step;
        return { steps: next };
      }
      return { steps: [...state.steps, step] };
    }),
  resetSteps: () => set({ steps: [] }),
  setIsRunningAgent: (isRunningAgent) => set({ isRunningAgent }),
  setPreviewUrl: (previewUrl) => set({ previewUrl: resolvePreviewUrl(previewUrl) }),
  bumpPreviewRefresh: () =>
    set((state) => ({ previewRefreshKey: state.previewRefreshKey + 1 })),
  appendConsoleLog: (log) =>
    set((state) => ({
      consoleLogs: [...state.consoleLogs.slice(-99), log],
    })),
  clearConsoleLogs: () => set({ consoleLogs: [] }),
  setGovernanceOpen: (governanceOpen) => set({ governanceOpen }),
  setWorkspaceModalOpen: (workspaceModalOpen) => set({ workspaceModalOpen }),
  setGitModalOpen: (gitModalOpen) => set({ gitModalOpen }),
  setSkillsModalOpen: (skillsModalOpen) => set({ skillsModalOpen }),
  setContainerStats: (containerStats) => set({ containerStats }),
}));
