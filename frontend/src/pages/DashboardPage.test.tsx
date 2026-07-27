// src/pages/DashboardPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import DashboardPage from './DashboardPage';
import { MemoryRouter } from 'react-router-dom';

// Mock the API module - replace real network calls with fake ones we control
vi.mock('../api/client', () => ({
    searchFoods: vi.fn(),
    getLogs: vi.fn(),
    addLog: vi.fn(),
    deleteLog: vi.fn(),
    getWater: vi.fn(),
    addWater: vi.fn(),
    logout: vi.fn(),
    todayString: () => '2026-07-14',
}));

// Mock loadGoals since it's imported from GoalsPage
vi.mock('./GoalsPage', () => ({
    loadGoals: () => ({ calories: 2000, protein: 150, carbs: 250, fat: 65 }),
}));

import { getLogs, getWater, searchFoods, addLog } from '../api/client';
function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}
describe('DashboardPage', () => {
    beforeEach(() => {
        // Reset mocks before each test so results from one test don't leak into another
        vi.clearAllMocks();

        // Default: empty diary and no water logged
        (getLogs as any).mockResolvedValue({
            entries: [],
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        });
        (getWater as any).mockResolvedValue({ totalMl: 0 });
    });

    test('shows loading state, then renders diary totals', async () => {
        renderWithRouter(<DashboardPage />)

        expect(screen.getByText(/loading diary/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText(/loading diary/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText(/total calories: 0/i)).toBeInTheDocument();
    });

    test('searching for food displays results', async () => {
        (searchFoods as any).mockResolvedValue([
            { _id: '1', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
        ]);

        renderWithRouter(<DashboardPage />)
        await waitFor(() => screen.getByPlaceholderText(/search foods/i));

        fireEvent.change(screen.getByLabelText(/search foods/i), {
            target: { value: 'banana' },
        });
        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        await waitFor(() => {
            expect(screen.getByText('Banana')).toBeInTheDocument();
        });
        expect(searchFoods).toHaveBeenCalledWith('banana');
    });

    test('selecting a food and submitting calls addLog with correct data', async () => {
        (searchFoods as any).mockResolvedValue([
            { _id: '1', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
        ]);
        (addLog as any).mockResolvedValue({});

        renderWithRouter(<DashboardPage />)
        await waitFor(() => screen.getByPlaceholderText(/search foods/i));

        fireEvent.change(screen.getByLabelText(/search foods/i), { target: { value: 'banana' } });
        fireEvent.click(screen.getByRole('button', { name: /search/i }));
        await waitFor(() => screen.getByText('Banana'));

        fireEvent.click(screen.getByText('Banana'));
        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        await waitFor(() => {
            expect(addLog).toHaveBeenCalledWith({
                foodId: '1',
                quantity: 1,
                meal: 'breakfast',
                date: '2026-07-14',
            });
        });
    });
});