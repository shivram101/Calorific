// src/pages/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';

vi.mock('../api/client', () => ({ login: vi.fn() }));
import { login } from '../api/client';

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    test('successful login redirects to dashboard', async () => {
        (login as any).mockResolvedValue({});
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => expect(login).toHaveBeenCalledWith('a@b.com', 'secret123'));
        await waitFor(() => expect(window.location.href).toBe('/Dashboard'));
    });

    test('shows an error message on failed login', async () => {
        (login as any).mockRejectedValue(new Error('Invalid credentials'));
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpass' } });
        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    });
});