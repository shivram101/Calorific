// src/pages/GoalsPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GoalsPage, { loadGoals } from './GoalsPage';

vi.mock('../api/client', () => ({
    getTargets: vi.fn(),
    setTargets: vi.fn(),
}));
import { getTargets, setTargets } from '../api/client';

describe('loadGoals (pure function, no rendering needed)', () => {
    beforeEach(() => localStorage.clear());

    test('falls back to maintain defaults when nothing is saved', () => {
        expect(loadGoals()).toEqual({ calories: 2200, protein: 165, carbs: 220, fat: 73 });
    });

    test('returns saved goals from localStorage when present', () => {
        localStorage.setItem('calorific_goals', JSON.stringify({ calories: 1800, protein: 180, carbs: 135, fat: 60 }));
        expect(loadGoals()).toEqual({ calories: 1800, protein: 180, carbs: 135, fat: 60 });
    });
});

describe('GoalsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        (getTargets as any).mockResolvedValue(null); // simulates "no targets set yet"
    });

    function renderPage() {
        return render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    }

    test('clicking a preset updates all target fields', async () => {
        renderPage();
        await waitFor(() => screen.getByLabelText(/daily calorie target/i));

        fireEvent.click(screen.getByText(/lose weight/i));

        expect(screen.getByLabelText(/daily calorie target/i)).toHaveValue(1800);
        expect(screen.getByLabelText(/protein target in grams/i)).toHaveValue(180);
    });

    test('saving sends the current values to the API', async () => {
        (setTargets as any).mockResolvedValue({});
        renderPage();
        await waitFor(() => screen.getByLabelText(/daily calorie target/i));

        fireEvent.click(screen.getByRole('button', { name: /save goals/i }));

        await waitFor(() => {
            expect(setTargets).toHaveBeenCalledWith({
                calorieTarget: 2200, proteinTarget: 165, carbTarget: 220, fatTarget: 73,
            });
        });
        expect(screen.getByText(/✓ saved/i)).toBeInTheDocument();
    });
});