// src/pages/SettingsPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SettingsPage from './SettingsPage';

vi.mock('../api/client', () => ({
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    logout: vi.fn(),
}));
import { getProfile, updateProfile, deleteAccount, logout } from '../api/client';

const PROFILE = {
    email: 'user@example.com', isVerified: true, firstName: 'Jane', lastName: 'Doe',
    age: 30, heightCm: 170, weightKg: 65, activityLevel: 'Active', goal: 'maintain',
};

describe('SettingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getProfile as any).mockResolvedValue(PROFILE);
    });

    test('loads and displays the profile', async () => {
        render(<SettingsPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Jane')).toBeInTheDocument());
        expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });

    test('saving sends the updated fields to the API', async () => {
        (updateProfile as any).mockResolvedValue({});
        render(<SettingsPage />);
        await waitFor(() => screen.getByDisplayValue('Jane'));

        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Janet' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Janet' }));
        });
        expect(await screen.findByText(/changes saved/i)).toBeInTheDocument();
    });

    test('deleting the account requires confirmation', async () => {
        (deleteAccount as any).mockResolvedValue({});
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<SettingsPage />);
        await waitFor(() => screen.getByDisplayValue('Jane'));

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));

        await waitFor(() => {
            expect(deleteAccount).toHaveBeenCalled();
            expect(logout).toHaveBeenCalled();
        });
    });

    test('cancelling the confirm dialog does not delete the account', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(<SettingsPage />);
        await waitFor(() => screen.getByDisplayValue('Jane'));

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));

        expect(deleteAccount).not.toHaveBeenCalled();
    });
});