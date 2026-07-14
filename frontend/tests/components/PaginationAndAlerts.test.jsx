import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorAlert, SuccessAlert } from '../../src/components/ui/Alerts';
import { Pagination } from '../../src/components/ui/Pagination';

describe('pagination and alert components', () => {
  test('moves to next page', async () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByLabelText(/next page/i));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test('renders error and success alerts when message exists', () => {
    render(
      <>
        <ErrorAlert message="Invalid token" />
        <SuccessAlert message="Saved" />
      </>,
    );

    expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });
});
