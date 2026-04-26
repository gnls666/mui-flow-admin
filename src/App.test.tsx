import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renders the run workspace as the primary execution surface', () => {
    render(<App />);

    expect(screen.getByText('Acme Ops')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Run' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Run list' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Run detail' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Step detail' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reorder selected sheets' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tool' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Input files' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Output files' })).toBeInTheDocument();
  });

  it('updates step detail when another step is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /select step approve output plan/i }));

    expect(screen.getByRole('heading', { name: 'Approve output plan' })).toBeInTheDocument();
    expect(screen.getByText('Approval decision')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve output plan' })).toBeInTheDocument();
  });

  it('captures paused user input for the password step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /select step set zip password/i }));
    await user.type(screen.getByLabelText('Zip password'), 'strong-pass');

    expect(screen.getByDisplayValue('strong-pass')).toBeInTheDocument();
    expect(screen.getByText('Password strength looks good.')).toBeInTheDocument();
  });

  it('shows flow templates and creates a run from a flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Flow' }));
    expect(screen.getByRole('heading', { name: 'Flows' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select flow sheet orchestration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Flow steps' })).toBeInTheDocument();
    expect(screen.getByText('Tool: Upload Files')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'To catalog' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Composer' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New Flow' }));
    expect(screen.getByRole('heading', { name: 'New Flow Composer' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to flow list' }));
    expect(screen.getByRole('heading', { name: 'Flows' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /select flow invoice cleanup/i }));
    expect(screen.getByRole('heading', { name: 'Invoice Cleanup' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open composer' }));
    expect(screen.getByRole('heading', { name: 'Invoice Cleanup' })).toBeInTheDocument();
    expect(screen.getAllByText('Extract exception rows').length).toBeGreaterThan(0);
    expect(screen.getByText('Excel context')).toBeInTheDocument();
    expect(screen.queryByText('Q2 Board Pack Automation')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Extract exception rows' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Create run' }));

    expect(screen.getByRole('tab', { name: 'Run' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Invoice Cleanup Run' })).toBeInTheDocument();
    expect(screen.getAllByText('Upload invoice files').length).toBeGreaterThan(0);
  });

  it('shows a focused AI composer with one canvas and one step inspector', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Flow' }));
    await user.click(screen.getByRole('button', { name: 'New Flow' }));

    expect(screen.getByRole('heading', { name: 'New Flow Composer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Workflow canvas' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Map and reorder tabs' }).length).toBeGreaterThan(0);
    expect(screen.getByText('AI command')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'AI Flow Draft' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inline AI editor' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Describe workflow objective')).not.toBeInTheDocument();
    expect(screen.getByText('Excel context')).toBeInTheDocument();
    expect(screen.getAllByText('Map and reorder tabs').length).toBeGreaterThan(0);
    expect(screen.getByText('Missing inputs')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refine' }));
    expect(screen.getByText('Draft refined with tool constraints')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add missing input Source files' }));
    expect(screen.getByText('Source files marked as requested')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add step' }));
    expect(screen.getAllByText('Validate workbook schema').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Apply draft' }));

    expect(screen.getByText('Draft applied to flow')).toBeInTheDocument();
  });

  it('mocks an AI inline editor that patches the selected composer step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Flow' }));
    await user.click(screen.getByRole('button', { name: 'New Flow' }));

    expect(screen.getByText('AI command')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /select composer step map and reorder tabs/i }));

    expect(screen.getByRole('button', { name: 'Apply AI patch' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send AI inline command' })).toBeDisabled();

    await user.type(screen.getByLabelText('Ask AI to edit selected step'), 'validate schema before reorder');
    await user.click(screen.getByRole('button', { name: 'Apply AI patch' }));

    expect(screen.getByDisplayValue('Validate workbook schema')).toBeInTheDocument();
    expect(screen.getAllByText('AI patch applied to Validate workbook schema').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Add approval pause' }));

    expect(screen.getAllByText('Validate workbook schema').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('Approval checkpoint')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Open selected tool Approval Gate' }).length).toBeGreaterThan(0);
  });

  it('opens the matching tool from a composer step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Flow' }));
    await user.click(screen.getByRole('button', { name: 'Open composer' }));
    await user.click(screen.getByRole('button', { name: 'Open selected tool Sheet Reorder' }));

    expect(screen.getByRole('tab', { name: 'Tools' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Sheet Reorder' })).toBeInTheDocument();
    expect(screen.getByText('Arrange selected sheets into a target order before preview and export.')).toBeInTheDocument();
  });

  it('shows the tool registry with flow-style list and detail', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Tools' }));

    expect(screen.getByRole('heading', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tool detail' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upload Files' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /select tool smart crawler/i }));

    expect(screen.getByRole('heading', { name: 'Smart Crawler' })).toBeInTheDocument();
    expect(screen.getByText('Crawl structured data from approved web sources.')).toBeInTheDocument();
  });

  it('shows the insights metrics page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Insights' }));

    expect(screen.getByRole('heading', { name: 'Insights' })).toBeInTheDocument();
    expect(screen.getByText('Flow click rate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Flow engagement' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Conversion matrix' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Insides' })).not.toBeInTheDocument();
  });
});
