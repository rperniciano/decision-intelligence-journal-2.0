/**
 * Category for organizing decisions
 */
export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string; // Hex color e.g., "#00d4aa"
  icon: string; // Emoji e.g., "💼"
  decisionCount: number;
  positiveRate: number | null;
  isSystem: boolean;
  createdAt: string;
}

/**
 * Default system categories
 */
export const SYSTEM_CATEGORIES: Array<Omit<Category, 'id' | 'userId' | 'decisionCount' | 'positiveRate' | 'createdAt'>> = [
  {
    name: 'Work',
    color: '#6366f1',
    icon: '💼',
    isSystem: true,
  },
  {
    name: 'Personal',
    color: '#ec4899',
    icon: '🏠',
    isSystem: true,
  },
  {
    name: 'Financial',
    color: '#10b981',
    icon: '💰',
    isSystem: true,
  },
  {
    name: 'Health',
    color: '#f59e0b',
    icon: '🏃',
    isSystem: true,
  },
  {
    name: 'Relationships',
    color: '#ef4444',
    icon: '❤️',
    isSystem: true,
  },
  {
    name: 'Education',
    color: '#8b5cf6',
    icon: '📚',
    isSystem: true,
  },
];
