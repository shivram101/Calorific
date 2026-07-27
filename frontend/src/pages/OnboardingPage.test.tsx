// src/pages/OnboardingPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import OnboardingPage from './OnboardingPage';

vi.mock('../api/client', () => ({ updateProfile: vi.fn() }));
import { updateProfile } from '../api/client';

describe('OnboardingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    test('blocks moving to step 2 if age or sex is missing', () => {
        render(<OnboardingPage />);
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        expect(screen.getByText(/please fill out all fields/i)).toBeInTheDocument();
        expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    test('completes all 3 steps and converts imperial units correctly', async () => {
        (updateProfile as any).mockResolvedValue({});
        render(<OnboardingPage />);

        // Step 1
        fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '30' } });
        fireEvent.click(screen.getByText('Male'));
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        // Step 2 — switch to imperial to verify the conversion math
        expect(await screen.findByText(/step 2 of 3/i)).toBeInTheDocument();
        fireEvent.click(screen.getByText('in'));
        fireEvent.change(screen.getByLabelText(/height/i), { target: { value: '70' } }); // 70 in
        fireEvent.click(screen.getByText('lbs'));
        fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: '154' } }); // 154 lb
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        // Step 3
        expect(await screen.findByText(/step 3 of 3/i)).toBeInTheDocument();
        fireEvent.click(screen.getByText('Active'));
        fireEvent.click(screen.getByText('Maintain'));
        fireEvent.click(screen.getByRole('button', { name: /finish/i }));

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledWith({
                sex: 'Male',
                heightCm: 178,   // 70in × 2.54, rounded
                weightKg: 69.9,  // 154lb × 0.453592, rounded to 1 decimal
                activityLevel: 'Active',
                goal: 'maintain',
            });
        });
    });
});