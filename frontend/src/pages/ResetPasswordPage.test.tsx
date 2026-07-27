// src/pages/ResetPasswordPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';

vi.mock('../api/client', () => ({ resetPassword: vi.fn() }));
import { resetPassword } from '../api/client';

function renderWithToken(token = 'abc123') {
    return render(
        <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
            <Routes>
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ResetPasswordPage', () => {
    beforeEach(() => vi.clearAllMocks());

    test('rejects a password shorter than 8 characters', async () => {
        renderWithToken();
        fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'short' } });
        fireEvent.change(screen.getByLabelText(/^confirm new password$/i), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    test('rejects mismatched passwords', async () => {
        renderWithToken();
        fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
        fireEvent.change(screen.getByLabelText(/^confirm new password$/i), { target: { value: 'different1' } });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(await screen.findByText(/don't match/i)).toBeInTheDocument();
    });

    test('submits the token and password, shows success', async () => {
        (resetPassword as any).mockResolvedValue({});
        renderWithToken('my-token');
        fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
        fireEvent.change(screen.getByLabelText(/^confirm new password$/i), { target: { value: 'longenough1' } });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(resetPassword).toHaveBeenCalledWith('my-token', 'longenough1');
        });
        expect(await screen.findByText(/password reset!/i)).toBeInTheDocument();
    });
});