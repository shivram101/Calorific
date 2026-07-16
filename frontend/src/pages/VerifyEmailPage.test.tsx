// src/pages/VerifyEmailPage.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';

vi.mock('../api/client', () => ({ verifyEmail: vi.fn() }));
import { verifyEmail } from '../api/client';

function renderWithToken(token = 'abc123') {
    return render(
        <MemoryRouter initialEntries={[`/verify-email/${token}`]}>
            <Routes>
                <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('VerifyEmailPage', () => {
    beforeEach(() => vi.clearAllMocks());

    test('shows success once verification resolves', async () => {
        (verifyEmail as any).mockResolvedValue({});
        renderWithToken('good-token');

        expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
        expect(await screen.findByText(/email verified!/i)).toBeInTheDocument();
        expect(verifyEmail).toHaveBeenCalledWith('good-token');
    });

    test('shows the error message when verification fails', async () => {
        (verifyEmail as any).mockRejectedValue(new Error('Link expired'));
        renderWithToken('bad-token');

        expect(await screen.findByText(/verification failed/i)).toBeInTheDocument();
        expect(screen.getByText(/link expired/i)).toBeInTheDocument();
    });
});