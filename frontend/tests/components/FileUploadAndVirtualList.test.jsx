import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { FileUpload } from '../../src/components/ui/FileUpload';
import { VirtualizedList } from '../../src/components/ui/VirtualizedList';

describe('file and large-list components', () => {
  test('renders accessible file upload input', () => {
    render(<FileUpload label="Upload PDF" accept=".pdf" multiple />);

    const input = screen.getByLabelText(/upload pdf/i);
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('multiple');
  });

  test('virtualized list renders visible items only', () => {
    const items = Array.from({ length: 200 }, (_, index) => ({ id: index, label: `Row ${index}` }));

    render(
      <VirtualizedList
        items={items}
        height={160}
        itemHeight={40}
        renderItem={(item) => <div>{item.label}</div>}
      />,
    );

    expect(screen.getByText('Row 0')).toBeInTheDocument();
    expect(screen.queryByText('Row 199')).not.toBeInTheDocument();
  });
});
