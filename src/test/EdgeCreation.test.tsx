import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';
import { ReactFlowProvider } from 'reactflow';

describe('Edge Creation', () => {
  it('adds an edge to the Mermaid text when connected in the UI', async () => {
    render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    );

    // Initial state: LIPO and BUCK
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('LIPO[fa:battery-full 2S LiPo Battery 7.4V]');
    expect(textarea.value).toContain('BUCK[icon:zap Buck Converter 7.4V to 5V]');

    // Let's check if 'LIPO -- TEST --> BUCK' is NOT there initially
    expect(textarea.value).not.toContain('LIPO -- TEST --> BUCK');
  });
});
