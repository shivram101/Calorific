// src/pages/ProgressPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProgressPage from './ProgressPage';

vi.mock('../api/client', () => ({
    getWeightHistory: vi.fn(),
    getProgressSummary: vi.fn(),
    getTargets: vi.fn(),
    logWeight: vi.fn(),
    logout: vi.fn(),
    todayString: () => '2026-07-14',
}));
import { getWeightHistory, getProgressSummary, getTargets, logWeight } from '../api/client';

const WEIGHTS = [
    { _id: '1', userId: 'u', date: '2026-07-01', weightKg: 80, createdAt: '' },
    { _id: '2', userId: 'u', date: '2026-07-14', weightKg: 78, createdAt: '' },
];
const SUMMARY = [
    { date: '2026-07-13', calories: 2000, protein: 150, carbs: 200, fat: 60 },
    { date: '2026-07-14', calories: 2100, protein: 160, carbs: 210, fat: 65 },
];

function renderPage() {
    return render(<MemoryRouter><ProgressPage /></MemoryRouter>);
}

describe('ProgressPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getWeightHistory as any).mockResolvedValue({ entries: WEIGHTS });
        (getProgressSummary as any).mockResolvedValue({ summary: SUMMARY });
        (getTargets as any).mockResolvedValue({ calorieTarget: 2200 });
    });

    test('falls back to sample data if the backend is unreachable', async () => {
        (getWeightHistory as any).mockRejectedValue(new Error('network error'));
        renderPage();

        expect(await screen.findByText(/showing sample data/i)).toBeInTheDocument();
    });

    test('shows real stats once data loads', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.queryByText(/loading your trends/i)).not.toBeInTheDocument();
        });
        expect(screen.getByText(/current weight/i)).toBeInTheDocument();
    });

    test('switching the date range re-fetches with the new range', async () => {
        renderPage();
        await waitFor(() => screen.getByText(/current weight/i));
        vi.clearAllMocks();
        (getWeightHistory as any).mockResolvedValue({ entries: WEIGHTS });
        (getProgressSummary as any).mockResolvedValue({ summary: SUMMARY });
        (getTargets as any).mockResolvedValue({ calorieTarget: 2200 });

        fireEvent.click(screen.getByRole('button', { name: '7 days' }));

        await waitFor(() => {
            expect(getWeightHistory).toHaveBeenCalledWith(7);
            expect(getProgressSummary).toHaveBeenCalledWith(7);
        });
    });

    test('logging weight converts lbs to kg before sending', async () => {
        (logWeight as any).mockResolvedValue({});
        renderPage();
        await waitFor(() => screen.getByText(/current weight/i));

        fireEvent.change(screen.getByLabelText(/today's weight in lbs/i), { target: { value: '150' } });
        fireEvent.click(screen.getByRole('button', { name: /log weight/i }));

        await waitFor(() => {
            // 150 lbs × 0.453592 ≈ 68.04, rounded to 1 decimal → 68
            expect(logWeight).toHaveBeenCalledWith(68);
        });
    });
});