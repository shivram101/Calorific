// src/pages/SignUpPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SignUpPage from './SignUpPage';

vi.mock('../api/client', () => ({ register: vi.fn() }));
import { register } from '../api/client';

function fillForm(name: string, email: string, password: string, confirm: string) {
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: name } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: password } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: confirm } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
}

describe('SignUpPage', () => {
    beforeEach(() => vi.clearAllMocks());

    test('splits a full name into first/last name', async () => {
        (register as any).mockResolvedValue({});
        render(<SignUpPage />);
        fillForm('Jane Doe', 'jane@example.com', 'pass1234', 'pass1234');

        await waitFor(() => {
            expect(register).toHaveBeenCalledWith('jane@example.com', 'pass1234', 'Jane', 'Doe');
        });
    });

    test('handles a single-word name with no last name', async () => {
        (register as any).mockResolvedValue({});
        render(<SignUpPage />);
        fillForm('Cher', 'cher@example.com', 'pass1234', 'pass1234');

        await waitFor(() => {
            expect(register).toHaveBeenCalledWith('cher@example.com', 'pass1234', 'Cher', '');
        });
    });

    test('blocks submission when passwords do not match', async () => {
        render(<SignUpPage />);
        fillForm('Jane Doe', 'jane@example.com', 'pass1234', 'different');

        expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
        expect(register).not.toHaveBeenCalled();
    });
});