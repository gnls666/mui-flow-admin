import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import GlobalStyles from '@mui/material/GlobalStyles';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import AddRounded from '@mui/icons-material/AddRounded';
import ApprovalRounded from '@mui/icons-material/ApprovalRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import FolderZipRounded from '@mui/icons-material/FolderZipRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import TableChartRounded from '@mui/icons-material/TableChartRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';

type TabKey = 'dashboard' | 'run' | 'flow' | 'tools' | 'insights';
type FlowStatus = 'Ready' | 'Draft' | 'Needs review';
type RunStatus = 'Waiting input' | 'Running' | 'Completed' | 'Failed';
type StepStatus = 'Done' | 'Active' | 'Waiting' | 'Queued';
type StepKind = 'upload' | 'inspect' | 'transform' | 'approve' | 'password' | 'export';
type FlowView = 'library' | 'composer';

type ToolStatus = 'Live' | 'Beta' | 'Planned';

type ToItem = {
  id: string;
  label: string;
  kind: 'file' | 'sheet' | 'mapping' | 'approval' | 'secret' | 'package';
  description: string;
};

type ComposerStep = {
  id: string;
  index: string;
  name: string;
  toolId: string;
  kind: StepKind;
  toId: string;
  inputs: string;
  output: string;
  status: 'Waiting for files' | 'Ready' | 'AI suggested' | 'Needs approval' | 'Draft';
};

type ComposerStepPatch = Partial<Omit<ComposerStep, 'id' | 'index'>>;

type FlowTemplate = {
  id: string;
  name: string;
  description: string;
  status: FlowStatus;
  owner: string;
  lastEdited: string;
  runCount: number;
  accent: string;
  steps: ComposerStep[];
  tos: ToItem[];
};

type RunStep = {
  id: string;
  name: string;
  kind: StepKind;
  status: StepStatus;
  toId: string;
  summary: string;
  prompt?: string;
};

type RunItem = {
  id: string;
  name: string;
  flowId: string;
  status: RunStatus;
  requestedBy: string;
  updatedAt: string;
  progress: number;
  steps: RunStep[];
};

type ToolItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ToolStatus;
  icon: typeof UploadFileRounded;
  accent: string;
  usedBy: string[];
  inputs: string[];
  outputs: string[];
};

type ComposerMode = 'new' | 'edit';
type Notify = (message: string) => void;

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'run', label: 'Run' },
  { key: 'flow', label: 'Flow' },
  { key: 'tools', label: 'Tools' },
  { key: 'insights', label: 'Insights' },
];

const flows: FlowTemplate[] = [
  {
    id: 'sheet-orchestration',
    name: 'Sheet Orchestration',
    description: 'Extract, reorder, package Excel sheets',
    status: 'Ready',
    owner: 'Mia Chen',
    lastEdited: '18 min ago',
    runCount: 328,
    accent: '#2563eb',
    steps: [
      {
        id: 'draft-upload',
        index: '01',
        name: 'Upload source workbooks',
        toolId: 'upload-files',
        kind: 'upload',
        toId: 'source-files',
        inputs: '.xlsx files',
        output: 'source-files.manifest.json',
        status: 'Waiting for files',
      },
      {
        id: 'draft-inspect',
        index: '02',
        name: 'Inspect sheet headers',
        toolId: 'read-sheet',
        kind: 'inspect',
        toId: 'header-map',
        inputs: 'source-files.manifest.json',
        output: 'headers.detected.json',
        status: 'Ready',
      },
      {
        id: 'draft-reorder',
        index: '03',
        name: 'Map and reorder tabs',
        toolId: 'sheet-reorder',
        kind: 'transform',
        toId: 'header-map',
        inputs: 'headers.detected.json',
        output: 'sheet-order.plan.json',
        status: 'AI suggested',
      },
      {
        id: 'draft-approval',
        index: '04',
        name: 'Approval checkpoint',
        toolId: 'approval-gate',
        kind: 'approve',
        toId: 'approval-gate',
        inputs: 'sheet-order.plan.json',
        output: 'approval.receipt.json',
        status: 'Needs approval',
      },
      {
        id: 'draft-export',
        index: '05',
        name: 'Export board pack',
        toolId: 'export-package',
        kind: 'export',
        toId: 'output-package',
        inputs: 'approval.receipt.json',
        output: 'board-pack.zip',
        status: 'Draft',
      },
    ],
    tos: [
      {
        id: 'source-files',
        label: 'Source workbooks',
        kind: 'file',
        description: 'Excel files uploaded by the operator.',
      },
      {
        id: 'header-map',
        label: 'Header map',
        kind: 'mapping',
        description: 'Detected headers and selected columns.',
      },
      {
        id: 'approval-gate',
        label: 'Approval decision',
        kind: 'approval',
        description: 'Human review before packaging.',
      },
      {
        id: 'zip-password',
        label: 'Zip password',
        kind: 'secret',
        description: 'Password required for protected output.',
      },
      {
        id: 'output-package',
        label: 'Output package',
        kind: 'package',
        description: 'Final reordered sheets as a protected zip.',
      },
    ],
  },
  {
    id: 'invoice-cleanup',
    name: 'Invoice Cleanup',
    description: 'Normalize invoice tabs and export exceptions',
    status: 'Needs review',
    owner: 'Leo Park',
    lastEdited: '1 hr ago',
    runCount: 94,
    accent: '#0f766e',
    steps: [
      {
        id: 'invoice-upload',
        index: '01',
        name: 'Upload invoice files',
        toolId: 'upload-files',
        kind: 'upload',
        toId: 'invoice-files',
        inputs: '.xlsx invoices',
        output: 'invoice-files.manifest.json',
        status: 'Waiting for files',
      },
      {
        id: 'invoice-extract',
        index: '02',
        name: 'Extract exception rows',
        toolId: 'read-sheet',
        kind: 'inspect',
        toId: 'exception-sheet',
        inputs: 'invoice-files.manifest.json',
        output: 'exception-rows.xlsx',
        status: 'AI suggested',
      },
      {
        id: 'invoice-approval',
        index: '03',
        name: 'Approve exception workbook',
        toolId: 'approval-gate',
        kind: 'approve',
        toId: 'exception-sheet',
        inputs: 'exception-rows.xlsx',
        output: 'approval.receipt.json',
        status: 'Needs approval',
      },
      {
        id: 'invoice-export',
        index: '04',
        name: 'Export exception workbook',
        toolId: 'export-package',
        kind: 'export',
        toId: 'exception-sheet',
        inputs: 'approval.receipt.json',
        output: 'invoice-exceptions.zip',
        status: 'Draft',
      },
    ],
    tos: [
      {
        id: 'invoice-files',
        label: 'Invoice files',
        kind: 'file',
        description: 'Raw invoice workbooks from finance.',
      },
      {
        id: 'exception-sheet',
        label: 'Exception sheet',
        kind: 'sheet',
        description: 'Rows that need manual reconciliation.',
      },
    ],
  },
  {
    id: 'sales-rollup',
    name: 'Sales Rollup',
    description: 'Merge regional sheets into leadership view',
    status: 'Draft',
    owner: 'Nora Li',
    lastEdited: 'Yesterday',
    runCount: 42,
    accent: '#7c3aed',
    steps: [
      {
        id: 'sales-upload',
        index: '01',
        name: 'Upload regional tabs',
        toolId: 'upload-files',
        kind: 'upload',
        toId: 'regional-tabs',
        inputs: 'regional workbooks',
        output: 'regional-tabs.manifest.json',
        status: 'Waiting for files',
      },
      {
        id: 'sales-rollup-map',
        index: '02',
        name: 'Merge regional sheets',
        toolId: 'sheet-reorder',
        kind: 'transform',
        toId: 'regional-tabs',
        inputs: 'regional-tabs.manifest.json',
        output: 'leadership-pack-preview.xlsx',
        status: 'AI suggested',
      },
      {
        id: 'sales-export',
        index: '03',
        name: 'Export leadership pack',
        toolId: 'export-package',
        kind: 'export',
        toId: 'leadership-pack',
        inputs: 'leadership-pack-preview.xlsx',
        output: 'leadership-pack.zip',
        status: 'Draft',
      },
    ],
    tos: [
      {
        id: 'regional-tabs',
        label: 'Regional tabs',
        kind: 'sheet',
        description: 'APAC, EMEA, and AMER tabs for rollup.',
      },
      {
        id: 'leadership-pack',
        label: 'Leadership pack',
        kind: 'package',
        description: 'Clean exported workbook bundle.',
      },
    ],
  },
];

const runs: RunItem[] = [
  {
    id: 'run-q2-board-pack',
    name: 'Q2 Board Pack',
    flowId: 'sheet-orchestration',
    status: 'Waiting input',
    requestedBy: 'Mia Chen',
    updatedAt: '4 min ago',
    progress: 54,
    steps: [
      {
        id: 'upload-workbooks',
        name: 'Upload source workbooks',
        kind: 'upload',
        status: 'Done',
        toId: 'source-files',
        summary: '3 Excel files attached and scanned.',
      },
      {
        id: 'inspect-headers',
        name: 'Inspect sheet headers',
        kind: 'inspect',
        status: 'Done',
        toId: 'header-map',
        summary: 'AI found 18 sheets and 7 candidate headers.',
      },
      {
        id: 'reorder-tabs',
        name: 'Reorder selected sheets',
        kind: 'transform',
        status: 'Active',
        toId: 'header-map',
        summary: 'Finance Summary will move before Regional Detail.',
      },
      {
        id: 'approve-output',
        name: 'Approve output plan',
        kind: 'approve',
        status: 'Waiting',
        toId: 'approval-gate',
        summary: 'Waiting for operator approval before export.',
        prompt: 'Approve the generated sheet order before packaging.',
      },
      {
        id: 'set-zip-password',
        name: 'Set zip password',
        kind: 'password',
        status: 'Queued',
        toId: 'zip-password',
        summary: 'Password will be required for protected zip export.',
        prompt: 'Enter a password for the final zip package.',
      },
      {
        id: 'export-package',
        name: 'Export package',
        kind: 'export',
        status: 'Queued',
        toId: 'output-package',
        summary: 'Final package will include 11 selected sheets.',
      },
    ],
  },
  {
    id: 'run-vendor-invoices',
    name: 'Vendor Invoice Cleanup',
    flowId: 'invoice-cleanup',
    status: 'Running',
    requestedBy: 'Leo Park',
    updatedAt: '12 min ago',
    progress: 68,
    steps: [
      {
        id: 'upload-invoices',
        name: 'Upload invoice files',
        kind: 'upload',
        status: 'Done',
        toId: 'invoice-files',
        summary: '12 invoice files uploaded.',
      },
      {
        id: 'extract-exceptions',
        name: 'Extract exception rows',
        kind: 'inspect',
        status: 'Active',
        toId: 'exception-sheet',
        summary: 'AI is reading unmatched vendor names.',
      },
      {
        id: 'export-exceptions',
        name: 'Export exception workbook',
        kind: 'export',
        status: 'Queued',
        toId: 'exception-sheet',
        summary: 'Exception workbook will be available after review.',
      },
    ],
  },
  {
    id: 'run-sales-rollup',
    name: 'April Sales Rollup',
    flowId: 'sales-rollup',
    status: 'Completed',
    requestedBy: 'Nora Li',
    updatedAt: 'Yesterday',
    progress: 100,
    steps: [
      {
        id: 'upload-regions',
        name: 'Upload regional tabs',
        kind: 'upload',
        status: 'Done',
        toId: 'regional-tabs',
        summary: 'All region files uploaded.',
      },
      {
        id: 'export-rollup',
        name: 'Export leadership pack',
        kind: 'export',
        status: 'Done',
        toId: 'leadership-pack',
        summary: 'Leadership pack exported successfully.',
      },
    ],
  },
];

const tools: ToolItem[] = [
  {
    id: 'upload-files',
    name: 'Upload Files',
    category: 'Input',
    description: 'Collect Excel workbooks and validate file type, size, and sheet availability.',
    status: 'Live',
    icon: UploadFileRounded,
    accent: '#2563eb',
    usedBy: ['Upload source workbooks', 'Upload invoice files', 'Upload regional tabs'],
    inputs: ['.xlsx', '.xls', '.csv'],
    outputs: ['source-files.manifest.json', 'file-validation.report.json'],
  },
  {
    id: 'read-sheet',
    name: 'Read Sheet',
    category: 'Extraction',
    description: 'Read workbook sheets, detect headers, infer column types, and prepare sheet inventory.',
    status: 'Live',
    icon: TableChartRounded,
    accent: '#0f766e',
    usedBy: ['Inspect sheet headers', 'Extract exception rows'],
    inputs: ['source-files.manifest.json', 'uploaded workbooks'],
    outputs: ['headers.detected.json', 'sheet-inventory.csv'],
  },
  {
    id: 'sheet-reorder',
    name: 'Sheet Reorder',
    category: 'Transform',
    description: 'Arrange selected sheets into a target order before preview and export.',
    status: 'Live',
    icon: DescriptionRounded,
    accent: '#7c3aed',
    usedBy: ['Reorder selected sheets'],
    inputs: ['headers.detected.json', 'sheet-inventory.csv'],
    outputs: ['sheet-order.plan.json', 'preview-workbook.xlsx'],
  },
  {
    id: 'approval-gate',
    name: 'Approval Gate',
    category: 'Human input',
    description: 'Pause a run and ask an operator to approve the generated plan before continuing.',
    status: 'Live',
    icon: ApprovalRounded,
    accent: '#d97706',
    usedBy: ['Approve output plan'],
    inputs: ['sheet-order.plan.json', 'preview-workbook.xlsx'],
    outputs: ['approval.receipt.json'],
  },
  {
    id: 'zip-password',
    name: 'Zip Password',
    category: 'Security',
    description: 'Collect or generate the password required for protected zip exports.',
    status: 'Live',
    icon: LockRounded,
    accent: '#be123c',
    usedBy: ['Set zip password'],
    inputs: ['approval.receipt.json'],
    outputs: ['zip-secret.pending'],
  },
  {
    id: 'export-package',
    name: 'Export Package',
    category: 'Output',
    description: 'Create the final workbook or protected zip package for download.',
    status: 'Live',
    icon: FolderZipRounded,
    accent: '#475569',
    usedBy: ['Export package'],
    inputs: ['preview-workbook.xlsx', 'zip-secret.pending'],
    outputs: ['q2-board-pack.zip'],
  },
  {
    id: 'smart-crawler',
    name: 'Smart Crawler',
    category: 'AI collection',
    description: 'Crawl structured data from approved web sources.',
    status: 'Beta',
    icon: SearchRounded,
    accent: '#0891b2',
    usedBy: ['Collect market benchmark', 'Refresh public registry data'],
    inputs: ['approved source URL', 'schema prompt', 'crawl policy'],
    outputs: ['crawl-results.json', 'source-citations.csv'],
  },
];

const excelContextTabs = ['Finance Summary', 'Executive View', 'Regional Detail', 'Exceptions'];
const missingInputs = ['Source files', 'Approval owner', 'Zip password rule'];
const agentTrace = ['Intent', 'Tools', 'Inputs', 'Ready'];


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    background: {
      default: '#f3f6fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#596276',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'].join(','),
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: {
      textTransform: 'none',
      fontWeight: 800,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const stepIconMap: Record<StepKind, typeof UploadFileRounded> = {
  upload: UploadFileRounded,
  inspect: TableChartRounded,
  transform: DescriptionRounded,
  approve: ApprovalRounded,
  password: LockRounded,
  export: FolderZipRounded,
};

function App() {
  const initialRoute = getInitialRoute();
  const mainRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(initialRoute.activeTab);
  const [flowView, setFlowView] = useState<FlowView>(initialRoute.flowView);
  const [selectedFlowId, setSelectedFlowId] = useState(flows[0].id);
  const [selectedToolId, setSelectedToolId] = useState(tools[0].id);
  const [selectedRunId, setSelectedRunId] = useState(runs[0].id);
  const [selectedStepId, setSelectedStepId] = useState(runs[0].steps[2].id);
  const [runItems, setRunItems] = useState<RunItem[]>(runs);
  const [flowStepDrafts, setFlowStepDrafts] = useState<Record<string, ComposerStep[]>>({});
  const [zipPassword, setZipPassword] = useState('');
  const [approvedSteps, setApprovedSteps] = useState<Set<string>>(new Set());
  const [actionMessage, setActionMessage] = useState('');

  const selectedFlow = useMemo(
    () => {
      const flow = flows.find((item) => item.id === selectedFlowId) ?? flows[0];
      return { ...flow, steps: flowStepDrafts[flow.id] ?? flow.steps };
    },
    [flowStepDrafts, selectedFlowId],
  );
  const selectedRun = useMemo(
    () => runItems.find((run) => run.id === selectedRunId) ?? runItems[0],
    [runItems, selectedRunId],
  );
  const selectedTool = useMemo(
    () => tools.find((tool) => tool.id === selectedToolId) ?? tools[0],
    [selectedToolId],
  );
  const selectedStep = useMemo(
    () => selectedRun.steps.find((step) => step.id === selectedStepId) ?? selectedRun.steps[0],
    [selectedRun, selectedStepId],
  );
  const selectedStepTo = getToForStep(selectedRun, selectedStep);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (mainRef.current && typeof mainRef.current.scrollTo === 'function') {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab, flowView]);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setActionMessage(''), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [actionMessage]);

  useEffect(() => {
    function handleHashChange() {
      const route = getInitialRoute();
      setActiveTab(route.activeTab);
      setFlowView(route.flowView);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function handleTabChange(tab: TabKey) {
    if (tab === 'flow') {
      setFlowView('library');
      setActiveTab('flow');
      syncHash('flow', 'library');
      return;
    }

    setActiveTab(tab);
    syncHash(tab, flowView);
  }

  function handleFlowViewChange(view: FlowView) {
    setFlowView(view);
    setActiveTab('flow');
    syncHash('flow', view);
  }

  function handleRunSelect(runId: string) {
    const run = runItems.find((item) => item.id === runId) ?? runItems[0];
    setSelectedRunId(run.id);
    setSelectedFlowId(run.flowId);
    setSelectedStepId(findPrimaryStep(run).id);
  }

  function handleFlowRun(flowId: string) {
    const baseFlow = getFlow(flowId);
    const flow = { ...baseFlow, steps: flowStepDrafts[flowId] ?? baseFlow.steps };
    const run = createRunFromFlow(flow);
    setSelectedFlowId(flowId);
    setRunItems((current) => [run, ...current.filter((item) => item.id !== run.id)]);
    setSelectedRunId(run.id);
    setSelectedStepId(findPrimaryStep(run).id);
    setActiveTab('run');
    syncHash('run', flowView);
    setActionMessage(`Run created from ${flow.name}`);
  }

  function handleOpenTool(toolId: string) {
    const tool = getTool(toolId);
    setSelectedToolId(toolId);
    setActiveTab('tools');
    syncHash('tools', flowView);
    setActionMessage(`Tool registry opened: ${tool.name}`);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            minWidth: 320,
          },
          '*': {
            boxSizing: 'border-box',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
        }}
      />
      <Box
        sx={{
          height: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onUserAction={(message) => setActionMessage(message)}
        />
        <Box
          component="main"
          ref={mainRef}
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            maxWidth: 1480,
            width: '100%',
            mx: 'auto',
            flex: 1,
            minHeight: 0,
            overflow: {
              xs: 'auto',
              lg: activeTab === 'run' || (activeTab === 'flow' && flowView === 'composer') ? 'hidden' : 'auto',
            },
          }}
        >
          {activeTab === 'run' && (
            <RunWorkspace
              selectedRun={selectedRun}
              runs={runItems}
              selectedStep={selectedStep}
              selectedStepTo={selectedStepTo}
              zipPassword={zipPassword}
              approvedSteps={approvedSteps}
              onRunSelect={handleRunSelect}
              onStepSelect={setSelectedStepId}
              onPasswordChange={setZipPassword}
              onApprove={(stepId) => setApprovedSteps((current) => new Set(current).add(stepId))}
              onNotify={setActionMessage}
            />
          )}
          {activeTab === 'flow' && (
            <FlowWorkspace
              flowView={flowView}
              selectedFlow={selectedFlow}
              selectedFlowId={selectedFlowId}
              onFlowViewChange={handleFlowViewChange}
              onSelectFlow={setSelectedFlowId}
              onCreateRun={handleFlowRun}
              onOpenTool={handleOpenTool}
              onUpdateFlowSteps={(flowId, steps) =>
                setFlowStepDrafts((current) => ({ ...current, [flowId]: cloneComposerSteps(steps) }))
              }
              onNotify={setActionMessage}
            />
          )}
          {activeTab === 'tools' && (
            <ToolsWorkspace
              selectedTool={selectedTool}
              selectedToolId={selectedToolId}
              onSelectTool={setSelectedToolId}
              onNotify={setActionMessage}
            />
          )}
          {(activeTab === 'dashboard' || activeTab === 'insights') && (
            <SummaryPage activeTab={activeTab} />
          )}
        </Box>
        <ActionToast message={actionMessage} />
      </Box>
    </ThemeProvider>
  );
}

function TopBar({
  activeTab,
  onTabChange,
  onUserAction,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onUserAction: Notify;
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function handleUserClick() {
    setUserMenuOpen((open) => !open);
    onUserAction(userMenuOpen ? 'User menu closed' : 'User menu opened');
  }

  return (
    <Paper
      component="header"
      elevation={0}
      square
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        sx={{
          minHeight: { xs: 104, sm: 72 },
          px: { xs: 2, md: 3 },
          pt: { xs: 1.25, sm: 0 },
          gap: { xs: 0.5, sm: 1.5, md: 3 },
          maxWidth: 1480,
          mx: 'auto',
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            minWidth: { md: 220 },
            flex: { xs: '1 0 100%', sm: '0 0 auto' },
            alignItems: 'center',
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: 'white',
              bgcolor: 'primary.main',
              boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.22)}`,
            }}
          >
            <BoltRounded fontSize="small" />
          </Box>
          <Typography variant="h6" component="div" sx={{ whiteSpace: 'nowrap' }}>
            Acme Ops
          </Typography>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_, value: TabKey) => onTabChange(value)}
          aria-label="Primary navigation"
          sx={{
            minHeight: { xs: 44, sm: 72 },
            flex: { xs: '1 0 100%', sm: 1 },
            order: { xs: 2, sm: 0 },
            '& .MuiTabs-flexContainer': {
              justifyContent: { xs: 'flex-start', md: 'center' },
            },
            '& .MuiTab-root': {
              minHeight: { xs: 44, sm: 72 },
              px: { xs: 1.2, sm: 2.5 },
              color: 'text.secondary',
            },
          }}
          variant="scrollable"
          scrollButtons={false}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              label={tab.label}
              onClick={() => {
                if (tab.key === activeTab) {
                  onTabChange(tab.key);
                }
              }}
            />
          ))}
        </Tabs>

        <Box sx={{ position: 'relative', display: { xs: 'none', sm: 'block' } }}>
          <ButtonBase
            aria-label="Open user menu"
            onClick={handleUserClick}
            sx={{
              borderRadius: 2,
              p: 0.75,
              gap: 1,
              display: 'flex',
              alignItems: 'center',
              color: 'text.primary',
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#111827', fontSize: 13 }}>MC</Avatar>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Mia Chen
            </Typography>
            <KeyboardArrowDownRounded fontSize="small" />
          </ButtonBase>
          {userMenuOpen && (
            <Paper
              elevation={0}
              sx={{
                position: 'absolute',
                right: 0,
                top: 50,
                width: 238,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 18px 50px rgba(15, 23, 42, 0.14)',
              }}
            >
              <Typography sx={{ fontWeight: 900 }}>Mia Chen</Typography>
              <Typography variant="body2" color="text.secondary">
                Flow operator · Finance Ops
              </Typography>
              <Divider sx={{ my: 1.2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                Waiting inputs
              </Typography>
              <Typography sx={{ fontWeight: 900 }}>3 approvals, 1 password</Typography>
            </Paper>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function ActionToast({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'fixed',
        right: { xs: 16, md: 28 },
        bottom: { xs: 16, md: 24 },
        zIndex: 30,
        maxWidth: { xs: 'calc(100vw - 32px)', sm: 360 },
        display: 'grid',
        gridTemplateColumns: '24px minmax(0, 1fr)',
        gap: 1,
        alignItems: 'center',
        px: 1.5,
        py: 1.15,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha('#2563eb', 0.24),
        color: '#1e3a8a',
        bgcolor: '#eff6ff',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.16)',
      }}
    >
      <CheckCircleRounded fontSize="small" />
      <Typography variant="body2" sx={{ fontWeight: 850 }}>
        {message}
      </Typography>
    </Box>
  );
}

function RunWorkspace({
  selectedRun,
  runs,
  selectedStep,
  selectedStepTo,
  zipPassword,
  approvedSteps,
  onRunSelect,
  onStepSelect,
  onPasswordChange,
  onApprove,
  onNotify,
}: {
  selectedRun: RunItem;
  runs: RunItem[];
  selectedStep: RunStep;
  selectedStepTo: ToItem;
  zipPassword: string;
  approvedSteps: Set<string>;
  onRunSelect: (runId: string) => void;
  onStepSelect: (stepId: string) => void;
  onPasswordChange: (password: string) => void;
  onApprove: (stepId: string) => void;
  onNotify: Notify;
}) {
  return (
    <Box
      sx={{
        height: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        pb: 1,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '240px 260px minmax(760px, 1fr)',
          gap: 2,
          alignItems: 'stretch',
          minWidth: 1300,
          height: '100%',
        }}
      >
        <RunList
          runs={runs}
          selectedRunId={selectedRun.id}
          onRunSelect={onRunSelect}
          onCreate={() => onNotify('Run creation starts from a selected Flow')}
        />
        <RunDetail
          selectedRun={selectedRun}
          selectedStep={selectedStep}
          onStepSelect={onStepSelect}
          onResume={() => onNotify(`Resume signal sent for ${selectedRun.name}`)}
        />
        <StepDetail
          run={selectedRun}
          step={selectedStep}
          to={selectedStepTo}
          zipPassword={zipPassword}
          approved={approvedSteps.has(selectedStep.id)}
          onPasswordChange={onPasswordChange}
          onApprove={() => onApprove(selectedStep.id)}
          onNotify={onNotify}
        />
      </Box>
    </Box>
  );
}

function RunList({
  runs,
  selectedRunId,
  onRunSelect,
  onCreate,
}: {
  runs: RunItem[];
  selectedRunId: string;
  onRunSelect: (runId: string) => void;
  onCreate: () => void;
}) {
  return (
    <Panel scrollable compact>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" component="h1">
              Run list
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Runs across every active state
            </Typography>
          </Box>
          <IconButton aria-label="Create run" color="primary" onClick={onCreate}>
            <AddRounded />
          </IconButton>
        </Stack>
        <TextField
          size="small"
          placeholder="Search runs"
          slotProps={{
            htmlInput: {
              'aria-label': 'Search runs',
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack spacing={1.25}>
          {runs.map((run) => {
            const flow = getFlow(run.flowId);
            const selected = run.id === selectedRunId;

            return (
              <ButtonBase
                key={run.id}
                aria-label={`Select run ${run.name}`}
                onClick={() => onRunSelect(run.id)}
                sx={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: selected ? alpha(flow.accent, 0.45) : 'divider',
                  bgcolor: selected ? alpha(flow.accent, 0.08) : '#fff',
                  p: 1.5,
                  transition: 'background-color 160ms ease, border-color 160ms ease',
                  '&:hover': {
                    bgcolor: selected ? alpha(flow.accent, 0.1) : '#f8fafc',
                  },
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 850 }}>{run.name}</Typography>
                    <StatusChip status={run.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {flow.name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={run.progress}
                    sx={{
                      height: 7,
                      borderRadius: 999,
                      bgcolor: alpha(flow.accent, 0.12),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: flow.accent,
                        borderRadius: 999,
                      },
                    }}
                  />
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {run.updatedAt}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {run.progress}%
                    </Typography>
                  </Stack>
                </Stack>
              </ButtonBase>
            );
          })}
        </Stack>
      </Stack>
    </Panel>
  );
}

function RunDetail({
  selectedRun,
  selectedStep,
  onStepSelect,
  onResume,
}: {
  selectedRun: RunItem;
  selectedStep: RunStep;
  onStepSelect: (stepId: string) => void;
  onResume: () => void;
}) {
  const flow = getFlow(selectedRun.flowId);

  return (
    <Panel scrollable compact>
      <Stack spacing={2.5}>
        <Stack spacing={1.5}>
          <Box>
            <Typography
              variant="overline"
              component="h2"
              color="text.secondary"
              sx={{ fontWeight: 900 }}
            >
              Run detail
            </Typography>
            <Typography variant="h4" component="h3">
              {selectedRun.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              From {flow.name}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<PlayArrowRounded />} fullWidth onClick={onResume}>
            Resume run
          </Button>
        </Stack>

        <Stack
          spacing={1}
          sx={{
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: '#f8fafc',
          }}
        >
          <Metric label="Status" value={selectedRun.status} />
          <Metric label="Progress" value={`${selectedRun.progress}%`} />
          <Metric label="Requested by" value={selectedRun.requestedBy} />
        </Stack>

        <Box>
          <Typography variant="h6" component="h3" sx={{ mb: 1.25 }}>
            Steps
          </Typography>
          <Stack spacing={1.1}>
            {selectedRun.steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                index={index}
                selected={step.id === selectedStep.id}
                to={getToForStep(selectedRun, step)}
                onSelect={() => onStepSelect(step.id)}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Panel>
  );
}

function StepRow({
  step,
  index,
  selected,
  to,
  onSelect,
}: {
  step: RunStep;
  index: number;
  selected: boolean;
  to: ToItem;
  onSelect: () => void;
}) {
  const StepIcon = stepIconMap[step.kind];

  return (
    <ButtonBase
      aria-label={`Select step ${step.name}`}
      onClick={onSelect}
      sx={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? alpha('#2563eb', 0.45) : 'divider',
        bgcolor: selected ? alpha('#2563eb', 0.07) : '#fff',
        p: 1.4,
        display: 'grid',
        gridTemplateColumns: '40px minmax(0, 1fr) auto',
        gap: 1.25,
        alignItems: 'center',
        '&:hover': {
          bgcolor: selected ? alpha('#2563eb', 0.09) : '#f8fafc',
        },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: selected ? '#fff' : 'primary.main',
          bgcolor: selected ? 'primary.main' : alpha('#2563eb', 0.1),
        }}
      >
        <StepIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
            {String(index + 1).padStart(2, '0')}
          </Typography>
          <Typography sx={{ fontWeight: 850 }} noWrap>
            {step.name}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" noWrap>
          To: {to.label}
        </Typography>
      </Box>
      <StepStatusChip status={step.status} />
    </ButtonBase>
  );
}

function StepDetail({
  run,
  step,
  to,
  zipPassword,
  approved,
  onPasswordChange,
  onApprove,
  onNotify,
}: {
  run: RunItem;
  step: RunStep;
  to: ToItem;
  zipPassword: string;
  approved: boolean;
  onPasswordChange: (password: string) => void;
  onApprove: () => void;
  onNotify: Notify;
}) {
  const StepIcon = stepIconMap[step.kind];
  const files = getStepFiles(step);

  return (
    <Panel scrollable wide>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="overline"
              component="h2"
              color="text.secondary"
              sx={{ fontWeight: 900 }}
            >
              Step detail
            </Typography>
            <Typography variant="h5" component="h3">
              {step.name}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              color: 'primary.main',
              bgcolor: alpha('#2563eb', 0.1),
            }}
          >
            <StepIcon />
          </Box>
        </Stack>

        <StepSection title="Overview">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
              gap: 1.5,
            }}
          >
            <Typography color="text.secondary">{step.summary}</Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.5,
                bgcolor: '#f8fafc',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
                To
              </Typography>
              <Typography sx={{ fontWeight: 850 }}>{to.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {to.description}
              </Typography>
            </Box>
          </Box>
        </StepSection>

        <StepSection title="Tool">
          {step.kind === 'upload' && <UploadStep onNotify={onNotify} />}
          {step.kind === 'inspect' && <InspectStep />}
          {step.kind === 'transform' && <TransformStep />}
          {step.kind === 'approve' && (
            <ApproveStep approved={approved} prompt={step.prompt ?? 'Approve this step.'} onApprove={onApprove} />
          )}
          {step.kind === 'password' && (
            <PasswordStep value={zipPassword} onChange={onPasswordChange} prompt={step.prompt ?? ''} />
          )}
          {step.kind === 'export' && <ExportStep run={run} onDownload={() => onNotify(`${run.name} package download prepared`)} />}
        </StepSection>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 1.5,
          }}
        >
          <StepSection title="Input files">
            <Stack spacing={1}>
              {files.inputs.map((file) => (
                <FileLine key={file} label={file} />
              ))}
            </Stack>
          </StepSection>
          <StepSection title="Output files">
            <Stack spacing={1}>
              {files.outputs.map((file) => (
                <FileLine key={file} label={file} />
              ))}
            </Stack>
          </StepSection>
        </Box>
      </Stack>
    </Panel>
  );
}

function UploadStep({ onNotify }: { onNotify: Notify }) {
  const [attached, setAttached] = useState(false);

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          border: '1px dashed',
          borderColor: alpha('#2563eb', 0.45),
          borderRadius: 2,
          p: 2,
          bgcolor: alpha('#2563eb', 0.05),
          textAlign: 'center',
        }}
      >
        <UploadFileRounded color="primary" />
        <Typography sx={{ fontWeight: 850 }}>Drop Excel files here</Typography>
        <Typography variant="body2" color="text.secondary">
          .xlsx, .xls, and CSV are supported
        </Typography>
      </Box>
      {['board_pack_q2.xlsx', 'regional_detail.xlsx', 'finance_summary.xlsx'].map((file) => (
        <FileLine key={file} label={file} />
      ))}
      <Button
        variant={attached ? 'outlined' : 'contained'}
        color={attached ? 'success' : 'primary'}
        startIcon={<UploadFileRounded />}
        onClick={() => {
          setAttached(true);
          onNotify('Sample Excel files attached');
        }}
      >
        {attached ? 'Sample files attached' : 'Attach sample files'}
      </Button>
    </Stack>
  );
}

function InspectStep() {
  return (
    <Stack spacing={1.2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
        AI header readout
      </Typography>
      {['Department', 'Amount', 'Region', 'Forecast', 'Owner'].map((header) => (
        <Stack
          key={header}
          direction="row"
          sx={{
            justifyContent: 'space-between',
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
          }}
        >
          <Typography variant="body2">{header}</Typography>
          <Chip label="selected" size="small" color="primary" variant="outlined" />
        </Stack>
      ))}
    </Stack>
  );
}

function TransformStep() {
  return (
    <Stack spacing={1.2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
        Proposed sheet order
      </Typography>
      {['Finance Summary', 'Executive View', 'Regional Detail', 'Exceptions'].map((sheet, index) => (
        <Stack
          key={sheet}
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            p: 1,
            borderRadius: 1.5,
            bgcolor: index === 0 ? alpha('#2563eb', 0.08) : '#f8fafc',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>
            {index + 1}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 750 }}>
            {sheet}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function ApproveStep({
  approved,
  prompt,
  onApprove,
}: {
  approved: boolean;
  prompt: string;
  onApprove: () => void;
}) {
  return (
    <Stack spacing={1.4}>
      <Typography color="text.secondary">{prompt}</Typography>
      <Button
        variant={approved ? 'outlined' : 'contained'}
        color={approved ? 'success' : 'primary'}
        startIcon={<ApprovalRounded />}
        onClick={onApprove}
      >
        {approved ? 'Approved' : 'Approve output plan'}
      </Button>
    </Stack>
  );
}

function PasswordStep({
  value,
  prompt,
  onChange,
}: {
  value: string;
  prompt: string;
  onChange: (password: string) => void;
}) {
  return (
    <Stack spacing={1.4}>
      <Typography color="text.secondary">{prompt}</Typography>
      <TextField
        label="Zip password"
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        helperText={value.length >= 8 ? 'Password strength looks good.' : 'Use at least 8 characters.'}
        size="small"
      />
    </Stack>
  );
}

function ExportStep({ run, onDownload }: { run: RunItem; onDownload: () => void }) {
  return (
    <Stack spacing={1.25}>
      <FileLine label={`${run.name.toLowerCase().replaceAll(' ', '-')}.zip`} />
      <Button variant="contained" startIcon={<FolderZipRounded />} onClick={onDownload}>
        Download package
      </Button>
    </Stack>
  );
}

function FlowWorkspace({
  flowView,
  selectedFlow,
  selectedFlowId,
  onFlowViewChange,
  onSelectFlow,
  onCreateRun,
  onOpenTool,
  onUpdateFlowSteps,
  onNotify,
}: {
  flowView: FlowView;
  selectedFlow: FlowTemplate;
  selectedFlowId: string;
  onFlowViewChange: (view: FlowView) => void;
  onSelectFlow: (flowId: string) => void;
  onCreateRun: (flowId: string) => void;
  onOpenTool: (toolId: string) => void;
  onUpdateFlowSteps: (flowId: string, steps: ComposerStep[]) => void;
  onNotify: Notify;
}) {
  const [draftApplied, setDraftApplied] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>('edit');

  function openComposer(flowId?: string, mode: ComposerMode = 'edit') {
    if (flowId) {
      onSelectFlow(flowId);
    }
    setDraftApplied(false);
    setComposerMode(mode);
    onFlowViewChange('composer');
    onNotify(mode === 'new' ? 'New flow composer opened' : `Composer opened: ${getFlow(flowId ?? selectedFlow.id).name}`);
  }

  return (
    <Stack
      spacing={1.5}
      sx={{
        height: { xs: 'auto', lg: flowView === 'composer' ? '100%' : 'auto' },
        minHeight: 0,
      }}
    >
      {flowView === 'library' && (
        <FlowLibrary
          selectedFlow={selectedFlow}
          selectedFlowId={selectedFlowId}
          onSelectFlow={onSelectFlow}
          onOpenComposer={openComposer}
          onCreateRun={onCreateRun}
        />
      )}
      {flowView === 'composer' && (
        <FlowComposer
          mode={composerMode}
          selectedFlow={selectedFlow}
          draftApplied={draftApplied}
          onBackToLibrary={() => onFlowViewChange('library')}
          onCreateRun={onCreateRun}
          onApplyDraft={() => setDraftApplied(true)}
          onOpenTool={onOpenTool}
          onUpdateFlowSteps={onUpdateFlowSteps}
          onNotify={onNotify}
        />
      )}
    </Stack>
  );
}

function FlowLibrary({
  selectedFlow,
  selectedFlowId,
  onSelectFlow,
  onOpenComposer,
  onCreateRun,
}: {
  selectedFlow: FlowTemplate;
  selectedFlowId: string;
  onSelectFlow: (flowId: string) => void;
  onOpenComposer: (flowId?: string, mode?: ComposerMode) => void;
  onCreateRun: (flowId: string) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
        gap: 2.5,
        alignItems: 'start',
      }}
    >
      <Panel>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="h5" component="h1">
                Flows
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reusable automation templates for Excel operations
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              sx={{ alignSelf: { sm: 'center' } }}
              onClick={() => onOpenComposer(undefined, 'new')}
            >
              New Flow
            </Button>
          </Stack>

          <Stack spacing={1.1}>
            {flows.map((flow) => (
              <FlowPreviewCard
                key={flow.id}
                flow={flow}
                selected={selectedFlowId === flow.id}
                onSelect={() => onSelectFlow(flow.id)}
                layout="row"
              />
            ))}
          </Stack>
        </Stack>
      </Panel>

      <Panel sticky>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>
                Flow detail
              </Typography>
              <Typography variant="h5" component="h2">
                {selectedFlow.name}
              </Typography>
            </Box>
            <IconButton aria-label="Open selected flow in composer" onClick={() => onOpenComposer(selectedFlow.id)}>
              <ChevronRightRounded />
            </IconButton>
          </Stack>
          <Typography color="text.secondary">{selectedFlow.description}</Typography>
          <Button variant="contained" startIcon={<AutoAwesomeRounded />} onClick={() => onOpenComposer(selectedFlow.id)}>
            Open composer
          </Button>
          <Button variant="outlined" startIcon={<PlayArrowRounded />} onClick={() => onCreateRun(selectedFlow.id)}>
            Create run
          </Button>
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            Flow steps
          </Typography>
          <Stack spacing={1}>
            {selectedFlow.steps.map((step) => (
              <FlowStepPreview key={step.id} step={step} />
            ))}
          </Stack>
        </Stack>
      </Panel>
    </Box>
  );
}

function FlowStepPreview({ step }: { step: ComposerStep }) {
  const tool = getTool(step.toolId);

  return (
    <Box
      sx={{
        p: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: '#f8fafc',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontWeight: 850 }}>
          {step.index} · {step.name}
        </Typography>
        <CompactComposerStatusChip status={step.status} />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Tool: {tool.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {step.inputs} {'->'} {step.output}
      </Typography>
    </Box>
  );
}

function FlowPreviewCard({
  flow,
  selected,
  onSelect,
  layout = 'card',
}: {
  flow: FlowTemplate;
  selected: boolean;
  onSelect: () => void;
  layout?: 'card' | 'row';
}) {
  const isRow = layout === 'row';

  return (
    <ButtonBase
      aria-label={`Select flow ${flow.name}`}
      onClick={onSelect}
      sx={{
        width: '100%',
        minHeight: isRow ? 78 : 104,
        textAlign: 'left',
        display: 'grid',
        gridTemplateColumns: {
          xs: '44px minmax(0, 1fr)',
          md: isRow ? '44px minmax(280px, 1fr) 120px 110px 96px' : '44px minmax(0, 1fr)',
        },
        gap: 1.25,
        alignItems: 'center',
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? alpha(flow.accent, 0.45) : 'divider',
        bgcolor: selected ? alpha(flow.accent, 0.08) : '#fff',
        '&:hover': {
          bgcolor: selected ? alpha(flow.accent, 0.1) : '#f8fafc',
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(flow.accent, 0.12),
          color: flow.accent,
          flex: '0 0 auto',
        }}
      >
        <TableChartRounded fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.4 }}>
          <Typography sx={{ fontWeight: 850 }} noWrap>
            {flow.name}
          </Typography>
          {!isRow && <FlowStatusChip status={flow.status} />}
        </Stack>
        <Typography variant="body2" color="text.secondary" noWrap>
          {flow.description}
        </Typography>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            mt: isRow ? 0.8 : 1.2,
            display: { xs: 'flex', md: isRow ? 'none' : 'flex' },
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {flow.lastEdited}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 900 }}>
            {flow.runCount} runs
          </Typography>
        </Stack>
      </Box>
      {isRow && (
        <>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <FlowStatusChip status={flow.status} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            {flow.lastEdited}
          </Typography>
          <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 900 }}>
            {flow.runCount} runs
          </Typography>
        </>
      )}
    </ButtonBase>
  );
}

function FlowComposer({
  mode,
  selectedFlow,
  draftApplied,
  onBackToLibrary,
  onCreateRun,
  onApplyDraft,
  onOpenTool,
  onUpdateFlowSteps,
  onNotify,
}: {
  mode: ComposerMode;
  selectedFlow: FlowTemplate;
  draftApplied: boolean;
  onBackToLibrary: () => void;
  onCreateRun: (flowId: string) => void;
  onApplyDraft: () => void;
  onOpenTool: (toolId: string) => void;
  onUpdateFlowSteps: (flowId: string, steps: ComposerStep[]) => void;
  onNotify: Notify;
}) {
  const [actionNotice, setActionNotice] = useState('');
  const [steps, setSteps] = useState<ComposerStep[]>(() => seedStepsForComposer(mode, selectedFlow));
  const [selectedComposerStepId, setSelectedComposerStepId] = useState(
    () => defaultSelectedComposerStepId(seedStepsForComposer(mode, selectedFlow)),
  );
  const [aiCommand, setAiCommand] = useState('');
  const [patchPreview, setPatchPreview] = useState('AI is focused on the selected step and its tool contract.');
  const [requestedInputs, setRequestedInputs] = useState<Set<string>>(new Set());
  const composerTitle =
    mode === 'new'
      ? 'New Flow Composer'
      : selectedFlow.id === 'sheet-orchestration'
        ? 'Q2 Board Pack Automation'
        : selectedFlow.name;
  const composerSubtitle =
    mode === 'new'
      ? 'Create an Excel workflow with AI-selected steps, tool contracts, and checkpoints'
      : selectedFlow.description;
  const selectedComposerStep = steps.find((step) => step.id === selectedComposerStepId) ?? steps[0];

  useEffect(() => {
    const nextSteps = seedStepsForComposer(mode, selectedFlow);
    setSteps(nextSteps);
    setSelectedComposerStepId(defaultSelectedComposerStepId(nextSteps));
    setAiCommand('');
    setPatchPreview('AI is focused on the selected step and its tool contract.');
  }, [mode, selectedFlow.id]);

  useEffect(() => {
    if (mode === 'edit') {
      onUpdateFlowSteps(selectedFlow.id, steps);
    }
  }, [mode, selectedFlow.id, steps]);

  function showNotice(message: string) {
    setActionNotice(message);
  }

  function patchComposerStep(stepId: string, patch: ComposerStepPatch) {
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, ...patch } : step)));
  }

  function addValidationStep() {
    const validationStep: ComposerStep = {
      id: 'draft-validate',
      index: String(steps.length + 1).padStart(2, '0'),
      name: 'Validate workbook schema',
      toolId: 'read-sheet',
      kind: 'inspect',
      toId: selectedComposerStep.toId,
      inputs: 'uploaded workbooks',
      output: 'schema-validation.report.json',
      status: 'AI suggested',
    };

    setSteps((current) => reindexComposerSteps(current.some((step) => step.id === validationStep.id) ? current : [...current, validationStep]));
    setSelectedComposerStepId(validationStep.id);
    setPatchPreview('AI inserted a schema validation step before export.');
    showNotice('Validate workbook schema added');
  }

  function applyAIInlinePatch(prompt = aiCommand) {
    if (!prompt.trim()) {
      showNotice('Describe an edit before applying');
      return;
    }

    const patch = inferInlinePatch(prompt, selectedComposerStep);
    patchComposerStep(selectedComposerStep.id, patch);
    setPatchPreview(`AI patch applied to ${patch.name ?? selectedComposerStep.name}`);
    showNotice(`AI patch applied to ${patch.name ?? selectedComposerStep.name}`);
    onNotify(`Composer patched: ${patch.name ?? selectedComposerStep.name}`);
  }

  function insertApprovalPause() {
    const approvalStep: ComposerStep = {
      id: makeUniqueStepId(steps, `${selectedComposerStep.id}-approval-pause`),
      index: '00',
      name: 'Approval checkpoint',
      toolId: 'approval-gate',
      kind: 'approve',
      toId: selectedFlow.tos.find((to) => to.kind === 'approval')?.id ?? selectedComposerStep.toId,
      inputs: selectedComposerStep.output,
      output: 'approval.receipt.json',
      status: 'Needs approval',
    };

    setSteps((current) => reindexComposerSteps(insertStepAfter(current, selectedComposerStep.id, approvalStep)));
    setSelectedComposerStepId(approvalStep.id);
    setPatchPreview(`AI inserted Approval checkpoint after ${selectedComposerStep.name}`);
    showNotice('Approval checkpoint inserted');
    onNotify('Composer inserted approval pause');
  }

  function applyToolToSelectedStep(toolId: string) {
    const tool = getTool(toolId);
    patchComposerStep(selectedComposerStep.id, {
      toolId,
      kind: kindForTool(toolId),
      inputs: tool.inputs[0],
      output: tool.outputs[0],
      status: 'AI suggested',
    });
    setPatchPreview(`Tool changed to ${tool.name}; inputs and outputs were refreshed from the registry.`);
    showNotice(`Tool changed to ${tool.name}`);
  }

  function handleApplyDraft() {
    onApplyDraft();
    showNotice('Flow steps are now editable');
    onNotify('AI draft committed to flow');
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '270px minmax(0, 1fr)',
          lg: '270px minmax(520px, 1fr) 360px',
        },
        gap: 2,
        alignItems: 'stretch',
        height: { xs: 'auto', lg: '100%' },
        minHeight: 0,
      }}
    >
      <ComposerBriefPanel
        title={composerTitle}
        subtitle={composerSubtitle}
        status={selectedFlow.status === 'Draft' ? 'Draft' : 'Ready'}
        onBackToLibrary={onBackToLibrary}
        onCreateRun={() => onCreateRun(selectedFlow.id)}
      />

      <WorkflowGraphCanvas
        steps={steps}
        selectedStepId={selectedComposerStep.id}
        actionNotice={actionNotice}
        command={aiCommand}
        patchPreview={patchPreview}
        onSelectStep={setSelectedComposerStepId}
        onCommandChange={setAiCommand}
        onApplyPatch={() => applyAIInlinePatch()}
        onAddApprovalPause={insertApprovalPause}
        onAskForFiles={() => applyAIInlinePatch('ask for source files upload')}
        onAddStep={addValidationStep}
        onOpenHistory={() => showNotice('AI edit history opened')}
        onOpenEditor={() => showNotice('Patch editor opened')}
      />

      <ComposerInspector
        selectedStep={selectedComposerStep}
        requestedInputs={requestedInputs}
        draftApplied={draftApplied}
        onPatch={(patch) => patchComposerStep(selectedComposerStep.id, patch)}
        onUseTool={applyToolToSelectedStep}
        onOpenTool={onOpenTool}
        onApplyDraft={handleApplyDraft}
        onRefine={() => showNotice('Draft refined with tool constraints')}
        onMissingInput={(label) => {
          setRequestedInputs((current) => new Set(current).add(label));
          showNotice(`${label} marked as requested`);
        }}
      />
    </Box>
  );
}

function ComposerBriefPanel({
  title,
  subtitle,
  status,
  onBackToLibrary,
  onCreateRun,
}: {
  title: string;
  subtitle: string;
  status: FlowStatus;
  onBackToLibrary: () => void;
  onCreateRun: () => void;
}) {
  return (
    <Panel compact scrollable fitContent>
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <Button variant="text" size="small" onClick={onBackToLibrary} sx={{ px: 0 }}>
            Flow Library
          </Button>
          <Typography variant="caption">/</Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>
            Composer
          </Typography>
        </Stack>

        <Box>
          <Typography variant="overline" component="h1" color="text.secondary" sx={{ fontWeight: 900 }}>
            AI workflow composer
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.6 }}>
            <Typography variant="h5" component="h2">
              {title}
            </Typography>
            <FlowStatusChip status={status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        <Stack spacing={1}>
          <Button variant="contained" startIcon={<PlayArrowRounded />} onClick={onCreateRun}>
            Create run
          </Button>
          <Button variant="outlined" onClick={onBackToLibrary}>
            Back to flow list
          </Button>
        </Stack>

        <ExcelContextStrip />
      </Stack>
    </Panel>
  );
}

function WorkflowGraphCanvas({
  steps,
  selectedStepId,
  actionNotice,
  command,
  patchPreview,
  onSelectStep,
  onCommandChange,
  onApplyPatch,
  onAddApprovalPause,
  onAskForFiles,
  onAddStep,
  onOpenHistory,
  onOpenEditor,
}: {
  steps: ComposerStep[];
  selectedStepId: string;
  actionNotice: string;
  command: string;
  patchPreview: string;
  onSelectStep: (stepId: string) => void;
  onCommandChange: (value: string) => void;
  onApplyPatch: () => void;
  onAddApprovalPause: () => void;
  onAskForFiles: () => void;
  onAddStep: () => void;
  onOpenHistory: () => void;
  onOpenEditor: () => void;
}) {
  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? steps[0];
  const canApplyCommand = command.trim().length > 0;

  return (
    <Panel wide fitContent>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.25}
          sx={{ alignItems: { md: 'flex-start' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="h5" component="h3">
              Workflow canvas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a node, then ask AI to rewrite that step without leaving the graph.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip label={`${steps.length} steps`} size="small" color="primary" variant="outlined" />
            <Button variant="outlined" startIcon={<AddRounded />} onClick={onAddStep}>
              Add step
            </Button>
          </Stack>
        </Stack>

        {actionNotice && <ComposerActionFeedback message={actionNotice} />}

        <Box
          sx={{
            border: '1px solid',
            borderColor: alpha('#2563eb', 0.16),
            borderRadius: 2,
            bgcolor: '#f8fbff',
            p: { xs: 1.25, md: 2 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              overflow: 'auto',
              pb: 1,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: `repeat(${steps.length}, minmax(0, 1fr))` },
                gap: { xs: 1.2, md: 1 },
                alignItems: 'stretch',
                py: { md: 0.5 },
              }}
            >
              {steps.map((step, index) => (
                <ComposerStepCard
                  key={step.id}
                  step={step}
                  active={step.id === selectedStepId}
                  selected={step.id === selectedStepId}
                  index={index}
                  isLast={index === steps.length - 1}
                  onSelect={() => onSelectStep(step.id)}
                />
              ))}
            </Box>
          </Box>

          <SelectedStepWorkspace
            selectedStep={selectedStep}
            command={command}
            patchPreview={patchPreview}
            canApplyCommand={canApplyCommand}
            onCommandChange={onCommandChange}
            onApplyPatch={onApplyPatch}
            onAddApprovalPause={onAddApprovalPause}
            onAskForFiles={onAskForFiles}
            onOpenHistory={onOpenHistory}
            onOpenEditor={onOpenEditor}
          />
        </Box>
      </Stack>
    </Panel>
  );
}

function SelectedStepWorkspace({
  selectedStep,
  command,
  patchPreview,
  canApplyCommand,
  onCommandChange,
  onApplyPatch,
  onAddApprovalPause,
  onAskForFiles,
  onOpenHistory,
  onOpenEditor,
}: {
  selectedStep: ComposerStep;
  command: string;
  patchPreview: string;
  canApplyCommand: boolean;
  onCommandChange: (value: string) => void;
  onApplyPatch: () => void;
  onAddApprovalPause: () => void;
  onAskForFiles: () => void;
  onOpenHistory: () => void;
  onOpenEditor: () => void;
}) {
  const tool = getTool(selectedStep.toolId);

  return (
    <Box
      sx={{
        mt: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 1.25 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 1 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Selected step workspace
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 750 }}>
              Editing {selectedStep.index} · {selectedStep.name}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AgentTrace compact />
            <Button size="small" variant="outlined" onClick={onOpenHistory}>
              History
            </Button>
          </Stack>
        </Stack>

        <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, mb: 0.45 }}>
          AI command
        </Typography>
        <TextField
          label="Ask AI to edit selected step"
          placeholder="Example: validate workbook schema before reorder"
          value={command}
          onChange={(event) => onCommandChange(event.target.value)}
          size="small"
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Send AI inline command"
                    color="primary"
                    size="small"
                    disabled={!canApplyCommand}
                    onClick={onApplyPatch}
                  >
                    <SendRounded fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ mt: 1, p: 1.15, borderRadius: 1.2, bgcolor: '#f6f8ff', border: '1px solid', borderColor: alpha('#2563eb', 0.1) }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                Patch preview
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {patchPreview}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={onOpenEditor} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
              Open in editor
            </Button>
          </Stack>
          <Stack spacing={0.25} sx={{ mt: 0.9 }}>
            <PatchLine tone="remove" text="Keep original sheet order" />
            <PatchLine tone="remove" text={`Map sheets directly from ${selectedStep.inputs}`} />
            <PatchLine tone="add" text="Reorder to: Executive View, Finance Summary, Regional Detail, Exceptions" />
          </Stack>
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75, mt: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AutoAwesomeRounded />}
            disabled={!canApplyCommand}
            onClick={onApplyPatch}
          >
            Apply AI patch
          </Button>
          <Button size="small" variant="outlined" onClick={onAddApprovalPause}>
            Add approval pause
          </Button>
          <Button size="small" variant="outlined" onClick={onAskForFiles}>
            Ask for files
          </Button>
        </Stack>
      </Box>

      <Divider />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: { xs: 0, md: 0 },
        }}
      >
        <WorkspaceContextSection title="Step context">
          <ContextRow label="Source files" value="q2-inputs.xlsx, q2-actuals.xlsx" />
          <ContextRow label="Expected output" value={selectedStep.output} />
          <ContextRow label="Detected sheets" value="6 sheets across 2 files" />
        </WorkspaceContextSection>
        <WorkspaceContextSection title="Schema hints" subtitle={`From ${selectedStep.inputs}`}>
          {['sheet_name', 'sheet_index', 'source_file'].map((field) => (
            <Stack key={field} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
                {field}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 750 }}>
                {field === 'sheet_index' ? 'number' : 'string'}
              </Typography>
            </Stack>
          ))}
        </WorkspaceContextSection>
        <WorkspaceContextSection title="AI recommendations">
          {[
            `${tool.name} matches this step`,
            'No duplicate sheet names detected',
            'Output contract is ready',
          ].map((item) => (
            <Stack key={item} direction="row" spacing={0.8} sx={{ alignItems: 'center', minWidth: 0 }}>
              <CheckCircleRounded sx={{ color: '#16a34a', fontSize: 17, flex: '0 0 auto' }} />
              <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
                {item}
              </Typography>
            </Stack>
          ))}
        </WorkspaceContextSection>
      </Box>
    </Box>
  );
}

function PatchLine({ tone, text }: { tone: 'add' | 'remove'; text: string }) {
  const isAdd = tone === 'add';

  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        color: isAdd ? '#047857' : '#b91c1c',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontWeight: 750,
      }}
    >
      {isAdd ? '+ ' : '- '}
      {text}
    </Typography>
  );
}

function WorkspaceContextSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.25,
        borderRight: { md: '1px solid' },
        borderBottom: { xs: '1px solid', md: 0 },
        borderColor: 'divider',
        '&:last-of-type': {
          borderRight: 0,
          borderBottom: 0,
        },
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
          {subtitle}
        </Typography>
      )}
      <Stack spacing={0.8} sx={{ mt: subtitle ? 0 : 0.8 }}>
        {children}
      </Stack>
    </Box>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800, flex: '0 0 auto' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
        {value}
      </Typography>
    </Stack>
  );
}

function ComposerInspector({
  selectedStep,
  requestedInputs,
  draftApplied,
  onPatch,
  onUseTool,
  onOpenTool,
  onApplyDraft,
  onRefine,
  onMissingInput,
}: {
  selectedStep: ComposerStep;
  requestedInputs: Set<string>;
  draftApplied: boolean;
  onPatch: (patch: ComposerStepPatch) => void;
  onUseTool: (toolId: string) => void;
  onOpenTool: (toolId: string) => void;
  onApplyDraft: () => void;
  onRefine: () => void;
  onMissingInput: (label: string) => void;
}) {
  const tool = getTool(selectedStep.toolId);

  return (
    <Panel sticky compact scrollable fitContent>
      <Stack spacing={1.05}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" component="h2" color="text.secondary" sx={{ fontWeight: 900 }}>
              Selected step · {selectedStep.index}
            </Typography>
            <Typography variant="h5" component="h3" sx={{ lineHeight: 1.15 }}>
              {selectedStep.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tool: {tool.name}
            </Typography>
          </Box>
          <ComposerStatusChip status={selectedStep.status} />
        </Stack>

        <ComposerInspectorSection title="Step fields">
          <Stack spacing={1}>
            <TextField
              label="Step title"
              size="small"
              value={selectedStep.name}
              onChange={(event) => onPatch({ name: event.target.value, status: 'Draft' })}
            />
            <TextField
              label="Inputs"
              size="small"
              value={selectedStep.inputs}
              onChange={(event) => onPatch({ inputs: event.target.value, status: 'Draft' })}
            />
            <TextField
              label="Output"
              size="small"
              value={selectedStep.output}
              onChange={(event) => onPatch({ output: event.target.value, status: 'Draft' })}
            />
          </Stack>
        </ComposerInspectorSection>

        <ComposerInspectorSection title="Tool">
          <Stack spacing={1}>
            <Button
              variant="outlined"
              size="small"
              aria-label={`Open selected tool ${tool.name}`}
              onClick={() => onOpenTool(tool.id)}
              sx={{ justifyContent: 'flex-start' }}
            >
              Open {tool.name}
            </Button>
            <Stack direction="row" spacing={0.65} sx={{ flexWrap: 'wrap', rowGap: 0.65 }}>
              {tools.slice(0, 6).map((item) => (
                <Button
                  key={item.id}
                  size="small"
                  variant={selectedStep.toolId === item.id ? 'contained' : 'outlined'}
                  aria-label={`Use ${item.name} for selected step`}
                  onClick={() => onUseTool(item.id)}
                >
                  {item.name}
                </Button>
              ))}
            </Stack>
          </Stack>
        </ComposerInspectorSection>

        <ComposerInspectorSection title="Missing inputs">
          <Stack spacing={0.55}>
            {missingInputs.map((item) => (
              <MissingInputRow
                key={item}
                label={item}
                requested={requestedInputs.has(item)}
                onRequest={() => onMissingInput(item)}
              />
            ))}
          </Stack>
        </ComposerInspectorSection>

        <Stack direction="row" spacing={0.8}>
          <Button variant="contained" fullWidth startIcon={<CheckCircleRounded />} onClick={onApplyDraft}>
            Apply draft
          </Button>
          <Button variant="outlined" fullWidth onClick={onRefine}>
            Refine
          </Button>
        </Stack>

        {draftApplied && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.1,
              py: 0.7,
              borderRadius: 999,
              color: '#047857',
              bgcolor: '#dcfce7',
              fontWeight: 850,
            }}
          >
            <CheckCircleRounded fontSize="small" />
            Draft applied to flow
          </Box>
        )}

        <ComposerAiSuggestionCard onView={onRefine} />
      </Stack>
    </Panel>
  );
}

function ComposerAiSuggestionCard({ onView }: { onView: () => void }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha('#2563eb', 0.18),
        borderRadius: 1.5,
        p: 1,
        bgcolor: alpha('#2563eb', 0.035),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <AutoAwesomeRounded color="primary" fontSize="small" sx={{ mt: 0.15 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.35 }}>
            AI has analyzed this step and suggested improvements to the mapping and order.
          </Typography>
          <Button size="small" variant="text" onClick={onView} sx={{ px: 0, py: 0.2, minHeight: 28 }}>
            View suggestions
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

function ComposerInspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 1,
        bgcolor: '#fff',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.75 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ComposerActionFeedback({ message }: { message: string }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        alignSelf: 'flex-start',
        px: 1.25,
        py: 0.75,
        borderRadius: 999,
        color: '#1d4ed8',
        bgcolor: '#dbeafe',
        fontWeight: 850,
      }}
    >
      <AutoAwesomeRounded fontSize="small" />
      {message}
    </Box>
  );
}

function ExcelContextStrip() {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.25,
        bgcolor: '#fff',
      }}
    >
      <Stack spacing={1.2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              bgcolor: '#dcfce7',
              color: '#047857',
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            X
          </Box>
          <Typography sx={{ fontWeight: 900 }}>Excel context</Typography>
          <Typography variant="body2" color="text.secondary">
            Detected sheets in source files
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
          {excelContextTabs.map((tab) => (
            <Chip key={tab} label={tab} size="small" variant="outlined" />
          ))}
          <Chip label="+ 2 more" size="small" variant="outlined" />
        </Stack>
      </Stack>
    </Box>
  );
}

function ComposerStepCard({
  step,
  active,
  selected,
  index,
  isLast,
  onSelect,
}: {
  step: ComposerStep;
  active: boolean;
  selected: boolean;
  index: number;
  isLast: boolean;
  onSelect: () => void;
}) {
  const StepIcon = stepIconMap[step.kind];
  const tool = getTool(step.toolId);

  return (
    <Box
      sx={{
        minHeight: 164,
        borderRadius: 2,
        border: '1px solid',
        borderColor: active ? alpha('#2563eb', 0.5) : 'divider',
        bgcolor: active ? alpha('#2563eb', 0.035) : '#fff',
        boxShadow: active ? `0 12px 34px ${alpha('#2563eb', 0.12)}` : 'none',
        position: 'relative',
        transition: 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 180ms cubic-bezier(0.25, 1, 0.5, 1), border-color 160ms ease-out',
        transitionDelay: `${Math.min(index, 4) * 12}ms`,
        transform: active ? 'translateY(-2px)' : 'translateY(0)',
        '&:hover': {
          borderColor: active ? alpha('#2563eb', 0.5) : alpha('#2563eb', 0.28),
        },
        '&::after': {
          content: '""',
          display: { xs: 'none', md: isLast ? 'none' : 'block' },
          position: 'absolute',
          left: 'calc(100% + 1px)',
          top: 42,
          width: 14,
          height: 2,
          bgcolor: '#cbd5e1',
          borderRadius: 999,
        },
      }}
    >
      <ButtonBase
        aria-label={`Select composer step ${step.name}`}
        aria-current={selected ? 'step' : undefined}
        onClick={onSelect}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 164,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 0.8,
          p: 1.1,
          borderRadius: 2,
          '&:focus-visible': {
            boxShadow: `0 0 0 3px ${alpha('#2563eb', 0.22)}`,
          },
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              flex: '0 0 32px',
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              border: '1px solid',
              borderColor: active ? alpha('#2563eb', 0.45) : 'divider',
              bgcolor: '#fff',
              color: active ? 'primary.main' : 'text.secondary',
              fontWeight: 900,
            }}
          >
            {step.index}
          </Box>
          <CompactComposerStatusChip status={step.status} />
        </Stack>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            title={step.name}
            sx={{
              fontWeight: 900,
              lineHeight: 1.22,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {step.name}
          </Typography>
          <Stack direction="row" spacing={0.55} sx={{ alignItems: 'center', minWidth: 0, mt: 0.45 }}>
            <Box
              sx={{
                width: 22,
                height: 22,
                flex: '0 0 22px',
                borderRadius: 1.1,
                display: 'grid',
                placeItems: 'center',
                color: active ? '#fff' : 'primary.main',
                bgcolor: active ? 'primary.main' : alpha('#2563eb', 0.1),
              }}
            >
              <StepIcon sx={{ fontSize: 15 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }} noWrap>
              {tool.name}
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ mt: 'auto' }} />
        <Stack direction="row" spacing={0.65} sx={{ alignItems: 'center', color: '#047857' }}>
          <CheckCircleRounded sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 850 }}>
            Ready
          </Typography>
        </Stack>
      </ButtonBase>
    </Box>
  );
}

function MissingInputRow({
  label,
  requested,
  onRequest,
}: {
  label: string;
  requested: boolean;
  onRequest: () => void;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 850 }} noWrap>
          {label}
        </Typography>
      </Box>
      <Button
        size="small"
        variant={requested ? 'contained' : 'outlined'}
        color={requested ? 'success' : 'primary'}
        aria-label={`Add missing input ${label}`}
        onClick={onRequest}
      >
        {requested ? 'Added' : 'Add'}
      </Button>
    </Stack>
  );
}

function AgentTrace({ compact = false }: { compact?: boolean }) {
  return (
    <Box sx={{ minWidth: compact ? 220 : 'auto' }}>
      {!compact && (
        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.65 }}>
          Agent trace
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${agentTrace.length}, 1fr)`,
          gap: 0.5,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '11%',
            right: '11%',
            top: compact ? 8 : 9,
            height: 2,
            bgcolor: '#86efac',
          },
        }}
      >
        {agentTrace.map((item) => (
          <Stack key={item} spacing={0.25} sx={{ alignItems: 'center', zIndex: 1, minWidth: 0 }}>
            <CheckCircleRounded sx={{ color: '#16a34a', bgcolor: '#fff', borderRadius: '50%', fontSize: compact ? 17 : 19 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ textAlign: 'center', fontWeight: 750, fontSize: compact ? 9 : 10, lineHeight: 1.1, maxWidth: '100%' }}
            >
              {item}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

function ToolsWorkspace({
  selectedTool,
  selectedToolId,
  onSelectTool,
  onNotify,
}: {
  selectedTool: ToolItem;
  selectedToolId: string;
  onSelectTool: (toolId: string) => void;
  onNotify: Notify;
}) {
  const [toolDraftStarted, setToolDraftStarted] = useState(false);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
        gap: 2.5,
        alignItems: 'start',
      }}
    >
      <Panel>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="h5" component="h1">
                Tools
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Step tools used by flows and runs
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              sx={{ alignSelf: { sm: 'center' } }}
              onClick={() => {
                setToolDraftStarted(true);
                onNotify('New tool draft created');
              }}
            >
              New Tool
            </Button>
          </Stack>

          {toolDraftStarted && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: alpha('#2563eb', 0.2),
                borderRadius: 2,
                p: 1.25,
                bgcolor: alpha('#2563eb', 0.04),
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <AutoAwesomeRounded color="primary" />
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>Tool draft ready</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Define an input schema, output contract, and which Composer steps can use it.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Stack spacing={1.1}>
            {tools.map((tool) => (
              <ToolListItem
                key={tool.id}
                tool={tool}
                selected={tool.id === selectedToolId}
                onSelect={() => {
                  onSelectTool(tool.id);
                  onNotify(`Tool selected: ${tool.name}`);
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Panel>

      <ToolDetail tool={selectedTool} />
    </Box>
  );
}

function ToolListItem({
  tool,
  selected,
  onSelect,
}: {
  tool: ToolItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const ToolIcon = tool.icon;

  return (
    <ButtonBase
      aria-label={`Select tool ${tool.name}`}
      onClick={onSelect}
      sx={{
        width: '100%',
        textAlign: 'left',
        display: 'grid',
        gridTemplateColumns: {
          xs: '42px minmax(0, 1fr)',
          md: '42px minmax(220px, 1fr) 130px 110px',
        },
        gap: 1.25,
        alignItems: 'center',
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? alpha(tool.accent, 0.45) : 'divider',
        bgcolor: selected ? alpha(tool.accent, 0.08) : '#fff',
        '&:hover': {
          bgcolor: selected ? alpha(tool.accent, 0.1) : '#f8fafc',
        },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: tool.accent,
          bgcolor: alpha(tool.accent, 0.12),
        }}
      >
        <ToolIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.35 }}>
          <Typography sx={{ fontWeight: 850 }} noWrap>
            {tool.name}
          </Typography>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <ToolStatusChip status={tool.status} />
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" noWrap>
          {tool.category}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
        {tool.usedBy.length} steps
      </Typography>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <ToolStatusChip status={tool.status} />
      </Box>
    </ButtonBase>
  );
}

function ToolDetail({ tool }: { tool: ToolItem }) {
  const ToolIcon = tool.icon;

  return (
    <Panel sticky>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" component="h2" color="text.secondary" sx={{ fontWeight: 900 }}>
              Tool detail
            </Typography>
            <Typography variant="h5" component="h3">
              {tool.name}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              color: tool.accent,
              bgcolor: alpha(tool.accent, 0.12),
            }}
          >
            <ToolIcon />
          </Box>
        </Stack>

        <Typography color="text.secondary">{tool.description}</Typography>
        <Stack direction="row" spacing={1}>
          <ToolStatusChip status={tool.status} />
          <Chip label={tool.category} size="small" variant="outlined" />
        </Stack>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
          Used by steps
        </Typography>
        <Stack spacing={1}>
          {tool.usedBy.map((step) => (
            <FileLine key={step} label={step} />
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.25,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              Inputs
            </Typography>
            <Stack spacing={1}>
              {tool.inputs.map((item) => (
                <FileLine key={item} label={item} />
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              Outputs
            </Typography>
            <Stack spacing={1}>
              {tool.outputs.map((item) => (
                <FileLine key={item} label={item} />
              ))}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Panel>
  );
}

const insightMetrics = [
  { label: 'Flow click rate', value: '42.8%', delta: '+8.4%', tone: '#2563eb' },
  { label: 'Run conversion', value: '31.6%', delta: '+5.1%', tone: '#0f766e' },
  { label: 'Avg. steps per run', value: '6.4', delta: '-0.7', tone: '#7c3aed' },
  { label: 'Human input stops', value: '14.2%', delta: '-3.2%', tone: '#d97706' },
];

const flowUsage = [
  { name: 'Sheet Orchestration', clickRate: 58, runs: 328, color: '#2563eb' },
  { name: 'Invoice Cleanup', clickRate: 34, runs: 94, color: '#0f766e' },
  { name: 'Sales Rollup', clickRate: 22, runs: 42, color: '#7c3aed' },
];

const weeklyUsage = [38, 44, 41, 52, 57, 63, 69];
const funnel = [
  { label: 'Flow viewed', value: 1280, width: 100 },
  { label: 'Run created', value: 405, width: 74 },
  { label: 'Files uploaded', value: 361, width: 66 },
  { label: 'Export completed', value: 292, width: 54 },
];

function SummaryPage({ activeTab }: { activeTab: 'dashboard' | 'insights' }) {
  if (activeTab === 'insights') {
    return <InsightsPage />;
  }

  return (
    <Panel>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            A control room for Excel automation throughput, waiting inputs, failed steps, and
            completed exports.
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}
        >
          <Metric label="Runs today" value="187" />
          <Metric label="Waiting input" value="14" />
          <Metric label="Sheets processed" value="2,846" />
          <Metric label="AI confidence" value="93%" />
        </Box>
      </Stack>
    </Panel>
  );
}

function InsightsPage() {
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" component="h1">
          Insights
        </Typography>
        <Typography color="text.secondary">
          Flow adoption, click-through behavior, run conversion, and automation health.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        }}
      >
        {insightMetrics.map((metric) => (
          <InsightMetric key={metric.label} {...metric} />
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
          gap: 2,
        }}
      >
        <Panel>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" component="h2">
                Flow engagement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click rate and run volume by flow template
              </Typography>
            </Box>
            <Stack spacing={1.4}>
              {flowUsage.map((flow) => (
                <FlowUsageRow key={flow.name} flow={flow} />
              ))}
            </Stack>
          </Stack>
        </Panel>

        <Panel>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" component="h2">
                Usage trend
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weekly flow interactions
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'end', height: 180 }}>
              {weeklyUsage.map((value, index) => (
                <Box
                  key={index}
                  aria-label={`Day ${index + 1} usage ${value}`}
                  sx={{
                    flex: 1,
                    height: `${value}%`,
                    minHeight: 34,
                    borderRadius: '8px 8px 3px 3px',
                    bgcolor: index === weeklyUsage.length - 1 ? 'primary.main' : alpha('#2563eb', 0.22),
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Panel>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' },
          gap: 2,
        }}
      >
        <Panel>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" component="h2">
                Conversion matrix
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From flow click to finished export
              </Typography>
            </Box>
            <Stack spacing={1.2}>
              {funnel.map((item) => (
                <Box key={item.label}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.6 }}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.value.toLocaleString()}
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 10, bgcolor: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${item.width}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 999,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Panel>

        <Panel>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" component="h2">
                Automation health
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI assists where workbook structure is ambiguous
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 1.2,
              }}
            >
              <MiniStat label="AI header confidence" value="93%" />
              <MiniStat label="Avg approval time" value="8m" />
              <MiniStat label="Failed exports" value="1.8%" />
            </Box>
          </Stack>
        </Panel>
      </Box>
    </Stack>
  );
}

function InsightMetric({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: string;
}) {
  return (
    <Panel>
      <Stack spacing={1.2}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 850 }}>
          {label}
        </Typography>
        <Stack direction="row" sx={{ alignItems: 'end', justifyContent: 'space-between' }}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            {value}
          </Typography>
          <Chip
            label={delta}
            size="small"
            sx={{ bgcolor: alpha(tone, 0.1), color: tone, fontWeight: 850 }}
          />
        </Stack>
      </Stack>
    </Panel>
  );
}

function FlowUsageRow({
  flow,
}: {
  flow: { name: string; clickRate: number; runs: number; color: string };
}) {
  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.7 }}>
        <Typography sx={{ fontWeight: 850 }}>{flow.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {flow.clickRate}% click rate · {flow.runs} runs
        </Typography>
      </Stack>
      <Box sx={{ height: 12, bgcolor: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${flow.clickRate}%`,
            height: '100%',
            bgcolor: flow.color,
            borderRadius: 999,
          }}
        />
      </Box>
    </Box>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 900 }}>
        {value}
      </Typography>
    </Box>
  );
}

function Panel({
  children,
  compact = false,
  scrollable = false,
  sticky = false,
  wide = false,
  fitContent = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
  scrollable?: boolean;
  sticky?: boolean;
  wide?: boolean;
  fitContent?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: compact ? 1.75 : wide ? 2.25 : 2,
        alignSelf: fitContent ? 'start' : 'stretch',
        position: { xl: sticky ? 'sticky' : 'static' },
        top: sticky ? 96 : 'auto',
        height: scrollable && !fitContent ? { xs: 'auto', lg: '100%' } : 'auto',
        maxHeight: scrollable && fitContent ? { xs: 'none', lg: '100%' } : 'none',
        minHeight: 0,
        overflowY: scrollable ? { xs: 'visible', lg: 'auto' } : 'visible',
        overflowX: 'hidden',
      }}
    >
      {children}
    </Paper>
  );
}

function StepSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        bgcolor: '#fff',
      }}
    >
      <Typography variant="h6" component="h4" sx={{ mb: 1.2, fontSize: 15, fontWeight: 900 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, p: 1.5, borderRadius: 1.5, bgcolor: '#fff' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900 }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

function FileLine({ label }: { label: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
      }}
    >
      <DescriptionRounded fontSize="small" color="primary" />
      <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
        {label}
      </Typography>
    </Stack>
  );
}

function StatusChip({ status }: { status: RunStatus }) {
  const colorMap: Record<RunStatus, { color: string; bg: string }> = {
    'Waiting input': { color: '#b45309', bg: '#fef3c7' },
    Running: { color: '#2563eb', bg: '#dbeafe' },
    Completed: { color: '#047857', bg: '#dcfce7' },
    Failed: { color: '#b91c1c', bg: '#fee2e2' },
  };

  return <ColorChip label={status} colors={colorMap[status]} />;
}

function StepStatusChip({ status }: { status: StepStatus }) {
  const colorMap: Record<StepStatus, { color: string; bg: string }> = {
    Done: { color: '#047857', bg: '#dcfce7' },
    Active: { color: '#2563eb', bg: '#dbeafe' },
    Waiting: { color: '#b45309', bg: '#fef3c7' },
    Queued: { color: '#64748b', bg: '#f1f5f9' },
  };

  return <ColorChip label={status} colors={colorMap[status]} />;
}

function FlowStatusChip({ status }: { status: FlowStatus }) {
  const colorMap: Record<FlowStatus, { color: string; bg: string }> = {
    Ready: { color: '#047857', bg: '#dcfce7' },
    Draft: { color: '#64748b', bg: '#f1f5f9' },
    'Needs review': { color: '#b91c1c', bg: '#fee2e2' },
  };

  return <ColorChip label={status} colors={colorMap[status]} />;
}

function ToolStatusChip({ status }: { status: ToolStatus }) {
  const colorMap: Record<ToolStatus, { color: string; bg: string }> = {
    Live: { color: '#047857', bg: '#dcfce7' },
    Beta: { color: '#2563eb', bg: '#dbeafe' },
    Planned: { color: '#64748b', bg: '#f1f5f9' },
  };

  return <ColorChip label={status} colors={colorMap[status]} />;
}

function ComposerStatusChip({ status }: { status: ComposerStep['status'] }) {
  const colorMap: Record<ComposerStep['status'], { color: string; bg: string }> = {
    'Waiting for files': { color: '#b45309', bg: '#fef3c7' },
    Ready: { color: '#047857', bg: '#dcfce7' },
    'AI suggested': { color: '#2563eb', bg: '#dbeafe' },
    'Needs approval': { color: '#b45309', bg: '#ffedd5' },
    Draft: { color: '#64748b', bg: '#f1f5f9' },
  };

  return <ColorChip label={status} colors={colorMap[status]} />;
}

function CompactComposerStatusChip({ status }: { status: ComposerStep['status'] }) {
  const labelMap: Record<ComposerStep['status'], string> = {
    'Waiting for files': 'Input',
    Ready: 'Ready',
    'AI suggested': 'AI',
    'Needs approval': 'Review',
    Draft: 'Draft',
  };
  const colorMap: Record<ComposerStep['status'], { color: string; bg: string }> = {
    'Waiting for files': { color: '#b45309', bg: '#fef3c7' },
    Ready: { color: '#047857', bg: '#dcfce7' },
    'AI suggested': { color: '#2563eb', bg: '#dbeafe' },
    'Needs approval': { color: '#b45309', bg: '#ffedd5' },
    Draft: { color: '#64748b', bg: '#f1f5f9' },
  };

  const colors = colorMap[status];

  return (
    <Chip
      label={labelMap[status]}
      size="small"
      sx={{
        maxWidth: 'calc(100% - 40px)',
        height: 24,
        justifySelf: 'start',
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 850,
        '& .MuiChip-label': {
          px: 0.75,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
    />
  );
}

function ColorChip({ label, colors }: { label: string; colors: { color: string; bg: string } }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        justifySelf: 'start',
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 850,
      }}
    />
  );
}

function inferInlinePatch(prompt: string, currentStep: ComposerStep): ComposerStepPatch {
  const normalized = prompt.trim().toLowerCase();

  if (normalized.includes('approve') || normalized.includes('approval')) {
    return {
      name: 'Approval checkpoint',
      toolId: 'approval-gate',
      kind: 'approve',
      inputs: currentStep.output,
      output: 'approval.receipt.json',
      status: 'Needs approval',
    };
  }

  if (normalized.includes('upload') || normalized.includes('file')) {
    return {
      name: 'Upload source workbooks',
      toolId: 'upload-files',
      kind: 'upload',
      inputs: '.xlsx files',
      output: 'source-files.manifest.json',
      status: 'Waiting for files',
    };
  }

  if (normalized.includes('password') || normalized.includes('zip')) {
    return {
      name: 'Set zip password',
      toolId: 'zip-password',
      kind: 'password',
      inputs: currentStep.output,
      output: 'zip-secret.pending',
      status: 'Needs approval',
    };
  }

  if (normalized.includes('schema') || normalized.includes('validate') || normalized.includes('header')) {
    return {
      name: 'Validate workbook schema',
      toolId: 'read-sheet',
      kind: 'inspect',
      inputs: 'uploaded workbooks',
      output: 'schema-validation.report.json',
      status: 'AI suggested',
    };
  }

  if (normalized.includes('crawl') || normalized.includes('web')) {
    return {
      name: 'Collect approved web data',
      toolId: 'smart-crawler',
      kind: 'inspect',
      inputs: 'approved source URL',
      output: 'crawl-results.json',
      status: 'AI suggested',
    };
  }

  return {
    name: `${currentStep.name} with AI guardrails`,
    status: 'AI suggested',
  };
}

function kindForTool(toolId: string): StepKind {
  const kindMap: Record<string, StepKind> = {
    'upload-files': 'upload',
    'read-sheet': 'inspect',
    'sheet-reorder': 'transform',
    'approval-gate': 'approve',
    'zip-password': 'password',
    'export-package': 'export',
    'smart-crawler': 'inspect',
  };

  return kindMap[toolId] ?? 'inspect';
}

function createRunFromFlow(flow: FlowTemplate): RunItem {
  return {
    id: `run-created-${flow.id}`,
    name: `${flow.name} Run`,
    flowId: flow.id,
    status: 'Waiting input',
    requestedBy: 'Mia Chen',
    updatedAt: 'Just now',
    progress: 0,
    steps: flow.steps.map((step, index) => ({
      id: `run-${flow.id}-${step.id}`,
      name: step.name,
      kind: step.kind,
      status: index === 0 ? 'Waiting' : 'Queued',
      toId: step.toId,
      summary: summaryForFlowStep(step),
      prompt: promptForFlowStep(step),
    })),
  };
}

function seedStepsForComposer(mode: ComposerMode, selectedFlow: FlowTemplate) {
  const sourceSteps = mode === 'new' ? flows[0].steps : selectedFlow.steps;
  return cloneComposerSteps(sourceSteps);
}

function cloneComposerSteps(steps: ComposerStep[]) {
  return steps.map((step) => ({ ...step }));
}

function defaultSelectedComposerStepId(steps: ComposerStep[]) {
  return steps.find((step) => step.status === 'AI suggested')?.id ?? steps[0]?.id ?? '';
}

function reindexComposerSteps(steps: ComposerStep[]) {
  return steps.map((step, index) => ({ ...step, index: String(index + 1).padStart(2, '0') }));
}

function insertStepAfter(steps: ComposerStep[], stepId: string, nextStep: ComposerStep) {
  const selectedIndex = steps.findIndex((step) => step.id === stepId);
  if (selectedIndex === -1) {
    return [...steps, nextStep];
  }

  return [...steps.slice(0, selectedIndex + 1), nextStep, ...steps.slice(selectedIndex + 1)];
}

function makeUniqueStepId(steps: ComposerStep[], baseId: string) {
  if (!steps.some((step) => step.id === baseId)) {
    return baseId;
  }

  let suffix = 2;
  let nextId = `${baseId}-${suffix}`;
  while (steps.some((step) => step.id === nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  return nextId;
}

function summaryForFlowStep(step: ComposerStep) {
  const tool = getTool(step.toolId);
  return `${tool.name} will consume ${step.inputs} and produce ${step.output}.`;
}

function promptForFlowStep(step: ComposerStep) {
  if (step.kind === 'approve') {
    return 'Review and approve this workflow checkpoint before continuing.';
  }
  if (step.kind === 'password') {
    return 'Enter a password for the protected output package.';
  }

  return undefined;
}

function getFlow(flowId: string) {
  return flows.find((flow) => flow.id === flowId) ?? flows[0];
}

function getTool(toolId: string) {
  return tools.find((tool) => tool.id === toolId) ?? tools[0];
}

function getToForStep(run: RunItem, step: RunStep) {
  const flow = getFlow(run.flowId);
  return flow.tos.find((to) => to.id === step.toId) ?? flow.tos[0];
}

function findPrimaryStep(run: RunItem) {
  return (
    run.steps.find((step) => step.status === 'Active') ??
    run.steps.find((step) => step.status === 'Waiting') ??
    run.steps[0]
  );
}

function getStepFiles(step: RunStep) {
  const fileMap: Record<StepKind, { inputs: string[]; outputs: string[] }> = {
    upload: {
      inputs: ['board_pack_q2.xlsx', 'regional_detail.xlsx', 'finance_summary.xlsx'],
      outputs: ['source-files.manifest.json'],
    },
    inspect: {
      inputs: ['source-files.manifest.json'],
      outputs: ['headers.detected.json', 'sheet-inventory.csv'],
    },
    transform: {
      inputs: ['headers.detected.json', 'sheet-inventory.csv'],
      outputs: ['sheet-order.plan.json', 'preview-workbook.xlsx'],
    },
    approve: {
      inputs: ['sheet-order.plan.json', 'preview-workbook.xlsx'],
      outputs: ['approval.receipt.json'],
    },
    password: {
      inputs: ['approval.receipt.json'],
      outputs: ['zip-secret.pending'],
    },
    export: {
      inputs: ['preview-workbook.xlsx', 'zip-secret.pending'],
      outputs: ['q2-board-pack.zip'],
    },
  };

  return fileMap[step.kind];
}

function getInitialRoute(): { activeTab: TabKey; flowView: FlowView } {
  if (typeof window === 'undefined') {
    return { activeTab: 'run', flowView: 'library' };
  }

  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'flow/composer') {
    return { activeTab: 'flow', flowView: 'composer' };
  }
  if (hash === 'flow' || hash === 'flow/library') {
    return { activeTab: 'flow', flowView: 'library' };
  }
  if (hash === 'dashboard' || hash === 'run' || hash === 'tools' || hash === 'insights') {
    return { activeTab: hash, flowView: 'library' };
  }

  return { activeTab: 'run', flowView: 'library' };
}

function syncHash(activeTab: TabKey, flowView: FlowView) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextHash = activeTab === 'flow' ? `#flow/${flowView}` : `#${activeTab}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash);
  }
}

export default App;
