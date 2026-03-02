import { useAppStore, type AppTab } from '../../store/useAppStore';

const TABS: { id: AppTab; label: string; icon: string }[] = [
    { id: 'pack', label: 'Scan & Pack', icon: '▣' },
    { id: 'verify', label: 'Verify', icon: '✓' },
    { id: 'records', label: 'Records', icon: '⊞' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
];

export function BottomNav() {
    const { currentTab, setCurrentTab } = useAppStore();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-item ${currentTab === tab.id ? 'active' : ''}`}
                    onClick={() => setCurrentTab(tab.id)}
                    aria-current={currentTab === tab.id ? 'page' : undefined}
                >
                    <span className="text-lg leading-none">{tab.icon}</span>
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}
