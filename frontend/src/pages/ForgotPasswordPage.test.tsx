// src/pages/ForgotPasswordPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';

vi.mock('../api/client', () => ({
    forgotPassword: vi.fn(),
}));

import { forgotPassword } from '../api/client';

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders the form initially', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    test('submitting a valid email calls forgotPassword and shows confirmation', async () => {
        (forgotPassword as any).mockResolvedValue({});

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'user@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(forgotPassword).toHaveBeenCalledWith('user@example.com');
        });

        // UI should flip to the "check your email" confirmation state
        expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    test('shows an error message if the API call fails', async () => {
        (forgotPassword as any).mockRejectedValue(new Error('No account found with that email'));

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'nouser@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(screen.getByText(/no account found with that email/i)).toBeInTheDocument();
        });

        // Should stay on the form, not flip to confirmation
        expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
    });
});